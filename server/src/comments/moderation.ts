import { ResultSetHeader, RowDataPacket } from "mysql2";
import {
    CommentBan,
    CommentHiddenBy,
    CommentModerationAction,
    CommentModerationLogEntry,
    CommentReportReason,
    ModComment,
    ModCommentReport,
    ModUser,
    ReplayCommentStatus
} from "shared";
import { GlobalsClient } from "../globals.js";
import { unixToISO } from "../util.js";
import { logModerationAction } from "./roles.js";

function modUser(userId: string | number, username: string | null | undefined): ModUser {
    return { userId: +userId, username: username ?? undefined };
}


// Bans

interface BanSQL {
    id: string
    user_id: string
    username: string | null
    reason: string
    banned_by: string
    banned_by_username: string | null
    created_at: string
    expires_at: string | null
}
type BanRow = BanSQL & RowDataPacket;

const BAN_SELECT = `SELECT b.id, b.user_id, u.username, b.reason, b.banned_by, bu.username AS banned_by_username,
        UNIX_TIMESTAMP(b.created_at) AS created_at, UNIX_TIMESTAMP(b.expires_at) AS expires_at
    FROM comment_bans b
    LEFT JOIN users u ON u.user_id = b.user_id
    LEFT JOIN users bu ON bu.user_id = b.banned_by`;
const ACTIVE_BAN = `b.revoked_at IS NULL AND (b.expires_at IS NULL OR b.expires_at > NOW())`;

function rowToBan(row: BanSQL): CommentBan {
    return {
        id: row.id,
        user: modUser(row.user_id, row.username),
        reason: row.reason,
        bannedBy: modUser(row.banned_by, row.banned_by_username),
        createdAt: unixToISO(row.created_at),
        expiresAt: row.expires_at !== null ? unixToISO(row.expires_at) : undefined
    };
}

/** The user's active ban that lasts the longest, if any. */
export async function getActiveBan(client: GlobalsClient, userId: number): Promise<CommentBan | undefined> {
    const query = `${BAN_SELECT} WHERE b.user_id = ? AND ${ACTIVE_BAN}
        ORDER BY b.expires_at IS NULL DESC, b.expires_at DESC LIMIT 1;`;
    const [[row]] = await client.pool.execute<BanRow[]>(query, [userId]);
    return row ? rowToBan(row) : undefined;
}

export async function listActiveBans(client: GlobalsClient): Promise<CommentBan[]> {
    const query = `${BAN_SELECT} WHERE ${ACTIVE_BAN} ORDER BY b.created_at DESC;`;
    const [rows] = await client.pool.execute<BanRow[]>(query);
    return rows.map(rowToBan);
}

/** Bans the user for some days, or for good when days is undefined. */
export async function banUser(client: GlobalsClient, actorId: number, userId: number, reason: string, days: number | undefined) {
    const query = days !== undefined
        ? `INSERT INTO comment_bans (user_id, reason, banned_by, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL ? DAY);`
        : `INSERT INTO comment_bans (user_id, reason, banned_by) VALUES (?, ?, ?);`;
    const values = days !== undefined ? [userId, reason, actorId, days] : [userId, reason, actorId];
    await client.pool.execute(query, values);

    const duration = days !== undefined ? `${days} day${days === 1 ? "" : "s"}` : "permanent";
    await logModerationAction(client, actorId, "ban", { targetUserId: userId, reason: `${duration}: ${reason}` });
}

/** Ends all of the user's active bans. Returns false if they had none. */
export async function unbanUser(client: GlobalsClient, actorId: number, userId: number) {
    const query = `UPDATE comment_bans b SET b.revoked_at = CURRENT_TIMESTAMP, b.revoked_by = ? WHERE b.user_id = ? AND ${ACTIVE_BAN};`;
    const [result] = await client.pool.execute<ResultSetHeader>(query, [actorId, userId]);
    if (result.affectedRows === 0) {
        return false;
    }
    await logModerationAction(client, actorId, "unban", { targetUserId: userId });
    return true;
}

// Comments for moderators

