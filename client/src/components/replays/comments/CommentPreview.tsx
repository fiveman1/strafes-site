import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";
import { ReplayComment } from "shared";
import { formatCommentTimestamp } from "../../../common/comments";
import UserAvatar from "../../displays/UserAvatar";
import CommentBadges from "./CommentBadges";

interface CommentPreviewProps {
    comment: ReplayComment
    isRunner: boolean
    isOwn: boolean
    showTimestamp?: boolean
    sx?: SxProps<Theme>
}

/** A compact comment for over the player. */
function CommentPreview(props: CommentPreviewProps) {
    const { comment, isRunner, isOwn, showTimestamp, sx } = props;
    return (
        <Box
            sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
                px: 1,
                py: 0.75,
                borderRadius: "8px",
                bgcolor: "#000000b0",
                color: "white",
                maxWidth: 300,
                ...sx
            }}>
            <UserAvatar username={comment.username} userThumb={comment.userThumb} sx={{ width: 20, height: 20, mt: 0.25 }} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                        @{comment.username}
                    </Typography>
                    <CommentBadges isRunner={isRunner} isOwn={isOwn} onDark />
                    {showTimestamp && comment.replaySeconds !== undefined &&
                    <Typography variant="caption" sx={{ ml: "auto", lineHeight: 1.4, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "secondary.light" }}>
                        {formatCommentTimestamp(comment.replaySeconds)}
                    </Typography>}
                </Box>
                <Typography
                    variant="body2"
                    sx={{
                        lineHeight: 1.35,
                        overflowWrap: "anywhere",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                    }}>
                    {comment.body}
                </Typography>
            </Box>
        </Box>
    );
}

export default CommentPreview;
