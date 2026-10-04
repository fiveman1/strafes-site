import { Request, Response } from "express";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { isBot } from "isbot";

const BURST_LIMIT = 100;
const shortLimiter = new RateLimiterMemory({
    points: BURST_LIMIT,
    duration: 60
});

const longLimiter = new RateLimiterMemory({
    points: BURST_LIMIT * 15,
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
        remaining: result.remainingPoints,
        reset: Math.ceil((Date.now() + result.msBeforeNext) / 1000)
    };
}

async function tryConsumeRequest(ip: string, points: number): Promise<[boolean, CacheHeaders | undefined]> {
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

export function rateLimiterMiddleware(points: number) {
    return async (req: Request, res: Response, next: () => any) => {
        if (!req.ip) {
            res.status(400);
            return;
        }

        if (isBot(req.get("user-agent"))) {
            points *= 5;
        }

        const [valid, headers] = await tryConsumeRequest(req.ip, points);

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