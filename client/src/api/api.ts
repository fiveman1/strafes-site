import axios, { AxiosResponse } from "axios";
import { Game, Map, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, UserSearchData, LeaderboardCount, LeaderboardSortBy, SettingsValues, WRCount, LoginUserWithInfo, TierVoteEligibility, MapTierInfo, Replay } from "shared";
import { JsonObject } from "../common/utils";

async function tryGetRequest(url: string, params?: JsonObject) {
    try {
        return await axios.get("/api/" + url, {params: params, timeout: 15000});
    } 
    catch {
        return null;
    }
}

export async function tryPostRequest(url: string, params?: JsonObject) {
    try {
        return await axios.post("/api/" + url, params, {timeout: 5000});
    } 
    catch {
        return null;
    }
}

export async function getUserIdFromName(username: string): Promise<number | null> {
    if (!username) return null;

    const params = {
        username: username
    };
    
    const res = await tryGetRequest("username", params);
    if (!res) return null;

    return res.data.id;
}

export async function getUserData(userId: string | undefined): Promise<User | null> {
    if (!userId) return null

    const res = await tryGetRequest("user/" + userId);
    if (!res) return null;
    
    return res.data as User;
}

export async function getUserRank(userId: string, game: Game, style: Style): Promise<Rank | null> {
    if (!userId) return null;

    const res = await tryGetRequest("user/rank/" + userId, {
        game: game,
        style: style
    });
    if (!res) return null;

    return res.data as Rank;
}

export async function getRanks(start: number | string, end: number | string, sortBy: RankSortBy, game: Game, style: Style): Promise<Rank[] | null>  {
    const res = await tryGetRequest("ranks", {
        start: start,
        end: end,
        sort: sortBy,
        game: game,
        style: style
    });
    if (!res) return null;

    return res.data as Rank[]
}

export async function getTimeData(
    start: number | string, 
    end: number | string, 
    sortBy: TimeSortBy, 
    course: number,
    game?: Game, 
    style?: Style, 
    userId?: string, 
    mapId?: string, 
    onlyWR?: boolean
): Promise<{ times: Time[], pagination: Pagination } | null> {
    
    let res: AxiosResponse | null;
    if (userId) {
        res = await tryGetRequest("user/times/" + userId, {
            start: start,
            end: end,
            sort: sortBy,
            game: game,
            style: style,
            course: course,
            onlyWR: !!onlyWR
        });
    }
    else if (mapId) {
        res = await tryGetRequest("map/times/" + mapId, {
            start: start,
            end: end,
            sort: sortBy,
            game: game,
            style: style,
            course: course
        });
    }
    else if (onlyWR) {
        res = await tryGetRequest("wrs", {
            start: start,
            end: end,
            sort: sortBy,
            game: game,
            style: style,
            course: course
        });
    }
    else {
        return null;
    }
    
    if (!res) return null;

    return {
        times: res.data.data,
        pagination: res.data.pagination
    };
}

export async function getRecords(mapId: number, userId: number) {
    const res = await tryGetRequest("times/records", {
        mapId: mapId,
        userId: userId
    });

    if (!res) return null

    return res.data as Time[];
}

export async function getAllTimesForUser(userId: string, game: Game, style: Style): Promise<Time[] | null> {
    const res = await tryGetRequest("user/times/all/" + userId, {
        game: game,
        style: style
    });

    if (!res) return null;

    return res.data.data;
}

export async function getCompletionsForUser(userId: string, game: Game, style: Style): Promise<number | null> {
    if (!userId) return null;

    const res = await tryGetRequest("user/times/completions/" + userId, {
        game: game,
        style: style,
    });
    
    if (!res) return null;

    return res.data.completions;
}

export async function getNumWRsForUser(userId: string, game: Game, style: Style): Promise<WRCount | null> {
    if (!userId) return null;

    const res = await tryGetRequest("user/times/wrs/" + userId, {
        game: game,
        style: style,
    });
    
    if (!res) return null;
    
    const data = res.data as WRCount;

    return data;
}

export interface Maps {
    [id: number]: Map | undefined
}

export async function getMaps(): Promise<Maps> {
    const res = await tryGetRequest("maps");
    if (!res) return {};

    const maps: Maps = {};
    const data = res.data.data as Map[];
    for (const map of data) {
        maps[map.id] = map;
    }
    return maps;
}

export async function searchByUsername(username: string): Promise<UserSearchData[]> {
    if (username === "") {
        return [];
    }

    const res = await tryGetRequest("usersearch", {username: username});
    if (!res) return [];

    return res.data.usernames;
}

export interface LeaderboardPage {
    total: number,
    data: LeaderboardCount[]
}
export async function getLeaderboardPage(start: number | string, end: number | string, game: Game, style: Style, sort: LeaderboardSortBy) {
    const res = await tryGetRequest("wrs/leaderboard", {
        game: game,
        style: style,
        start: start,
        end: end,
        sort: sort
    });

    if (!res) return null;

    return res.data as LeaderboardPage;
}

export async function getLoggedInUser() {
    const res = await tryGetRequest("auth/user");

    if (!res) return null;

    return res.data as LoginUserWithInfo;
}

export async function login(path: string) {
    const res = await tryGetRequest("login", {
        path: path
    });

    if (!res) return null;

    return res.data.url as string;
}

export async function logout() {
    await tryGetRequest("logout");
}

export async function updateSettings(settings: SettingsValues) {
    const res = await tryPostRequest("auth/settings", {
        game: settings.defaultGame,
        style: settings.defaultStyle,
        theme: settings.theme,
        maxDaysRelative: settings.maxDaysRelativeDates,
        country: settings.country
    });

    return !!res;
}

export async function getVotingInfo() {
    const res = await tryGetRequest("auth/user/tiers");

    if (!res) return null;

    return res.data as TierVoteEligibility;
}

export async function getCurrentMapTierVote(mapId: number) {
    const res = await tryGetRequest("auth/tiers", {
        mapId: mapId
    });

    if (!res) return null;

    return res.data as MapTierInfo | undefined;
}

export async function voteForMapTier(mapId: number, tier: number | null) {
    const res = await tryPostRequest("auth/tiers", {
        mapId: mapId,
        tier: tier
    });

    if (!res) return null;

    return (res.data.result ?? null) as MapTierInfo | null;
}

export async function getReplayById(id: string) {
    const res = await tryGetRequest("replays/times/" + id);

    if (!res) return null;

    return res.data as Replay;
}

export async function getBotFileResponse(timeId: string) {
    const res = await tryGetRequest("replays/bots/" + timeId);
    
    if (!res) return null;

    const url = res.data.url as string;

    const fileRes = await fetch(url);

    if (!fileRes.ok) return null;

    return fileRes;
}

export async function getMapFileResponse(mapId: number) {
    const res = await tryGetRequest("replays/maps/" + mapId);
    
    if (!res) return null;

    const url = res.data.url as string;

    const fileRes = await fetch(url);
    
    if (!fileRes.ok) return null;

    return fileRes;
}