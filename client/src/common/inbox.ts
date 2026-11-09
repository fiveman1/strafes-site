import { useQuery } from "@tanstack/react-query";
import { InboxItem } from "shared";
import { queries } from "../api/queries";

// How often an open tab checks for new inbox items. Paused while the tab is in the background.
const INBOX_POLL_MS = 75 * 1000;

/** Unread inbox items for the logged in user, kept up to date while the tab is open. */
export function useInboxCount(userId: number | undefined) {
    const query = useQuery({
        ...queries.inbox.count(userId),
        enabled: userId !== undefined,
        refetchInterval: INBOX_POLL_MS
    });
    return query.data?.unread ?? 0;
}

/** Where an item goes when clicked: the replay, opened to the comment when there is one. */
export function inboxItemLink(item: InboxItem) {
    const replay = `/replays/${item.replay.timeId}`;
    return item.type === "reactions" ? replay : `${replay}?comment=${item.comment.id}`;
}

export function isUnread(item: InboxItem, seenAt: string | undefined) {
    return seenAt === undefined || Date.parse(item.at) > Date.parse(seenAt);
}
