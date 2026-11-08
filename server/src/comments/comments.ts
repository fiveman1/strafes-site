import AsyncLock from "async-lock";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import {
    CommentHiddenBy,
    CommentReportReason,
    CommentRole,
    CommentRun,
    CommentSort,
    commentLength,
    compareCommentIds,
    LoginUser,
    MAX_COMMENT_REPORT_NOTE_LENGTH,
    ReplayComment,
    ReplayComments,
    ReplayCommentStatus,
    normalizeComment
} from "shared";
import { GlobalsClient } from "../globals.js";
import { unixToISO } from "../util.js";
import { fetchFreshTimeById, lookupUserInfo } from "../strafes_api/api.js";
import { prepareCommentBody } from "./filter.js";
import { getActiveBan } from "./moderation.js";
import { logModerationAction } from "./roles.js";

// Minimum wait between one user's comments, and how many they can post in a day
const COMMENT_COOLDOWN_SECONDS = 15;
const MAX_COMMENTS_PER_DAY = 30;
// Reports from this many different users take a comment down until a moderator looks at it
const REPORTS_TO_HIDE = 3;
// Per replay. Far more than any replay should get; past this, the oldest are left out.
const MAX_COMMENTS_PER_REPLAY = 1000;

export interface CommentViewer {
    userId: number
    role: CommentRole | undefined
}

/** What every comment query selects, so rows can go through rowToComment. */
const COMMENT_COLUMNS = `
    c.id, c.time_id, c.user_id, c.parent_id, c.reply_to_user_id, c.replay_seconds, c.body, c.status, c.hidden_by,
    UNIX_TIMESTAMP(c.created_at) AS created_at, c.runner_id, c.run_time_ms, c.run_date,
    u.username, ru.username AS reply_to_username,
    (SELECT COUNT(*) FROM replay_comment_likes l WHERE l.comment_id = c.id) AS likes
`;
const COMMENT_JOINS = `
    LEFT JOIN users u ON u.user_id = c.user_id
    LEFT JOIN users ru ON ru.user_id = c.reply_to_user_id
`;

interface CommentSQL {
    id: string
    time_id: string
    user_id: string
    parent_id: string | null
    reply_to_user_id: string | null
    replay_seconds: number | null
    body: string
    status: ReplayCommentStatus
    hidden_by: CommentHiddenBy | null
    created_at: string // unix seconds, as a decimal string
    runner_id: string
    run_time_ms: number
    run_date: Date
    username: string | null
    reply_to_username: string | null
    likes: string
}
type CommentRow = CommentSQL & RowDataPacket;

interface CommentIdSQL {
    comment_id: string
}
type CommentIdRow = CommentIdSQL & RowDataPacket;


function canView(row: CommentSQL, viewer: CommentViewer | undefined) {
    if (row.status === "visible") return true;
    if (row.status === "deleted" || !viewer) return false;
    if (viewer.role !== undefined || +row.user_id === viewer.userId) return true;
    // So the runner can unhide it
    return row.status === "hidden" && row.hidden_by === "runner" && +row.runner_id === viewer.userId;
}

/** The run a time holds now, in the form comments store it. */
export function currentRunOf(time: { time: number, date: string }): CommentRun {
    // Whole seconds, since that's all a DATETIME keeps
    return {
        time: time.time,
        date: new Date(Math.floor(Date.parse(time.date) / 1000) * 1000).toISOString()
    };
}

/** The run the comment was posted on, if the runner has beaten it since. */
function previousRunOf(row: CommentSQL, currentRun: CommentRun | undefined): CommentRun | undefined {
    if (!currentRun) {
        return undefined;
    }
    const run: CommentRun = { time: row.run_time_ms, date: row.run_date.toISOString() };
    return run.time !== currentRun.time || run.date !== currentRun.date ? run : undefined;
}

