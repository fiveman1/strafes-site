import { exit } from "process";
import { Api, TimePlacement } from "./client.js";
import memoize from "memoize";
import memCache from "memory-cache";
import { Game, RankSortBy, Style, TimeSortBy } from "shared";
import { IS_DEV_MODE } from "../util.js";

const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

const placementCache: memCache.CacheClass<string, number> = new memCache.Cache();

const STRAFES_CLIENT = new Api({
    baseUrl: "https://api.strafes.net/api/v1",
    securityWorker: () => {
        return {
            headers: {
                "X-API-Key": STRAFES_KEY
            }
        };
    }
});

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

export const getTimes = memoize(getTimesCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
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

export const getUserRank = memoize(getUserRankCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
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
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export const getRanks = memoize(getRanksCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
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

export const getUserInfo = memoize(getUserInfoCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getUserInfoCore(userId: number) {
    try {
        const res = await STRAFES_CLIENT.user.userDetail(userId);
        return res.data.data;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export const getTimeById = memoize(getTimeByIdCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getTimeByIdCore(timeId: string) {
    try {
        const res = await STRAFES_CLIENT.time.timeDetail(timeId);
        return res.data.data;
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}

export async function getBotFileFromId(timeId: string) {
    try {
        const res = await STRAFES_CLIENT.time.getTime(timeId);
        return await res.arrayBuffer();
    }
    catch (err) {
        if (IS_DEV_MODE) {
            console.error(err);
        }
        return undefined;
    }
}