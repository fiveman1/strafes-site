import axios from "axios";
import { Game, Pagination, RankData, Style, Time, User } from "./interfaces";

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

export async function getRankData(userId: string, game: Game, style: Style): Promise<RankData | undefined> {
    const res = await tryGetRequest("user/rank/" + userId, {
        game: game,
        style: style
    });
    if (!res) return undefined;

    return res.data as RankData;
}

export async function getTimeData(userId: string, game: Game, style: Style): Promise<{ times: Time[], pagination: Pagination } | undefined> {
    const res = await tryGetRequest("user/times/" + userId, {
        game: game,
        style: style
    });
    if (!res) return undefined;

    return {
        times: res.data.data,
        pagination: res.data.pagination
    };
}