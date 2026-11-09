import { ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import ReplyIcon from "@mui/icons-material/Reply";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { Link as RouterLink } from "react-router";
import { InboxItem, ReplayReaction, UserRef } from "shared";
import { inboxItemLink } from "../../common/inbox";
import { getReactionInfo, REACTION_IMAGES } from "../../common/reactions";
import CommentSnapshot, { CommentReplayLine } from "../displays/CommentSnapshot";
import DateDisplay from "../displays/DateDisplay";
import UserAvatar from "../displays/UserAvatar";

const AVATAR_SIZE = 36;
const ICON_BADGE_SIZE = 20;

function Name(props: { user: UserRef }) {
    return <Box component="span" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{props.user.username ?? `User ${props.user.userId}`}</Box>;
}

/** "alice", "alice and bob", "alice, bob, and 3 others" */
function GroupNames(props: { users: UserRef[], total: number }) {
    const { users, total } = props;
    const others = total - users.length;
    const parts: ReactNode[] = users.map((user) => <Name key={user.userId} user={user} />);
    if (others > 0) {
        parts.push(`${others} ${others === 1 ? "other" : "others"}`);
    }
    return (
        <>
            {parts.map((part, i) => (
                <span key={i}>
                    {i > 0 && (parts.length === 2 ? " and " : i === parts.length - 1 ? ", and " : ", ")}
                    {part}
                </span>
            ))}
        </>
    );
}

/** The user's avatar with a small icon in the corner for what kind of item it is. */
function ItemAvatar(props: { user?: UserRef, icon: ReactNode, iconColor: string }) {
    const { user, icon, iconColor } = props;
    const theme = useTheme();
    return (
        <Box sx={{ position: "relative", flexShrink: 0, width: AVATAR_SIZE, height: AVATAR_SIZE }}>
            {user ?
            <UserAvatar username={user.username ?? ""} userThumb={user.userThumb} sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} />
            :
            <Box sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: "50%", bgcolor: "action.hover" }} />}
            <Box
                sx={{
                    position: "absolute",
                    right: -4,
                    bottom: -4,
                    width: ICON_BADGE_SIZE,
                    height: ICON_BADGE_SIZE,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: iconColor,
                    color: theme.palette.getContrastText(iconColor),
                    // Keeps the icon apart from the avatar, in the card's color
                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                    "& svg": { fontSize: 12 }
                }}>
                {icon}
            </Box>
        </Box>
    );
}

function ReactionCounts(props: { reactions: { reaction: ReplayReaction, count: number }[] }) {
    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {props.reactions.map(({ reaction, count }) => {
                const info = getReactionInfo(reaction);
                return (
                    <Box
                        key={reaction}
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            height: 24,
                            px: 0.75,
                            borderRadius: "12px",
                            bgcolor: "action.hover",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums"
                        }}>
                        <img src={REACTION_IMAGES[reaction]} alt={info.label} draggable={false} width={16} height={16} />
                        {count}
                    </Box>
                );
            })}
        </Box>
    );
}

interface InboxItemCardProps {
    item: InboxItem
    unread: boolean
    viewerId: number
}

function InboxItemCard(props: InboxItemCardProps) {
    const { item, unread, viewerId } = props;
    const theme = useTheme();
    // Shared by everything but reactions, which aren't about a comment
    const snapshotProps = { replay: item.replay, maxLines: 3 };

    let avatar: ReactNode;
    let headline: ReactNode;
    let content: ReactNode;
    switch (item.type) {
        case "comment":
            avatar = <ItemAvatar user={item.comment.author} icon={<ChatBubbleOutlineIcon />} iconColor={theme.palette.primary.main} />;
            headline = <><Name user={item.comment.author} /> commented on your run</>;
            content = <CommentSnapshot comment={item.comment} {...snapshotProps} />;
            break;
        case "reply":
            avatar = <ItemAvatar user={item.comment.author} icon={<ReplyIcon />} iconColor={theme.palette.primary.main} />;
            // In a thread the user started, the reply may have answered someone else
            headline = <><Name user={item.comment.author} /> {item.repliedTo.author.userId === viewerId ? "replied to your comment" : "replied in your thread"}</>;
            content = <CommentSnapshot comment={item.comment} repliedTo={item.repliedTo} {...snapshotProps} />;
            break;
        case "reactions":
            avatar = <ItemAvatar user={item.users[0]} icon={<img src={REACTION_IMAGES[item.reactions[0].reaction]} alt="" width={12} height={12} />} iconColor={theme.palette.background.default} />;
            headline = <><GroupNames users={item.users} total={item.userCount} /> reacted to your run</>;
            content = (
                <>
                    <ReactionCounts reactions={item.reactions} />
                    <CommentReplayLine replay={item.replay} />
                </>
            );
            break;
        case "likes":
            avatar = <ItemAvatar user={item.users[0]} icon={<ThumbUpIcon />} iconColor={theme.palette.secondary.main} />;
            headline = <><GroupNames users={item.users} total={item.userCount} /> liked your comment</>;
            content = <CommentSnapshot comment={item.comment} muted {...snapshotProps} />;
            break;
        case "hidden":
            avatar = <ItemAvatar icon={<VisibilityOffOutlinedIcon />} iconColor={theme.palette.error.main} />;
            headline = <>A moderator hid your comment</>;
            content = <CommentSnapshot comment={item.comment} muted {...snapshotProps} />;
            break;
    }

    return (
        <ButtonBase
            component={RouterLink}
            to={inboxItemLink(item)}
            sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                textAlign: "left",
                gap: 1.5,
                width: "100%",
                p: 1.5,
                borderRadius: "8px",
                bgcolor: unread ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                transition: "background-color 150ms ease",
                "&:hover": {
                    bgcolor: unread ? alpha(theme.palette.primary.main, 0.14) : "action.hover"
                },
                "&.Mui-focusVisible": {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2
                }
            }}>
            {avatar}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0, flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography variant="body2" component="div" sx={{ flexGrow: 1, minWidth: 0 }}>
                        {headline}
                    </Typography>
                    <Box sx={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75 }}>
                        <DateDisplay date={item.at} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
                        {unread && <Box role="img" aria-label="Unread" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />}
                    </Box>
                </Box>
                {content}
            </Box>
        </ButtonBase>
    );
}

export default InboxItemCard;
