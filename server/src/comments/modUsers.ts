import { CommentModerationLogEntry, ModComment, ModUser } from "shared";
import { AuthClient } from "../auth.js";
import { setMissingUsernames, setUserInfoForList } from "../users.js";

export function modCommentUsers(comment: ModComment): ModUser[] {
    return [comment.author, comment.runner, ...comment.reports.map((report) => report.reporter)];
}

export function logEntryUsers(entry: CommentModerationLogEntry): ModUser[] {
    return [entry.actor, ...(entry.target ? [entry.target] : []), ...(entry.comment ? modCommentUsers(entry.comment) : [])];
}

/**
 * Fills in thumbnails, role colors, and countries for everyone shown in the moderation portal, and usernames for
 * anyone the site hasn't saved one for (like group staff who've never used the site).
 */
export async function setModUserInfo(authClient: AuthClient, users: ModUser[]) {
    await Promise.all([setUserInfoForList(authClient, users), setMissingUsernames(users)]);
}
