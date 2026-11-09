import { Request, Response, Router } from "express";
import vine, { errors } from "@vinejs/vine";
import { RowDataPacket } from "mysql2";
import {
    allReplayReactions,
    CommentReplay,
    Inbox,
    INBOX_DAYS,
    InboxItem,
    MAX_INBOX_GROUP_USERS,
    MAX_INBOX_ITEMS,
    ReplayReaction,
    UserRef
} from "shared";
import { AuthClient } from "./auth.js";
import { findRepliedTo, REPLAY_COLUMNS, REPLAY_JOINS, ReplayRunSQL, toCommentReplay, toExcerpt } from "./comments/excerpts.js";
import { GlobalsClient } from "./globals.js";
import { rateLimiterMiddleware } from "./middleware.js";
import { setUserRefInfo, userRef } from "./users.js";
import { unixToISO } from "./util.js";

// The inbox isn't stored: it's worked out from comments, likes and reactions whenever it's asked for, so anything
// deleted, hidden or taken back drops out on its own. The only state is when each user last looked.

// Per kind of item, before grouping. Far more than the inbox shows; past this, the oldest are left out.
const MAX_ROWS = 1000;

/** A comment, with what toExcerpt needs. */
interface InboxCommentSQL {
    id: string
    time_id: string
    user_id: string
    username: string | null
    body: string
    replay_seconds: number | null
    at: string // unix seconds, as a decimal string
}
type InboxCommentRow = InboxCommentSQL & RowDataPacket;

interface ReplySQL extends InboxCommentSQL {
    parent_id: string
    reply_to_user_id: string | null
}
type ReplyRow = ReplySQL & RowDataPacket;

interface ReactionSQL {
    time_id: string
    reaction: string
    user_id: string
    username: string | null
    at: string
}
type ReactionRow = ReactionSQL & RowDataPacket;

interface LikeSQL {
    // The comment, which is the user's own
    comment_id: string
    time_id: string
    body: string
    replay_seconds: number | null
    author_id: string
    author_username: string | null
    // Who liked it
    user_id: string
    username: string | null
    at: string
}
type LikeRow = LikeSQL & RowDataPacket;

interface SeenSQL {
    seen_at: string | null
}
type SeenRow = SeenSQL & RowDataPacket;

/** Everything that happened to the user after since, before it's grouped. */
interface InboxRows {
    comments: InboxCommentSQL[]
    replies: ReplySQL[]
    reactions: ReactionSQL[]
    likes: LikeSQL[]
    hidden: InboxCommentSQL[]
}

/**
 * Where one kind of item comes from: SQL from FROM through WHERE, with its values. Several parts are unioned, so each
 * can use its own index. The same parts load the rows and count the items, so the badge and the list agree.
 */
interface InboxSource {
    columns: string
    parts: { from: string, values: (string | number | string[])[] }[]
    // What makes one item: a row, or a group of them
    itemKey: string
}

// When a comment showed up: when it was posted, or when it became visible later (approved, or restored after being
// hidden), so one that shows up after the user last looked is still new to them
const SHOWN_AT = "COALESCE(GREATEST(c.created_at, c.status_changed_at), c.created_at)";

