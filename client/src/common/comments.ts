import { compareCommentIds, CommentReportReason, CommentSort, ReplayComment, ReplayComments } from "shared";

export const COMMENT_SORT_LABELS: Record<CommentSort, string> = {
    new: "Newest",
    old: "Oldest",
    top: "Most liked"
};

export const REPORT_REASON_LABELS: Record<CommentReportReason, string> = {
    hate: "Hate speech or slurs",
    harassment: "Harassment or bullying",
    spam: "Spam",
    other: "Something else"
};

/** 0:07, 1:23, 1:02:03 */
export function formatCommentTimestamp(seconds: number) {
    const whole = Math.max(0, Math.floor(seconds));
    const h = Math.floor(whole / 3600);
    const m = Math.floor((whole % 3600) / 60);
    const s = whole % 60;
    const ss = s.toString().padStart(2, "0");
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** The server's order for top-level comments. Removed comments are compared by their shown likes (0). */
function compareComments(a: ReplayComment, b: ReplayComment, sort: CommentSort) {
    switch (sort) {
        case "new":
            return compareCommentIds(b.id, a.id);
        case "old":
            return compareCommentIds(a.id, b.id);
        case "top":
            return b.likes - a.likes || compareCommentIds(b.id, a.id);
    }
}

function findTopLevel(data: ReplayComments, id: string) {
    return data.comments.findIndex((comment) => comment.id === id);
}

export function findComment(data: ReplayComments | null | undefined, id: string): ReplayComment | undefined {
    for (const comment of data?.comments ?? []) {
        if (comment.id === id) return comment;
        const reply = comment.replies.find((reply) => reply.id === id);
        if (reply) return reply;
    }
    return undefined;
}

/** Applies fn to the comment with this ID, wherever it is. */
export function updateComment(data: ReplayComments, id: string, fn: (comment: ReplayComment) => ReplayComment): ReplayComments {
    return {
        ...data,
        comments: data.comments.map((comment) => {
            if (comment.id === id) return fn(comment);
            if (!comment.replies.some((reply) => reply.id === id)) return comment;
            return { ...comment, replies: comment.replies.map((reply) => reply.id === id ? fn(reply) : reply) };
        })
    };
}

/**
 * Adds a comment, or replaces it if it's already there (it can arrive both from posting and from the live stream).
 * A new top-level comment goes where the sort puts it, without moving the others, so nothing jumps while reading.
 * Returns undefined for a reply whose parent isn't loaded, which needs a refetch.
 */
export function upsertComment(data: ReplayComments, comment: ReplayComment): ReplayComments | undefined {
    const existing = findComment(data, comment.id);
    if (existing) {
        // Keep what's specific to this viewer, which the stream doesn't know
        return updateComment(data, comment.id, (old) => ({ ...comment, liked: old.liked, reported: old.reported, replies: old.replies }));
    }

    if (comment.parentId !== undefined) {
        const parentIndex = findTopLevel(data, comment.parentId);
        if (parentIndex < 0) return undefined;
        const comments = [...data.comments];
        const parent = comments[parentIndex];
        comments[parentIndex] = { ...parent, replies: [...parent.replies, comment] };
        return { ...data, comments: comments };
    }

    const comments = [...data.comments];
    const index = comments.findIndex((other) => compareComments(comment, other, data.sort) < 0);
    comments.splice(index < 0 ? comments.length : index, 0, comment);
    return { ...data, comments: comments };
}

/**
 * Takes away a comment the viewer can no longer see. A top-level comment with replies stays as a placeholder, and a
 * placeholder goes once its last reply does.
 */
export function removeComment(data: ReplayComments, id: string): ReplayComments {
    const comments: ReplayComment[] = [];
    for (const comment of data.comments) {
        if (comment.id === id) {
            if (comment.replies.length > 0) {
                comments.push({
                    ...comment,
                    userId: 0,
                    username: "",
                    userThumb: undefined,
                    userRoles: undefined,
                    userCountry: undefined,
                    body: "",
                    status: "visible",
                    hiddenBy: undefined,
                    likes: 0,
                    liked: false,
                    reported: false,
                    removed: true
                });
            }
            continue;
        }

        const replies = comment.replies.filter((reply) => reply.id !== id);
        if (replies.length === comment.replies.length) {
            comments.push(comment);
        }
        else if (!(comment.removed && replies.length === 0)) {
            comments.push({ ...comment, replies: replies });
        }
    }
    return { ...data, comments: comments };
}

export function setLikeCounts(data: ReplayComments, likes: Map<string, number>): ReplayComments {
    const apply = (comment: ReplayComment) => {
        const count = likes.get(comment.id);
        return count === undefined ? comment : { ...comment, likes: count };
    };
    return {
        ...data,
        comments: data.comments.map((comment) => ({ ...apply(comment), replies: comment.replies.map(apply) }))
    };
}

/** Comments people can read, not counting removed placeholders. */
export function countComments(data: ReplayComments | null | undefined) {
    let count = 0;
    for (const comment of data?.comments ?? []) {
        if (!comment.removed) count++;
        count += comment.replies.length;
    }
    return count;
}

/** A comment on the seek bar, with its badges. */
export interface MarkerComment {
    comment: ReplayComment
    isRunner: boolean
    isOwn: boolean
}

/** The comments at one point on the seek bar. */
export interface CommentMarker {
    seconds: number
    // Oldest first
    comments: MarkerComment[]
}

/**
 * Where comments go on the seek bar: visible top-level comments with a timestamp, on the run the replay shows.
 * Comments at the same second share a marker.
 */
export function getCommentMarkers(data: ReplayComments | null | undefined, runnerId: number | undefined, viewerId: number | undefined): CommentMarker[] {
    const bySecond = new Map<number, MarkerComment[]>();
    for (const comment of data?.comments ?? []) {
        if (comment.replaySeconds === undefined || comment.removed || comment.status !== "visible" || comment.previousRun) continue;
        let comments = bySecond.get(comment.replaySeconds);
        if (!comments) {
            comments = [];
            bySecond.set(comment.replaySeconds, comments);
        }
        comments.push({
            comment: comment,
            isRunner: comment.userId === runnerId,
            isOwn: viewerId !== undefined && comment.userId === viewerId
        });
    }
    return Array.from(bySecond, ([seconds, comments]) => ({
        seconds: seconds,
        comments: comments.sort((a, b) => compareCommentIds(a.comment.id, b.comment.id))
    })).sort((a, b) => a.seconds - b.seconds);
}

/**
 * Merges markers that would be closer than minGap pixels on a seek bar this wide. A merged marker sits at its earliest
 * comment and has all of their comments in time order. Markers must be sorted by time.
 */
export function mergeCloseMarkers(markers: CommentMarker[], min: number, max: number, width: number, minGap: number): CommentMarker[] {
    if (width <= 0 || max <= min) return markers;
    const pixelsPerSecond = width / (max - min);
    const merged: CommentMarker[] = [];
    for (const marker of markers) {
        const last = merged.at(-1);
        if (last && (marker.seconds - last.seconds) * pixelsPerSecond < minGap) {
            merged[merged.length - 1] = { seconds: last.seconds, comments: [...last.comments, ...marker.comments] };
        }
        else {
            merged.push(marker);
        }
    }
    return merged;
}
