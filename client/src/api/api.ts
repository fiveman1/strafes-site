import { Game, Map, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, UserSearchData, LeaderboardCount, LeaderboardSortBy, SettingsValues, WRCount, LoginUserWithInfo, TierVoteEligibility, MapTierInfo, Replay } from "shared";
import { JsonObject } from "../common/utils";

// Mirrors what axios did: skip null/undefined params and repeat the key for each array item (a=1&a=2)
function toSearchParams(params?: JsonObject) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
        for (const item of Array.isArray(value) ? value : [value]) {
            if (item !== null && item !== undefined) {
                search.append(key, String(item));
            }
        }
    }
    return search.toString();
}

// Returns null on network errors, timeouts, and non-2xx responses
async function tryRequest(url: string, init: RequestInit, timeout: number) {
    try {
        const res = await fetch("/api/" + url, { ...init, signal: AbortSignal.timeout(timeout) });
        if (!res.ok) return null;
        const data = await res.json();
        return { data };
    }
    catch {
        return null;
    }
}

async function tryGetRequest(url: string, params?: JsonObject) {
    const query = toSearchParams(params);
    return await tryRequest(query ? `${url}?${query}` : url, { method: "GET" }, 15000);
}

export async function tryPostRequest(url: string, params?: JsonObject) {
    return await tryRequest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
    }, 5000);
}

// Counts this browser's replay player toward how many viewers use WebGL instead of WebGPU,
// once per UTC day (the server's counting day) and again if the backend changes
export function reportGraphicsBackend(webgl: boolean) {
    const backend = webgl ? "webgl" : "webgpu";
    const mark = new Date().toISOString().slice(0, 10) + " " + backend;
    try {
        if (localStorage.getItem("graphicsBackendReported") === mark) return;
        localStorage.setItem("graphicsBackendReported", mark);
    }
    catch {
        // without localStorage, report anyway; the server limits how often an IP counts
    }
    void tryPostRequest("graphics-backend", { backend, hasWebgpuApi: "gpu" in navigator });
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
    if (!userId || game === Game.all || style === Style.all) return null;

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
    filterGames?: Game[],
    style?: Style, 
    userId?: string, 
    mapId?: string, 
    onlyWR?: boolean
): Promise<{ times: Time[], pagination: Pagination } | null> {
    
    const res = await tryGetRequest("times", {
        userId: userId,
        mapId: mapId,
        start: start,
        end: end,
        sort: sortBy,
        game: game,
        filterGames: filterGames,
        style: style,
        course: course,
        onlyWR: !!onlyWR
    });
    
    if (!res) return null;

    return {
        times: res.data.data,
        pagination: res.data.pagination
    };
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
    if (!userId || game === Game.all || style === Style.all) return null;

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

    return res.data as MapTierInfo | null;
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
    const url = await getBotFileURL(timeId);

    if (!url) return null;

    const fileRes = await fetch(url);

    if (!fileRes.ok) return null;

    return fileRes;
}

export async function getBotFileURL(timeId: string) {
    const res = await tryGetRequest("replays/bots/" + timeId);
    
    if (!res) return null;

    return res.data.url as string;
}

export async function getMapFileURL(mapId: number) {
    const res = await tryGetRequest("replays/maps/" + mapId);
    
    if (!res) return null;

    return res.data.url as string;
}