function rowToComment(row: CommentSQL, liked: boolean, reported: boolean, currentRun: CommentRun | undefined): ReplayComment {
    return {
        id: row.id,
        timeId: row.time_id,
        userId: +row.user_id,
        username: row.username ?? "",
        parentId: row.parent_id ?? undefined,
        replyToUsername: row.reply_to_username ?? undefined,
        replaySeconds: row.replay_seconds ?? undefined,
        body: row.body,
        status: row.status === "deleted" ? "hidden" : row.status,
        hiddenBy: row.hidden_by ?? undefined,
        createdAt: unixToISO(row.created_at),
        likes: +row.likes,
        liked: liked,
        reported: reported,
        removed: false,
        previousRun: previousRunOf(row, currentRun),
        replies: []
    };
}

function removedPlaceholder(row: CommentSQL, currentRun: CommentRun | undefined): ReplayComment {
    return {
        id: row.id,
        timeId: row.time_id,
        userId: 0,
        username: "",
        replaySeconds: row.replay_seconds ?? undefined,
        body: "",
        status: "visible",
        createdAt: unixToISO(row.created_at),
        likes: 0,
        liked: false,
        reported: false,
        removed: true,
        previousRun: previousRunOf(row, currentRun),
        replies: []
    };
}

/**
 * The replay's comments as the viewer can see them, with replies nested under their top-level comment.
 * Top-level comments are in the order of sort; replies are always oldest first.
 * currentRun is what the time holds now, for marking comments on earlier runs; leave it out if that's unknown.
 */
export async function getCommentsForReplay(
    client: GlobalsClient,
    timeId: string,
    viewer: CommentViewer | undefined,
    sort: CommentSort,
    currentRun: CommentRun | undefined
): Promise<ReplayComments> {
    // Newest first, so the limit drops the oldest
    const query = `SELECT ${COMMENT_COLUMNS} FROM replay_comments c ${COMMENT_JOINS}
        WHERE c.time_id = ? ORDER BY c.id DESC LIMIT ${MAX_COMMENTS_PER_REPLAY};`;
    const rowsPromise = client.pool.execute<CommentRow[]>(query, [timeId]);

    let likedPromise: Promise<[CommentIdRow[], unknown]> | undefined;
    let reportedPromise: Promise<[CommentIdRow[], unknown]> | undefined;
    if (viewer) {
        const likedQuery = `SELECT l.comment_id FROM replay_comment_likes l
            INNER JOIN replay_comments c ON c.id = l.comment_id WHERE c.time_id = ? AND l.user_id = ?;`;
        likedPromise = client.pool.execute<CommentIdRow[]>(likedQuery, [timeId, viewer.userId]);
        const reportedQuery = `SELECT r.comment_id FROM replay_comment_reports r
            INNER JOIN replay_comments c ON c.id = r.comment_id WHERE c.time_id = ? AND r.reporter_id = ?;`;
        reportedPromise = client.pool.execute<CommentIdRow[]>(reportedQuery, [timeId, viewer.userId]);
    }

    const [[newestFirst], likedResult, reportedResult] = await Promise.all([rowsPromise, likedPromise, reportedPromise]);
    const rows = newestFirst.reverse();
    const liked = new Set(likedResult ? likedResult[0].map((row) => row.comment_id) : []);
    const reported = new Set(reportedResult ? reportedResult[0].map((row) => row.comment_id) : []);

    const repliesByParent = new Map<string, ReplayComment[]>();
    for (const row of rows) {
        if (row.parent_id === null || !canView(row, viewer)) continue;
        let replies = repliesByParent.get(row.parent_id);
        if (!replies) {
            replies = [];
            repliesByParent.set(row.parent_id, replies);
        }
        replies.push(rowToComment(row, liked.has(row.id), reported.has(row.id), currentRun));
    }

    const comments: ReplayComment[] = [];
    // Removed comments show 0 likes, but sort by what they had, so a big thread under one doesn't sink
    const likesForSort = new Map<string, number>();
    for (const row of rows) {
        if (row.parent_id !== null) continue;
        const replies = repliesByParent.get(row.id) ?? [];
        let comment: ReplayComment;
        if (canView(row, viewer)) {
            comment = rowToComment(row, liked.has(row.id), reported.has(row.id), currentRun);
        }
        else if (replies.length > 0) {
            comment = removedPlaceholder(row, currentRun);
        }
        else {
            continue;
        }
        comment.replies = replies;
        comments.push(comment);
        likesForSort.set(comment.id, +row.likes);
    }

    // rows are oldest first, so comments already are
    if (sort === "new") {
        comments.reverse();
    }
    else if (sort === "top") {
        // Ties go to the newer comment
        comments.sort((a, b) => (likesForSort.get(b.id) ?? 0) - (likesForSort.get(a.id) ?? 0) || compareCommentIds(b.id, a.id));
    }

    return {
        timeId: timeId,
        sort: sort,
        comments: comments
    };
}

