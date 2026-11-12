import { Game, Map, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, UserSearchData, LeaderboardCount, LeaderboardSortBy, SettingsValues, WRCount, LoginUserWithInfo, TierVoteEligibility, MapTierInfo, Replay, ReplayReaction, ReplayReactions, CommentReportReason, CommentSort, ReplayComment, ReplayComments, ModComment, ReplayCommentStatus, CommentBan, CommentModerator, CommentModerationLogEntry, CommentRole, Inbox, InboxCount, LinkPageInfo, LinkConfirmResult } from "shared";
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

/**
 * A request that failed. status is unset when there was no response at all (offline, or it timed out). The message
 * is fit to show: the server's own when it sent one.
 */
export class ApiError extends Error {
    readonly status: number | undefined;
    readonly bannedUntil: string | undefined;

    constructor(message: string, status?: number, bannedUntil?: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.bannedUntil = bannedUntil;
    }
}

/** Why a request failed, fit to show */
export function errorMessage(error: unknown) {
    return error instanceof ApiError ? error.message : "Something went wrong, try again";
}

/** Worth trying again on its own: no response, or the server (or StrafesNET behind it) had a problem. */
export function isTransientError(error: unknown) {
    return error instanceof ApiError && (error.status === undefined || error.status >= 500);
}

type RequestResult = { ok: true, data: unknown } | { ok: false, error: ApiError };

async function sendRequest(url: string, init: RequestInit, timeout: number): Promise<RequestResult> {
    let res: Response;
    try {
        res = await fetch("/api/" + url, { ...init, signal: AbortSignal.timeout(timeout) });
    }
    catch (err) {
        const timedOut = err instanceof DOMException && err.name === "TimeoutError";
        return { ok: false, error: new ApiError(timedOut ? "The server took too long to respond, try again" : "Couldn't reach the server, check your connection") };
    }

    const body = await res.json().catch(() => undefined);
    if (!res.ok) {
        // Validation errors come back as a list, which isn't worth showing
        const message = typeof body?.error === "string" && body.error !== "Not found" ? body.error
            : res.status === 429 ? "You're doing that too fast, wait a bit"
            : res.status === 404 ? "Couldn't find that"
            : "Something went wrong, try again";
        const bannedUntil = typeof body?.bannedUntil === "string" ? body.bannedUntil : undefined;
        return { ok: false, error: new ApiError(message, res.status, bannedUntil) };
    }
    return { ok: true, data: body };
}

function withParams(url: string, params?: JsonObject) {
    const query = toSearchParams(params);
    return query ? `${url}?${query}` : url;
}

/** Throws an ApiError if the request fails, which is what react-query needs to know it failed. */
async function getRequest<T>(url: string, params?: JsonObject): Promise<T> {
    const res = await sendRequest(withParams(url, params), { method: "GET" }, 15000);
    if (!res.ok) throw res.error;
    return res.data as T;
}

/**
 * Like getRequest, but null for a status that means there's nothing there (by default a 404), so that isn't treated
 * as a failure.
 */
async function getRequestOrNull<T>(url: string, params?: JsonObject, emptyStatus = 404): Promise<T | null> {
    const res = await sendRequest(withParams(url, params), { method: "GET" }, 15000);
    if (!res.ok) {
        if (res.error.status === emptyStatus) return null;
        throw res.error;
    }
    return res.data as T;
}

// bannedUntil comes with "You're banned from commenting", unset for a permanent ban
export type ApiResult<T> = { ok: true, data: T } | { ok: false, error: string, bannedUntil?: string };

/** For changes. Doesn't throw, the result has the error message to show instead. */
async function trySendRequest<T>(method: "POST" | "DELETE", url: string, params?: JsonObject): Promise<ApiResult<T>> {
    const res = await sendRequest(url, {
        method: method,
        headers: params ? { "Content-Type": "application/json" } : undefined,
        body: params ? JSON.stringify(params) : undefined
    // Generous, since some of these wait on StrafesNET, and giving up early would report a failure for something that
    // went through
    }, 20000);
    if (!res.ok) {
        return { ok: false, error: res.error.message, bannedUntil: res.error.bannedUntil };
    }
    return { ok: true, data: res.data as T };
}

