import { Request, Response, CookieOptions } from "express";
import mysql, { RowDataPacket } from "mysql2/promise";
import * as client from "openid-client";
import { CODE_TO_COUNTRY, Game, LoginUser, SettingsValues, Style } from "shared";
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

export const AUTH_POOL = mysql.createPool({
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
    preferred_username: string,
    created_at: number,
    profile: string, // URL
    picture: string // URL
}

export interface SettingsRow {
    userId: string
    theme: "dark" | "light"
    game: number
    style: number
    maxDaysRelative: number
    countryCode: string | null
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
    const session = await loadSession(request, response);
    if (!session) {
        return undefined;
    }

    let userInfo: RobloxClaims;
    try {
        userInfo = await client.fetchUserInfo(config, session.accessToken, session.userId) as client.UserInfoResponse & RobloxClaims;
    }
    catch {
        // Refresh and try again
        const newSession = await refreshSession(response, session);
        if (!newSession) {
            return undefined;
        }
        userInfo = await client.fetchUserInfo(config, newSession.accessToken, newSession.userId) as client.UserInfoResponse & RobloxClaims;
    }

    return {
        userId: userInfo.sub,
        username: userInfo.preferred_username,
        displayName: userInfo.name,
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

export async function getSettings(request: Request, response: Response) {
    const user = await getLoggedInUser(request, response);
    
    if (!user) {
        response.status(401).json({error: "You are not logged in"});
        return;
    }

    const settings = await loadSettingsFromDB(user.userId);
    if (!settings) {
        response.status(404).json({error: "No settings found"});
        return;
    }

    response.status(200).json(settings);
}

export async function updateSettings(request: Request, response: Response) {
    const game = request.body.game;
    const style = request.body.style;
    const theme = request.body.theme;
    const maxDaysRelative = request.body.maxDaysRelative;
    const country = request.body.country;

    if (!game || isNaN(+game) || Game[+game] === undefined || +game === Game.all) {
        response.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined || +style == Style.all) {
        response.status(400).json({error: "Invalid style"});
        return;
    }

    if (theme !== "light" && theme !== "dark") {
        response.status(400).json({error: "Invalid theme"});
        return;
    }

    if (maxDaysRelative === undefined || isNaN(+maxDaysRelative) || +maxDaysRelative < 0 || +maxDaysRelative > 9999) {
        response.status(400).json({error: "Invalid max days relative dates"});
        return;
    }

    if (country && (typeof country !== "string" || CODE_TO_COUNTRY.get(country) === undefined)) {
        response.status(400).json({error: "Invalid country"});
        return;
    }

    const user = await getLoggedInUser(request, response);
    
    if (!user) {
        response.status(401).json({error: "You are not logged in"});
        return;
    }

    await updateSettingsToDB({
        userId: user.userId,
        game: +game,
        style: +style,
        theme: theme,
        maxDaysRelative: +maxDaysRelative,
        countryCode: country
    });

    response.status(200).json({success: true});
}

// Helpers
async function loadSession(request: Request, response: Response, noRefresh?: boolean): Promise<Session | undefined> {
    const cookies = request.signedCookies as AuthCookies;
    if (!cookies.session) {
        return undefined;
    }
    
    return loadSessionFromDB(response, cookies.session, noRefresh);
}

async function loadSessionFromDB(response: Response, sessionToken: string, noRefresh?: boolean) {
    const hash = hashSessionToken(sessionToken);
    
    const query = "SELECT * FROM sessions WHERE sessionHash = ?;";
    const [[row]] = await AUTH_POOL.query<(SessionRow & RowDataPacket)[]>(query, [hash]);
    if (!row) {
        response.clearCookie("session");
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
    let newSession;
    try {
        const newTokenSet = await client.refreshTokenGrant(config, session.refreshToken, {
            scope: SCOPE,
        });

        newSession = createSessionObject(session.sessionToken, session.sessionHash, newTokenSet);
    }
    catch {
        
    }
    
    if (!newSession) {
        response.clearCookie("session");
        await deleteSessionFromDB(session);
        return undefined;
    }

    response.cookie("session", newSession.sessionToken, createCookieOptions(newSession.refreshExpiresAt));
    await insertSessionToDB(newSession);
    return newSession;
}

async function insertSessionToDB(session: SessionRow) {
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
    await AUTH_POOL.query(query, [[values]]);
}

async function deleteSessionFromDB(session: SessionRow) {
    const query = `DELETE FROM sessions WHERE sessionHash=?;`;
    await AUTH_POOL.query(query, [session.sessionHash]);
}

export async function loadSettingsFromDB(userId: string): Promise<SettingsValues | undefined> {
    const query = `SELECT * FROM settings WHERE userId=?`;
    const [[row]] = await AUTH_POOL.query<(SettingsRow & RowDataPacket)[]>(query, [userId]);
    if (!row) {
        return undefined;
    }

    return {
        defaultGame: row.game,
        defaultStyle: row.style,
        theme: row.theme,
        maxDaysRelativeDates: row.maxDaysRelative,
        country: row.countryCode ?? undefined
    };
}

async function updateSettingsToDB(settings: SettingsRow) {
    const query = `INSERT INTO settings (userId, theme, game, style, maxDaysRelative, countryCode) 
        VALUES ? AS new 
        ON DUPLICATE KEY UPDATE
            theme=new.theme,
            game=new.game,
            style=new.style,
            maxDaysRelative=new.maxDaysRelative,
            countryCode=new.countryCode
    ;`;

    const values = [
        settings.userId,
        settings.theme,
        settings.game,
        settings.style,
        settings.maxDaysRelative,
        settings.countryCode
    ];
    await AUTH_POOL.query(query, [[values]]);
}

// async function deleteSessionsByUserFromDB(userId: string) {
//     const query = `SELECT * FROM sessions WHERE userId = ?;`;
//     const [rows] = await pool.query<(SessionRow & RowDataPacket)[]>(query, [userId]);
//     if (!rows) {
//         return undefined;
//     }

//     for (const row of rows) {
//         await client.tokenRevocation(config, row.refreshToken);
//         await deleteSessionFromDB(row);
//     }
// }

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