/** One comment as everyone sees it, for the live stream. */
export async function getPublicComment(client: GlobalsClient, commentId: string, currentRun: CommentRun | undefined): Promise<ReplayComment | undefined> {
    const query = `SELECT ${COMMENT_COLUMNS} FROM replay_comments c ${COMMENT_JOINS} WHERE c.id = ?;`;
    const [[row]] = await client.pool.execute<CommentRow[]>(query, [commentId]);
    if (!row || row.status !== "visible") {
        return undefined;
    }
    return rowToComment(row, false, false, currentRun);
}

/** The comment as its author sees it, right after posting. */
async function getCommentForAuthor(client: GlobalsClient, commentId: string): Promise<ReplayComment> {
    const query = `SELECT ${COMMENT_COLUMNS} FROM replay_comments c ${COMMENT_JOINS} WHERE c.id = ?;`;
    const [[row]] = await client.pool.execute<CommentRow[]>(query, [commentId]);
    // Just posted, so it's on the current run
    return rowToComment(row, false, false, undefined);
}

interface CommentStateSQL {
    id: string
    time_id: string
    user_id: string
    parent_id: string | null
    status: ReplayCommentStatus
    hidden_by: CommentHiddenBy | null
    runner_id: string
}
type CommentStateRow = CommentStateSQL & RowDataPacket;

export type CommentState = CommentStateSQL;

export async function getCommentState(client: GlobalsClient, commentId: string): Promise<CommentState | undefined> {
    const query = `SELECT id, time_id, user_id, parent_id, status, hidden_by, runner_id FROM replay_comments WHERE id = ?;`;
    const [[row]] = await client.pool.execute<CommentStateRow[]>(query, [commentId]);
    return row;
}

export interface NewComment {
    timeId: string
    body: string
    replaySeconds?: number
    parentId?: string
}

export type CommentFailure = { ok: false, status: number, error: string, bannedUntil?: string };
export type CommentResult<T> = { ok: true, value: T } | CommentFailure;

function fail(status: number, error: string, bannedUntil?: string): CommentFailure {
    return { ok: false, status: status, error: error, bannedUntil: bannedUntil };
}

interface RecentCommentsSQL {
    day_count: string
    seconds_since_last: string | null
}
type RecentCommentsRow = RecentCommentsSQL & RowDataPacket;

/** Whether the user can post, like and report: they've played StrafesNET and aren't banned. */
async function checkCanComment(client: GlobalsClient, userId: number): Promise<CommentFailure | undefined> {
    const [strafesUser, ban] = await Promise.all([lookupUserInfo(userId), getActiveBan(client, userId)]);
    if (strafesUser === undefined) {
        return fail(503, "Couldn't check your StrafesNET account, try again in a bit");
    }
    if (strafesUser === null) {
        return fail(403, "You need to play StrafesNET before you can comment");
    }
    if (ban) {
        // Sent separately so the client can format it
        return fail(403, "You're banned from commenting", ban.expiresAt);
    }
    return undefined;
}

// One post at a time per user, so parallel requests can't all slip under the rate limit
const postLock = new AsyncLock();

