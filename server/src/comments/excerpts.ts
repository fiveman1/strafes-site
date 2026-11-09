import { RowDataPacket } from "mysql2";
import { CommentExcerpt, CommentReplay, compareCommentIds, ReplayCommentStatus } from "shared";
import { GlobalsClient } from "../globals.js";
import { userRef } from "../users.js";

export interface ReplyRef {
    id: string
    parentId: string
    replyToUserId: string | null
}

interface ThreadCommentSQL {
    id: string
    parent_id: string | null
    user_id: string
    username: string | null
    body: string
    replay_seconds: number | null
    status: ReplayCommentStatus
}
type ThreadCommentRow = ThreadCommentSQL & RowDataPacket;

export function toExcerpt(row: { id: string, body: string, replay_seconds: number | null, user_id: string, username: string | null }): CommentExcerpt {
    return {
        id: row.id,
        body: row.body,
        replaySeconds: row.replay_seconds ?? undefined,
        author: userRef(row.user_id, row.username)
    };
}

// What toCommentReplay needs, from replay_runs rr (plus a time_id): its columns and joins
export const REPLAY_COLUMNS = `rr.runner_id, ru.username AS runner_username, rr.map_id, m.name AS map_name, rr.game, rr.style,
    rr.course, rr.run_time_ms`;
export const REPLAY_JOINS = `LEFT JOIN users ru ON ru.user_id = rr.runner_id
    LEFT JOIN maps m ON m.map_id = rr.map_id`;

export interface ReplayRunSQL {
    time_id: string
    runner_id: string
    runner_username: string | null
    map_id: string
    map_name: string | null
    game: number
    style: number
    course: number
    run_time_ms: number
}

export function toCommentReplay(row: ReplayRunSQL): CommentReplay {
    return {
        timeId: row.time_id,
        mapId: +row.map_id,
        mapName: row.map_name ?? undefined,
        game: row.game,
        style: row.style,
        course: row.course,
        // The run the time holds now, which is what the replay page opens
        time: row.run_time_ms,
        runner: userRef(row.runner_id, row.runner_username)
    };
}

/**
 * The comment each reply answered, by reply ID. A reply to a top-level comment answered that comment. A reply to a
 * reply only saves who it answered (replies stay one level deep), so it's taken to be that person's latest reply in
 * the thread from before it, or the top-level comment if they have none.
 *
 * Moderators see every comment as it is. With a viewer, a comment they couldn't see on the replay (anything not
 * visible, other than their own) comes back removed. It's still the one picked, so a reply doesn't look like it
 * answered someone else.
 */
export async function findRepliedTo(client: GlobalsClient, replies: ReplyRef[], viewerId?: number): Promise<Map<string, CommentExcerpt>> {
    const repliedTo = new Map<string, CommentExcerpt>();
    if (replies.length === 0) {
        return repliedTo;
    }

    const parentIds = new Set(replies.map((reply) => reply.parentId));
    // Only threads with a reply to a reply need their other replies
    const threadIds = Array.from(new Set(replies.filter((reply) => reply.replyToUserId !== null).map((reply) => reply.parentId)));
    const conditions = ["c.id IN (?)"];
    const values: string[][] = [Array.from(parentIds)];
    if (threadIds.length > 0) {
        conditions.push("c.parent_id IN (?)");
        values.push(threadIds);
    }
    const query = `SELECT c.id, c.parent_id, c.user_id, u.username, c.body, c.replay_seconds, c.status
        FROM replay_comments c
        LEFT JOIN users u ON u.user_id = c.user_id
        WHERE ${conditions.join(" OR ")};`;
    const [rows] = await client.pool.query<ThreadCommentRow[]>(query, values);

    const canSee = (row: ThreadCommentSQL) =>
        viewerId === undefined || row.status === "visible" || (+row.user_id === viewerId && row.status !== "deleted");

    const byId = new Map<string, ThreadCommentSQL>();
    // Each thread's replies, oldest first
    const threadReplies = new Map<string, ThreadCommentSQL[]>();
    for (const row of rows) {
        if (parentIds.has(row.id)) {
            byId.set(row.id, row);
        }
        if (row.parent_id !== null) {
            const thread = threadReplies.get(row.parent_id) ?? [];
            thread.push(row);
            threadReplies.set(row.parent_id, thread);
        }
    }
    for (const thread of threadReplies.values()) {
        thread.sort((a, b) => compareCommentIds(a.id, b.id));
    }

    for (const reply of replies) {
        let answered = byId.get(reply.parentId);
        if (reply.replyToUserId !== null) {
            for (const row of threadReplies.get(reply.parentId) ?? []) {
                if (compareCommentIds(row.id, reply.id) >= 0) break;
                if (row.user_id === reply.replyToUserId) {
                    answered = row;
                }
            }
        }
        if (!answered) continue;
        repliedTo.set(reply.id, canSee(answered) ? toExcerpt(answered) : {
            id: answered.id,
            body: "",
            author: userRef(answered.user_id, answered.username),
            removed: true
        });
    }
    return repliedTo;
}
