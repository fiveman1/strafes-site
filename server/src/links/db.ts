import { randomUUID } from "crypto";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { generateApiKey, generateLinkToken, generateWebhookSecret, sha256 } from "./keys.js";

// How long a link from the bot works for
export const LINK_REQUEST_TTL_MS = 15 * 60 * 1000;
// Old requests are only kept around for checking on them afterwards
const LINK_REQUEST_RETENTION_DAYS = 30;

export interface ApiKey {
    id: number
    name: string
    ownerDiscordId: string
    permissions: number
    webhookUrl: string | undefined
    webhookSecret: string | undefined
}

export interface ApiKeyListing extends ApiKey {
    createdAt: Date
    lastUsedAt: Date | undefined
    revokedAt: Date | undefined
}

export interface DiscordLink {
    discordId: string
    robloxId: number
    source: "legacy" | "oauth"
    linkedAt: Date | undefined
}

export type LinkRequestStatus = "pending" | "completed" | "cancelled" | "expired";

/** A link request as the public API shows it */
export interface LinkRequest {
    id: string
    status: LinkRequestStatus
    discordId: string
    createdAt: string
    expiresAt: string
    completedAt?: string
    robloxId?: number
    robloxUsername?: string
    previousRobloxId?: number
}

/** What the link page shows about a request */
export interface PendingLinkRequest {
    id: string
    apiKeyId: number
    appName: string
    discordId: string
    discordUsername: string | undefined
    discordAvatarUrl: string | undefined
    expiresAt: Date
}

export interface CompletedLink {
    request: LinkRequest
    // The key that asked for it, for sending its webhook
    apiKey: ApiKey
}

interface ApiKeySQL {
    id: number
    key_hash: string
    owner_discord_id: string
    name: string
    permissions: number
    webhook_url: string | null
    webhook_secret: string | null
    created_at: Date
    last_used_at: Date | null
    revoked_at: Date | null
}
type ApiKeyRow = ApiKeySQL & RowDataPacket;

interface DiscordLinkSQL {
    discord_id: string
    roblox_id: string
    source: "legacy" | "oauth"
    linked_at: Date | null
}
type DiscordLinkRow = DiscordLinkSQL & RowDataPacket;

interface LinkRequestSQL {
    id: string
    token_hash: string
    api_key_id: number
    discord_id: string
    discord_username: string | null
    discord_avatar_url: string | null
    status: "pending" | "completed" | "cancelled"
    created_at: Date
    expires_at: Date
    completed_at: Date | null
    roblox_id: string | null
    roblox_username: string | null
    previous_roblox_id: string | null
}
type LinkRequestRow = LinkRequestSQL & RowDataPacket;

type LinkRequestWithKeyRow = LinkRequestRow & {
    key_name: string
    key_owner_discord_id: string
    key_permissions: number
    key_webhook_url: string | null
    key_webhook_secret: string | null
    key_revoked_at: Date | null
};

/** Now, to the second, since DATETIME columns round off the milliseconds (so what's returned matches what's stored) */
function nowToSecond() {
    return new Date(Math.floor(Date.now() / 1000) * 1000);
}

function toApiKey(row: ApiKeySQL): ApiKey {
    return {
        id: row.id,
        name: row.name,
        ownerDiscordId: row.owner_discord_id,
        permissions: row.permissions,
        webhookUrl: row.webhook_url ?? undefined,
        webhookSecret: row.webhook_secret ?? undefined
    };
}

function toLinkRequest(row: LinkRequestSQL): LinkRequest {
    const expired = row.status === "pending" && row.expires_at.getTime() <= Date.now();
    const request: LinkRequest = {
        id: row.id,
        status: expired ? "expired" : row.status,
        discordId: row.discord_id,
        createdAt: row.created_at.toISOString(),
        expiresAt: row.expires_at.toISOString()
    };
    if (row.completed_at) request.completedAt = row.completed_at.toISOString();
    if (row.roblox_id !== null) request.robloxId = +row.roblox_id;
    if (row.roblox_username !== null) request.robloxUsername = row.roblox_username;
    if (row.previous_roblox_id !== null) request.previousRobloxId = +row.previous_roblox_id;
    return request;
}

export class LinksClient {

    protected readonly pool: mysql.Pool;

    public constructor(user: string, password: string) {
        this.pool = mysql.createPool({
            host: "localhost",
            user: user,
            password: password,
            database: "strafes_links",
            timezone: "Z", // UTC
            supportBigNumbers: true,
            bigNumberStrings: true
        });
    }

    public async end() {
        await this.pool.end();
    }

    // API keys

    /** The key, if it exists and hasn't been revoked */
    public async findApiKey(rawKey: string): Promise<ApiKey | undefined> {
        const query = "SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL;";
        const [[row]] = await this.pool.execute<ApiKeyRow[]>(query, [sha256(rawKey)]);
        if (!row) {
            return undefined;
        }

        // At most once a minute, since this is on every request with a key
        if (!row.last_used_at || Date.now() - row.last_used_at.getTime() > 60 * 1000) {
            this.pool.execute("UPDATE api_keys SET last_used_at = UTC_TIMESTAMP() WHERE id = ?;", [row.id]).catch((err) => {
                console.error("Failed to update API key last used:", err);
            });
        }

        return toApiKey(row);
    }

