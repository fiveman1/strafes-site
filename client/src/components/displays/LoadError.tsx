import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import { errorMessage } from "../../api/api";

interface LoadErrorProps {
    /** What couldn't be loaded, like "comments" */
    what: string
    error: unknown
    onRetry?: () => void
    /** While the retry is in flight */
    retrying?: boolean
    /** Centered, for where a whole list or page would be */
    block?: boolean
    sx?: SxProps<Theme>
}

/** "Couldn't load X", the reason, and a button to try again. */
function LoadError(props: LoadErrorProps) {
    const { what, error, onRetry, retrying, block, sx } = props;
    return (
        <Box
            role="alert"
            sx={{
                display: "flex",
                alignItems: block ? "center" : "flex-start",
                flexDirection: block ? "column" : "row",
                textAlign: block ? "center" : undefined,
                gap: block ? 1 : 1.25,
                py: block ? 4 : 0,
                px: block ? 2 : 0,
                ...sx
            }}>
            <ErrorOutlineIcon color="error" fontSize={block ? "medium" : "small"} sx={{ mt: block ? 0 : "2px" }} />
            <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: block ? "center" : "flex-start" }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Couldn't load {what}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {errorMessage(error)}
                </Typography>
                {onRetry &&
                // Under the reason, lined up with the text when it's not centered
                <Button size="small" onClick={onRetry} disabled={retrying} sx={{ mt: block ? 1 : 0.5, ml: block ? 0 : "-5px" }}>
                    {retrying ? "Trying again..." : "Try again"}
                </Button>}
            </Box>
        </Box>
    );
}

interface InlineLoadErrorProps {
    error: unknown
    /** Left off where it's clear from the label next to it */
    what?: string
    onRetry?: () => void
    retrying?: boolean
}

/** For a single value, like a stat: a short "Couldn't load" with the reason in a tooltip, and a retry button. */
export function InlineLoadError(props: InlineLoadErrorProps) {
    const { error, what, onRetry, retrying } = props;
    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title={errorMessage(error)} placement="top-start" arrow>
                <Typography component="span" variant="body2" color="error" sx={{ fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 16 }} />
                    {what ? `Couldn't load ${what}` : "Couldn't load"}
                </Typography>
            </Tooltip>
            {onRetry &&
            <Tooltip title="Try again">
                <span>
                    <IconButton size="small" onClick={onRetry} disabled={retrying} aria-label="Try again" sx={{ p: 0.25 }}>
                        <RefreshIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </span>
            </Tooltip>}
        </Box>
    );
}

interface ErrorWithReasonProps {
    /** What went wrong, like "Couldn't load the replay." */
    issue: ReactNode
    /** The error, or a message already taken from one (like an ApiResult's) */
    error: unknown
}

/** One line of "what went wrong" and why, for alerts and helper text. The issue stands out so they don't run together. */
export function ErrorWithReason(props: ErrorWithReasonProps) {
    const { issue, error } = props;
    return (
        <>
            <Box component="span" sx={{ fontWeight: 600 }}>{issue}</Box>
            {" "}
            <Box component="span" sx={{ opacity: 0.85 }}>{typeof error === "string" ? error : errorMessage(error)}</Box>
        </>
    );
}

export default LoadError;
