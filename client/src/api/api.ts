import axios, { AxiosResponse } from "axios";
import { Game, Map, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, UserSearchData, LeaderboardCount } from "./interfaces";

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function tryGetRequest(url: string, params?: any) {
    try {
        return await axios.get("/api/" + url, {params: params, timeout: 10000});
    } 
    catch (err) {
        //console.log(err);
        return undefined;
    }
}

export async function getUserIdFromName(username: string): Promise<string | undefined> {
    const params = {
        username: username
    };
    
    const res = await tryGetRequest("username", params);
    if (!res) return undefined;

    return res.data.id;
}

export async function getUserData(userId: string): Promise<User | undefined> {
    const res = await tryGetRequest("user/" + userId);
    if (!res) return undefined;
    
    return res.data as User;
}

export async function getUserRank(userId: string, game: Game, style: Style): Promise<Rank | undefined> {
    const res = await tryGetRequest("user/rank/" + userId, {
        game: game,
        style: style
    });
    if (!res) return undefined;

    return res.data as Rank;
}

export async function getRanks(start: number | string, end: number | string, sortBy: RankSortBy, game: Game, style: Style): Promise<Rank[] | undefined>  {
    const res = await tryGetRequest("ranks", {
        start: start,
        end: end,
        sort: sortBy,
        game: game,
        style: style
    });
    if (!res) return undefined;

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
    map?: Map, 
    onlyWR?: boolean
): Promise<{ times: Time[], pagination: Pagination } | undefined> {
    
    let res: AxiosResponse | undefined;
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
    else if (map) {
        res = await tryGetRequest("map/times/" + map.id, {
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
        return undefined;
    }
    
    if (!res) return undefined;

    return {
        times: res.data.data,
        pagination: res.data.pagination
    };
}

export async function getAllTimesForUser(userId: string, game: Game, style: Style): Promise<Time[] | undefined> {
    const res = await tryGetRequest("user/times/all/" + userId, {
        game: game,
        style: style
    });

    if (!res) return undefined;

    return res.data.data;
}

export async function getCompletionsForUser(userId: string, game: Game, style: Style): Promise<number | undefined> {
    const res = await tryGetRequest("user/times/completions/" + userId, {
        game: game,
        style: style,
    });
    
    if (!res) return undefined;

    return res.data.completions;
}

export interface WRCount {
    loaded: boolean,
    mainWrs: number,
    bonusWrs: number
}

export async function getNumWRsForUser(userId: string, game: Game, style: Style): Promise<WRCount | undefined> {
    const res = await tryGetRequest("user/times/wrs/" + userId, {
        game: game,
        style: style,
    });
    
    if (!res) return undefined;
    const data = res.data as WRCount;
    
    if (!data.loaded) return undefined;

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
    const res = await tryGetRequest("usersearch", {username: username});
    if (!res) return [];

    return res.data.usernames;
}

export interface LeaderboardPage {
    total: number,
    data: LeaderboardCount[]
}
export async function getLeaderboardPage(start: number | string, end: number | string, game: Game, style: Style) {
    const res = await tryGetRequest("wrs/leaderboard", {
        game: game,
        style: style,
        start: start,
        end: end
    });

    if (!res) return undefined;

    return res.data as LeaderboardPage;
}