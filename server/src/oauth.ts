import { Request } from "express";
import mysql, { RowDataPacket } from "mysql2/promise";
import * as client from "openid-client";

const SCOPE = "openid profile";

const user = process.env.AUTH_DB_USER ?? "";
const password = process.env.AUTH_DB_PASSWORD ?? "";
const pool = mysql.createPool({
    host: "localhost",
    user: user,
    password: password,
    database: "strafes_auth_users",
    timezone: "Z", // UTC
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true
});

const clientId = process.env.ROBLOX_CLIENT_ID ?? "";
const clientSecret = process.env.ROBLOX_CLIENT_SECRET ?? "";

let redirectUri = process.env.BASE_URL + "/oauth/callback";
if (process.argv.splice(2)[0] === "--dev") {
    redirectUri = "http://localhost:3000/oauth/callback";
}

const config = await client.discovery(
    new URL("https://apis.roblox.com/oauth/.well-known/openid-configuration"),
    clientId,
    clientSecret
);

export interface AuthCookieTokens {
    accessToken: string | undefined,
    expiresAt: string | undefined,
    refreshToken: string | undefined,
    robloxUserId: string | undefined
}

export interface AuthRedirectInfo {
    url: string,
    cookies: LoginCookieTokens
}

export interface LoginCookieTokens {
    codeVerifier: string
    state?: string
}

export async function getUserInfo(request: Request) {
    
}

export async function getAuthRedirectUrl(): Promise<AuthRedirectInfo> {
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const params: Record<string, string> = {
        redirect_uri: redirectUri,
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

    return {
        url: client.buildAuthorizationUrl(config, params).href,
        cookies: {
            codeVerifier: codeVerifier,
            state: params.state
        }
    };

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

async function insertUserToDB(accessToken: string, claims: RobloxClaims) {
    
}

export async function authorizeAndGetTokens(request: Request): Promise<AuthCookieTokens | undefined> {
    const cookies = request.signedCookies.login as LoginCookieTokens;
    try {
        const tokens = await client.authorizationCodeGrant(
            config,
            new URL(`${process.env.BASE_URL}${request.url}`),
            {
                pkceCodeVerifier: cookies.codeVerifier,
                expectedState: cookies.state,
            },
        );

        const now = new Date().getTime();
        const expiresAt = new Date(now + (tokens.expiresIn() ?? 0));

        const claims = tokens.claims() as client.IDToken & RobloxClaims;
        await insertUserToDB(tokens.access_token, claims);

        return {
            accessToken: tokens.access_token,
            expiresAt: expiresAt.toISOString(),
            refreshToken: tokens.refresh_token ?? "",
            robloxUserId: claims.sub
        };
    }
    catch {
        return undefined;
    }
}

export async function getLoggedInUser(request: Request) {
    const cookies = request.signedCookies.tokens as AuthCookieTokens;
    const now = new Date();
    let accessToken = cookies.accessToken || "";
    if (cookies.accessToken === undefined || cookies.refreshToken === undefined || cookies.expiresAt === undefined || cookies.robloxUserId === undefined) {
        return undefined;
    }
    else if (now > new Date(cookies.expiresAt)) {
        const newTokenSet = await client.refreshTokenGrant(config, cookies.refreshToken, {
            scope: SCOPE,
        });
        accessToken = newTokenSet.access_token;
    }
    const userInfo = await client.fetchUserInfo(config, accessToken, cookies.robloxUserId) as unknown as RobloxClaims;
    return {
        userId: userInfo.sub,
        username: userInfo.name,
        displayName: userInfo.prferred_username,
        createdAt: userInfo.created_at,
        profileUrl: userInfo.profile,
        thumbnailUrl: userInfo.picture
    };
}