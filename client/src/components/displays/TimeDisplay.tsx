import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime, Time } from "shared";
import DiffDisplay from "./DiffDisplay";
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import { lighten, useTheme } from "@mui/material/styles";
import { noop, useQueryClient } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { useCallback } from "react";

const MONO = '"Geist Mono", monospace';

interface ITimeDisplayProps {
    time: Time
    hideDiff?: boolean
    /** Reserve a fixed width for the time so diffs line up across rows (e.g. in a grid). Defaults to true. */
    alignDiff?: boolean
    /** Font size of the time text. Defaults to 0.8125rem. */
    fontSize?: string
}

function TimeDisplay(props: ITimeDisplayProps) {
    const { time, hideDiff, alignDiff = true, fontSize = "0.8125rem" } = props;
    const theme = useTheme();
    const queryClient = useQueryClient();

    const isLight = theme.palette.mode === "light";

    const ms = time.time;
    const diff = time.wrDiff;
    const hasBot = time.hasBot;
    const timeId = time.id;
    const mapId = time.mapId;
    const showDiff = !hideDiff && diff !== undefined;

    const prefetchURLs = useCallback(() => {
        // Just a head start, the replay page fetches them again if these fail
        queryClient.query(queries.replays.botURL(timeId)).catch(noop);
        queryClient.query(queries.replays.mapURL(mapId)).catch(noop);
    }, [mapId, queryClient, timeId]);

    const timeText = (
        <Typography
            variant="inherit"
            color={hasBot ? "textPrimary" : undefined}
            className="timeValue"
            sx={{
                fontFamily: MONO,
                fontSize: fontSize,
                minWidth: showDiff && alignDiff ? "9ch" : undefined,
                mr: showDiff ? (alignDiff ? 1.25 : 0.75) : undefined
            }}>
            {formatTime(ms)}
        </Typography>
    );

    if (!showDiff && !hasBot) {
        return timeText;
    }

    const content = (
        <Box
            sx={{
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center"
            }}>
            {timeText}
            {showDiff && <DiffDisplay ms={ms} diff={diff} />}
            {hasBot && <SmartDisplayIcon className="videoIcon" sx={{ ml: 0.75, color: "text.secondary", transition: "color .15s ease", fontSize: "16px" }} />}
        </Box>
    );

    if (!hasBot) {
        return content;
    }

    return (
        <Link
            component={RouterLink}
            to={`/replays/${timeId}`}
            onClick={prefetchURLs}
            underline="none"
            sx={{
                textDecoration: "none",
                ":hover": {
                    ".timeValue": { textDecoration: "underline", color: isLight ? theme.palette.primary.main : lighten(theme.palette.primary.main, 0.1) },
                    ".videoIcon": { color: theme.palette.primary.main }
                }
            }}
        >
            {content}
        </Link>
    );
}

export default TimeDisplay;
