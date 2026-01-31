import { Request, Response, CookieOptions } from "express";
import mysql, { RowDataPacket } from "mysql2/promise";
import * as client from "openid-client";
import { LoginUser } from "./interfaces.js";
import { createHash, randomBytes } from "crypto";

// Environment params
const CLIENT_ID = process.env.ROBLOX_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET ?? "";
const IS_DEBUG = process.env.DEBUG === "true";
const BASE_URL = process.env.BASE_URL;
const REDIRECT_URI = BASE_URL + "/oauth/callback";
// If running the dev site, go back across the proxy
const AFTER_AUTH_URL = process.argv.splice(2)[0] === "--dev" ? "http://localhost:3000/" : "/";

// Contants
const SCOPE = "openid profile";

// Setup
const config = await client.discovery(
    new URL("https://apis.roblox.com/oauth/.well-known/openid-configuration"),
    CLIENT_ID,
    CLIENT_SECRET
);

const pool = mysql.createPool({
    host: "localhost",
    user: process.env.AUTH_DB_USER ?? "",
    password: process.env.AUTH_DB_PASSWORD ?? "",
    database: "strafes_auth_users",
    timezone: "Z", // UTC
    supportBigNumbers: true,
    bigNumberStrings: true
});

// Types
interface AuthCookies {
    session?: string
}

interface LoginCookies {
    codeVerifier?: string
    state?: string
}

interface SessionRow {
    sessionHash: string
    refreshToken: string
    accessToken: string
    refreshExpiresAt: Date
    accessExpiresAt: Date
    userId: string
}

interface Session extends SessionRow {
    sessionToken: string
}

interface RobloxClaims {
    sub: string,
    name: string,
    nickname: string,
    prferred_username: string,
    created_at: number,
    profile: string, // URL
    picture: string // URL
}

// Entrypoints
export async function redirectToAuthURL(response: Response) {
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const params: Record<string, string> = {
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
        response_type: "code",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    };

    if (!config.serverMetadata().supportsPKCE()) {
        /**
         * We cannot be sure the server supports PKCE so we're going to use state too.
         * Use of PKCE is backwards compatible even if the AS doesn't support it which
         * is why we're using it regardless. Like PKCE, random state must be generated
         * for every redirect to the authorization_endpoint.
         */
        params.state = client.randomState();
    }

    const expiresAt = new Date().getTime() + (60 * 10000); // 1 minute
    const options = createCookieOptions(new Date(expiresAt));
    response.cookie("codeVerifier", codeVerifier, options);
    response.cookie("state", params.state, options);

    response.status(200).json({url: client.buildAuthorizationUrl(config, params).href});
}

export async function authorizeAndSetTokens(request: Request, response: Response) {
    let userId = "";
    try {
        const cookies = request.signedCookies as LoginCookies;
        const tokens = await client.authorizationCodeGrant(
            config,
            new URL(BASE_URL + request.url),
            {
                pkceCodeVerifier: cookies.codeVerifier,
                expectedState: cookies.state,
            },
        );
        
        const sessionToken = generateSessionToken();
        const session = createSessionObject(sessionToken, hashSessionToken(sessionToken), tokens);
        if (session) {
            userId = session.userId;
            response.cookie("session", sessionToken, createCookieOptions(session.refreshExpiresAt));
            await insertSessionToDB(session);
        }
    }
    catch (err) {
        console.error(err);
    }
    
    response.clearCookie("codeVerifier");
    response.clearCookie("state");

    const url = userId ? `${AFTER_AUTH_URL}users/${userId}` : AFTER_AUTH_URL;
    response.redirect(url);
}

export async function getLoggedInUser(request: Request, response: Response): Promise<LoginUser | undefined> {
    // Clear out old style of cookies, can remove later once no one is still using them
    if (request.signedCookies.accessToken) {
        response.clearCookie("accessToken");
    }
    if (request.signedCookies.refreshToken) {
        response.clearCookie("refreshToken");
    }

    const session = await loadSession(request, response);
    if (!session) {
        return undefined;
    }

    let userInfo;
    try {
        userInfo = await client.fetchUserInfo(config, session.accessToken, session.userId) as unknown as RobloxClaims;
    }
    catch {
        // Refresh and try again
        const newSession = await refreshSession(response, session);
        if (!newSession) {
            response.clearCookie("session");
            return undefined;
        }
        userInfo = await client.fetchUserInfo(config, newSession.accessToken, newSession.userId) as unknown as RobloxClaims;
    }

    return {
        userId: userInfo.sub,
        username: userInfo.name,
        displayName: userInfo.prferred_username,
        createdAt: userInfo.created_at,
        profileUrl: userInfo.profile,
        thumbnailUrl: userInfo.picture
    };
}