/** Checks everything about a new comment and saves it. A flagged comment is saved as pending. */
export async function postComment(client: GlobalsClient, user: LoginUser, input: NewComment): Promise<CommentResult<ReplayComment>> {
    const prepared = prepareCommentBody(input.body);
    if ("error" in prepared) {
        return fail(400, prepared.error);
    }

    const [time, cantComment] = await Promise.all([
        // Not cached: the run is saved with the comment, and a cached copy could be one the runner just beat
        fetchFreshTimeById(input.timeId),
        checkCanComment(client, user.userId)
    ]);

    if (cantComment) {
        return cantComment;
    }
    if (!time) {
        return fail(404, "Invalid time");
    }
    if (!time.has_bot) {
        return fail(400, "This time doesn't have a replay");
    }

    let parentId: string | null = null;
    let replyToUserId: string | null = null;
    let replaySeconds: number | null = input.replaySeconds ?? null;
    if (input.parentId !== undefined) {
        const parent = await getCommentState(client, input.parentId);
        if (!parent || parent.time_id !== input.timeId || parent.status !== "visible") {
            return fail(404, "The comment you're replying to is gone");
        }
        // Replies stay one level deep: a reply to a reply goes under the same top-level comment
        if (parent.parent_id !== null) {
            parentId = parent.parent_id;
            replyToUserId = parent.user_id;
        }
        else {
            parentId = parent.id;
        }
        replaySeconds = null;
    }
    if (replaySeconds !== null && replaySeconds > Math.ceil(time.time / 1000)) {
        return fail(400, "That timestamp is past the end of the run");
    }

    const status: ReplayCommentStatus = prepared.check === "flagged" ? "pending" : "visible";
    const run = currentRunOf(time);

    const result = await postLock.acquire(user.userId.toString(), async (): Promise<CommentResult<string>> => {
        const recentQuery = `SELECT
                COUNT(*) AS day_count,
                TIMESTAMPDIFF(SECOND, MAX(created_at), NOW()) AS seconds_since_last
            FROM replay_comments WHERE user_id = ? AND created_at > NOW() - INTERVAL 1 DAY;`;
        const [[recent]] = await client.pool.execute<RecentCommentsRow[]>(recentQuery, [user.userId]);
        if (recent.seconds_since_last !== null && +recent.seconds_since_last < COMMENT_COOLDOWN_SECONDS) {
            return fail(429, "You're commenting too fast, wait a few seconds");
        }
        if (+recent.day_count >= MAX_COMMENTS_PER_DAY) {
            return fail(429, `You can post at most ${MAX_COMMENTS_PER_DAY} comments a day`);
        }

        // Make sure the author has a row in the users table with their current username from Roblox
        if (user.username) {
            await client.upsertUser(user.userId, user.username);
        }

        const insertQuery = `INSERT INTO replay_comments
            (time_id, user_id, parent_id, reply_to_user_id, replay_seconds, body, status, runner_id, map_id, game, style, course, run_time_ms, run_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        const [inserted] = await client.pool.execute<ResultSetHeader>(insertQuery, [
            input.timeId,
            user.userId,
            parentId,
            replyToUserId,
            replaySeconds,
            prepared.body,
            status,
            time.user.id,
            time.map.id,
            time.game_id,
            time.style_id,
            time.mode_id,
            run.time,
            new Date(run.date)
        ]);
        return { ok: true, value: inserted.insertId.toString() };
    });

    if (!result.ok) {
        return result;
    }
    return { ok: true, value: await getCommentForAuthor(client, result.value) };
}

/** A status change, for deciding what to tell the live stream. */
export interface CommentChange {
    commentId: string
    timeId: string
    before: ReplayCommentStatus
    after: ReplayCommentStatus
}

/** The author deletes their own comment. */
export async function deleteComment(client: GlobalsClient, user: LoginUser, commentId: string): Promise<CommentResult<CommentChange>> {
    const comment = await getCommentState(client, commentId);
    if (!comment || comment.status === "deleted") {
        return fail(404, "Comment not found");
    }
    if (+comment.user_id !== user.userId) {
        return fail(403, "You can only delete your own comments");
    }

    const query = `UPDATE replay_comments SET status = 'deleted', status_changed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status <> 'deleted';`;
    await client.pool.execute(query, [commentId]);
    return { ok: true, value: { commentId: commentId, timeId: comment.time_id, before: comment.status, after: "deleted" } };
}

interface CountSQL {
    count: string
}
type CountRow = CountSQL & RowDataPacket;

export async function setCommentLike(client: GlobalsClient, user: LoginUser, commentId: string, active: boolean): Promise<CommentResult<{ timeId: string, likes: number }>> {
    const comment = await getCommentState(client, commentId);
    if (!comment) {
        return fail(404, "Comment not found");
    }

    if (active) {
        if (comment.status !== "visible") {
            return fail(404, "Comment not found");
        }
        const cantComment = await checkCanComment(client, user.userId);
        if (cantComment) {
            return cantComment;
        }
        const query = `INSERT IGNORE INTO replay_comment_likes (comment_id, user_id) VALUES (?, ?);`;
        await client.pool.execute(query, [commentId, user.userId]);
    }
    else {
        // Always allowed, so a like can be taken back from a comment that's since been hidden
        const query = `DELETE FROM replay_comment_likes WHERE comment_id = ? AND user_id = ?;`;
        await client.pool.execute(query, [commentId, user.userId]);
    }

    const countQuery = `SELECT COUNT(*) AS count FROM replay_comment_likes WHERE comment_id = ?;`;
    const [[row]] = await client.pool.execute<CountRow[]>(countQuery, [commentId]);
    return { ok: true, value: { timeId: comment.time_id, likes: +row.count } };
}

interface LikeCountSQL {
    comment_id: string
    count: string
}
type LikeCountRow = LikeCountSQL & RowDataPacket;

/** Like counts for the given comments; ones with no likes are 0. */
export async function getLikeCounts(client: GlobalsClient, commentIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>(commentIds.map((id) => [id, 0]));
    if (commentIds.length === 0) {
        return counts;
    }
    const query = `SELECT comment_id, COUNT(*) AS count FROM replay_comment_likes WHERE comment_id IN (?) GROUP BY comment_id;`;
    const [rows] = await client.pool.query<LikeCountRow[]>(query, [commentIds]);
    for (const row of rows) {
        counts.set(row.comment_id, +row.count);
    }
    return counts;
}

/** Reports a comment. Enough open reports from different users move a visible one to pending. */
export async function reportComment(
    client: GlobalsClient,
    user: LoginUser,
    commentId: string,
    reason: CommentReportReason,
    note: string | undefined
): Promise<CommentResult<CommentChange | undefined>> {
    const comment = await getCommentState(client, commentId);
    // Including ones the runner hid, which a moderator may still need to act on
    const reportable = comment?.status === "visible" || (comment?.status === "hidden" && comment.hidden_by === "runner");
    if (!comment || !reportable) {
        return fail(404, "Comment not found");
    }
    if (+comment.user_id === user.userId) {
        return fail(400, "You can't report your own comment");
    }
    const cantComment = await checkCanComment(client, user.userId);
    if (cantComment) {
        return cantComment;
    }

    let cleanNote: string | null = note !== undefined ? normalizeComment(note) : null;
    if (cleanNote === "") {
        cleanNote = null;
    }
    if (cleanNote !== null && commentLength(cleanNote) > MAX_COMMENT_REPORT_NOTE_LENGTH) {
        return fail(400, `Notes can be at most ${MAX_COMMENT_REPORT_NOTE_LENGTH} characters`);
    }

    // IGNORE: someone whose report was already dealt with doesn't get to reopen it
    const insertQuery = `INSERT IGNORE INTO replay_comment_reports (comment_id, reporter_id, reason, note) VALUES (?, ?, ?, ?);`;
    await client.pool.execute(insertQuery, [commentId, user.userId, reason, cleanNote]);

    const updateQuery = `UPDATE replay_comments SET status = 'pending', status_changed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'visible'
        AND (SELECT COUNT(*) FROM replay_comment_reports WHERE comment_id = ? AND resolved_at IS NULL) >= ?;`;
    const [updated] = await client.pool.execute<ResultSetHeader>(updateQuery, [commentId, commentId, REPORTS_TO_HIDE]);
    if (updated.affectedRows === 0) {
        return { ok: true, value: undefined };
    }
    return { ok: true, value: { commentId: commentId, timeId: comment.time_id, before: "visible", after: "pending" } };
}

/**
 * Hides or unhides a comment. Moderators can do this to any comment; the runner only to visible comments on their
 * own replay, and only unhide ones they hid themselves.
 */
export async function setCommentHidden(
    client: GlobalsClient,
    actor: CommentViewer,
    commentId: string,
    hidden: boolean,
    reason: string | undefined
): Promise<CommentResult<CommentChange | undefined>> {
    const comment = await getCommentState(client, commentId);
    if (!comment || comment.status === "deleted") {
        return fail(404, "Comment not found");
    }

    if (actor.role !== undefined) {
        return moderateComment(client, actor.userId, comment, hidden ? "hide" : "approve", reason);
    }

    if (+comment.runner_id !== actor.userId) {
        return fail(403, "You can only hide comments on your own replays");
    }

    let query: string;
    if (hidden) {
        if (comment.status !== "visible") {
            return { ok: true, value: undefined };
        }
        query = `UPDATE replay_comments SET status = 'hidden', hidden_by = 'runner', status_changed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'visible';`;
    }
    else {
        if (comment.status !== "hidden") {
            return { ok: true, value: undefined };
        }
        if (comment.hidden_by !== "runner") {
            return fail(403, "A moderator hid this comment");
        }
        query = `UPDATE replay_comments SET status = 'visible', hidden_by = NULL, status_changed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'hidden' AND hidden_by = 'runner';`;
    }

    const [updated] = await client.pool.execute<ResultSetHeader>(query, [commentId]);
    if (updated.affectedRows === 0) {
        return { ok: true, value: undefined };
    }

    await logModerationAction(client, actor.userId, hidden ? "hide" : "restore", { commentId: commentId, targetUserId: +comment.user_id, reason: reason });
    return { ok: true, value: { commentId: commentId, timeId: comment.time_id, before: comment.status, after: hidden ? "hidden" : "visible" } };
}

export type ModeratorCommentAction = "approve" | "hide" | "dismiss";

/**
 * A moderator's decision on a comment, which also closes its open reports.
 * approve: pending or hidden goes back to visible. hide: hidden by a moderator. dismiss: just closes the reports.
 */
export async function moderateComment(
    client: GlobalsClient,
    moderatorId: number,
    comment: CommentState,
    action: ModeratorCommentAction,
    reason: string | undefined
): Promise<CommentResult<CommentChange | undefined>> {
    if (comment.status === "deleted" && action !== "dismiss") {
        return fail(400, "The author deleted this comment");
    }

    let change: CommentChange | undefined;
    if (action === "approve" && comment.status !== "visible") {
        const query = `UPDATE replay_comments SET status = 'visible', hidden_by = NULL, status_changed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status IN ('pending', 'hidden');`;
        const [updated] = await client.pool.execute<ResultSetHeader>(query, [comment.id]);
        if (updated.affectedRows > 0) {
            change = { commentId: comment.id, timeId: comment.time_id, before: comment.status, after: "visible" };
        }
    }
    else if (action === "hide" && !(comment.status === "hidden" && comment.hidden_by === "moderator")) {
        // Also takes over a runner's hide, so the runner can't undo it
        const query = `UPDATE replay_comments SET status = 'hidden', hidden_by = 'moderator', status_changed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status IN ('visible', 'pending', 'hidden');`;
        const [updated] = await client.pool.execute<ResultSetHeader>(query, [comment.id]);
        if (updated.affectedRows > 0) {
            change = { commentId: comment.id, timeId: comment.time_id, before: comment.status, after: "hidden" };
        }
    }

    const resolveQuery = `UPDATE replay_comment_reports SET resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
        WHERE comment_id = ? AND resolved_at IS NULL;`;
    const [resolved] = await client.pool.execute<ResultSetHeader>(resolveQuery, [moderatorId, comment.id]);

    const logAction = action === "hide" ? "hide"
        : action === "dismiss" ? "dismiss_reports"
        : comment.status === "pending" ? "approve" : "restore";
    // Don't log something that changed nothing
    if (change || resolved.affectedRows > 0) {
        await logModerationAction(client, moderatorId, logAction, { commentId: comment.id, targetUserId: +comment.user_id, reason: reason });
    }

    return { ok: true, value: change };
}
