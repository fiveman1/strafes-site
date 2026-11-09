import { MouseEvent, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Link as RouterLink } from "react-router";
import { CommentRole, formatTime, Game, ReplayComment, Style } from "shared";
import { formatCommentTimestamp } from "../../../common/comments";
import DateDisplay from "../../displays/DateDisplay";
import UserAvatar from "../../displays/UserAvatar";
import UserLink from "../../displays/UserLink";
import CommentBadges from "./CommentBadges";

export interface CommentViewer {
    userId: number | undefined
    role: CommentRole | undefined
    // Whether the viewer is the runner of this replay
    isRunner: boolean
}

export interface CommentActions {
    onSeek: (seconds: number) => void
    // Logged out users get a login prompt instead, anchored to the button they clicked
    onLoginNeeded: (anchor: HTMLElement) => void
    onLike: (comment: ReplayComment) => void
    onReply: (comment: ReplayComment) => void
    onReport: (comment: ReplayComment) => void
    onDelete: (comment: ReplayComment) => void
    onSetHidden: (comment: ReplayComment, hidden: boolean) => void
}

interface CommentItemProps {
    comment: ReplayComment
    isReply: boolean
    // Whether the thread this is in was started on a run the runner has since beaten
    onEarlierRun: boolean
    runnerId: number
    game: Game
    style: Style
    viewer: CommentViewer
    actions: CommentActions
}

function statusText(comment: ReplayComment, viewer: CommentViewer) {
    const own = comment.userId === viewer.userId;
    const onlyYou = own ? " · Only you can see this" : "";
    if (comment.status === "pending") {
        return (own ? "Waiting for a moderator to review it" : "Waiting for review") + onlyYou;
    }
    if (comment.status === "hidden") {
        return (comment.hiddenBy === "runner" ? "Hidden by the runner" : "Hidden by a moderator") + onlyYou;
    }
    return undefined;
}

