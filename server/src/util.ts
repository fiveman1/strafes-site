// utils.ts

export function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;
}

export const IS_DEV_MODE = process.env.NODE_ENV === "development";

/** A unix time in seconds (as MySQL's UNIX_TIMESTAMP gives it) to an ISO string. */
export function unixToISO(seconds: string | number) {
    return new Date(+seconds * 1000).toISOString();
}

export function sleep(ms: number) { 
    return new Promise(resolve => setTimeout(resolve, ms));
}