/** null if there's no user with that name */
export async function getUserIdFromName(username: string): Promise<number | null> {
    if (!username) return null;
    const data = await getRequestOrNull<{ id: number }>("username", { username: username });
    return data ? data.id : null;
}

/** null if there's no user with that ID */
export async function getUserData(userId: string | undefined): Promise<User | null> {
    if (!userId) return null;
    return await getRequestOrNull<User>("user/" + userId);
}

/** null if the user isn't ranked in that game and style */
export async function getUserRank(userId: string, game: Game, style: Style): Promise<Rank | null> {
    if (!userId || game === Game.all || style === Style.all) return null;

    return await getRequestOrNull<Rank>("user/rank/" + userId, {
        game: game,
        style: style
    });
}

export async function getRanks(start: number | string, end: number | string, sortBy: RankSortBy, game: Game, style: Style): Promise<Rank[]>  {
    return await getRequest<Rank[]>("ranks", {
        start: start,
        end: end,
        sort: sortBy,
        game: game,
        style: style
    });
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
): Promise<{ times: Time[], pagination: Pagination }> {
    const data = await getRequest<{ data: Time[], pagination: Pagination }>("times", {
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

    return {
        times: data.data,
        pagination: data.pagination
    };
}

export async function getAllTimesForUser(userId: string, game: Game, style: Style): Promise<Time[]> {
    const data = await getRequest<{ data: Time[] }>("user/times/all/" + userId, {
        game: game,
        style: style
    });
    return data.data;
}

/** null when there's no count to show (all games or styles) */
export async function getCompletionsForUser(userId: string, game: Game, style: Style): Promise<number | null> {
    if (!userId || game === Game.all || style === Style.all) return null;

    const data = await getRequest<{ completions: number }>("user/times/completions/" + userId, {
        game: game,
        style: style,
    });
    return data.completions;
}

export async function getNumWRsForUser(userId: string, game: Game, style: Style): Promise<WRCount | null> {
    if (!userId) return null;

    return await getRequest<WRCount>("user/times/wrs/" + userId, {
        game: game,
        style: style,
    });
}

export interface Maps {
    [id: number]: Map | undefined
}

export async function getMaps(): Promise<Maps> {
    const data = await getRequest<{ data: Map[] }>("maps");

    const maps: Maps = {};
    for (const map of data.data) {
        maps[map.id] = map;
    }
    return maps;
}

export async function searchByUsername(username: string): Promise<UserSearchData[]> {
    if (username === "") {
        return [];
    }

    // A 404 is no results
    const data = await getRequestOrNull<{ usernames: UserSearchData[] }>("usersearch", { username: username });
    return data ? data.usernames : [];
}

export interface LeaderboardPage {
    total: number,
    data: LeaderboardCount[]
}
export async function getLeaderboardPage(start: number | string, end: number | string, game: Game, style: Style, sort: LeaderboardSortBy) {
    return await getRequest<LeaderboardPage>("wrs/leaderboard", {
        game: game,
        style: style,
        start: start,
        end: end,
        sort: sort
    });
}

/** null when logged out */
export async function getLoggedInUser() {
    return await getRequestOrNull<LoginUserWithInfo>("auth/user", undefined, 401);
}

/** The Roblox page to send the user to, or null if it couldn't be made */
export async function login(path: string) {
    const res = await sendRequest(withParams("login", { path: path }), { method: "GET" }, 15000);
    return res.ok ? (res.data as { url: string }).url : null;
}

export async function logout() {
    await sendRequest("logout", { method: "GET" }, 15000);
}

/** null when the link expired, was used, or was replaced by a newer one */
export async function getLinkRequest(token: string) {
    return await getRequestOrNull<LinkPageInfo>("link/" + encodeURIComponent(token));
}

export async function confirmLink(token: string) {
    return await trySendRequest<LinkConfirmResult>("POST", "link/confirm", { token: token });
}

export async function updateSettings(settings: SettingsValues) {
    return await trySendRequest<unknown>("POST", "auth/settings", {
        game: settings.defaultGame,
        style: settings.defaultStyle,
        theme: settings.theme,
        maxDaysRelative: settings.maxDaysRelativeDates,
        country: settings.country
    });
}

/** null when logged out */
export async function getVotingInfo() {
    return await getRequestOrNull<TierVoteEligibility>("auth/user/tiers", undefined, 401);
}

/** null if the user hasn't voted on the map (or is logged out) */
export async function getCurrentMapTierVote(mapId: number) {
    return await getRequestOrNull<MapTierInfo | null>("auth/tiers", { mapId: mapId }, 401);
}

/** On success, the vote as saved, or null if it was removed */
export async function voteForMapTier(mapId: number, tier: number | null): Promise<ApiResult<MapTierInfo | null>> {
    const res = await trySendRequest<{ result?: MapTierInfo }>("POST", "auth/tiers", {
        mapId: mapId,
        tier: tier
    });
    return res.ok ? { ok: true, data: res.data.result ?? null } : res;
}

/** null if there's no time with that ID */
export async function getReplayById(id: string) {
    return await getRequestOrNull<Replay>("replays/times/" + id);
}

export async function getReplayReactions(timeId: string) {
    return await getRequest<ReplayReactions>("replays/times/" + timeId + "/reactions");
}

export function getReplayStreamURL(timeId: string) {
    return "/api/replays/times/" + timeId + "/stream";
}

export async function setReplayReaction(timeId: string, reaction: ReplayReaction, active: boolean) {
    return await trySendRequest<ReplayReactions>("POST", "auth/reactions", {
        timeId: timeId,
        reaction: reaction,
        active: active
    });
}

export async function getReplayComments(timeId: string, sort: CommentSort) {
    return await getRequest<ReplayComments>("replays/times/" + timeId + "/comments", { sort: sort });
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

// Moderation. Reads throw if they fail, including when the user isn't a moderator.
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
    return (await getRequest<{ comments: ModComment[] }>("mod/queue")).comments;
}

export async function searchModComments(search: ModCommentSearch) {
    return await getRequest<ModCommentPage>("mod/comments", { ...search });
}

export async function resolveModComment(commentId: string, action: ModAction, reason: string | undefined) {
    return await trySendRequest<{ success: boolean }>("POST", "mod/comments/resolve", {
        commentId: commentId,
        action: action,
        reason: reason
    });
}

export async function getModLog(page: number) {
    return await getRequest<ModLogPage>("mod/log", { page: page });
}

export async function getCommentBans() {
    return (await getRequest<{ bans: CommentBan[] }>("mod/bans")).bans;
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
    return (await getRequest<{ moderators: CommentModerator[] }>("mod/moderators")).moderators;
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

export async function getInbox() {
    return await getRequest<Inbox>("auth/inbox");
}

export async function getInboxCount() {
    return await getRequest<InboxCount>("auth/inbox/count");
}

/** upTo is the newest item's "at", so anything that came in after the inbox loaded stays unread. */
export async function markInboxSeen(upTo: string) {
    return await trySendRequest<{ success: boolean }>("POST", "auth/inbox/seen", { upTo: upTo });
}

export async function getBotFileResponse(timeId: string) {
    const url = await getBotFileURL(timeId);

    let fileRes: Response;
    try {
        fileRes = await fetch(url);
    }
    catch {
        throw new ApiError("Couldn't download the bot file, check your connection");
    }

    if (!fileRes.ok) throw new ApiError("Couldn't download the bot file", fileRes.status);

    return fileRes;
}

export async function getBotFileURL(timeId: string) {
    return (await getRequest<{ url: string }>("replays/bots/" + timeId)).url;
}

export async function getMapFileURL(mapId: number) {
    return (await getRequest<{ url: string }>("replays/maps/" + mapId)).url;
}
