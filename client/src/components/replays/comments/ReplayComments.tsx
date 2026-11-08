import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COMMENT_SORTS, CommentSort, DEFAULT_COMMENT_SORT, LoginUser, Replay, ReplayComment, ReplayCommentLikes, ReplayCommentRemoved, ReplayComments as ReplayCommentsData } from "shared";
import { deleteReplayComment, login, setReplayCommentHidden, setReplayCommentLike } from "../../../api/api";
import { queries } from "../../../api/queries";
import { useReplayStream } from "../../../api/replayStream";
import { COMMENT_SORT_LABELS, countComments, findComment, removeComment, setLikeCounts, updateComment, upsertComment } from "../../../common/comments";
import { useLoginUser } from "../../../common/states";
import { PlaybackTime } from "../../playback/playbackTime";
import CommentComposer from "./CommentComposer";
import CommentItem, { CommentActions, CommentViewer } from "./CommentItem";
import ReportDialog from "./ReportDialog";

// Lines the replies up with the text of the comment above: avatar (32px) + gap (12px)
const REPLY_INDENT = "44px";

interface ReplyTarget {
    // The top-level comment the reply goes under
    threadId: string
    comment: ReplayComment
}

interface ReplayCommentsProps {
    replay: Replay
    loginUser: LoginUser | undefined
    playbackTime: PlaybackTime
    // Length of the run in seconds, for timestamps
    duration: number
    onSeek: (seconds: number) => void
    sx?: SxProps<Theme>
}

