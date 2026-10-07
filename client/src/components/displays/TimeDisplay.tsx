import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime, Time } from "shared";
import DiffDisplay from "./DiffDisplay";
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import { lighten, useTheme } from "@mui/material/styles";
import { useQueryClient } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { useCallback } from "react";

const MONO = '"Geist Mono", monospace';

interface ITimeDisplayProps {
    time: Time
    hideDiff?: boolean
}

function TimeDisplay(props: ITimeDisplayProps) {
    const { time, hideDiff } = props;
    const theme = useTheme();
    const queryClient = useQueryClient();

    const isLight = theme.palette.mode === "light";

    const ms = time.time;
    const diff = time.wrDiff;
    const hasBot = time.hasBot;
    const timeId = time.id;
    const mapId = time.mapId;

    const prefetchURLs = useCallback(() => {
        queryClient.prefetchQuery(queries.replays.botURL(timeId));
        queryClient.prefetchQuery(queries.replays.mapURL(mapId));
    }, [mapId, queryClient, timeId]);

    if (hideDiff) {
        if (hasBot) {
            return (
                <Link
                    component={RouterLink}
                    to={`/replays/${time.id}`}
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
                    <Box
                        sx={{
                            display: "inline-flex",
                            flexDirection: "row",
                            alignItems: "center"
                        }}>
                        <Typography variant="inherit" color="textPrimary" className="timeValue" sx={{ fontFamily: MONO, fontSize: "0.8125rem" }}>
                            {formatTime(ms)}
                        </Typography>
                        <SmartDisplayIcon className="videoIcon" sx={{ ml: 0.75, color: "text.secondary", transition: "color .15s ease", fontSize: "16px" }} />
                    </Box>
                </Link>
            );
        }

        return (
            <Typography variant="inherit" sx={{ fontFamily: MONO, fontSize: "0.8125rem" }}>
                {formatTime(ms)}
            </Typography>
        );
    }

    if (hasBot) {
        return (
            <Link
                component={RouterLink} 
                to={`/replays/${time.id}`}
                onClick={prefetchURLs}
                underline="none"
                sx={{
                    textDecoration: "none",
                    ":hover": {
                        ".timeValue": { textDecoration: "underline", color: theme.palette.mode === "dark" ? lighten(theme.palette.primary.main, 0.1) : theme.palette.primary.main },
                        ".videoIcon": { color: theme.palette.primary.main }
                    }
                }}
            >
                <Box
                    sx={{
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center"
                    }}>
                    <Typography variant="inherit" color="textPrimary" className="timeValue" sx={{
                        fontFamily: MONO,
                        fontSize: "0.8125rem",
                        minWidth: diff !== undefined ? "9ch" : undefined,
                        mr: diff !== undefined ? 1.25 : undefined
                    }}>
                        {formatTime(ms)}
                    </Typography>
                    <DiffDisplay ms={ms} diff={diff} />
                    <SmartDisplayIcon className="videoIcon" sx={{ ml: 0.75, color: "text.secondary", transition: "color .15s ease", fontSize: "16px" }} />
                </Box>
            </Link>
        );
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center"
            }}>
            <Typography variant="inherit" sx={{
                fontFamily: MONO,
                fontSize: "0.8125rem",
                minWidth: "9ch",
                mr: 1.25
            }}>
                {formatTime(ms)}
            </Typography>
            <DiffDisplay ms={ms} diff={diff} />
        </Box>
    );
}

export default TimeDisplay;