    /** Returns the key, which is the only time it's ever available */
    public async createApiKey(name: string, ownerDiscordId: string, permissions: number, webhookUrl?: string) {
        const key = generateApiKey();
        const webhookSecret = webhookUrl ? generateWebhookSecret() : null;
        const query = `INSERT INTO api_keys (key_hash, owner_discord_id, name, permissions, webhook_url, webhook_secret, created_at)
            VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP());`;
        const [result] = await this.pool.execute<ResultSetHeader>(query, [sha256(key), ownerDiscordId, name, permissions, webhookUrl ?? null, webhookSecret]);
        return { id: result.insertId, key: key, webhookSecret: webhookSecret ?? undefined };
    }

    public async listApiKeys(): Promise<ApiKeyListing[]> {
        const [rows] = await this.pool.query<ApiKeyRow[]>("SELECT * FROM api_keys ORDER BY id;");
        return rows.map((row) => ({
            ...toApiKey(row),
            createdAt: row.created_at,
            lastUsedAt: row.last_used_at ?? undefined,
            revokedAt: row.revoked_at ?? undefined
        }));
    }

    /** false if there's no such key, or it was already revoked */
    public async revokeApiKey(id: number) {
        const [result] = await this.pool.execute<ResultSetHeader>("UPDATE api_keys SET revoked_at = UTC_TIMESTAMP() WHERE id = ? AND revoked_at IS NULL;", [id]);
        return result.affectedRows > 0;
    }

    public async setApiKeyPermissions(id: number, permissions: number) {
        const [result] = await this.pool.execute<ResultSetHeader>("UPDATE api_keys SET permissions = ? WHERE id = ?;", [permissions, id]);
        return result.affectedRows > 0;
    }

    /** Sets (with a new secret, which is returned) or clears the key's webhook. undefined if there's no such key. */
    public async setApiKeyWebhook(id: number, webhookUrl: string | undefined) {
        const secret = webhookUrl ? generateWebhookSecret() : null;
        const [result] = await this.pool.execute<ResultSetHeader>("UPDATE api_keys SET webhook_url = ?, webhook_secret = ? WHERE id = ?;", [webhookUrl ?? null, secret, id]);
        return result.affectedRows > 0 ? { webhookSecret: secret ?? undefined } : undefined;
    }

    // Links

    public async getLink(discordId: string): Promise<DiscordLink | undefined> {
        const [[row]] = await this.pool.execute<DiscordLinkRow[]>("SELECT * FROM discord_links WHERE discord_id = ?;", [discordId]);
        if (!row) {
            return undefined;
        }
        return {
            discordId: row.discord_id,
            robloxId: +row.roblox_id,
            source: row.source,
            linkedAt: row.linked_at ?? undefined
        };
    }

    /** Oldest link first */
    public async getDiscordIdsForRoblox(robloxId: number): Promise<string[]> {
        const query = "SELECT discord_id FROM discord_links WHERE roblox_id = ? ORDER BY linked_at IS NOT NULL, linked_at, discord_id;";
        const [rows] = await this.pool.execute<DiscordLinkRow[]>(query, [robloxId]);
        return rows.map((row) => row.discord_id);
    }

    /** The Roblox account it was linked to, or undefined if it wasn't linked */
    public async deleteLink(discordId: string): Promise<number | undefined> {
        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();
            const [[row]] = await conn.execute<DiscordLinkRow[]>("SELECT roblox_id FROM discord_links WHERE discord_id = ? FOR UPDATE;", [discordId]);
            if (!row) {
                await conn.rollback();
                return undefined;
            }
            await conn.execute("DELETE FROM discord_links WHERE discord_id = ?;", [discordId]);
            await conn.commit();
            return +row.roblox_id;
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }

    // Link requests

    /**
     * A new link request, and the token for its URL. Any pending request the key made for the same Discord account
     * is cancelled, so only the newest link works.
     */
    public async createLinkRequest(apiKeyId: number, discordId: string, discordUsername?: string, discordAvatarUrl?: string) {
        const id = randomUUID();
        const token = generateLinkToken();
        const now = nowToSecond();
        const expiresAt = new Date(now.getTime() + LINK_REQUEST_TTL_MS);

        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute(
                "UPDATE link_requests SET status = 'cancelled' WHERE discord_id = ? AND api_key_id = ? AND status = 'pending';",
                [discordId, apiKeyId]
            );
            const query = `INSERT INTO link_requests (id, token_hash, api_key_id, discord_id, discord_username, discord_avatar_url, status, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?);`;
            await conn.execute(query, [id, sha256(token), apiKeyId, discordId, discordUsername ?? null, discordAvatarUrl ?? null, now, expiresAt]);
            await conn.commit();
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }

