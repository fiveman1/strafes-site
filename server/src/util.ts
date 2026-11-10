// utils.ts

import ExpiryMap from "expiry-map";
import pMemoize from "p-memoize";

export function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;
}

export const IS_DEV_MODE = process.env.NODE_ENV === "development";

/** A unix time in seconds (as MySQL's UNIX_TIMESTAMP gives it) to an ISO string. */
export function unixToISO(seconds: string | number) {
    return new Date(+seconds * 1000).toISOString();
}

/**
 * p-memoize for an async function that returns undefined (or throws) when it fails. Those results aren't cached, so
 * the next call tries again instead of getting the failure until it expires. Calls made while one is in flight share
 * it. Keyed by all the arguments unless cacheKey says otherwise. Takes either maxAge, or a cache to share with other
 * code (which sets its own expiry).
 */
export function memoizeAsync<A extends unknown[], T>(fn: (...args: A) => Promise<T>, options: {
    cacheKey?: (args: A) => string
    // For results that shouldn't be cached besides undefined, which never is
    shouldCache?: (value: Awaited<T>) => boolean
} & ({ maxAge: number } | { cache: ExpiryMap<string, Awaited<T>> })): (...args: A) => Promise<T> {
    const { shouldCache } = options;
    return pMemoize(fn, {
        cacheKey: options.cacheKey ?? ((args) => JSON.stringify(args)),
        cache: "cache" in options ? options.cache : new ExpiryMap<string, Awaited<T>>(options.maxAge),
        shouldCache: (value) => value !== undefined && (shouldCache?.(value) ?? true)
    });
}
