import { FormEvent, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { CommentModerator, CommentRole } from "shared";
import { grantCommentModerator, revokeCommentModerator } from "../../api/api";
import { queries } from "../../api/queries";
import { useFoundUser, useLoginUser } from "../../common/states";
import UserSearch from "../search/UserSearch";
import { LoadFailed, Loading, ModUserLink } from "./common";
import useModFeedback from "./useModFeedback";

const ROLE_LABELS: Record<CommentRole, string> = {
    moderator: "Moderator",
    admin: "Admin"
};

/** Only admins can add or remove moderators, and only ones added on the site. */
function ModeratorsTab() {
    const loginUser = useLoginUser().data;
    const isAdmin = loginUser?.commentRole === "admin";
    const moderators = useQuery(queries.mod.moderators);
    const { notify, refresh, snackbar } = useModFeedback();
    const foundUser = useFoundUser();
    const newUserId = foundUser.userId;
    const [role, setRole] = useState<CommentRole>("moderator");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<number | undefined>(undefined);

    const add = async (event: FormEvent) => {
        event.preventDefault();
        if (newUserId === undefined) return;
        setError("");
        setAdding(true);
        const result = await grantCommentModerator(newUserId, role);
        setAdding(false);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        foundUser.clear();
        await refresh();
    };

    const remove = async (moderator: CommentModerator) => {
        setBusyId(moderator.user.userId);
        const result = await revokeCommentModerator(moderator.user.userId);
        if (!result.ok) notify(result.error);
        await refresh();
        setBusyId(undefined);
    };

    return (
        <>
            {isAdmin &&
            <>
                <Box component="form" onSubmit={add} sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                    <Box sx={{ flex: "1 1 200px" }}>
                        <UserSearch setUserId={foundUser.setUserId} userSearch={foundUser.userSearch} />
                    </Box>
                    <TextField select value={role} onChange={(event) => setRole(event.target.value as CommentRole)} label="Role" size="small" sx={{ flex: "0 1 160px" }}>
                        <MenuItem value="moderator">Moderator</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </TextField>
                    <Button type="submit" variant="contained" disabled={adding || newUserId === undefined}>Add</Button>
                </Box>
                {error !== "" &&
                <Typography variant="body2" role="alert" sx={{ color: "error.main", mb: 1 }}>{error}</Typography>}
                <Box sx={{ mb: 1.5 }} />
            </>}

            {moderators.isPending ? <Loading />
            : !moderators.data ? <LoadFailed />
            :
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {moderators.data.map((moderator) => (
                    <Paper key={moderator.user.userId} variant="outlined" sx={{ px: 1.5, py: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                        <ModUserLink user={moderator.user} avatarSize={28} />
                        <Chip size="small" label={ROLE_LABELS[moderator.role]} color={moderator.role === "admin" ? "secondary" : "default"} variant="outlined" />
                        <Box sx={{ flexGrow: 1 }} />
                        {isAdmin && moderator.source === "granted" && moderator.user.userId !== loginUser?.userId &&
                        <Button size="small" color="error" disabled={busyId === moderator.user.userId} onClick={() => remove(moderator)}>Remove</Button>}
                    </Paper>
                ))}
            </Box>}
            {snackbar}
        </>
    );
}

export default ModeratorsTab;