interface ModCommentSQL {
    id: string
    time_id: string
    parent_id: string | null
    replay_seconds: number | null
    body: string
    status: ReplayCommentStatus
    hidden_by: CommentHiddenBy | null
    created_at: string
    status_changed_at: string | null
    user_id: string
    username: string | null
    runner_id: string
    runner_username: string | null
    map_id: string
    map_name: string | null
    game: number
    style: number
    course: number
    run_time_ms: number
    run_date: Date
    open_reports: string
}
type ModCommentRow = ModCommentSQL & RowDataPacket;

interface ReportSQL {
    comment_id: string
    reporter_id: string
    reporter_username: string | null
    reason: CommentReportReason
    note: string | null
    created_at: string
    // A string, since the pool returns BIGINTs as strings
    resolved: string
}
type ReportRow = ReportSQL & RowDataPacket;

const MOD_COMMENT_SELECT = `SELECT c.id, c.time_id, c.parent_id, c.replay_seconds, c.body, c.status, c.hidden_by,
        UNIX_TIMESTAMP(c.created_at) AS created_at, UNIX_TIMESTAMP(c.status_changed_at) AS status_changed_at,
        c.user_id, u.username, c.runner_id, ru.username AS runner_username,
        c.map_id, m.name AS map_name, c.game, c.style, c.course, c.run_time_ms, c.run_date,
        (SELECT COUNT(*) FROM replay_comment_reports r WHERE r.comment_id = c.id AND r.resolved_at IS NULL) AS open_reports
    FROM replay_comments c
    LEFT JOIN users u ON u.user_id = c.user_id
    LEFT JOIN users ru ON ru.user_id = c.runner_id
    LEFT JOIN maps m ON m.map_id = c.map_id`;

async function rowsToModComments(client: GlobalsClient, rows: ModCommentSQL[]): Promise<ModComment[]> {
    const reportsByComment = new Map<string, ModCommentReport[]>();
    if (rows.length > 0) {
        const query = `SELECT r.comment_id, r.reporter_id, u.username AS reporter_username, r.reason, r.note,
                UNIX_TIMESTAMP(r.created_at) AS created_at, r.resolved_at IS NOT NULL AS resolved
            FROM replay_comment_reports r
            LEFT JOIN users u ON u.user_id = r.reporter_id
            WHERE r.comment_id IN (?)
            ORDER BY r.created_at DESC;`;
        const [reportRows] = await client.pool.query<ReportRow[]>(query, [rows.map((row) => row.id)]);
        for (const row of reportRows) {
            let reports = reportsByComment.get(row.comment_id);
            if (!reports) {
                reports = [];
                reportsByComment.set(row.comment_id, reports);
            }
            reports.push({
                reporter: modUser(row.reporter_id, row.reporter_username),
                reason: row.reason,
                note: row.note ?? undefined,
                createdAt: unixToISO(row.created_at),
                resolved: row.resolved === "1"
            });
        }
    }

    const comments: ModComment[] = rows.map((row) => ({
        id: row.id,
        timeId: row.time_id,
        parentId: row.parent_id ?? undefined,
        replaySeconds: row.replay_seconds ?? undefined,
        body: row.body,
        status: row.status,
        hiddenBy: row.hidden_by ?? undefined,
        createdAt: unixToISO(row.created_at),
        statusChangedAt: row.status_changed_at !== null ? unixToISO(row.status_changed_at) : undefined,
        author: modUser(row.user_id, row.username),
        run: { time: row.run_time_ms, date: row.run_date.toISOString() },
        runner: modUser(row.runner_id, row.runner_username),
        mapId: +row.map_id,
        mapName: row.map_name ?? undefined,
        game: row.game,
        style: row.style,
        course: row.course,
        openReports: +row.open_reports,
        reports: reportsByComment.get(row.id) ?? []
    }));
    return comments;
}

async function getModCommentsByIds(client: GlobalsClient, ids: string[]): Promise<ModComment[]> {
    if (ids.length === 0) return [];
    const [rows] = await client.pool.query<ModCommentRow[]>(`${MOD_COMMENT_SELECT} WHERE c.id IN (?);`, [ids]);
    return rowsToModComments(client, rows);
}

