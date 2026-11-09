import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ModComment } from "shared";
import { ModAction } from "../../api/api";
import { REPORT_REASON_LABELS } from "../../common/comments";
import CommentSnapshot from "../displays/CommentSnapshot";
import DateDisplay from "../displays/DateDisplay";
import { StatusChip } from "./common";
import UserRefLink from "../displays/UserRefLink";

interface CardAction {
    action: ModAction
    label: string
}

function getActions(comment: ModComment): CardAction[] {
    const reported = comment.openReports > 0;
    switch (comment.status) {
        case "pending":
            return [{ action: "approve", label: "Approve" }, { action: "hide", label: "Hide" }];
        case "visible":
            return reported ? [{ action: "dismiss", label: "Dismiss reports" }, { action: "hide", label: "Hide" }]
                : [{ action: "hide", label: "Hide" }];
        case "hidden": {
            const actions: CardAction[] = [{ action: "approve", label: "Restore" }];
            // Taking over the runner's hide means they can't undo it
            if (comment.hiddenBy === "runner") actions.push({ action: "hide", label: "Hide as moderator" });
            if (reported) actions.push({ action: "dismiss", label: "Dismiss reports" });
            return actions;
        }
        case "deleted":
            return reported ? [{ action: "dismiss", label: "Dismiss reports" }] : [];
    }
}

interface ModCommentCardProps {
    comment: ModComment
    // Read-only without these
    busy?: boolean
    onAction?: (comment: ModComment, action: ModAction) => void
    onBan?: (comment: ModComment) => void
}

function ModCommentCard(props: ModCommentCardProps) {
    const { comment, busy, onAction, onBan } = props;
    const theme = useTheme();
    const actions = onAction ? getActions(comment) : [];

    return (
        <Paper variant="outlined" sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 1, rowGap: 0.5 }}>
                <UserRefLink user={comment.author} avatarSize={28} game={comment.replay.game} strafesStyle={comment.replay.style} />
                <StatusChip status={comment.status} hiddenBy={comment.hiddenBy} />
                <DateDisplay date={comment.createdAt} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
            </Box>

            {/* All of it, uncut, since moderators need to see the whole comment */}
            <CommentSnapshot comment={comment} repliedTo={comment.repliedTo} replay={comment.replay} links shaded />

            {comment.reports.length > 0 &&
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, pl: 1.5, borderLeft: 2, borderColor: comment.openReports > 0 ? "warning.main" : "divider" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {comment.openReports > 0 ? `${comment.openReports} open report${comment.openReports === 1 ? "" : "s"}` : "Reports"}
                </Typography>
                {comment.reports.map((report) => (
                    <Box key={report.reporter.userId} sx={{ opacity: report.resolved ? 0.6 : 1 }}>
                        <Typography variant="body2" component="div" sx={{ display: "flex", flexWrap: "wrap", columnGap: 0.75, alignItems: "center" }}>
                            <span style={{ fontWeight: 600 }}>{REPORT_REASON_LABELS[report.reason]}</span>
                            <span>from</span>
                            <UserRefLink user={report.reporter} avatarSize={18} />
                            <DateDisplay date={report.createdAt} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
                            {report.resolved && <Typography variant="caption" sx={{ color: "text.secondary" }}>(resolved)</Typography>}
                        </Typography>
                        {report.note &&
                        <Typography variant="body2" sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
                            "{report.note}"
                        </Typography>}
                    </Box>
                ))}
            </Box>}

            {(onAction || onBan) &&
            <Box sx={{ display: "flex", gap: 1 }}>
                {actions.map(({ action, label }) => (
                    <Button
                        key={action}
                        size="small"
                        variant={action === "hide" ? "outlined" : "contained"}
                        color={action === "hide" ? "error" : "primary"}
                        disabled={busy}
                        onClick={() => onAction?.(comment, action)}>
                        {label}
                    </Button>
                ))}
                <Box sx={{ flexGrow: 1 }} />
                {onBan && <Button size="small" color="error" onClick={() => onBan(comment)}>Ban user</Button>}
            </Box>}
        </Paper>
    );
}

export default ModCommentCard;
