import AsyncLock from "async-lock";
import { RowDataPacket } from "mysql2";
import { allReplayReactions, LoginUser, MAX_REACTIONS_PER_USER, ReplayReaction, ReplayReactionCount, ReplayReactions } from "shared";
import { GlobalsClient } from "./globals.js";

// How many usernames to send per reaction, for the "reacted by" tooltip
const MAX_REACTION_USERS = 10;

interface ReactionCountSQL {
    reaction: string
    count: string
}
type ReactionCountRow = ReactionCountSQL & RowDataPacket;

interface ReactionSQL {
    reaction: string
}
type ReactionRow = ReactionSQL & RowDataPacket;

interface ReactionUserSQL {
    reaction: string
    username: string | null
}
type ReactionUserRow = ReactionUserSQL & RowDataPacket;

export async function getReactionsForReplay(client: GlobalsClient, timeId: string, userId: number | undefined): Promise<ReplayReactions> {
    const countsQuery = `SELECT reaction, COUNT(*) AS count FROM replay_reactions WHERE time_id = ? GROUP BY reaction;`;
    const countsPromise = client.pool.execute<ReactionCountRow[]>(countsQuery, [timeId]);

    const mineQuery = `SELECT reaction FROM replay_reactions WHERE time_id = ? AND user_id = ?;`;
    const minePromise = userId !== undefined ? client.pool.execute<ReactionRow[]>(mineQuery, [timeId, userId]) : undefined;

    // LEFT JOIN so a reactor missing from the users table is still counted, just not named
    const usersQuery = `
        SELECT reaction, username FROM (
            SELECT
                r.reaction,
                u.username,
                ROW_NUMBER() OVER (PARTITION BY r.reaction ORDER BY r.created_at, r.user_id) AS rn
            FROM
                replay_reactions r
            LEFT JOIN
                users u ON u.user_id = r.user_id
            WHERE
                r.time_id = ?
        ) ranked
        WHERE rn <= ${MAX_REACTION_USERS}
        ORDER BY reaction, rn
    ;`;
    const usersPromise = client.pool.execute<ReactionUserRow[]>(usersQuery, [timeId]);

    const [[countRows], mineResult, [userRows]] = await Promise.all([countsPromise, minePromise, usersPromise]);

    const mine = new Set<string>(mineResult ? mineResult[0].map((row) => row.reaction) : []);

    const usersByReaction = new Map<string, string[]>();
    for (const row of userRows) {
        if (row.username === null) continue;
        let users = usersByReaction.get(row.reaction);
        if (!users) {
            users = [];
            usersByReaction.set(row.reaction, users);
        }
        users.push(row.username);
    }

    const countByReaction = new Map<string, number>();
    for (const row of countRows) {
        countByReaction.set(row.reaction, +row.count);
    }

    // Keep the display order from REPLAY_REACTIONS, and drop any keys that are no longer in it
    const reactions: ReplayReactionCount[] = [];
    for (const reaction of allReplayReactions) {
        const count = countByReaction.get(reaction);
        if (!count) continue;
        reactions.push({
            reaction: reaction,
            count: count,
            reacted: mine.has(reaction),
            users: usersByReaction.get(reaction) ?? []
        });
    }

    return {
        timeId: timeId,
        reactions: reactions
    };
}

// One change at a time per user per replay, so parallel requests can't each see room under the limit and all insert
const reactionLock = new AsyncLock();

/** Returns undefined if the user already has the most reactions allowed on this replay. */
export async function setReactionForReplay(client: GlobalsClient, timeId: string, user: LoginUser, reaction: ReplayReaction, active: boolean): Promise<ReplayReactions | undefined> {
    const added = await reactionLock.acquire(`${timeId}:${user.userId}`, async () => {
        if (!active) {
            const query = `DELETE FROM replay_reactions WHERE time_id = ? AND user_id = ? AND reaction = ?;`;
            await client.pool.execute(query, [timeId, user.userId, reaction]);
            return true;
        }

        const mineQuery = `SELECT reaction FROM replay_reactions WHERE time_id = ? AND user_id = ?;`;
        const [mine] = await client.pool.execute<ReactionRow[]>(mineQuery, [timeId, user.userId]);
        if (mine.some((row) => row.reaction === reaction)) {
            // Already added, nothing to do
            return true;
        }
        if (mine.length >= MAX_REACTIONS_PER_USER) {
            return false;
        }

        // Make sure the reactor has a row in the users table with their current username from Roblox
        if (user.username) {
            await client.upsertUser(user.userId, user.username);
        }

        const query = `INSERT INTO replay_reactions (time_id, user_id, reaction) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reaction = reaction;`;
        await client.pool.execute(query, [timeId, user.userId, reaction]);
        return true;
    });

    if (!added) {
        return undefined;
    }

    return await getReactionsForReplay(client, timeId, user.userId);
}
