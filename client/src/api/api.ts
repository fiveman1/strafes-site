import { Game, Map, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, UserSearchData, LeaderboardCount, LeaderboardSortBy, SettingsValues, WRCount, LoginUserWithInfo, TierVoteEligibility, MapTierInfo, Replay, ReplayReaction, ReplayReactions, CommentReportReason, CommentSort, ReplayComment, ReplayComments, ModComment, ReplayCommentStatus, CommentBan, CommentModerator, CommentModerationLogEntry, CommentRole } from "shared";
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

// bannedUntil comes with "You're banned from commenting", unset for a permanent ban
export type ApiResult<T> = { ok: true, data: T } | { ok: false, error: string, bannedUntil?: string };

/** Like tryRequest, but keeps the server's error message. */
async function tryRequestWithError<T>(url: string, init: RequestInit, timeout: number): Promise<ApiResult<T>> {
    let res: Response;
    try {
        res = await fetch("/api/" + url, { ...init, signal: AbortSignal.timeout(timeout) });
    }
    catch {
        return { ok: false, error: "Couldn't reach the server, try again" };
    }

    const body = await res.json().catch(() => undefined);
    if (!res.ok) {
        // Validation errors come back as a list, which isn't worth showing
        const message = typeof body?.error === "string" ? body.error
            : res.status === 429 ? "You're doing that too fast, wait a bit"
            : "Something went wrong, try again";
        return { ok: false, error: message, bannedUntil: typeof body?.bannedUntil === "string" ? body.bannedUntil : undefined };
    }
    return { ok: true, data: body as T };
}

async function trySendRequest<T>(method: "POST" | "DELETE", url: string, params?: JsonObject) {
    return await tryRequestWithError<T>(url, {
        method: method,
        headers: params ? { "Content-Type": "application/json" } : undefined,
        body: params ? JSON.stringify(params) : undefined
    // Generous, since some of these wait on StrafesNET, and giving up early would report a failure for something that
    // went through
    }, 20000);
}

export async function tryPostRequest(url: string, params?: JsonObject) {
    return await tryRequest(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
    }, 5000);
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

export async function getReplayReactions(timeId: string) {
    const res = await tryGetRequest("replays/times/" + timeId + "/reactions");

    if (!res) return null;

    return res.data as ReplayReactions;
}

export function getReplayStreamURL(timeId: string) {
    return "/api/replays/times/" + timeId + "/stream";
}

export async function setReplayReaction(timeId: string, reaction: ReplayReaction, active: boolean) {
    const res = await tryPostRequest("auth/reactions", {
        timeId: timeId,
        reaction: reaction,
        active: active
    });

    if (!res) return null;

    return res.data as ReplayReactions;
}

export async function getReplayComments(timeId: string, sort: CommentSort) {
    const res = await tryGetRequest("replays/times/" + timeId + "/comments", { sort: sort });

    if (!res) return null;

    return res.data as ReplayComments;
}

export interface NewReplayComment {
    timeId: string
    body: string
    replaySeconds?: number
    parentId?: string
}

export async function postReplayComment(comment: NewReplayComment) {
    return await trySendRequest<ReplayComment>("POST", "auth/comments", { ...comment });
}

export async function deleteReplayComment(commentId: string) {
    return await trySendRequest<{ success: boolean }>("DELETE", "auth/comments/" + commentId);
}

export async function setReplayCommentLike(commentId: string, active: boolean) {
    return await trySendRequest<{ commentId: string, likes: number, liked: boolean }>("POST", "auth/comments/likes", {
        commentId: commentId,
        active: active
    });
}

export async function reportReplayComment(commentId: string, reason: CommentReportReason, note: string | undefined) {
    return await trySendRequest<{ success: boolean }>("POST", "auth/comments/reports", {
        commentId: commentId,
        reason: reason,
        note: note
    });
}

/** For the runner on their own replay, or a moderator. */
export async function setReplayCommentHidden(commentId: string, hidden: boolean) {
    return await trySendRequest<{ success: boolean }>("POST", "auth/comments/hide", {
        commentId: commentId,
        hidden: hidden
    });
}

// Moderation. Reads return null if they fail, including when the user isn't a moderator.
export type ModAction = "approve" | "hide" | "dismiss";

export interface ModCommentSearch {
    userId?: number
    timeId?: string
    status?: ReplayCommentStatus
    page: number
}

export interface ModCommentPage {
    comments: ModComment[]
    total: number
    page: number
    pageSize: number
}

export interface ModLogPage {
    entries: CommentModerationLogEntry[]
    page: number
    pageSize: number
}

export async function getModQueue() {
    const res = await tryGetRequest("mod/queue");
    return res ? (res.data.comments as ModComment[]) : null;
}

export async function searchModComments(search: ModCommentSearch) {
    const res = await tryGetRequest("mod/comments", { ...search });
    return res ? (res.data as ModCommentPage) : null;
}

export async function resolveModComment(commentId: string, action: ModAction, reason: string | undefined) {
    return await trySendRequest<{ success: boolean }>("POST", "mod/comments/resolve", {
        commentId: commentId,
        action: action,
        reason: reason
    });
}

export async function getModLog(page: number) {
    const res = await tryGetRequest("mod/log", { page: page });
    return res ? (res.data as ModLogPage) : null;
}

export async function getCommentBans() {
    const res = await tryGetRequest("mod/bans");
    return res ? (res.data.bans as CommentBan[]) : null;
}

/** days unset for a permanent ban */
export async function banCommenter(userId: number, reason: string, days: number | undefined) {
    return await trySendRequest<{ success: boolean }>("POST", "mod/bans", {
        userId: userId,
        reason: reason,
        days: days
    });
}

export async function unbanCommenter(userId: number) {
    return await trySendRequest<{ success: boolean }>("DELETE", "mod/bans/" + userId);
}

export async function getCommentModerators() {
    const res = await tryGetRequest("mod/moderators");
    return res ? (res.data.moderators as CommentModerator[]) : null;
}

export async function grantCommentModerator(userId: number, role: CommentRole) {
    return await trySendRequest<{ success: boolean }>("POST", "mod/moderators", {
        userId: userId,
        role: role
    });
}

export async function revokeCommentModerator(userId: number) {
    return await trySendRequest<{ success: boolean }>("DELETE", "mod/moderators/" + userId);
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