        // Clean up old requests now and then. Not worth failing the request over.
        if (Math.random() < 0.05) {
            this.pool.execute(`DELETE FROM link_requests WHERE created_at < UTC_TIMESTAMP() - INTERVAL ${LINK_REQUEST_RETENTION_DAYS} DAY LIMIT 1000;`).catch((err) => {
                console.error("Failed to clean up old link requests:", err);
            });
        }

        const request: LinkRequest = {
            id: id,
            status: "pending",
            discordId: discordId,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        return { request, token };
    }

    /** Only requests made by the given key */
    public async getLinkRequest(id: string, apiKeyId: number): Promise<LinkRequest | undefined> {
        const [[row]] = await this.pool.execute<LinkRequestRow[]>("SELECT * FROM link_requests WHERE id = ? AND api_key_id = ?;", [id, apiKeyId]);
        return row ? toLinkRequest(row) : undefined;
    }

    /** The request, if the token is for one that can still be completed */
    public async getPendingLinkRequest(token: string): Promise<PendingLinkRequest | undefined> {
        const query = `SELECT r.*, k.name AS key_name, k.revoked_at AS key_revoked_at FROM link_requests r
            JOIN api_keys k ON k.id = r.api_key_id
            WHERE r.token_hash = ?;`;
        const [[row]] = await this.pool.execute<LinkRequestWithKeyRow[]>(query, [sha256(token)]);
        if (!row || !LinksClient.isUsable(row)) {
            return undefined;
        }
        return {
            id: row.id,
            apiKeyId: row.api_key_id,
            appName: row.key_name,
            discordId: row.discord_id,
            discordUsername: row.discord_username ?? undefined,
            discordAvatarUrl: row.discord_avatar_url ?? undefined,
            expiresAt: row.expires_at
        };
    }

    /**
     * Links the request's Discord account to the Roblox account, replacing whatever it was linked to. undefined if the
     * token isn't for a request that can still be completed (it expired, was used, or was replaced by a newer one).
     */
    public async completeLinkRequest(token: string, robloxId: number, robloxUsername: string): Promise<CompletedLink | undefined> {
        const conn = await this.pool.getConnection();
        try {
            await conn.beginTransaction();

            // Locked, so the same link opened twice can't be used twice
            const query = `SELECT r.*, k.name AS key_name, k.owner_discord_id AS key_owner_discord_id, k.permissions AS key_permissions,
                    k.webhook_url AS key_webhook_url, k.webhook_secret AS key_webhook_secret, k.revoked_at AS key_revoked_at
                FROM link_requests r
                JOIN api_keys k ON k.id = r.api_key_id
                WHERE r.token_hash = ?
                FOR UPDATE;`;
            const [[row]] = await conn.execute<LinkRequestWithKeyRow[]>(query, [sha256(token)]);
            if (!row || !LinksClient.isUsable(row)) {
                await conn.rollback();
                return undefined;
            }

            const [[previous]] = await conn.execute<DiscordLinkRow[]>("SELECT roblox_id FROM discord_links WHERE discord_id = ? FOR UPDATE;", [row.discord_id]);
            const previousRobloxId = previous ? +previous.roblox_id : undefined;

            const now = nowToSecond();
            await conn.execute(`INSERT INTO discord_links (discord_id, roblox_id, source, api_key_id, linked_at)
                VALUES (?, ?, 'oauth', ?, ?) AS new
                ON DUPLICATE KEY UPDATE
                    roblox_id = new.roblox_id,
                    source = new.source,
                    api_key_id = new.api_key_id,
                    linked_at = new.linked_at;`,
                [row.discord_id, robloxId, row.api_key_id, now]
            );
            await conn.execute(`UPDATE link_requests SET status = 'completed', completed_at = ?, roblox_id = ?, roblox_username = ?, previous_roblox_id = ?
                WHERE id = ?;`,
                [now, robloxId, robloxUsername, previousRobloxId ?? null, row.id]
            );
            await conn.commit();

            const request = toLinkRequest({
                ...row,
                status: "completed",
                completed_at: now,
                roblox_id: robloxId.toString(),
                roblox_username: robloxUsername,
                previous_roblox_id: previousRobloxId?.toString() ?? null
            });
            const apiKey = toApiKey({
                id: row.api_key_id,
                key_hash: "",
                owner_discord_id: row.key_owner_discord_id,
                name: row.key_name,
                permissions: row.key_permissions,
                webhook_url: row.key_webhook_url,
                webhook_secret: row.key_webhook_secret,
                created_at: now,
                last_used_at: null,
                revoked_at: null
            });
            return { request, apiKey };
        }
        catch (err) {
            await conn.rollback();
            throw err;
        }
        finally {
            conn.release();
        }
    }

    /** Pending, not expired, and the key that made it still works */
    protected static isUsable(row: LinkRequestWithKeyRow) {
        return row.status === "pending" && row.expires_at.getTime() > Date.now() && row.key_revoked_at === null;
    }
}
