import axios, { AxiosResponse } from "axios";
import { IS_DEV_MODE, memoizeAsync } from "./util.js";
import { UpstreamFailure } from "./upstream.js";

const DISABLE_ROPROXY = process.env.DISABLE_ROPROXY === "true";

export const tryGetCached = memoizeAsync(tryGetRequest, { maxAge: 5 * 60 * 1000 });
export const tryPostCached = memoizeAsync(tryPostRequest, { maxAge: 5 * 60 * 1000 });

/**
 * null when the response is a 404 or 400 (it's not there, or the service won't take what was asked for, so trying again
 * won't help), an UpstreamFailure when the request failed some other way. These are only used for Roblox's APIs.
 */
function onRequestError(err: unknown): null | UpstreamFailure {
    const response = axios.isAxiosError(err) ? err.response : undefined;
    const status = response?.status;
    if (status === 404 || status === 400) {
        return null;
    }
    if (IS_DEV_MODE) {
        console.log(err);
    }
    else {
        // Just enough to tell a rate limit (429) from Roblox or StrafesNET being down
        const url = axios.isAxiosError(err) ? err.config?.url : undefined;
        const reason = status ?? (err instanceof Error ? err.message : "unknown error");
        console.error(`Request failed (${reason}): ${url ?? "unknown url"}`);
    }
    return new UpstreamFailure("Roblox", status, response ? getRetryAfterMs(response.headers) : undefined);
}

function resolveUrl(url: string) {
    return DISABLE_ROPROXY ? url.replace("roproxy.com", "roblox.com") : url;
}

/** null when there's nothing there (see onRequestError), an UpstreamFailure when the request failed. */
export async function tryGetRequest(url: string, params?: any, headers?: any): Promise<AxiosResponse | null | UpstreamFailure> {
    url = resolveUrl(url);
    try {
        return await axios.get(url, {params: params, headers: headers, timeout: 10000});
    }
    catch (err) {
        return onRequestError(err);
    }
}

/** null when there's nothing there (see onRequestError), an UpstreamFailure when the request failed. */
export async function tryPostRequest(url: string, params?: any): Promise<AxiosResponse | null | UpstreamFailure> {
    try {
        return await axios.post(url, params, {timeout: 5000});
    }
    catch (err) {
        return onRequestError(err);
    }
}

/**
 * status is unset when there was no response. retryAfterMs is how long the service asked to be left alone, if it
 * said.
 */
export type RequestResult = { ok: true, res: AxiosResponse } | { ok: false, status: number | undefined, retryAfterMs: number | undefined };

/** Like tryGetRequest, but says why it failed, for callers that back off. Doesn't log. */
export async function getWithStatus(url: string, params?: any): Promise<RequestResult> {
    try {
        return { ok: true, res: await axios.get(resolveUrl(url), { params: params, timeout: 10000 }) };
    }
    catch (err) {
        const response = axios.isAxiosError(err) ? err.response : undefined;
        return { ok: false, status: response?.status, retryAfterMs: response ? getRetryAfterMs(response.headers) : undefined };
    }
}

export function getRetryAfterMs(headers: Record<string, unknown>) {
    // Both in seconds. Roblox sends when its rate limit window resets too, which can be later than retry-after.
    const seconds = [headers["retry-after"], headers["x-ratelimit-reset"]]
        .map(Number)
        .filter((value) => Number.isFinite(value) && value > 0);
    return seconds.length > 0 ? Math.max(...seconds) * 1000 : undefined;
}
