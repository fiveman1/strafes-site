import { CommentModerationLogEntry, ModComment, UserRef } from "shared";

export function modCommentUsers(comment: ModComment): UserRef[] {
    return [
        comment.author,
        comment.replay.runner,
        ...(comment.repliedTo ? [comment.repliedTo.author] : []),
        ...comment.reports.map((report) => report.reporter)
    ];
}

export function logEntryUsers(entry: CommentModerationLogEntry): UserRef[] {
    return [entry.actor, ...(entry.target ? [entry.target] : []), ...(entry.comment ? modCommentUsers(entry.comment) : [])];
}
