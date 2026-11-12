import { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { IS_DEV_MODE } from "../util.js";
import { ApiKey, LinksClient } from "./db.js";
import { hasPermission } from "./keys.js";

// The legacy routes answer in rbhopdog-verify's format, and v1 in its own. Each router sets which one it is, so the
// middleware shared between them (and their rate limits, which count across both) can answer the right way.
export type ApiFormat = "v1" | "legacy";

export type ApiErrorCode =
    "bad_request" |
    "unauthorized" |
    "forbidden" |
    "not_found" |
    "gone" |
    "rate_limited" |
    "server_error";

interface ApiLocals {
    apiFormat?: ApiFormat
    apiKey?: ApiKey
}

function locals(res: Response) {
    return res.locals as ApiLocals;
}

export function setApiFormat(format: ApiFormat) {
    return (req: Request, res: Response, next: NextFunction) => {
        locals(res).apiFormat = format;
        next();
    };
}

export function getApiKey(res: Response) {
    return locals(res).apiKey;
}

/** The legacy API's response format */
export function legacyResponse(res: Response, status: number, message: string | undefined, result: object = {}) {
    const ok = status >= 200 && status < 300;
    res.status(status).json({
        status: ok ? "ok" : "error",
        code: status,
        messages: message ? [message] : [],
        result: result,
        // 0 = none, 1 = default. The others were for phrases, which are gone.
        errorCode: ok ? 0 : 1
    });
}

export function sendApiError(res: Response, status: number, code: ApiErrorCode, message: string) {
    if (locals(res).apiFormat === "legacy") {
        legacyResponse(res, status, message);
    }
    else {
        res.status(status).json({ error: { code: code, message: message } });
    }
}

/**
 * For errors from a router's routes, and from express.json() before them (bad JSON, a body that's too big), which
 * would otherwise get Express's HTML error page. Mounted after the router at the same path, since body parsing errors
 * happen before the router runs.
 */
export function apiErrorHandler(format: ApiFormat) {
    return (err: unknown, req: Request, res: Response, next: NextFunction) => {
        if (res.headersSent) {
            next(err);
            return;
        }
        locals(res).apiFormat = format;

        // body-parser's errors say which 4xx they are, and that their message is fine to show
        const clientError = err as { status?: unknown, expose?: unknown, type?: unknown, message?: unknown } | undefined;
        const status = typeof clientError?.status === "number" ? clientError.status : 500;
        if (status >= 400 && status < 500 && clientError?.expose === true) {
            const message =
                clientError.type === "entity.parse.failed" ? "The request body isn't valid JSON." :
                clientError.type === "entity.too.large" ? "The request body is too big." :
                String(clientError.message);
            sendApiError(res, status, "bad_request", message);
            return;
        }

        console.error(`Public API error on ${req.method} ${req.originalUrl}:`, err);
        sendApiError(res, 500, "server_error", "Something went wrong on our end. Try again later.");
    };
}

/** The key from "Authorization: Bearer <key>", or the "api-key" header the old API used */
function apiKeyFromHeaders(req: Request) {
    const authorization = req.get("authorization");
    if (authorization) {
        const match = /^Bearer\s+(\S+)$/i.exec(authorization);
        return match ? match[1] : "";
    }
    return req.get("api-key");
}

/**
 * Loads the request's API key, if it has one, for requirePermission and the rate limits. A key that doesn't work is
 * turned away rather than treated like no key, so a typo or a revoked key gets noticed.
 */
export function loadApiKey(links: LinksClient) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const rawKey = apiKeyFromHeaders(req);
        if (rawKey === undefined) {
            next();
            return;
        }

        const apiKey = rawKey && rawKey.length <= 128 ? await links.findApiKey(rawKey) : undefined;
        if (!apiKey) {
            sendApiError(res, 401, "unauthorized", "The API key isn't valid. It may have been revoked.");
            return;
        }
        locals(res).apiKey = apiKey;
        next();
    };
}

/** After loadApiKey */
export function requirePermission(permission: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiKey = locals(res).apiKey;
        if (!apiKey) {
            sendApiError(res, 401, "unauthorized", "This endpoint needs an API key, sent as \"Authorization: Bearer <key>\".");
            return;
        }
        if (!hasPermission(apiKey.permissions, permission)) {
            sendApiError(res, 403, "forbidden", "The API key doesn't have permission for this endpoint.");
            return;
        }
        next();
    };
}

function rateLimited(req: Request, res: Response) {
    sendApiError(res, 429, "rate_limited", "You have exceeded the rate limit.");
}

const sharedLimitOptions = {
    standardHeaders: "draft-7",
    legacyHeaders: true,
    handler: rateLimited,
    validate: { xForwardedForHeader: !IS_DEV_MODE }
} as const;

// Without a key, by IP. The same limits the old API had on its public lookup.
const anonymousHourly = rateLimit({
    ...sharedLimitOptions,
    windowMs: 60 * 60 * 1000,
    limit: 300,
    skip: (req, res) => locals(res).apiKey !== undefined
});
const anonymousDaily = rateLimit({
    ...sharedLimitOptions,
    windowMs: 24 * 60 * 60 * 1000,
    limit: 3000,
    skip: (req, res) => locals(res).apiKey !== undefined
});
// With a key, by key, so a bot isn't limited by sharing an IP (or held to the anonymous limits)
const keyed = rateLimit({
    ...sharedLimitOptions,
    windowMs: 60 * 1000,
    limit: 600,
    skip: (req, res) => locals(res).apiKey === undefined,
    keyGenerator: (req, res) => `key:${locals(res).apiKey!.id}`
});

/** After loadApiKey */
// Hourly last, so the headers show the limit that runs out first
export const apiRateLimit = [anonymousDaily, anonymousHourly, keyed];

/** For :discordId params. Snowflakes go past what a JS number can hold, so they stay strings. */
export function parseDiscordId(value: unknown): string | undefined {
    if (typeof value !== "string" || !/^\d{1,20}$/.test(value)) {
        return undefined;
    }
    const id = BigInt(value);
    return id > 0n && id < (1n << 64n) ? id.toString() : undefined;
}

/** For :robloxId params */
export function parseRobloxId(value: unknown): number | undefined {
    if (typeof value !== "string" || !/^\d{1,16}$/.test(value)) {
        return undefined;
    }
    const id = +value;
    return id > 0 && Number.isSafeInteger(id) ? id : undefined;
}
