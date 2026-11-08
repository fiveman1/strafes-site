import { Request, Response } from "express";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { isBot } from "isbot";
import { stat } from "fs/promises";
import path from "path";
import { IS_DEV_MODE } from "./util.js";

const BURST_LIMIT = 100;
// Points are counted in tenths
const POINT_SCALE = 10;
const shortLimiter = new RateLimiterMemory({
    points: BURST_LIMIT * POINT_SCALE,
    duration: 60
});

const longLimiter = new RateLimiterMemory({
    points: BURST_LIMIT * 15 * POINT_SCALE,
    duration: 60 * 60
});

interface CacheHeaders {
    retryAfter: number
    limit: number
    remaining: number
    reset: number
}

function createCacheHeaders(result: RateLimiterRes): CacheHeaders {
    return {
        retryAfter: result.msBeforeNext / 1000,
        limit: BURST_LIMIT,
        remaining: Math.floor(result.remainingPoints / POINT_SCALE),
        reset: Math.ceil((Date.now() + result.msBeforeNext) / 1000)
    };
}

async function tryConsumeRequest(ip: string, points: number): Promise<[boolean, CacheHeaders | undefined]> {
    points = Math.max(1, Math.round(points * POINT_SCALE));
    try {
        await longLimiter.consume(ip, points);
        const result = await shortLimiter.consume(ip, points);
        return [true, createCacheHeaders(result)];
    }
    catch (result) {
        if (result instanceof RateLimiterRes) {
            return [false, createCacheHeaders(result)];
        }
        else {
            return [false, undefined];
        }
    }
}

/** points can be fractional, down to 0.1 */
export function rateLimiterMiddleware(points: number) {
    return async (req: Request, res: Response, next: () => any) => {
        // Local testing sends far more requests than browsing, all from one IP
        if (IS_DEV_MODE) {
            next();
            return;
        }

        if (!req.ip) {
            res.status(400);
            return;
        }

        let calcPoints = points;
        if (isBot(req.get("user-agent"))) {
            calcPoints *= 5;
        }

        const [valid, headers] = await tryConsumeRequest(req.ip, calcPoints);

        if (headers) {
            res.setHeader("Retry-After", headers.retryAfter);
            res.setHeader("X-RateLimit-Limit", headers.limit);
            res.setHeader("X-RateLimit-Remaining", headers.remaining);
            res.setHeader("X-RateLimit-Reset", headers.reset);
        }

        if (valid) {
            next();
        }
        else {
            res.status(429).send("Too many requests");
        }
    };
}

// Vite puts a content hash in every file name under /assets, so a changed file always gets a new URL
// and the old one can be cached forever. index.html is what points at the current files.
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function isHashedAsset(root: string, filePath: string) {
    return path.relative(root, filePath).startsWith("assets" + path.sep);
}

/** setHeaders for express.static, so hashed assets served uncompressed get the same caching. */
export function staticCacheHeaders(root: string) {
    return (res: Response, filePath: string) => {
        if (isHashedAsset(root, filePath)) {
            res.setHeader("Cache-Control", IMMUTABLE_CACHE_CONTROL);
        }
    };
}

/** Serves the .br file the client build writes next to each asset, when the browser accepts brotli. */
export function precompressedMiddleware(root: string) {
    const resolvedRoot = path.resolve(root);
    return async (req: Request, res: Response, next: () => any) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
            return next();
        }

        let filePath: string;
        try {
            filePath = path.join(resolvedRoot, decodeURIComponent(req.path));
        }
        catch {
            return next();
        }
        if (!isHashedAsset(resolvedRoot, filePath)) {
            return next();
        }

        const brPath = filePath + ".br";
        try {
            if (!(await stat(brPath)).isFile()) return next();
        }
        catch {
            return next();
        }

        // Caches (Cloudflare included) must keep the brotli and uncompressed versions apart
        res.vary("Accept-Encoding");
        if (!req.acceptsEncodings("br")) {
            return next();
        }

        res.setHeader("Content-Encoding", "br");
        res.setHeader("Cache-Control", IMMUTABLE_CACHE_CONTROL);
        res.type(path.extname(filePath));
        res.sendFile(brPath, (err) => {
            if (err && !res.headersSent) {
                res.removeHeader("Content-Encoding");
                next();
            }
        });
    };
}
