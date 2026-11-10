import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox as InboxData, INBOX_DAYS } from "shared";
import { login, markInboxSeen } from "../api/api";
import { queries } from "../api/queries";
import { isUnread, useInboxCount } from "../common/inbox";
import { useLoginUser } from "../common/states";
import InboxItemCard from "./inbox/InboxItemCard";
import { LoadFailed, Loading } from "./moderation/common";

function InboxList(props: { userId: number }) {
    const { userId } = props;
    const queryClient = useQueryClient();
    const inboxQuery = useQuery(queries.inbox.items(userId));
    const data = inboxQuery.data;

    // The badge keeps checking for new items, and the menu can't open the inbox while it's already open, so when the
    // badge goes up, the list loads them
    const unread = useInboxCount(userId);
    const lastUnread = useRef(unread);
    useEffect(() => {
        if (unread > lastUnread.current) {
            queryClient.invalidateQueries({ queryKey: queries.inbox.items(userId).queryKey });
        }
        lastUnread.current = unread;
    }, [unread, userId, queryClient]);

    // What was unread when the page opened stays highlighted until the user leaves, even though it's marked read
    // right away. Later refetches (on focus) only add highlights for what came in since.
    const [seenAt, setSeenAt] = useState<{ value: string | undefined } | undefined>(undefined);
    const markedUpTo = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!data) return;
        if (seenAt === undefined) {
            setSeenAt({ value: data.seenAt });
        }

        const newest = data.items[0]?.at;
        if (newest === undefined || (data.seenAt !== undefined && Date.parse(newest) <= Date.parse(data.seenAt))) return;
        if (markedUpTo.current !== undefined && Date.parse(newest) <= Date.parse(markedUpTo.current)) return;
        markedUpTo.current = newest;
        markInboxSeen(newest).then((result) => {
            if (!result.ok) {
                // Try again on the next refetch
                if (markedUpTo.current === newest) markedUpTo.current = undefined;
                return;
            }
            // The cached inbox too, or coming back to the page would start from the old seenAt and show these as
            // unread again. This page's highlights don't change, since they come from seenAt in state.
            queryClient.setQueryData<InboxData | null>(queries.inbox.items(userId).queryKey, (old) =>
                old && (old.seenAt === undefined || Date.parse(old.seenAt) < Date.parse(newest)) ? { ...old, seenAt: newest } : old);
            // The badge in the account menu
            queryClient.invalidateQueries({ queryKey: queries.inbox.count(userId).queryKey });
        });
    }, [data, seenAt, userId, queryClient]);

    if (inboxQuery.isPending) return <Loading />;
    if (!data) return <LoadFailed what="your inbox" query={inboxQuery} />;

    if (data.items.length === 0) {
        return (
            <Typography sx={{ color: "text.secondary", p: 1 }}>
                Nothing yet. When people comment on or react to your runs, or reply to and like your comments, it'll show
                up here.
            </Typography>
        );
    }

    const baseline = seenAt ? seenAt.value : data.seenAt;
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {data.items.map((item) => (
                <InboxItemCard
                    key={`${item.type}:${item.type === "reactions" ? item.replay.timeId : item.comment.id}`}
                    item={item}
                    unread={isUnread(item, baseline)}
                    viewerId={userId}
                />
            ))}
            <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", pt: 1.5 }}>
                Inbox shows the last {INBOX_DAYS} days.
            </Typography>
        </Box>
    );
}

function Inbox() {
    const loginUserQuery = useLoginUser();
    const user = loginUserQuery.data;

    useEffect(() => {
        document.title = "inbox - strafes";
    }, []);

    const onLogin = async () => {
        const url = await login(window.location.pathname.slice(1) + window.location.search);
        if (url) window.location.href = url; // Force external redirect
    };

    return (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1, flexGrow: 1, pt: { xs: 0.5, sm: 2 } }}>
            <Paper elevation={0} sx={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "720px", p: { xs: 1, sm: 2.5 } }}>
                <Typography component="h1" variant="h5" sx={{ p: 1, mb: 1 }}>
                    Inbox
                </Typography>
                {loginUserQuery.isPending ? <Loading />
                : !user ?
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1 }}>
                    <Typography sx={{ color: "text.secondary" }}>Log in to see your inbox.</Typography>
                    <Button size="small" variant="outlined" onClick={onLogin}>Log in</Button>
                </Box>
                :
                <InboxList userId={user.userId} />}
            </Paper>
        </Box>
    );
}

export default Inbox;