function ReplayComments(props: ReplayCommentsProps) {
    const { replay, loginUser, playbackTime, duration, onSeek, sx } = props;
    const timeId = replay.id;
    const userId = loginUser?.userId;
    const queryClient = useQueryClient();
    const commentRole = useLoginUser().data?.commentRole;

    const [sort, setSort] = useState<CommentSort>(DEFAULT_COMMENT_SORT);
    const commentsQuery = useQuery({
        ...queries.replays.comments(timeId, userId, sort),
        // While another sort loads, keep showing the last one (same replay and viewer only), so the count and the list
        // don't blank out. The key is ["replays", "comments", timeId, userId, sort].
        placeholderData: (previous, previousQuery) =>
            previousQuery?.queryKey[2] === timeId && previousQuery.queryKey[3] === userId ? previous : undefined
    });
    const data = commentsQuery.data;
    const loadingSort = commentsQuery.isPlaceholderData;

    const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
    const [replyTarget, setReplyTarget] = useState<ReplyTarget | undefined>(undefined);
    const [reportTarget, setReportTarget] = useState<ReplayComment | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<ReplayComment | undefined>(undefined);
    const [loginAnchor, setLoginAnchor] = useState<HTMLElement | null>(null);
    const [message, setMessage] = useState("");

    // Comments with a like request in flight, whose counts from the live stream would be out of order
    const pendingLikes = useRef(new Set<string>());
    // The stream's first open comes right after the page's own fetch, so only later ones (reconnects) refetch
    const streamOpened = useRef(false);

    // Every sort's copy for this replay and viewer. The player's seek bar reads one that may not be the list's sort.
    const allSortsKey = [...queries.replays.comments._def, timeId, userId];

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: allSortsKey });
    };

    /** Changes the comments in every sort's copy. Where fn gives up (returns undefined), that copy is fetched again. */
    const updateData = (fn: (data: ReplayCommentsData) => ReplayCommentsData | undefined) => {
        for (const [key, current] of queryClient.getQueriesData<ReplayCommentsData | null>({ queryKey: allSortsKey })) {
            if (!current) continue;
            const result = fn(current);
            if (result) {
                queryClient.setQueryData(key, result);
            }
            else {
                queryClient.invalidateQueries({ queryKey: key });
            }
        }
    };

    useReplayStream(timeId, {
        comment: (raw) => {
            const comment = JSON.parse(raw) as ReplayComment;
            updateData((current) => upsertComment(current, comment));
        },
        comment_removed: (raw) => {
            const removed = JSON.parse(raw) as ReplayCommentRemoved;
            const copies = queryClient.getQueriesData<ReplayCommentsData | null>({ queryKey: allSortsKey });
            const existing = copies.map(([, copy]) => findComment(copy, removed.commentId)).find((comment) => comment !== undefined);
            if (!existing) return;
            if (existing.userId === userId || commentRole !== undefined || (userId !== undefined && userId === replay.userId)) {
                // They can still see it, now with a label, which only the server knows
                refetch();
            }
            else {
                updateData((data) => removeComment(data, removed.commentId));
            }
        },
        comment_likes: (raw) => {
            const update = JSON.parse(raw) as ReplayCommentLikes;
            const likes = new Map(update.likes
                .filter((entry) => !pendingLikes.current.has(entry.commentId))
                .map((entry) => [entry.commentId, entry.likes]));
            if (likes.size > 0) {
                updateData((data) => setLikeCounts(data, likes));
            }
        }
    }, () => {
        if (streamOpened.current) refetch();
        streamOpened.current = true;
    });

    const expand = (threadId: string) => {
        setExpanded((old) => old.has(threadId) ? old : new Set(old).add(threadId));
    };
    const toggleExpanded = (threadId: string) => {
        setExpanded((old) => {
            const next = new Set(old);
            if (!next.delete(threadId)) next.add(threadId);
            return next;
        });
    };

    const onPosted = (comment: ReplayComment) => {
        updateData((current) => upsertComment(current, comment));
        if (comment.parentId !== undefined) {
            expand(comment.parentId);
            setReplyTarget(undefined);
        }
    };

    const onLogin = async () => {
        const url = await login(window.location.pathname.slice(1) + window.location.search);
        if (url) window.location.href = url; // Force external redirect
    };

    const actions: CommentActions = {
        onSeek: onSeek,
        onLoginNeeded: setLoginAnchor,
        onLike: async (comment) => {
            if (pendingLikes.current.has(comment.id)) return;
            const active = !comment.liked;
            pendingLikes.current.add(comment.id);
            updateData((current) => updateComment(current, comment.id, (old) => ({ ...old, liked: active, likes: old.likes + (active ? 1 : -1) })));
            const result = await setReplayCommentLike(comment.id, active);
            pendingLikes.current.delete(comment.id);
            if (result.ok) {
                updateData((current) => updateComment(current, comment.id, (old) => ({ ...old, liked: result.data.liked, likes: result.data.likes })));
            }
            else {
                updateData((current) => updateComment(current, comment.id, (old) => ({ ...old, liked: comment.liked, likes: comment.likes })));
                setMessage(result.error);
            }
        },
        onReply: (comment) => {
            const threadId = comment.parentId ?? comment.id;
            expand(threadId);
            setReplyTarget({ threadId: threadId, comment: comment });
        },
        onReport: setReportTarget,
        onDelete: setDeleteTarget,
        onSetHidden: async (comment, hidden) => {
            const result = await setReplayCommentHidden(comment.id, hidden);
            if (!result.ok) {
                setMessage(result.error);
                return;
            }
            setMessage(hidden ? "Comment hidden" : comment.status === "pending" ? "Comment approved" : "Comment unhidden");
            refetch();
        }
    };

    const confirmDelete = async () => {
        const comment = deleteTarget;
        setDeleteTarget(undefined);
        if (!comment) return;
        const result = await deleteReplayComment(comment.id);
        if (!result.ok) {
            setMessage(result.error);
            return;
        }
        updateData((current) => removeComment(current, comment.id));
        setMessage("Comment deleted");
    };

    const viewer: CommentViewer = {
        userId: userId,
        role: commentRole,
        isRunner: userId !== undefined && userId === replay.userId
    };

    const count = countComments(data);
    const comments = data?.comments ?? [];

    const renderItem = (comment: ReplayComment, isReply: boolean) => (
        <CommentItem
            key={comment.id}
            comment={comment}
            isReply={isReply}
            runnerId={replay.userId}
            game={replay.game}
            style={replay.style}
            viewer={viewer}
            actions={actions}
        />
    );

    return (
        <Box component="section" aria-labelledby="comments-heading" sx={{ display: "flex", flexDirection: "column", gap: 2, ...sx }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography id="comments-heading" variant="h6" component="h2">
                    {data ? (count === 1 ? "1 comment" : `${count} comments`) : "Comments"}
                </Typography>
                <TextField
                    select
                    size="small"
                    variant="standard"
                    value={sort}
                    onChange={(event) => setSort(event.target.value as CommentSort)}
                    // On the element screen readers announce as the dropdown, not the hidden input behind it
                    slotProps={{ select: { SelectDisplayProps: { "aria-label": "Sort comments" } } }}
                    sx={{ minWidth: 110 }}>
                    {COMMENT_SORTS.map((key) => (
                        <MenuItem key={key} value={key}>{COMMENT_SORT_LABELS[key]}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {loginUser ?
            <CommentComposer
                timeId={timeId}
                loginUser={loginUser}
                playbackTime={playbackTime}
                duration={duration}
                onPosted={onPosted}
            />
            :
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Log in to comment on this run</Typography>
                <Button size="small" variant="outlined" onClick={onLogin}>Log in</Button>
            </Box>}

            {commentsQuery.isPending ?
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={28} />
            </Box>
            : !data ?
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Couldn't load comments</Typography>
                <Button size="small" onClick={refetch}>Try again</Button>
            </Box>
            : comments.length === 0 ?
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No comments yet.
            </Typography>
            :
            <Box
                aria-busy={loadingSort}
                sx={{ display: "flex", flexDirection: "column", gap: 2, opacity: loadingSort ? 0.6 : 1, transition: "opacity .15s ease" }}>
                {comments.map((comment) => {
                    const isExpanded = expanded.has(comment.id);
                    const replyCount = comment.replies.length;
                    const replying = replyTarget?.threadId === comment.id && loginUser;
                    return (
                        <Box key={comment.id}>
                            {renderItem(comment, false)}
                            {(replyCount > 0 || replying) &&
                            <Box sx={{ pl: REPLY_INDENT, display: "flex", flexDirection: "column", gap: 1 }}>
                                {replyCount > 0 &&
                                <Button
                                    size="small"
                                    onClick={() => toggleExpanded(comment.id)}
                                    startIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    sx={{ alignSelf: "flex-start", ml: -0.75 }}>
                                    {replyCount === 1 ? "1 reply" : `${replyCount} replies`}
                                </Button>}
                                {isExpanded && comment.replies.map((reply) => renderItem(reply, true))}
                                {replying &&
                                <CommentComposer
                                    // A new box for each comment replied to, so a draft doesn't carry over
                                    key={replyTarget.comment.id}
                                    timeId={timeId}
                                    loginUser={loginUser}
                                    replyTo={replyTarget.comment}
                                    autoFocus
                                    onPosted={onPosted}
                                    onCancel={() => setReplyTarget(undefined)}
                                />}
                            </Box>}
                        </Box>
                    );
                })}
            </Box>}

            <ReportDialog
                comment={reportTarget}
                onClose={() => setReportTarget(undefined)}
                onReported={(comment) => {
                    updateData((current) => updateComment(current, comment.id, (old) => ({ ...old, reported: true })));
                    setMessage("Thanks for the report. A moderator will take a look.");
                }}
            />

            <Dialog open={deleteTarget !== undefined} onClose={() => setDeleteTarget(undefined)}>
                <DialogTitle>Delete comment?</DialogTitle>
                <DialogContent>
                    <DialogContentText>This can't be undone.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={() => setDeleteTarget(undefined)}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Popover
                open={loginAnchor !== null}
                anchorEl={loginAnchor}
                onClose={() => setLoginAnchor(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                slotProps={{ paper: { sx: { mt: -0.75 } } }}>
                <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">Log in to like and reply to comments</Typography>
                    <Button variant="contained" size="small" onClick={onLogin}>Log in</Button>
                </Box>
            </Popover>

            <Snackbar
                open={message !== ""}
                message={message}
                autoHideDuration={4000}
                onClose={(_event, reason) => reason !== "clickaway" && setMessage("")}
            />
        </Box>
    );
}

export default ReplayComments;
