import { KeyboardEvent, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { commentLength, LoginUser, MAX_COMMENT_LENGTH, normalizeComment, ReplayComment } from "shared";
import { postReplayComment } from "../../../api/api";
import { formatCommentTimestamp } from "../../../common/comments";
import { PlaybackTime } from "../../playback/playbackTime";
import UserAvatar from "../../displays/UserAvatar";
import { dateTimeFormat } from "../../../common/datetime";

// Shown once the comment gets close to the limit
const COUNTER_FROM = MAX_COMMENT_LENGTH - 50;

/** The current playback time in whole seconds within the run, updating once a second rather than every frame. */
function usePlaybackSecond(playbackTime: PlaybackTime | undefined, duration: number) {
    const clamp = (time: number) => Math.min(Math.max(0, Math.floor(time)), Math.floor(duration));
    const [second, setSecond] = useState(() => playbackTime ? clamp(playbackTime.get()) : 0);
    useEffect(() => {
        if (!playbackTime) return;
        const update = (time: number) => setSecond(Math.min(Math.max(0, Math.floor(time)), Math.floor(duration)));
        update(playbackTime.get());
        return playbackTime.subscribe(update);
    }, [playbackTime, duration]);
    return second;
}

interface CommentComposerProps {
    timeId: string
    loginUser: LoginUser
    // Set for a reply
    replyTo?: ReplayComment
    // Set to offer a timestamp (top-level comments only)
    playbackTime?: PlaybackTime
    duration?: number
    autoFocus?: boolean
    onPosted: (comment: ReplayComment) => void
    onCancel?: () => void
}

function CommentComposer(props: CommentComposerProps) {
    const { timeId, loginUser, replyTo, playbackTime, duration, autoFocus, onPosted, onCancel } = props;
    const [text, setText] = useState("");
    const [focused, setFocused] = useState(false);
    const [pinnedSecond, setPinnedSecond] = useState<number | undefined>(undefined);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState("");

    const offerTimestamp = !replyTo && playbackTime !== undefined && duration !== undefined && duration > 0;
    const currentSecond = usePlaybackSecond(offerTimestamp ? playbackTime : undefined, duration ?? 0);

    // Counted the way the server does, after cleaning up the text
    const length = commentLength(normalizeComment(text));
    const tooLong = length > MAX_COMMENT_LENGTH;
    const canPost = length > 0 && !tooLong && !posting;
    // The buttons show while writing, and always for a reply
    const expanded = focused || text !== "" || replyTo !== undefined;

    const reset = () => {
        setText("");
        setPinnedSecond(undefined);
        setError("");
    };

    const submit = async () => {
        if (!canPost) return;
        setPosting(true);
        setError("");
        const result = await postReplayComment({
            timeId: timeId,
            body: text,
            replaySeconds: offerTimestamp ? pinnedSecond : undefined,
            parentId: replyTo?.id
        });
        setPosting(false);
        if (!result.ok) {
            setError(result.bannedUntil ? `${result.error} until ${dateTimeFormat.format(new Date(result.bannedUntil))}` : result.error);
            return;
        }
        reset();
        onPosted(result.data);
    };

    const onKeyDown = (event: KeyboardEvent) => {
        // Enter alone makes a new line
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            submit();
        }
        else if (event.key === "Escape" && replyTo) {
            onCancel?.();
        }
    };

    const placeholder = replyTo ? `Reply to @${replyTo.username}...` : "Add a comment...";
    const avatarSize = replyTo ? 24 : 32;

    return (
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <UserAvatar username={loginUser.username} userThumb={loginUser.thumbnailUrl} sx={{ width: avatarSize, height: avatarSize, mt: 0.5 }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <TextField
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    multiline
                    maxRows={6}
                    fullWidth
                    variant="standard"
                    disabled={posting}
                    error={tooLong}
                    slotProps={{ htmlInput: { "aria-label": placeholder } }}
                />
                {expanded &&
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {offerTimestamp &&
                    (pinnedSecond !== undefined ?
                    <Tooltip title="This comment will link to this point in the run" disableInteractive>
                        <Chip
                            size="small"
                            color="secondary"
                            icon={<AccessTimeIcon />}
                            label={`at ${formatCommentTimestamp(pinnedSecond)}`}
                            onDelete={() => setPinnedSecond(undefined)}
                            // Keep focus in the text box, so the buttons don't disappear before the click lands
                            onMouseDown={(event) => event.preventDefault()}
                        />
                    </Tooltip>
                    :
                    <Tooltip title="Link this comment to the current point in the run" disableInteractive>
                        <Chip
                            size="small"
                            variant="outlined"
                            icon={<AccessTimeIcon />}
                            label={`Add ${formatCommentTimestamp(currentSecond)}`}
                            onClick={() => setPinnedSecond(currentSecond)}
                            onMouseDown={(event) => event.preventDefault()}
                        />
                    </Tooltip>)}
                    {length >= COUNTER_FROM &&
                    <Typography variant="caption" sx={{ color: tooLong ? "error.main" : "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                        {length}/{MAX_COMMENT_LENGTH}
                    </Typography>}
                    <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                        <Button
                            size="small"
                            color="inherit"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                reset();
                                onCancel?.();
                                (document.activeElement as HTMLElement | null)?.blur();
                            }}>
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            disabled={!canPost}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={submit}>
                            {replyTo ? "Reply" : "Comment"}
                        </Button>
                    </Box>
                </Box>}
                {error !== "" &&
                <Typography variant="body2" role="alert" sx={{ color: "error.main", mt: 0.75 }}>
                    {error}
                </Typography>}
            </Box>
        </Box>
    );
}

export default CommentComposer;
