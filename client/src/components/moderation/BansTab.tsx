import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { CommentBan } from "shared";
import { unbanCommenter } from "../../api/api";
import { queries } from "../../api/queries";
import { dateFormat } from "../../common/datetime";
import DateDisplay from "../displays/DateDisplay";
import BanDialog from "./BanDialog";
import { LoadFailed, Loading } from "./common";
import UserRefLink from "../displays/UserRefLink";
import useModFeedback from "./useModFeedback";

function BansTab() {
    const theme = useTheme();
    const bans = useQuery(queries.mod.bans);
    const { notify, refresh, snackbar } = useModFeedback();
    const [banOpen, setBanOpen] = useState(false);
    const [busyId, setBusyId] = useState<string | undefined>(undefined);

    const unban = async (ban: CommentBan) => {
        setBusyId(ban.id);
        const result = await unbanCommenter(ban.user.userId);
        if (!result.ok) notify(result.error);
        await refresh();
        setBusyId(undefined);
    };

    return (
        <>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: "text.secondary", flexGrow: 1 }}>
                    Banned users can't post comments until their ban ends.
                </Typography>
                <Button variant="contained" color="error" onClick={() => setBanOpen(true)}>Ban a user</Button>
            </Box>

            {bans.isPending ? <Loading />
            : !bans.data ? <LoadFailed what="bans" query={bans} />
            : bans.data.length === 0 ?
            <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
                Nobody is banned
            </Typography>
            :
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {bans.data.map((ban) => (
                    <Paper key={ban.id} variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.75 }}>
                                <UserRefLink user={ban.user} avatarSize={28} />
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {ban.expiresAt ? `until ${dateFormat.format(new Date(ban.expiresAt))}` : "permanently"}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ my: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                {ban.reason}
                            </Typography>
                            <Typography variant="caption" component="div" sx={{ color: "text.secondary", display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 0.5 }}>
                                Banned by <UserRefLink user={ban.bannedBy} avatarSize={16} />
                                <DateDisplay date={ban.createdAt} variant="caption" color={theme.palette.text.secondary} tooltipPlacement="top" alwaysRelative />
                            </Typography>
                        </Box>
                        <Button size="small" disabled={busyId === ban.id} onClick={() => unban(ban)}>Unban</Button>
                    </Paper>
                ))}
            </Box>}

            <BanDialog
                open={banOpen}
                onClose={() => setBanOpen(false)}
                onBanned={() => refresh()}
            />
            {snackbar}
        </>
    );
}

export default BansTab;
