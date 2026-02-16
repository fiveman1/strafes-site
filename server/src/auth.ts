import { Request, Response, CookieOptions } from "express";
import mysql, { RowDataPacket } from "mysql2/promise";
import * as client from "openid-client";
import { COUNTRIES, LoginUser, SettingsValues } from "shared";
import { createHash, randomBytes } from "crypto";
import vine, { errors } from "@vinejs/vine";
import * as validators from "./validators.js";
import { IS_DEV_MODE } from "./util.js";

// If running the dev site, go back across the proxy
const AFTER_AUTH_URL = IS_DEV_MODE ? "http://localhost:3000/" : "/";

export class AuthClient {

    protected readonly SCOPE = "openid profile";

    protected readonly config: client.Configuration;
    protected readonly baseURL: string;
    protected readonly pool: mysql.Pool;

    public static async Create(clientId: string, clientSecret: string, dbUser: string, dbPassword: string, baseURL: string) {
        const config = await client.discovery(
            new URL("https://apis.roblox.com/oauth/.well-known/openid-configuration"),
            clientId,
            clientSecret
        );
        return new AuthClient(config, dbUser, dbPassword, baseURL);
    }

    protected constructor(config: client.Configuration, dbUser: string, dbPassword: string, baseURL: string) {
        this.config = config;
        this.pool =  mysql.createPool({
            host: "localhost",
            user: dbUser,
            password: dbPassword,
            database: "strafes_auth_users",
            timezone: "Z", // UTC
            supportBigNumbers: true,
            bigNumberStrings: true
        });
        this.baseURL = baseURL;
    }

    // Entrypoints
    public async redirectToAuthURL(response: Response) {
        const codeVerifier = client.randomPKCECodeVerifier();
        const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

        const params: Record<string, string> = {
            redirect_uri: this.baseURL + "/oauth/callback",
            scope: this.SCOPE,
            response_type: "code",
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        };

        if (!this.config.serverMetadata().supportsPKCE()) {
            /**
             * We cannot be sure the server supports PKCE so we're going to use state too.
             * Use of PKCE is backwards compatible even if the AS doesn't support it which
             * is why we're using it regardless. Like PKCE, random state must be generated
             * for every redirect to the authorization_endpoint.
             */
            params.state = client.randomState();
        }

        const expiresAt = new Date().getTime() + (60 * 10000); // 1 minute
        const options = this.createCookieOptions(new Date(expiresAt));
        response.cookie("codeVerifier", codeVerifier, options);
        response.cookie("state", params.state, options);

        response.status(200).json({url: client.buildAuthorizationUrl(this.config, params).href});
    }

