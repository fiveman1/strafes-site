import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink, useOutletContext } from "react-router";
import { formatCourse, formatGame, formatStyle, formatTime, ModComment } from "shared";
import { ModAction } from "../../api/api";
import { ContextParams, getGameColor, getStyleColor } from "../../common/common";
import { formatCommentTimestamp, REPORT_REASON_LABELS } from "../../common/comments";
import ColorChip from "../displays/ColorChip";
import DateDisplay from "../displays/DateDisplay";
import MapThumb from "../displays/MapThumb";
import { StatusChip, ModUserLink } from "./common";

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

/** The map and run the comment is on. */
function CommentRun(props: { comment: ModComment }) {
    const { comment } = props;
    const theme = useTheme();
    const { maps } = useOutletContext() as ContextParams;
    const map = maps[comment.mapId];
    const replayLink = `/replays/${comment.timeId}`;

    return (
        <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", minWidth: 0 }}>
            <Link component={RouterLink} to={replayLink} aria-label="Open the replay" sx={{ flexShrink: 0, display: "flex", width: 44, height: 44, overflow: "hidden", borderRadius: "4px" }}>
                <MapThumb size={44} map={map} sx={{ borderRadius: "4px" }} />
            </Link>
            <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.75, rowGap: 0.25 }}>
                    <Link component={RouterLink} to={replayLink} underline="hover" color="textPrimary" variant="body2" sx={{ fontWeight: 600 }}>
                        {comment.mapName ?? map?.name ?? `Map ${comment.mapId}`}
                    </Link>
                    <ColorChip color={getGameColor(comment.game, theme)} label={formatGame(comment.game)} />
                    <ColorChip color={getStyleColor(comment.style, theme)} label={formatStyle(comment.style)} />
                    {comment.course !== 0 &&
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{formatCourse(comment.course, true)}</Typography>}
                </Box>
                <Typography variant="body2" component="div" sx={{ color: "text.secondary", display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.75 }}>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatTime(comment.run.time)}</span>
                    <span>by</span>
                    <ModUserLink user={comment.runner} avatarSize={18} game={comment.game} style={comment.style} />
                </Typography>
            </Box>
        </Box>
    );
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
                <ModUserLink user={comment.author} avatarSize={28} game={comment.game} style={comment.style} />
                <StatusChip status={comment.status} hiddenBy={comment.hiddenBy} />
                <DateDisplay date={comment.createdAt} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
            </Box>

            <Typography
                variant="body1"
                sx={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    bgcolor: "action.hover",
                    borderRadius: "8px",
                    px: 1.5,
                    py: 1
                }}>
                {comment.replaySeconds !== undefined &&
                <Box component="span" sx={{ color: "secondary.main", fontWeight: 600, mr: 0.75, fontVariantNumeric: "tabular-nums" }}>
                    {formatCommentTimestamp(comment.replaySeconds)}
                </Box>}
                {comment.parentId !== undefined &&
                <Box component="span" sx={{ color: "text.secondary", mr: 0.75 }}>(reply)</Box>}
                {comment.body}
            </Typography>

            <CommentRun comment={comment} />

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
                            <ModUserLink user={report.reporter} avatarSize={18} />
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
