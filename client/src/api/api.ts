import axios, { AxiosResponse } from "axios";
import { Game, Map, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy } from "./interfaces";

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function tryGetRequest(url: string, params?: any) {
    try {
        return await axios.get("/api/" + url, {params: params, timeout: 5000});
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

export async function getTimeData(start: number | string, end: number | string, sortBy: TimeSortBy, game?: Game, style?: Style, userId?: string, map?: Map, onlyWR?: boolean): Promise<{ times: Time[], pagination: Pagination } | undefined> {
    let res: AxiosResponse | undefined;
    if (userId) {
        res = await tryGetRequest("user/times/" + userId, {
            start: start,
            end: end,
            sort: sortBy,
            game: game,
            style: style,
            onlyWR: !!onlyWR
        });
    }
    else if (map) {
        res = await tryGetRequest("map/times/" + map.id, {
            start: start,
            end: end,
            sort: sortBy,
            game: game,
            style: style
        });
    }
    else if (onlyWR) {
        res = await tryGetRequest("wrs", {
            start: start,
            end: end,
            sort: sortBy,
            game: game,
            style: style,
            onlyWR: true
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

export interface Maps {
    [id: number]: Map
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