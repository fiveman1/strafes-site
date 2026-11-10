import { ResultSetHeader, RowDataPacket } from "mysql2";
import { CommentModerationAction, CommentModerator, CommentRole, UserRole } from "shared";
import { GlobalsClient } from "../globals.js";
import { setMissingUsernames } from "../users.js";
import { unixToISO } from "../util.js";
import { loadUsersToRoles, peekUsersToRoles } from "../roles.js";

// Staff roles in the Roblox Bhoppers group that can moderate comments without being added on the site
const MODERATOR_GROUP_ROLES: ReadonlySet<UserRole> = new Set([
    UserRole.ChatMod,
    UserRole.InGameMod,
    UserRole.InGameHeadMod,
    UserRole.Dev,
    UserRole.GameCreator
]);

// Comma separated Roblox user IDs that are always admins, so nobody can lock everyone out from the site
const CONFIG_ADMIN_IDS: ReadonlySet<number> = new Set(
    (process.env.COMMENT_ADMIN_IDS ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => /^\d+$/.test(id))
        .map((id) => +id)
);

const ROLE_WEIGHT: Record<CommentRole, number> = {
    moderator: 1,
    admin: 2
};

export function hasRole(role: CommentRole | undefined, needed: CommentRole) {
    return role !== undefined && ROLE_WEIGHT[role] >= ROLE_WEIGHT[needed];
}

export function isConfigAdmin(userId: number) {
    return CONFIG_ADMIN_IDS.has(userId);
}

async function hasModeratorGroupRole(userId: number, wait: boolean) {
    const roles = wait ? await loadUsersToRoles(MODERATOR_GROUP_ROLES) : peekUsersToRoles();
    return roles.get(userId)?.some((role) => MODERATOR_GROUP_ROLES.has(role)) ?? false;
}

interface GrantedRoleSQL {
    role: CommentRole
}
type GrantedRoleRow = GrantedRoleSQL & RowDataPacket;

async function getGrantedRole(client: GlobalsClient, userId: number): Promise<CommentRole | undefined> {
    const query = `SELECT role FROM comment_moderators WHERE user_id = ?;`;
    const [[row]] = await client.pool.execute<GrantedRoleRow[]>(query, [userId]);
    return row?.role;
}

/**
 * The user's comment moderation role, from any source, or undefined if they can't moderate.
 *
 * If the Roblox group roles haven't loaded since the server started, by default this waits a moment for them, then
 * throws RolesUnavailableError rather than guess. With wait false, it goes by what's loaded, which can miss a group
 * moderator right after a restart. That's for where it only changes what's shown, not what they can do.
 */
export async function getCommentRole(client: GlobalsClient, userId: number, options: { wait?: boolean } = {}): Promise<CommentRole | undefined> {
    if (isConfigAdmin(userId)) {
        return "admin";
    }

    const granted = await getGrantedRole(client, userId);
    // The group only makes someone a moderator, which a granted role already covers
    if (granted) {
        return granted;
    }
    return await hasModeratorGroupRole(userId, options.wait ?? true) ? "moderator" : undefined;
}

interface ModeratorSQL {
    user_id: string
    role: CommentRole
    granted_by: string
    granted_at: number
}
type ModeratorRow = ModeratorSQL & RowDataPacket;

interface UsernameSQL {
    user_id: string
    username: string
}
type UsernameRow = UsernameSQL & RowDataPacket;

/** Everyone who can moderate comments, with the source that gives them the highest role. */
export async function listModerators(client: GlobalsClient): Promise<CommentModerator[]> {
    const moderators = new Map<number, CommentModerator>();
    const add = (moderator: CommentModerator) => {
        const existing = moderators.get(moderator.user.userId);
        if (!existing || ROLE_WEIGHT[moderator.role] > ROLE_WEIGHT[existing.role]) {
            moderators.set(moderator.user.userId, moderator);
        }
    };

    for (const userId of CONFIG_ADMIN_IDS) {
        add({ user: { userId: userId }, role: "admin", source: "config" });
    }

    const groupRoles = await loadUsersToRoles(MODERATOR_GROUP_ROLES);
    for (const [userId, roles] of groupRoles) {
        if (roles.some((role) => MODERATOR_GROUP_ROLES.has(role))) {
            add({ user: { userId: userId }, role: "moderator", source: "group" });
        }
    }

    const query = `SELECT user_id, role, granted_by, UNIX_TIMESTAMP(granted_at) AS granted_at FROM comment_moderators;`;
    const [rows] = await client.pool.execute<ModeratorRow[]>(query);
    for (const row of rows) {
        add({
            user: { userId: +row.user_id },
            role: row.role,
            source: "granted",
            grantedBy: +row.granted_by,
            grantedAt: unixToISO(row.granted_at)
        });
    }

    const result = Array.from(moderators.values());
    if (result.length > 0) {
        const usernameQuery = `SELECT user_id, username FROM users WHERE user_id IN (?);`;
        const [usernameRows] = await client.pool.query<UsernameRow[]>(usernameQuery, [result.map((moderator) => moderator.user.userId)]);
        const usernames = new Map(usernameRows.map((row) => [+row.user_id, row.username]));
        for (const moderator of result) {
            moderator.user.username = usernames.get(moderator.user.userId);
        }
        // Before sorting by name
        await setMissingUsernames(result.map((moderator) => moderator.user));
    }

    result.sort((a, b) => ROLE_WEIGHT[b.role] - ROLE_WEIGHT[a.role] || (a.user.username ?? "").localeCompare(b.user.username ?? ""));
    return result;
}

export async function grantModerator(client: GlobalsClient, actorId: number, userId: number, role: CommentRole) {
    const query = `INSERT INTO comment_moderators (user_id, role, granted_by) VALUES (?, ?, ?) AS new
        ON DUPLICATE KEY UPDATE role = new.role, granted_by = new.granted_by, granted_at = CURRENT_TIMESTAMP;`;
    await client.pool.execute(query, [userId, role, actorId]);
    await logModerationAction(client, actorId, "grant_mod", { targetUserId: userId, reason: role });
}

/** Removes a moderator added on the site. Returns false if they weren't one. */
export async function revokeModerator(client: GlobalsClient, actorId: number, userId: number) {
    const query = `DELETE FROM comment_moderators WHERE user_id = ?;`;
    const [result] = await client.pool.execute<ResultSetHeader>(query, [userId]);
    if (result.affectedRows === 0) {
        return false;
    }
    await logModerationAction(client, actorId, "revoke_mod", { targetUserId: userId });
    return true;
}

export async function logModerationAction(
    client: GlobalsClient,
    actorId: number,
    action: CommentModerationAction,
    details: { commentId?: string, targetUserId?: number, reason?: string }
) {
    const query = `INSERT INTO comment_moderation_log (actor_id, action, comment_id, target_user_id, reason) VALUES (?, ?, ?, ?, ?);`;
    await client.pool.execute(query, [actorId, action, details.commentId ?? null, details.targetUserId ?? null, details.reason ?? null]);
}
