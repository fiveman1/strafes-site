import { CommentExcerpt, CommentReplay, ReplayReaction, UserRef } from "./interfaces";

// How far back the inbox goes
export const INBOX_DAYS = 30;
// Most items the inbox shows, newest first
export const MAX_INBOX_ITEMS = 100;
// How many people are named on a grouped item (reactions, likes); the rest are only counted
export const MAX_INBOX_GROUP_USERS = 3;

interface InboxItemBase {
    // When it happened; for a group, its newest entry
    at: string
    replay: CommentReplay
}

/** A top-level comment on one of your runs. */
export interface InboxCommentItem extends InboxItemBase {
    type: "comment"
    comment: CommentExcerpt
}

/** A reply to one of your comments, or in a thread you started. */
export interface InboxReplyItem extends InboxItemBase {
    type: "reply"
    comment: CommentExcerpt
    // The comment it answered: yours, or someone else's in your thread
    repliedTo: CommentExcerpt
}

/** Reactions on one of your runs from the last INBOX_DAYS, grouped. */
export interface InboxReactionsItem extends InboxItemBase {
    type: "reactions"
    // In display order
    reactions: { reaction: ReplayReaction, count: number }[]
    // Newest first, up to MAX_INBOX_GROUP_USERS
    users: UserRef[]
    userCount: number
}

/** Likes on one of your comments from the last INBOX_DAYS, grouped. */
export interface InboxLikesItem extends InboxItemBase {
    type: "likes"
    comment: CommentExcerpt
    // Newest first, up to MAX_INBOX_GROUP_USERS
    users: UserRef[]
    userCount: number
}

/** A moderator hid one of your comments. The reason isn't included, since moderators write it for each other. */
export interface InboxHiddenItem extends InboxItemBase {
    type: "hidden"
    comment: CommentExcerpt
}

export type InboxItem = InboxCommentItem | InboxReplyItem | InboxReactionsItem | InboxLikesItem | InboxHiddenItem;
export type InboxItemType = InboxItem["type"];

export interface Inbox {
    items: InboxItem[]
    // Items after this are unread. Unset if the user has never opened the inbox.
    seenAt?: string
}

export interface InboxCount {
    unread: number
}
