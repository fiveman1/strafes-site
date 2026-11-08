import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MAX_COMMENT_MODERATION_REASON_LENGTH } from "shared";
import { banCommenter } from "../../api/api";
import { useFoundUser } from "../../common/states";
import UserSearch from "../search/UserSearch";

const BAN_DURATIONS: { label: string, days: number | undefined }[] = [
    { label: "1 day", days: 1 },
    { label: "7 days", days: 7 },
    { label: "30 days", days: 30 },
    { label: "Permanent", days: undefined }
];

export interface BanTarget {
    userId: number
    username?: string
}

interface BanDialogProps {
    open: boolean
    // Unset to search for the user
    target?: BanTarget
    onClose: () => void
    onBanned: () => void
}

function BanDialog(props: BanDialogProps) {
    const { open, target, onClose, onBanned } = props;
    const foundUser = useFoundUser();
    const [reason, setReason] = useState("");
    const [durationIndex, setDurationIndex] = useState(1);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const close = () => {
        foundUser.clear();
        setReason("");
        setDurationIndex(1);
        setError("");
        onClose();
    };

    const submit = async () => {
        const userId = target?.userId ?? foundUser.userId;
        if (userId === undefined) return;
        setSending(true);
        setError("");
        const result = await banCommenter(userId, reason.trim(), BAN_DURATIONS[durationIndex].days);
        setSending(false);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        onBanned();
        close();
    };

    const canSubmit = reason.trim() !== "" && (target !== undefined || foundUser.userId !== undefined) && !sending;

    return (
        <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
            <DialogTitle>
                {target ? `Ban ${target.username ? "@" + target.username : "user " + target.userId} from commenting` : "Ban from commenting"}
            </DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {!target &&
                <Box sx={{ mt: 1 }}>
                    <UserSearch setUserId={foundUser.setUserId} userSearch={foundUser.userSearch} autoFocus />
                </Box>}
                <TextField
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    label="Reason"
                    size="small"
                    multiline
                    maxRows={4}
                    required
                    autoFocus={target !== undefined}
                    sx={{ mt: target ? 1 : 0 }}
                    slotProps={{ htmlInput: { maxLength: MAX_COMMENT_MODERATION_REASON_LENGTH } }}
                />
                <TextField
                    select
                    value={durationIndex}
                    onChange={(event) => setDurationIndex(+event.target.value)}
                    label="Length"
                    size="small">
                    {BAN_DURATIONS.map((duration, index) => (
                        <MenuItem key={duration.label} value={index}>{duration.label}</MenuItem>
                    ))}
                </TextField>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Their existing comments stay up.
                </Typography>
                {error !== "" &&
                <Typography variant="body2" role="alert" sx={{ color: "error.main" }}>
                    {error}
                </Typography>}
            </DialogContent>
            <DialogActions>
                <Button color="inherit" onClick={close}>Cancel</Button>
                <Button variant="contained" color="error" disabled={!canSubmit} onClick={submit}>Ban</Button>
            </DialogActions>
        </Dialog>
    );
}

export default BanDialog;
