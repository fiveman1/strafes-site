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
    try {
        const res = await STRAFES_CLIENT.time.placementList({ids: timeIds.join(",")});
        return res.data.data;
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
}

export const getTimes = memoize(getTimesCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getTimesCore(userId: string | number | undefined, mapId: string | number | undefined, pageSize: number, pageNum: number, game: Game | undefined, style: Style | undefined, course: number, sort?: TimeSortBy) {
    try {
        const res = await STRAFES_CLIENT.time.timeList({
            user_id: userId !== undefined ? +userId : undefined,
            map_id: mapId !== undefined ? +mapId : undefined,
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
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
}

export const getUserRank = memoize(getUserRankCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getUserRankCore(userId: string | number, game: Game, style: Style) {
    try {
        const res = await STRAFES_CLIENT.user.rankList(+userId, {
            game_id: game,
            style_id: style,
            mode_id: 0
        });

        return res.data.data;
    }
    catch (err) {
        if (IS_DEBUG) {
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
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
}

export const getUserInfo = memoize(getUserInfoCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
async function getUserInfoCore(userId: string | number) {
    try {
        const res = await STRAFES_CLIENT.user.userDetail(+userId);
        return res.data.data;
    }
    catch (err) {
        if (IS_DEBUG) {
            console.error(err);
        }
        return undefined;
    }
}