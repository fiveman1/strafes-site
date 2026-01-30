import { Request, Response, CookieOptions } from "express";
// import mysql, { RowDataPacket } from "mysql2/promise";
import * as client from "openid-client";
import { LoginUser } from "./interfaces.js";

const SCOPE = "openid profile";

// const user = process.env.AUTH_DB_USER ?? "";
// const password = process.env.AUTH_DB_PASSWORD ?? "";
// const pool = mysql.createPool({
//     host: "localhost",
//     user: user,
//     password: password,
//     database: "strafes_auth_users",
//     timezone: "Z", // UTC
//     dateStrings: true,
//     supportBigNumbers: true,
//     bigNumberStrings: true
// });

const clientId = process.env.ROBLOX_CLIENT_ID ?? "";
const clientSecret = process.env.ROBLOX_CLIENT_SECRET ?? "";
const isDebug = process.env.DEBUG === "true";

const BASE_URL = process.env.BASE_URL;
const REDIRECT_URI = BASE_URL + "/oauth/callback";
// If running the dev site, go back across the proxy
const AFTER_AUTH_URL = process.argv.splice(2)[0] === "--dev" ? "http://localhost:3000/" : "/";

const config = await client.discovery(
    new URL("https://apis.roblox.com/oauth/.well-known/openid-configuration"),
    clientId,
    clientSecret
);

export interface AuthCookies {
    accessToken: {
        token: string | undefined
    } | undefined,
    refreshToken: {
        token: string | undefined
        robloxUserId: string | undefined
    } | undefined
}

export interface LoginCookies {
    login: {
        codeVerifier: string
        state?: string
    } | undefined
}

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

    response.cookie("login", {
        codeVerifier: codeVerifier,
        state: params.state
    }, createCookieOptions());

    response.status(200).json({url: client.buildAuthorizationUrl(config, params).href});
}

export interface RobloxClaims {
    sub: string,
    name: string,
    nickname: string,
    prferred_username: string,
    created_at: number,
    profile: string, // URL
    picture: string // URL
}

// async function insertUserToDB(claims: RobloxClaims) {
    
// }

export async function authorizeAndSetTokens(request: Request, response: Response) {
    let userId = "";
    try {
        const cookies = request.signedCookies as LoginCookies;
        const tokens = await client.authorizationCodeGrant(
            config,
            new URL(BASE_URL + request.url),
            {
                pkceCodeVerifier: cookies.login?.codeVerifier,
                expectedState: cookies.login?.state,
            },
        );

        const claims = tokens.claims() as client.IDToken & RobloxClaims;
        userId = claims.sub;
        // await insertUserToDB(claims);

        setAccessCookie(response, tokens.access_token, tokens.expiresIn());
        setRefreshCookie(response, tokens.refresh_token ?? "", userId);
    }
    catch (err) {
        console.error(err);
    }
    
    response.clearCookie("login");
    const url = userId ? `${AFTER_AUTH_URL}users/${userId}` : AFTER_AUTH_URL;
    response.redirect(url);
}

function setAccessCookie(response: Response, accessToken: string, expiresIn: number | undefined) {
    response.cookie("accessToken", {
        token: accessToken
    }, createCookieOptions(expiresIn));
}

function setRefreshCookie(response: Response, refreshToken: string, robloxUserId: string) {
    response.cookie("refreshToken", {
        token: refreshToken,
        robloxUserId: robloxUserId
    }, createCookieOptions(90 * 60 * 60 * 24)); // 90 days
}

export async function setLoggedInUser(request: Request, response: Response) {
    const cookies = request.signedCookies as AuthCookies;
    let accessToken = cookies.accessToken?.token;
    let refreshToken = cookies.refreshToken?.token;
    let userId = cookies.refreshToken?.robloxUserId;
    
    if (!refreshToken || !userId) {
        response.status(401).json({error: "You are not logged in"});
        return;
    }
    else if (!accessToken) {
        const newTokenSet = await refreshTokens(response, refreshToken);
        accessToken = newTokenSet.accessToken;
        refreshToken = newTokenSet.refreshToken;
        userId = newTokenSet.userId;
    }

    let userInfo;
    try {
        userInfo = await client.fetchUserInfo(config, accessToken, userId) as unknown as RobloxClaims;
    }
    catch {
        // Refresh and try again
        const newTokenSet = await refreshTokens(response, refreshToken ?? "");
        userInfo = await client.fetchUserInfo(config, newTokenSet.accessToken, newTokenSet.userId) as unknown as RobloxClaims;
    }

    const data: LoginUser = {
        userId: userInfo.sub,
        username: userInfo.name,
        displayName: userInfo.prferred_username,
        createdAt: userInfo.created_at,
        profileUrl: userInfo.profile,
        thumbnailUrl: userInfo.picture
    };

    response.status(200).json(data);
}

async function refreshTokens(response: Response, refreshToken: string) {
    const newTokenSet = await client.refreshTokenGrant(config, refreshToken, {
        scope: SCOPE,
    });
    const claims = newTokenSet.claims() as client.IDToken;
    const tokens = {
        accessToken: newTokenSet.access_token,
        refreshToken: newTokenSet.refresh_token ?? "",
        expiresIn: newTokenSet.expiresIn(),
        userId: claims.sub
    };
    setAccessCookie(response, tokens.accessToken, tokens.expiresIn);
    setRefreshCookie(response, tokens.refreshToken, claims.sub);
    
    return tokens;
}

function createCookieOptions(expiresIn?: number): CookieOptions {
    return {
        secure: !isDebug,
        httpOnly: true,
        signed: true,
        maxAge: expiresIn ? expiresIn * 1000 : undefined
    };
}

export async function logout(request: Request, response: Response) {
    const cookies = request.signedCookies as AuthCookies;
    if (cookies.refreshToken?.token) {
        await client.tokenRevocation(config, cookies.refreshToken.token);
    }
    
    response.clearCookie("accessToken");
    response.clearCookie("refreshToken");
    response.status(200).json({logout: "success"});
}