function CommentItem(props: CommentItemProps) {
    const { comment, isReply, onEarlierRun, runnerId, game, style, viewer, actions } = props;
    const theme = useTheme();
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const avatarSize = isReply ? 24 : 32;

    if (comment.removed) {
        return (
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", py: 0.5 }}>
                <Box sx={{ width: avatarSize, height: avatarSize, borderRadius: "50%", bgcolor: "action.hover", flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                    This comment was removed
                </Typography>
            </Box>
        );
    }

    const loggedIn = viewer.userId !== undefined;
    const own = comment.userId === viewer.userId;
    const visible = comment.status === "visible";
    const isMod = viewer.role !== undefined;
    const status = statusText(comment, viewer);
    // Only the top-level comment is labeled, since a whole thread belongs to the run it started on
    const previousRun = !isReply ? comment.previousRun : undefined;
    const userLink = `/users/${comment.userId}?game=${game}&style=${style}`;

    // What the menu offers. The server checks all of this again.
    const canReport = loggedIn && !own && (visible || (comment.status === "hidden" && comment.hiddenBy === "runner"));
    const canHide = isMod ? comment.status !== "hidden" || comment.hiddenBy === "runner"
        : viewer.isRunner && visible;
    const canUnhide = isMod ? comment.status !== "visible"
        : viewer.isRunner && comment.status === "hidden" && comment.hiddenBy === "runner";
    const hasMenu = canReport || canHide || canUnhide || own;

    const onLikeClick = (event: MouseEvent<HTMLElement>) => {
        if (!loggedIn) actions.onLoginNeeded(event.currentTarget);
        else actions.onLike(comment);
    };
    const onReplyClick = (event: MouseEvent<HTMLElement>) => {
        if (!loggedIn) actions.onLoginNeeded(event.currentTarget);
        else actions.onReply(comment);
    };
    const menuAction = (fn: () => void) => () => {
        setMenuAnchor(null);
        fn();
    };

    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
                opacity: onEarlierRun ? 0.6 : 1,
                transition: "opacity .15s ease",
                ":hover, :focus-within": { opacity: 1 }
            }}>
            <Link component={RouterLink} to={userLink} sx={{ flexShrink: 0, mt: 0.25 }} aria-label={comment.username}>
                <UserAvatar username={comment.username} userThumb={comment.userThumb} sx={{ width: avatarSize, height: avatarSize }} />
            </Link>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1, rowGap: 0.25 }}>
                    <UserLink
                        userId={comment.userId}
                        username={comment.username}
                        userRoles={comment.userRoles}
                        userCountry={comment.userCountry}
                        userThumb={comment.userThumb}
                        game={game}
                        strafesStyle={style}
                        hideAvatar
                        hideYouIcon
                        showAt
                        underline="hover"
                        variant="body2"
                        sx={{ fontWeight: 600, minWidth: 0 }}
                    />
                    <CommentBadges isRunner={comment.userId === runnerId} isOwn={own} />
                    <DateDisplay date={comment.createdAt} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
                    {previousRun &&
                    <Tooltip disableInteractive title={`Posted on a previous time of ${formatTime(previousRun.time)}`}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            on an earlier run
                        </Typography>
                    </Tooltip>}
                </Box>
                {status &&
                <Typography variant="caption" sx={{ display: "block", color: "warning.main" }}>
                    {status}
                </Typography>}
                <Typography
                    variant="body2"
                    sx={{
                        mt: 0.25,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere"
                    }}>
                    {comment.replaySeconds !== undefined &&
                    (previousRun ?
                    <Box component="span" sx={{ color: "text.secondary", mr: 0.75, fontVariantNumeric: "tabular-nums" }}>
                        {formatCommentTimestamp(comment.replaySeconds)}
                    </Box>
                    :
                    <ButtonBase
                        onClick={() => actions.onSeek(comment.replaySeconds!)}
                        aria-label={`Jump to ${formatCommentTimestamp(comment.replaySeconds)}`}
                        sx={{
                            mr: 0.75,
                            px: 0.5,
                            gap: 0.25,
                            borderRadius: "4px",
                            verticalAlign: "baseline",
                            font: "inherit",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                            color: "secondary.main",
                            bgcolor: alpha(theme.palette.secondary.main, 0.12),
                            ":hover": { bgcolor: alpha(theme.palette.secondary.main, 0.22) }
                        }}>
                        <AccessTimeIcon sx={{ fontSize: "0.9em" }} />
                        {formatCommentTimestamp(comment.replaySeconds)}
                    </ButtonBase>)}
                    {comment.replyToUsername &&
                    <Box component="span" sx={{ color: "secondary.main", mr: 0.5 }}>@{comment.replyToUsername}</Box>}
                    {comment.body}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25, ml: -0.75 }}>
                    <Button
                        size="small"
                        color="inherit"
                        disabled={!visible}
                        onClick={onLikeClick}
                        aria-pressed={comment.liked}
                        aria-label={comment.liked ? "Unlike" : "Like"}
                        startIcon={comment.liked ? <ThumbUpIcon sx={{ color: "secondary.main" }} /> : <ThumbUpOutlinedIcon />}
                        sx={{ minWidth: 0, px: 0.75, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                        {comment.likes > 0 ? comment.likes : ""}
                    </Button>
                    {visible &&
                    <Button size="small" color="inherit" onClick={onReplyClick} sx={{ minWidth: 0, px: 0.75, color: "text.secondary" }}>
                        Reply
                    </Button>}
                    {hasMenu &&
                    <IconButton size="small" aria-label="More" onClick={(event) => setMenuAnchor(event.currentTarget)} sx={{ color: "text.secondary" }}>
                        <MoreVertIcon fontSize="small" />
                    </IconButton>}
                </Box>
            </Box>
            <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
                {canReport &&
                <MenuItem disabled={comment.reported} onClick={menuAction(() => actions.onReport(comment))}>
                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                    {comment.reported ? "Reported" : "Report"}
                </MenuItem>}
                {canHide &&
                <MenuItem onClick={menuAction(() => actions.onSetHidden(comment, true))}>
                    <ListItemIcon><VisibilityOffOutlinedIcon fontSize="small" /></ListItemIcon>
                    Hide
                </MenuItem>}
                {canUnhide &&
                <MenuItem onClick={menuAction(() => actions.onSetHidden(comment, false))}>
                    <ListItemIcon><VisibilityOutlinedIcon fontSize="small" /></ListItemIcon>
                    {comment.status === "pending" ? "Approve" : "Unhide"}
                </MenuItem>}
                {own &&
                <MenuItem onClick={menuAction(() => actions.onDelete(comment))}>
                    <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                    Delete
                </MenuItem>}
            </Menu>
        </Box>
    );
}

export default CommentItem;
