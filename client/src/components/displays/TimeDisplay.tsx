import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime, Time } from "shared";
import DiffDisplay from "./DiffDisplay";
import SmartDisplayIcon from '@mui/icons-material/SmartDisplay';
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import { lighten, useTheme } from "@mui/material/styles";

interface ITimeDisplayProps {
    time: Time
    hideDiff?: boolean
}

function TimeDisplay(props: ITimeDisplayProps) {
    const { time, hideDiff } = props;
    const theme = useTheme();

    const isLight = theme.palette.mode === "light";
    
    const ms = time.time;
    const diff = time.wrDiff;
    const hasBot = time.hasBot;

    if (hideDiff) {
        if (hasBot) {
            return (
                <Link
                    component={RouterLink} 
                    to={`/replays/${time.id}`}
                    underline="none"
                    sx={{
                        textDecoration: "none",
                        ":hover": {
                            ".timeValue": { textDecoration: "underline", color: isLight ? theme.palette.primary.main : lighten(theme.palette.primary.main, 0.1) },
                            ".videoIcon": { color: lighten(theme.palette.secondary.main, 0.3) }
                        }
                    }}
                >
                    <Box display="inline-flex" flexDirection="row" alignItems="center">
                        <Typography variant="inherit" color="textPrimary" className="timeValue">
                            {formatTime(ms)}
                        </Typography>
                        <SmartDisplayIcon className="videoIcon" color="secondary" fontSize="small" sx={{ ml: 0.75, mb: "2px", transition: "color .15s ease" }} />
                    </Box>
                </Link>
            );
        }

        return (
            <Typography variant="inherit">
                {formatTime(ms)}
            </Typography>
        );
    }

    if (hasBot) {
        return (
            <Link
                component={RouterLink} 
                to={`/replays/${time.id}`}
                underline="none"
                sx={{
                    textDecoration: "none",
                    ":hover": {
                        ".timeValue": { textDecoration: "underline", color: theme.palette.mode === "dark" ? lighten(theme.palette.primary.main, 0.1) : theme.palette.primary.main },
                        ".videoIcon": { color: lighten(theme.palette.secondary.main, 0.3) }
                    }
                }}
            >
                <Box display="inline-flex" flexDirection="row" alignItems="center">
                    <Typography variant="inherit" width={diff !== undefined ? "72px" : undefined} color="textPrimary" className="timeValue">
                        {formatTime(ms)}
                    </Typography>
                    <DiffDisplay ms={ms} diff={diff} />
                    <SmartDisplayIcon className="videoIcon" color="secondary" fontSize="small" sx={{ ml: 0.75, mb: "2px", transition: "color .15s ease" }} />
                </Box>
            </Link>
        );
    }
    
    return (
        <Box display="flex" flexDirection="row" alignItems="center">
            <Typography variant="inherit" width="72px">
                {formatTime(ms)}
            </Typography>
            <DiffDisplay ms={ms} diff={diff} />
        </Box>
    );
}

export default TimeDisplay;