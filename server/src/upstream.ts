import express from "express";

export type Service = "StrafesNET" | "Roblox";

/**
 * A request to a service the site depends on that failed, other than there being nothing there (those come back as
 * null). status is unset when there was no response, and retryAfterMs is how long the service asked to be left alone,
 * if it said.
 */
export class UpstreamFailure {
    constructor(readonly service: Service, readonly status: number | undefined, readonly retryAfterMs: number | undefined) {}
}

/** The value, or undefined if the request failed, for callers that do fine without it. */
export function unlessFailed<T>(value: T | UpstreamFailure): T | undefined {
    return value instanceof UpstreamFailure ? undefined : value;
}

/**
 * What to tell the client. A 429 when the service said the site is making too many requests, so the client doesn't
 * retry right away.
 */
export function upstreamErrorResponse(failure: UpstreamFailure): { status: 429 | 503, error: string } {
    if (failure.status === 429) {
        return { status: 429, error: `${failure.service} is getting too many requests from the site, try again in a bit` };
    }
    return { status: 503, error: `Couldn't reach ${failure.service}, try again in a bit` };
}

/** For when a service the site depends on didn't answer, as opposed to there being nothing to find (a 404). */
export function sendUpstreamError(res: express.Response, failure: UpstreamFailure) {
    const { status, error } = upstreamErrorResponse(failure);
    if (status === 429 && failure.retryAfterMs !== undefined) {
        res.setHeader("Retry-After", Math.ceil(failure.retryAfterMs / 1000));
    }
    res.status(status).json({ error: error });
}