function inboxSources(userId: number, since: number): Record<keyof InboxRows, InboxSource> {
    // since goes through FROM_UNIXTIME rather than as a Date, which mysql2 would write out in the pool's time zone
    // (UTC) for the session to read in its own. FROM_UNIXTIME is still in the session's zone, so in the hour repeated
    // when daylight saving ends, a few items can come out read or unread when they shouldn't.
    const commentColumns = `c.id, c.time_id, c.user_id, u.username, c.body, c.replay_seconds`;
    const replyColumns = `${commentColumns}, UNIX_TIMESTAMP(${SHOWN_AT}) AS at, c.parent_id, c.reply_to_user_id`;

    return {
        // Top-level comments on the user's runs
        comments: {
            columns: `${commentColumns}, UNIX_TIMESTAMP(${SHOWN_AT}) AS at`,
            parts: [{
                from: `FROM replay_runs rr
                    INNER JOIN replay_comments c ON c.time_id = rr.time_id
                    LEFT JOIN users u ON u.user_id = c.user_id
                    WHERE rr.runner_id = ? AND c.parent_id IS NULL AND c.status = 'visible' AND c.user_id <> ?
                        AND ${SHOWN_AT} > FROM_UNIXTIME(?)`,
                values: [userId, userId, since]
            }],
            itemKey: "c.id"
        },
        // Replies in threads the user started, and replies to the user's own replies
        replies: {
            columns: replyColumns,
            parts: [{
                from: `FROM replay_comments p
                    INNER JOIN replay_comments c ON c.parent_id = p.id
                    LEFT JOIN users u ON u.user_id = c.user_id
                    WHERE p.user_id = ? AND p.status <> 'deleted' AND c.status = 'visible' AND c.user_id <> ?
                        AND ${SHOWN_AT} > FROM_UNIXTIME(?)`,
                values: [userId, userId, since]
            }, {
                from: `FROM replay_comments c
                    LEFT JOIN users u ON u.user_id = c.user_id
                    WHERE c.reply_to_user_id = ? AND c.status = 'visible' AND c.user_id <> ? AND ${SHOWN_AT} > FROM_UNIXTIME(?)`,
                values: [userId, userId, since]
            }],
            itemKey: "c.id"
        },
        // Only reactions that are still offered, which the inbox can show
        reactions: {
            columns: "r.time_id, r.reaction, r.user_id, u.username, UNIX_TIMESTAMP(r.created_at) AS at",
            parts: [{
                from: `FROM replay_runs rr
                    INNER JOIN replay_reactions r ON r.time_id = rr.time_id
                    LEFT JOIN users u ON u.user_id = r.user_id
                    WHERE rr.runner_id = ? AND r.user_id <> ? AND r.reaction IN (?) AND r.created_at > FROM_UNIXTIME(?)`,
                values: [userId, userId, [...allReplayReactions], since]
            }],
            itemKey: "r.time_id"
        },
        likes: {
            columns: `l.comment_id, c.time_id, c.body, c.replay_seconds, c.user_id AS author_id, cu.username AS author_username,
                l.user_id, u.username, UNIX_TIMESTAMP(l.created_at) AS at`,
            parts: [{
                from: `FROM replay_comments c
                    INNER JOIN replay_comment_likes l ON l.comment_id = c.id
                    LEFT JOIN users u ON u.user_id = l.user_id
                    LEFT JOIN users cu ON cu.user_id = c.user_id
                    WHERE c.user_id = ? AND c.status = 'visible' AND l.user_id <> ? AND l.created_at > FROM_UNIXTIME(?)`,
                values: [userId, userId, since]
            }],
            itemKey: "l.comment_id"
        },
        // Hidden by a moderator, either after it was up or instead of approving it
        hidden: {
            columns: `${commentColumns}, UNIX_TIMESTAMP(c.status_changed_at) AS at`,
            parts: [{
                from: `FROM replay_comments c
                    LEFT JOIN users u ON u.user_id = c.user_id
                    WHERE c.user_id = ? AND c.status = 'hidden' AND c.hidden_by = 'moderator'
                        AND c.status_changed_at > FROM_UNIXTIME(?)`,
                values: [userId, since]
            }],
            itemKey: "c.id"
        }
    };
}

async function loadRows<T extends RowDataPacket>(client: GlobalsClient, source: InboxSource): Promise<T[]> {
    const query = source.parts.map((part) => `(SELECT ${source.columns} ${part.from})`).join(" UNION ")
        + ` ORDER BY at DESC LIMIT ${MAX_ROWS};`;
    const [rows] = await client.pool.query<T[]>(query, source.parts.flatMap((part) => part.values));
    return rows;
}

async function countItems(client: GlobalsClient, source: InboxSource): Promise<number> {
    // The inbox never shows more than this many, so there's no need to count past it
    const keys = source.parts.map((part) => `(SELECT DISTINCT ${source.itemKey} AS item ${part.from})`).join(" UNION ");
    const query = `SELECT COUNT(*) AS count FROM (${keys} LIMIT ${MAX_INBOX_ITEMS}) items;`;
    const [[row]] = await client.pool.query<({ count: number } & RowDataPacket)[]>(query, source.parts.flatMap((part) => part.values));
    return +row.count;
}

