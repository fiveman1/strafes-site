import { exit } from "process";
import { Api as StrafesApi, TimePlacement, User as ApiUser } from "./generated/strafes.js";
import { Api as MapsApi } from "./generated/maps.js";
import memCache from "memory-cache";
import ExpiryMap from "expiry-map";
import { Game, RankSortBy, Style, TimeSortBy } from "shared";
import { IS_DEV_MODE, memoizeAsync } from "../util.js";

const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

const placementCache: memCache.CacheClass<string, number> = new memCache.Cache();

const STRAFES_CLIENT = new StrafesApi({
    baseUrl: "https://api.strafes.net/api/v1",
    securityWorker: () => {
        return {
            headers: {
                "X-API-Key": STRAFES_KEY
            }
        };
    }
});

const MAPS_CLIENT = new MapsApi({
    baseUrl: "https://maps.strafes.net/public-api/v1",
    securityWorker: () => {
        return {
            headers: {
                "X-API-Key": STRAFES_KEY
            }
        };
    }
});

// The generated clients throw the response itself when the status isn't OK
function isNotFound(err: unknown) {
    return (err as { status?: number } | undefined)?.status === 404;
}

export async function getPlacements(timeIds: string[]) {
    const placements: TimePlacement[] = [];
    const notCachedIds = new Set<string>();
    try {
        for (const timeId of timeIds) {
            const placement = placementCache.get(timeId);
            if (placement !== null) {
                placements.push({id: timeId, placement: placement});
            }
            else {
                notCachedIds.add(timeId);
            }
        }
        if (notCachedIds.size > 0) {
            const res = await STRAFES_CLIENT.time.placementList({ids: Array.from(notCachedIds).join(",")});
            for (const placement of res.data.data) {
                placementCache.put(placement.id, placement.placement, 5 * 60 * 1000); // 5 minutes
                placements.push(placement);
            }
        }
        return placements;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export const getTimes = memoizeAsync(getTimesCore, { maxAge: 5 * 60 * 1000 });
async function getTimesCore(userId: number | undefined, mapId: number | undefined, pageSize: number, pageNum: number, game: Game | undefined, style: Style | undefined, course: number, sort?: TimeSortBy) {
    try {
        const res = await STRAFES_CLIENT.time.timeList({
            user_id: userId,
            map_id: mapId,
            page_size: pageSize,
            page_number: pageNum,
            game_id: game === Game.all ? undefined : game,
            style_id: style === Style.all ? undefined : style,
            mode_id: course >= 0 ? course : undefined,
            sort_by: sort
        });
        
        return res.data;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export const getUserRank = memoizeAsync(getUserRankCore, { maxAge: 5 * 60 * 1000 });
/** null if the user isn't ranked, undefined if the request failed. */
async function getUserRankCore(userId: number, game: Game, style: Style) {
    try {
        const res = await STRAFES_CLIENT.user.rankList(userId, {
            game_id: game,
            style_id: style,
            mode_id: 0
        });

        return res.data.data;
    }
    catch (err) {
        if (isNotFound(err)) {
            return null;
        }
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export const getRanks = memoizeAsync(getRanksCore, { maxAge: 5 * 60 * 1000 });
async function getRanksCore(pageSize: number, pageNum: number, game: Game, style: Style, sort: RankSortBy) {
    try {
        const res = await STRAFES_CLIENT.rank.rankList({
            page_size: pageSize,
            page_number: pageNum,
            sort_by: sort,
            game_id: game,
            style_id: style,
            mode_id: 0
        });

        return res.data;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

const FOUND_USER_CACHE_MS = 5 * 60 * 1000;
// Short, so someone who joins the game for the first time doesn't wait long before the site notices
const MISSING_USER_CACHE_MS = 60 * 1000;
// Wrapped, since memory-cache returns null for a miss
const userInfoCache: memCache.CacheClass<number, { user: ApiUser | null }> = new memCache.Cache();

/**
 * The user's StrafesNET details, null if they've never joined the game, or undefined if the request failed.
 * Failures aren't cached, so a blip in the API doesn't stick around.
 */
export async function lookupUserInfo(userId: number): Promise<ApiUser | null | undefined> {
    const cached = userInfoCache.get(userId);
    if (cached) {
        return cached.user;
    }

    try {
        const res = await STRAFES_CLIENT.user.userDetail(userId);
        const user = res.data.data;
        userInfoCache.put(userId, { user: user }, FOUND_USER_CACHE_MS);
        return user;
    }
    catch (err) {
        if (isNotFound(err)) {
            userInfoCache.put(userId, { user: null }, MISSING_USER_CACHE_MS);
            return null;
        }
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

/** Like lookupUserInfo, for callers that treat "never joined" and "request failed" the same. */
export async function getUserInfo(userId: number): Promise<ApiUser | undefined> {
    return (await lookupUserInfo(userId)) ?? undefined;
}

const TIME_CACHE_MS = 5 * 60 * 1000;
const timeCache = new ExpiryMap<string, Awaited<ReturnType<typeof fetchTimeById>>>(TIME_CACHE_MS);
/** null if there's no time with that ID, undefined if the request failed. */
export const getTimeById = memoizeAsync(fetchTimeById, { cache: timeCache });

/**
 * getTimeById without the cache, for when a stale copy would be saved somewhere: a time is updated in place when its
 * runner beats it. The fresh copy replaces the cached one, so everything else agrees with what was saved.
 */
export async function fetchFreshTimeById(timeId: string) {
    const time = await fetchTimeById(timeId);
    if (time) {
        timeCache.set(JSON.stringify([timeId]), time);
    }
    return time;
}

async function fetchTimeById(timeId: string) {
    try {
        const res = await STRAFES_CLIENT.time.timeDetail(timeId);
        return res.data.data;
    }
    catch (err) {
        if (isNotFound(err)) {
            return null;
        }
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

// These download URLs are signed and only live for 5 minutes, but a 2 minute cache should be okay.
export const getBotDownloadURL = memoizeAsync(getBotDownloadURLCore, { maxAge: 2 * 60 * 1000 });
async function getBotDownloadURLCore(timeId: string) {
    try {
        const res = await STRAFES_CLIENT.time.getTime(timeId, { redirect: "manual" });
        const url = res.headers.get("location");
        return url ?? undefined;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export const getMapDownloadURL = memoizeAsync(getMapDownloadURLCore, { maxAge: 2 * 60 * 1000 });
export async function getMapDownloadURLCore(mapId: number) {
    try {
        const res = await MAPS_CLIENT.map.snfmList(mapId, { redirect: "manual" });
        const url = res.headers.get("location");
        return url ?? undefined;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}