const QUEUE_LIMIT = 100;

/** Comments waiting on a moderator: pending ones, and ones with open reports. Oldest first. */
export async function getModerationQueue(client: GlobalsClient): Promise<ModComment[]> {
    // Each side uses its own index (queue_idx, open_reports_idx), so this only reads the queue, not every comment
    const query = `${MOD_COMMENT_SELECT}
        INNER JOIN (
            SELECT id FROM replay_comments WHERE status = 'pending'
            UNION
            SELECT r.comment_id FROM replay_comment_reports r
                INNER JOIN replay_comments rc ON rc.id = r.comment_id
                WHERE r.resolved_at IS NULL AND rc.status IN ('visible', 'hidden')
        ) queue ON queue.id = c.id
        ORDER BY c.id
        LIMIT ${QUEUE_LIMIT};`;
    const [rows] = await client.pool.execute<ModCommentRow[]>(query);
    return rowsToModComments(client, rows);
}

export interface ModCommentFilter {
    userId?: number
    timeId?: string
    status?: ReplayCommentStatus
}

/** Comments matching the filter, newest first, including deleted ones. */
export async function searchComments(client: GlobalsClient, filter: ModCommentFilter, page: number, pageSize: number): Promise<{ total: number, comments: ModComment[] }> {
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    if (filter.userId !== undefined) {
        conditions.push("c.user_id = ?");
        values.push(filter.userId);
    }
    if (filter.timeId !== undefined) {
        conditions.push("c.time_id = ?");
        values.push(filter.timeId);
    }
    if (filter.status !== undefined) {
        conditions.push("c.status = ?");
        values.push(filter.status);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) AS count FROM replay_comments c ${where};`;
    const [[countRow]] = await client.pool.execute<({ count: string } & RowDataPacket)[]>(countQuery, values);

    const offset = (page - 1) * pageSize;
    const query = `${MOD_COMMENT_SELECT} ${where} ORDER BY c.id DESC LIMIT ${pageSize} OFFSET ${offset};`;
    const [rows] = await client.pool.execute<ModCommentRow[]>(query, values);

    return {
        total: +countRow.count,
        comments: await rowsToModComments(client, rows)
    };
}

// Log

interface LogSQL {
    id: string
    actor_id: string
    actor_username: string | null
    action: CommentModerationAction
    comment_id: string | null
    target_user_id: string | null
    target_username: string | null
    reason: string | null
    created_at: string
}
type LogRow = LogSQL & RowDataPacket;

export async function getModerationLog(client: GlobalsClient, page: number, pageSize: number): Promise<CommentModerationLogEntry[]> {
    const offset = (page - 1) * pageSize;
    const query = `SELECT l.id, l.actor_id, au.username AS actor_username, l.action, l.comment_id,
            l.target_user_id, tu.username AS target_username, l.reason, UNIX_TIMESTAMP(l.created_at) AS created_at
        FROM comment_moderation_log l
        LEFT JOIN users au ON au.user_id = l.actor_id
        LEFT JOIN users tu ON tu.user_id = l.target_user_id
        ORDER BY l.id DESC
        LIMIT ${pageSize} OFFSET ${offset};`;
    const [rows] = await client.pool.execute<LogRow[]>(query);

    const commentIds = Array.from(new Set(rows.flatMap((row) => row.comment_id !== null ? [row.comment_id] : [])));
    const comments = new Map((await getModCommentsByIds(client, commentIds)).map((comment) => [comment.id, comment]));

    const entries: CommentModerationLogEntry[] = rows.map((row) => ({
        id: row.id,
        actor: modUser(row.actor_id, row.actor_username),
        action: row.action,
        commentId: row.comment_id ?? undefined,
        target: row.target_user_id !== null ? modUser(row.target_user_id, row.target_username) : undefined,
        reason: row.reason ?? undefined,
        createdAt: unixToISO(row.created_at),
        comment: row.comment_id !== null ? comments.get(row.comment_id) : undefined
    }));
    return entries;
}