export async function setLoggedInUser(request: Request, response: Response) {
    const user = await getLoggedInUser(request, response);
    
    if (!user) {
        response.status(401).json({error: "You are not logged in"});
        return;
    }

    response.status(200).json(user);
}

export async function logout(request: Request, response: Response) {
    const session = await loadSession(request, response, true);
    if (session) {
        await deleteSessionFromDB(session);
        await client.tokenRevocation(config, session.refreshToken);
    }
    
    response.clearCookie("session");
    response.status(200).json({logout: "success"});
}

// Helpers
async function loadSession(request: Request, response: Response, noRefresh?: boolean): Promise<Session | undefined> {
    const cookies = request.signedCookies as AuthCookies;
    if (!cookies.session) {
        return undefined;
    }
    
    const session = loadSessionFromDB(response, cookies.session, noRefresh);
    if (!session) {
        response.clearCookie("session");
    }

    return session;
}

async function loadSessionFromDB(response: Response, sessionToken: string, noRefresh?: boolean) {
    const hash = hashSessionToken(sessionToken);
    
    const query = "SELECT * FROM sessions WHERE sessionHash = ?;";
    const [[row]] = await pool.query<(SessionRow & RowDataPacket)[]>(query, [hash]);
    if (!row) {
        return undefined;
    }

    const session: Session = {
        sessionToken: sessionToken,
        ...row
    };

    const now = new Date();
    if (now > session.refreshExpiresAt) {
        return undefined;
    }

    if (!noRefresh && now > session.accessExpiresAt) {
        return await refreshSession(response, session);
    }

    return session;
}

async function refreshSession(response: Response, session: Session): Promise<Session | undefined> {
    const newTokenSet = await client.refreshTokenGrant(config, session.refreshToken, {
        scope: SCOPE,
    });

    const newSession = createSessionObject(session.sessionToken, session.sessionHash, newTokenSet);
    if (!newSession) {
        response.clearCookie("session");
        return undefined;
    }

    response.cookie("session", newSession.sessionToken, createCookieOptions(newSession.refreshExpiresAt));
    await insertSessionToDB(newSession);
    return newSession;
}

async function insertSessionToDB(session: Session) {
    const query = `INSERT INTO sessions (sessionHash, refreshToken, accessToken, refreshExpiresAt, accessExpiresAt, userId) 
        VALUES ? AS new 
        ON DUPLICATE KEY UPDATE
            refreshToken=new.refreshToken,
            accessToken=new.accessToken,
            refreshExpiresAt=new.refreshExpiresAt,
            accessExpiresAt=new.accessExpiresAt,
            userId=new.userId
    ;`;

    const values = [
        session.sessionHash,
        session.refreshToken,
        session.accessToken,
        session.refreshExpiresAt,
        session.accessExpiresAt,
        session.userId
    ];
    await pool.query(query, [[values]]);
}

async function deleteSessionFromDB(session: Session) {
    const query = `DELETE FROM sessions WHERE sessionHash=?;`;
    await pool.query(query, [session.sessionHash]);
}

// Utils
function hashSessionToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken() {
    return randomBytes(64).toString("hex").slice(0, 64);
}

function createCookieOptions(expires: Date): CookieOptions {
    return {
        secure: !IS_DEBUG,
        httpOnly: true,
        signed: true,
        expires: expires
    };
}

function createSessionObject(sessionToken: string, sessionHash: string, tokenSet: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers): Session | undefined {
    const claims = tokenSet.claims();
    if (!tokenSet.refresh_token || !claims) {
        return undefined;
    }

    const now = new Date().getTime();
    const accessExpiresIn = (tokenSet.expiresIn() ?? 0) * 1000;
    const refreshExpiresIn = 30 * 60 * 60 * 24 * 1000; // 30 days
    
    return {
        sessionToken: sessionToken,
        sessionHash: sessionHash,
        refreshToken: tokenSet.refresh_token,
        accessToken: tokenSet.access_token,
        refreshExpiresAt: new Date(now + refreshExpiresIn),
        accessExpiresAt: new Date(now + accessExpiresIn),
        userId: claims.sub
    };
}