    public async authorizeAndSetTokens(request: Request, response: Response) {
        let userId = "";
        try {
            const cookies = request.signedCookies as LoginCookies;
            const tokens = await client.authorizationCodeGrant(
                this.config,
                new URL(this.baseURL + request.url),
                {
                    pkceCodeVerifier: cookies.codeVerifier,
                    expectedState: cookies.state,
                },
            );
            
            const sessionToken = AuthClient.generateSessionToken();
            const session = AuthClient.createSessionObject(sessionToken, AuthClient.hashSessionToken(sessionToken), tokens);
            if (session) {
                userId = session.userId;
                response.cookie("session", sessionToken, this.createCookieOptions(session.refreshExpiresAt));
                await this.insertSessionToDB(session);
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

    public async getLoggedInUser(request: Request, response: Response): Promise<LoginUser | undefined> {
        const session = await this.loadSession(request, response);
        if (!session) {
            return undefined;
        }

        let userInfo: RobloxClaims;
        try {
            userInfo = await client.fetchUserInfo(this.config, session.accessToken, session.userId) as client.UserInfoResponse & RobloxClaims;
        }
        catch {
            // Refresh and try again
            const newSession = await this.refreshSession(response, session);
            if (!newSession) {
                return undefined;
            }
            userInfo = await client.fetchUserInfo(this.config, newSession.accessToken, newSession.userId) as client.UserInfoResponse & RobloxClaims;
        }

        return {
            userId: +userInfo.sub,
            username: userInfo.preferred_username,
            displayName: userInfo.name,
            createdAt: userInfo.created_at,
            profileUrl: userInfo.profile,
            thumbnailUrl: userInfo.picture
        };
    }

    public async setLoggedInUser(request: Request, response: Response) {
        const user = await this.getLoggedInUser(request, response);
        
        if (!user) {
            response.status(401).json({error: "You are not logged in"});
            return;
        }

        response.status(200).json(user);
    }

    public async logout(request: Request, response: Response) {
        const session = await this.loadSession(request, response, true);
        if (session) {
            await this.deleteSessionFromDB(session);
            await client.tokenRevocation(this.config, session.refreshToken);
        }
        
        response.clearCookie("session");
        response.status(200).json({logout: "success"});
    }

    public async getSettings(request: Request, response: Response) {
        const user = await this.getLoggedInUser(request, response);
        
        if (!user) {
            response.status(401).json({error: "You are not logged in"});
            return;
        }

        const settings = await this.loadSettingsFromDB(user.userId);
        if (!settings) {
            response.status(404).json({error: "No settings found"});
            return;
        }

        response.status(200).json(settings);
    }

    protected readonly settingsValidator = vine.create({
        game: validators.game(),
        style: validators.style(),
        theme: vine.enum(["light", "dark"]),
        maxDaysRelative: vine.number().withoutDecimals().range([0, 9999]),
        country: vine.enum(COUNTRIES.map((country) => country.code)).optional()
    });

    public async updateSettings(request: Request, response: Response) {
        const [error, result] = await this.settingsValidator.tryValidate(request.body);
        if (error) {
            response.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input"});
            return;
        }
        
        const game = result.game;
        const style = result.style;
        const theme = result.theme;
        const maxDaysRelative = result.maxDaysRelative;
        const country = result.country;

        const user = await this.getLoggedInUser(request, response);
        
        if (!user) {
            response.status(401).json({error: "You are not logged in"});
            return;
        }

        await this.updateSettingsToDB({
            userId: user.userId.toString(),
            game: game,
            style: style,
            theme: theme,
            maxDaysRelative: maxDaysRelative,
            countryCode: country ?? null
        });

        response.status(200).json({success: true});
    }

    // Helpers
    protected async loadSession(request: Request, response: Response, noRefresh?: boolean): Promise<Session | undefined> {
        const cookies = request.signedCookies as AuthCookies;
        if (!cookies.session) {
            return undefined;
        }
        
        return this.loadSessionFromDB(response, cookies.session, noRefresh);
    }

    protected async loadSessionFromDB(response: Response, sessionToken: string, noRefresh?: boolean) {
        const hash = AuthClient.hashSessionToken(sessionToken);
        
        const query = "SELECT * FROM sessions WHERE sessionHash = ?;";
        const [[row]] = await this.pool.query<(SessionRow & RowDataPacket)[]>(query, [hash]);
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
            return await this.refreshSession(response, session);
        }

        return session;
    }

    protected async refreshSession(response: Response, session: Session): Promise<Session | undefined> {
        let newSession;
        try {
            const newTokenSet = await client.refreshTokenGrant(this.config, session.refreshToken, {
                scope: this.SCOPE,
            });

            newSession = AuthClient.createSessionObject(session.sessionToken, session.sessionHash, newTokenSet);
        }
        catch {
            
        }
        
        if (!newSession) {
            response.clearCookie("session");
            await this.deleteSessionFromDB(session);
            return undefined;
        }

        response.cookie("session", newSession.sessionToken, this.createCookieOptions(newSession.refreshExpiresAt));
        await this.insertSessionToDB(newSession);
        return newSession;
    }

    protected async insertSessionToDB(session: SessionRow) {
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
        await this.pool.query(query, [[values]]);
    }

    protected async deleteSessionFromDB(session: SessionRow) {
        const query = `DELETE FROM sessions WHERE sessionHash=?;`;
        await this.pool.query(query, [session.sessionHash]);
    }

    public async loadSettingsFromDB(userId: number): Promise<SettingsValues | undefined> {
        const query = `SELECT * FROM settings WHERE userId=?`;
        const [[row]] = await this.pool.query<(SettingsRow & RowDataPacket)[]>(query, [userId]);
        if (!row) {
            return undefined;
        }

        return AuthClient.settingsRowToValues(row);
    }

    public async loadSettingsFromDBMulti(userIds: number[]): Promise<Map<number, SettingsValues> | undefined> {
        const query = `SELECT * FROM settings WHERE userId IN (?);`;
        const [rows] = await this.pool.query<(SettingsRow & RowDataPacket)[]>(query, [userIds]);
        if (!rows) {
            return undefined;
        }

        const userIdToSettings = new Map<number, SettingsValues>();
        for (const row of rows) {
            userIdToSettings.set(+row.userId, AuthClient.settingsRowToValues(row));
        }

        return userIdToSettings;
    }

    protected async updateSettingsToDB(settings: SettingsRow) {
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
        await this.pool.query(query, [[values]]);
    }

    // Utils
    protected static hashSessionToken(token: string) {
        return createHash("sha256").update(token).digest("hex");
    }

    protected static generateSessionToken() {
        return randomBytes(64).toString("hex").slice(0, 64);
    }

    protected createCookieOptions(expires: Date): CookieOptions {
        return {
            secure: !this.baseURL.startsWith("http://localhost"),
            httpOnly: true,
            signed: true,
            expires: expires
        };
    }

    protected static createSessionObject(sessionToken: string, sessionHash: string, tokenSet: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers): Session | undefined {
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

    protected static settingsRowToValues(row: SettingsRow): SettingsValues {
        return {
            defaultGame: row.game,
            defaultStyle: row.style,
            theme: row.theme,
            maxDaysRelativeDates: row.maxDaysRelative,
            country: row.countryCode ?? undefined
        };
    }
}

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