import { exit } from "process";
import { Api } from "./client.js";
import memoize from "memoize";
import { Game, RankSortBy, Style, TimeSortBy } from "shared";

const IS_DEBUG = process.env.DEBUG === "true";
const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

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
    let res;
    try {
        res = await STRAFES_CLIENT.time.placementList({ids: timeIds.join(",")});
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }

    if (!res.ok) return undefined;

    return res.data.data;
}

export const getTimes = memoize(getTimesCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getTimesCore(userId: string | number | undefined, mapId: string | number | undefined, pageSize: number, pageNum: number, game: Game | undefined, style: Style | undefined, course: number, sort?: TimeSortBy) {
    let res;
    try {
        res = await STRAFES_CLIENT.time.timeList({
            user_id: userId !== undefined ? +userId : undefined,
            map_id: mapId !== undefined ? +mapId : undefined,
            page_size: pageSize,
            page_number: pageNum,
            game_id: game === Game.all ? undefined : game,
            style_id: style === Style.all ? undefined : style,
            mode_id: course >= 0 ? course : undefined,
            sort_by: sort
        });
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
    
    if (!res.ok) return undefined;
    
    return res.data;
}

export const getUserRank = memoize(getUserRankCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getUserRankCore(userId: string | number, game: Game, style: Style) {
    let res;
    try {
        res = await STRAFES_CLIENT.user.rankList(+userId, {
            game_id: game,
            style_id: style,
            mode_id: 0
        });
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
    
    if (!res.ok) return undefined;
    
    return res.data.data;
}

export const getRanks = memoize(getRanksCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getRanksCore(pageSize: number, pageNum: number, game: Game, style: Style, sort: RankSortBy) {
    let res;
    try {
        res = await STRAFES_CLIENT.rank.rankList({
            page_size: pageSize,
            page_number: pageNum,
            sort_by: sort,
            game_id: game,
            style_id: style,
            mode_id: 0
        });
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
    
    if (!res.ok) return undefined;
    
    return res.data;
}

export const getUserInfo = memoize(getUserInfoCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getUserInfoCore(userId: string | number) {
    let res;
    try {
        res = await STRAFES_CLIENT.user.userDetail(+userId);
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
    
    if (!res.ok) return undefined;
    
    return res.data.data;
}