import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useOutletContext } from "react-router";
import { CommentExcerpt, CommentReplay, formatCourse, formatGame, formatStyle, formatTime } from "shared";
import { ContextParams, getGameColor, getStyleColor } from "../../common/common";
import { formatCommentTimestamp } from "../../common/comments";
import ColorChip from "./ColorChip";
import MapThumb from "./MapThumb";
import UserRefLink from "./UserRefLink";

// A comment shown outside its replay, in the inbox and the mod portal: its text, what it replied to, and the replay
// it's on, all laid out the same way in both.

interface CommentTextProps {
    comment: Pick<CommentExcerpt, "body" | "replaySeconds">
    muted?: boolean
    // Cuts the text off after this many lines. Unset shows all of it, which moderators need.
    maxLines?: number
    // On a shaded background, to set it apart from what's around it (like the reports in the mod portal)
    shaded?: boolean
    // Makes the text a link (to the comment on its replay)
    to?: string
}

function CommentText(props: CommentTextProps) {
    const { comment, muted, maxLines, shaded, to } = props;

    const text = (
        <Typography
            variant="body2"
            sx={{
                color: muted ? "text.secondary" : "text.primary",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                ...(maxLines !== undefined && {
                    display: "-webkit-box",
                    WebkitLineClamp: maxLines,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                })
            }}>
            {comment.replaySeconds !== undefined &&
            <Box component="span" sx={{ color: "secondary.main", fontWeight: 600, mr: 0.75, fontVariantNumeric: "tabular-nums" }}>
                {formatCommentTimestamp(comment.replaySeconds)}
            </Box>}
            {comment.body}
        </Typography>
    );

    const shadedSx = shaded ? { bgcolor: "action.hover", borderRadius: "8px", px: 1.5, py: 1 } : {};
    if (to === undefined) {
        return <Box sx={shadedSx}>{text}</Box>;
    }
    return (
        <Link
            component={RouterLink}
            to={to}
            underline="none"
            color="inherit"
            sx={{
                display: "block",
                borderRadius: "8px",
                transition: "background-color 150ms ease",
                ...shadedSx,
                "&:hover": { bgcolor: shaded ? "action.selected" : "action.hover" }
            }}>
            {text}
        </Link>
    );
}

/** The viewer, in place of their own UserLink: like one for someone without a role color, toned down the same way. */
function You() {
    return <Box component="span" sx={{ fontWeight: 600, flexShrink: 0, color: "text.primary", opacity: 0.8 }}>You</Box>;
}

/** The comment a reply answered, as one line. */
function RepliedTo(props: { comment: CommentExcerpt, links?: boolean }) {
    const { comment, links } = props;
    const { loginUser } = useOutletContext() as ContextParams;
    const author = comment.author;
    return (
        <Typography
            variant="body2"
            component="div"
            sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, pl: 1, borderLeft: 2, borderColor: "divider" }}>
            {author.userId === loginUser?.userId ?
            <You />
            :
            <UserRefLink
                user={author}
                avatarSize={16}
                disableLink={!links}
                // Toned down, since it's the comment being answered, not the one this is about
                sx={{ flexShrink: 0, maxWidth: "50%", opacity: 0.8 }}
            />}
            {comment.replaySeconds !== undefined &&
            <Box component="span" sx={{ color: "secondary.main", fontWeight: 600, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {formatCommentTimestamp(comment.replaySeconds)}
            </Box>}
            <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(comment.removed && { fontStyle: "italic", pr: 0.25 }) }}>
                {comment.removed ? "Comment removed" : comment.body}
            </Box>
        </Typography>
    );
}

interface CommentReplayLineProps {
    replay: CommentReplay
    // Makes the map open the replay (at this comment, if given) and the runner open their profile. Leave off inside
    // something that's already a link.
    links?: boolean
    commentId?: string
}

/** The replay: map, game and style, time, and runner, like the replay page lays them out. Wraps when it's narrow. */
export function CommentReplayLine(props: CommentReplayLineProps) {
    const { replay, links, commentId } = props;
    const theme = useTheme();
    const { maps, loginUser } = useOutletContext() as ContextParams;
    const map = maps[replay.mapId];
    const mapName = (replay.mapName ?? map?.name ?? `Map ${replay.mapId}`) + (replay.course !== 0 ? ` (${formatCourse(replay.course, true)})` : "");
    const replayLink = `/replays/${replay.timeId}` + (commentId !== undefined ? `?comment=${commentId}` : "");
    const runner = replay.runner;

    return (
        <Typography
            variant="body2"
            component="div"
            sx={{ color: "text.secondary", display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.75, rowGap: 0.5, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                {links ?
                <Link component={RouterLink} to={replayLink} aria-label={`Open the replay on ${mapName}`} sx={{ display: "flex", flexShrink: 0 }}>
                    <MapThumb size={22} map={map} sx={{ borderRadius: "4px" }} />
                </Link>
                : <MapThumb size={22} map={map} sx={{ borderRadius: "4px", flexShrink: 0 }} />}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 500, overflowWrap: "anywhere" }}>
                    {links ?
                    <Link component={RouterLink} to={replayLink} underline="hover" color="inherit">{mapName}</Link>
                    : mapName}
                </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
                <ColorChip color={getGameColor(replay.game, theme)} label={formatGame(replay.game)} />
                <ColorChip color={getStyleColor(replay.style, theme)} label={formatStyle(replay.style)} />
            </Box>
            <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                in <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatTime(replay.time)}</span> by
            </Box>
            {runner.userId === loginUser?.userId ?
            <You />
            :
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                <UserRefLink user={runner} game={replay.game} strafesStyle={replay.style} avatarSize={18} disableLink={!links} />
            </Box>}
        </Typography>
    );
}

interface CommentSnapshotProps extends Omit<CommentReplayLineProps, "commentId"> {
    comment: Pick<CommentExcerpt, "id" | "body" | "replaySeconds">
    repliedTo?: CommentExcerpt
    muted?: boolean
    maxLines?: number
    shaded?: boolean
}

/** A comment's text, what it replied to, and the replay it's on. */
function CommentSnapshot(props: CommentSnapshotProps) {
    const { comment, repliedTo, muted, maxLines, shaded, ...lineProps } = props;
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}>
            <CommentText
                comment={comment}
                muted={muted}
                maxLines={maxLines}
                shaded={shaded}
                to={lineProps.links ? `/replays/${lineProps.replay.timeId}?comment=${comment.id}` : undefined}
            />
            {repliedTo && <RepliedTo comment={repliedTo} links={lineProps.links} />}
            <CommentReplayLine {...lineProps} commentId={comment.id} />
        </Box>
    );
}

export default CommentSnapshot;