async function loadInboxRows(client: GlobalsClient, userId: number, since: number): Promise<InboxRows> {
    const sources = inboxSources(userId, since);
    const [comments, replies, reactions, likes, hidden] = await Promise.all([
        loadRows<InboxCommentRow>(client, sources.comments),
        loadRows<ReplyRow>(client, sources.replies),
        loadRows<ReactionRow>(client, sources.reactions),
        loadRows<LikeRow>(client, sources.likes),
        loadRows<InboxCommentRow>(client, sources.hidden)
    ]);
    return { comments, replies, reactions, likes, hidden };
}

async function loadReplays(client: GlobalsClient, timeIds: string[]): Promise<Map<string, CommentReplay>> {
    const replays = new Map<string, CommentReplay>();
    if (timeIds.length === 0) {
        return replays;
    }
    const query = `SELECT rr.time_id, ${REPLAY_COLUMNS} FROM replay_runs rr ${REPLAY_JOINS} WHERE rr.time_id IN (?);`;
    const [rows] = await client.pool.query<(ReplayRunSQL & RowDataPacket)[]>(query, [timeIds]);
    for (const row of rows) {
        replays.set(row.time_id, toCommentReplay(row));
    }
    return replays;
}

/** The first few different people in the rows, which are newest first, and how many there are in all. */
function groupUsers(rows: { user_id: string, username: string | null }[]) {
    const seen = new Set<string>();
    const users: UserRef[] = [];
    for (const row of rows) {
        if (seen.has(row.user_id)) continue;
        seen.add(row.user_id);
        if (users.length < MAX_INBOX_GROUP_USERS) {
            users.push(userRef(row.user_id, row.username));
        }
    }
    return { users: users, userCount: seen.size };
}

/** Users mentioned anywhere in the item, for filling in avatars and role colors. */
function itemUsers(item: InboxItem): UserRef[] {
    const users = [item.replay.runner];
    switch (item.type) {
        case "comment":
        case "hidden":
            users.push(item.comment.author);
            break;
        case "reply":
            users.push(item.comment.author, item.repliedTo.author);
            break;
        case "likes":
            users.push(item.comment.author, ...item.users);
            break;
        case "reactions":
            users.push(...item.users);
            break;
    }
    return users;
}

async function getSeenAt(client: GlobalsClient, userId: number): Promise<number | undefined> {
    const query = `SELECT UNIX_TIMESTAMP(seen_at) AS seen_at FROM inbox_seen WHERE user_id = ?;`;
    const [[row]] = await client.pool.execute<SeenRow[]>(query, [userId]);
    return row?.seen_at ? +row.seen_at : undefined;
}

function oldestShown() {
    return Math.floor(Date.now() / 1000) - INBOX_DAYS * 24 * 60 * 60;
}

export async function getInbox(client: GlobalsClient, authClient: AuthClient, userId: number): Promise<Inbox> {
    const [rows, seenAt] = await Promise.all([loadInboxRows(client, userId, oldestShown()), getSeenAt(client, userId)]);

    const timeIds = new Set<string>([
        ...rows.comments.map((row) => row.time_id),
        ...rows.replies.map((row) => row.time_id),
        ...rows.reactions.map((row) => row.time_id),
        ...rows.likes.map((row) => row.time_id),
        ...rows.hidden.map((row) => row.time_id)
    ]);
    const [replays, repliedTo] = await Promise.all([
        loadReplays(client, Array.from(timeIds)),
        findRepliedTo(client, rows.replies.map((row) => ({ id: row.id, parentId: row.parent_id, replyToUserId: row.reply_to_user_id })), userId)
    ]);

    // Every comment and reaction's time is saved to replay_runs first, so a missing replay shouldn't happen. If it
    // does, the item is left out, since there'd be nothing to link to.
    const items: InboxItem[] = [];

    for (const row of rows.comments) {
        const replay = replays.get(row.time_id);
        if (!replay) continue;
        items.push({ type: "comment", at: unixToISO(row.at), replay: replay, comment: toExcerpt(row) });
    }

    for (const row of rows.replies) {
        const replay = replays.get(row.time_id);
        const answered = repliedTo.get(row.id);
        if (!replay || !answered) continue;
        items.push({ type: "reply", at: unixToISO(row.at), replay: replay, comment: toExcerpt(row), repliedTo: answered });
    }

    // Map.groupBy keeps the rows in order, so each group is newest first
    for (const [timeId, group] of Map.groupBy(rows.reactions, (row) => row.time_id)) {
        const replay = replays.get(timeId);
        if (!replay) continue;
        const counts = new Map<string, number>();
        for (const row of group) {
            counts.set(row.reaction, (counts.get(row.reaction) ?? 0) + 1);
        }
        // In display order. The query only loads reactions that are still offered.
        const reactions = allReplayReactions
            .filter((reaction) => counts.has(reaction))
            .map((reaction: ReplayReaction) => ({ reaction: reaction, count: counts.get(reaction)! }));
        items.push({
            type: "reactions",
            at: unixToISO(group[0].at),
            replay: replay,
            reactions: reactions,
            ...groupUsers(group)
        });
    }

    for (const group of Map.groupBy(rows.likes, (row) => row.comment_id).values()) {
        const first = group[0];
        const replay = replays.get(first.time_id);
        if (!replay) continue;
        items.push({
            type: "likes",
            at: unixToISO(first.at),
            replay: replay,
            comment: toExcerpt({ id: first.comment_id, body: first.body, replay_seconds: first.replay_seconds, user_id: first.author_id, username: first.author_username }),
            ...groupUsers(group)
        });
    }

    for (const row of rows.hidden) {
        const replay = replays.get(row.time_id);
        if (!replay) continue;
        items.push({ type: "hidden", at: unixToISO(row.at), replay: replay, comment: toExcerpt(row) });
    }

    items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const shown = items.slice(0, MAX_INBOX_ITEMS);

    await setUserRefInfo(authClient, shown.flatMap(itemUsers));

    return {
        items: shown,
        seenAt: seenAt !== undefined ? unixToISO(seenAt) : undefined
    };
}

