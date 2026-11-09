import { ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CommentModerationLogEntry } from "shared";
import { queries } from "../../api/queries";
import DateDisplay from "../displays/DateDisplay";
import { LoadFailed, Loading, PageControls } from "./common";
import UserRefLink from "../displays/UserRefLink";
import ModCommentCard from "./ModCommentCard";

function describe(entry: CommentModerationLogEntry): ReactNode {
    const target = entry.target ? <UserRefLink user={entry.target} avatarSize={18} /> : "someone";
    switch (entry.action) {
        case "hide": return <>hid a comment by {target}</>;
        case "restore": return <>restored a comment by {target}</>;
        case "approve": return <>approved a comment by {target}</>;
        case "dismiss_reports": return <>dismissed reports on a comment by {target}</>;
        case "ban": return <>banned {target}</>;
        case "unban": return <>unbanned {target}</>;
        // The reason holds the role they were given
        case "grant_mod": return <>made {target} {entry.reason === "admin" ? "an admin" : "a moderator"}</>;
        case "revoke_mod": return <>removed {target} as a moderator</>;
    }
}

function LogEntry(props: { entry: CommentModerationLogEntry }) {
    const { entry } = props;
    const theme = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <Box sx={{ px: 1.5, py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" component="div" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.5, rowGap: 0.25 }}>
                        <UserRefLink user={entry.actor} avatarSize={20} />
                        {describe(entry)}
                        <Box component="span" sx={{ ml: 0.5 }}>
                            <DateDisplay date={entry.createdAt} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
                        </Box>
                    </Typography>
                    {entry.reason && entry.action !== "grant_mod" &&
                    <Typography variant="body2" sx={{ color: "text.secondary", overflowWrap: "anywhere" }}>
                        {entry.reason}
                    </Typography>}
                </Box>
                {entry.comment &&
                <IconButton
                    size="small"
                    aria-label={open ? "Hide the comment" : "Show the comment"}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                    // So rows with a comment aren't taller than ones without
                    sx={{ my: -0.5 }}>
                    <ExpandMoreIcon fontSize="small" sx={{ transition: "transform .15s ease", transform: open ? "rotate(180deg)" : "none" }} />
                </IconButton>}
            </Box>
            {entry.comment &&
            <Collapse in={open} unmountOnExit>
                <Box sx={{ pt: 1 }}>
                    <ModCommentCard comment={entry.comment} />
                </Box>
            </Collapse>}
        </Box>
    );
}

function LogTab() {
    const [page, setPage] = useState(1);
    const log = useQuery({ ...queries.mod.log(page), placeholderData: keepPreviousData });

    if (log.isPending) return <Loading />;
    if (!log.data) return <LoadFailed />;

    const { entries, pageSize } = log.data;
    return (
        <Box sx={{ opacity: log.isPlaceholderData ? 0.6 : 1, transition: "opacity .15s ease" }}>
            {entries.length === 0 ?
            <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
                Nothing yet
            </Typography>
            :
            <Paper variant="outlined" sx={{ "& > :not(:first-of-type)": { borderTop: 1, borderColor: "divider" } }}>
                {entries.map((entry) => <LogEntry key={entry.id} entry={entry} />)}
            </Paper>}
            <PageControls page={page} hasNext={entries.length === pageSize} onPage={setPage} />
        </Box>
    );
}

export default LogTab;