export async function getUnreadCount(client: GlobalsClient, userId: number): Promise<number> {
    const seenAt = await getSeenAt(client, userId);
    const sources = inboxSources(userId, Math.max(seenAt ?? 0, oldestShown()));
    const counts = await Promise.all(Object.values(sources).map((source) => countItems(client, source)));
    return Math.min(counts.reduce((sum, count) => sum + count, 0), MAX_INBOX_ITEMS);
}

/** Marks everything up to upTo (unix seconds) as read. Never moves backwards, or past now. */
export async function markInboxSeen(client: GlobalsClient, userId: number, upTo: number) {
    // Nothing older is shown anyway, and it keeps FROM_UNIXTIME in range (it's NULL before 1970)
    upTo = Math.max(upTo, oldestShown());
    const query = `INSERT INTO inbox_seen (user_id, seen_at) VALUES (?, LEAST(FROM_UNIXTIME(?), CURRENT_TIMESTAMP)) AS new
        ON DUPLICATE KEY UPDATE seen_at = GREATEST(inbox_seen.seen_at, new.seen_at);`;
    await client.pool.execute(query, [userId, upTo]);
}

const markSeenValidator = vine.create({
    // An item's "at" from the inbox, so items newer than what the user saw stay unread
    upTo: vine.date({ formats: ["iso8601"] })
});

export function createInboxRouter(globalsClient: GlobalsClient, authClient: AuthClient) {
    const router = Router();

    // Only the session, not the Roblox profile, since the count is polled by every open tab
    async function requireUserId(req: Request, res: Response): Promise<number | undefined> {
        const userId = await authClient.getAuthenticatedUserId(req, res);
        if (userId === undefined) {
            res.status(401).json({ error: "You are not logged in" });
        }
        return userId;
    }

    router.get("/api/auth/inbox", rateLimiterMiddleware(0.5), async (req, res) => {
        const userId = await requireUserId(req, res);
        if (userId === undefined) return;
        res.status(200).json(await getInbox(globalsClient, authClient, userId));
    });

    // Polled by every open tab, so it's kept cheap: only counts, no rows or user info
    router.get("/api/auth/inbox/count", rateLimiterMiddleware(0.2), async (req, res) => {
        const userId = await requireUserId(req, res);
        if (userId === undefined) return;
        res.status(200).json({ unread: await getUnreadCount(globalsClient, userId) });
    });

    router.post("/api/auth/inbox/seen", rateLimiterMiddleware(0.5), async (req, res) => {
        const [error, input] = await markSeenValidator.tryValidate(req.body);
        if (error) {
            res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
            return;
        }
        const userId = await requireUserId(req, res);
        if (userId === undefined) return;
        await markInboxSeen(globalsClient, userId, Math.floor(input.upTo.getTime() / 1000));
        res.status(200).json({ success: true });
    });

    return router;
}
