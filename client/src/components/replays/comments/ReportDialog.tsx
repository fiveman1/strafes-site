import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { COMMENT_REPORT_REASONS, CommentReportReason, MAX_COMMENT_REPORT_NOTE_LENGTH, ReplayComment } from "shared";
import { reportReplayComment } from "../../../api/api";
import { REPORT_REASON_LABELS } from "../../../common/comments";

interface ReportDialogProps {
    comment: ReplayComment | undefined
    onClose: () => void
    onReported: (comment: ReplayComment) => void
}

function ReportDialog(props: ReportDialogProps) {
    const { comment, onClose, onReported } = props;
    const [reason, setReason] = useState<CommentReportReason | "">("");
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const close = () => {
        setReason("");
        setNote("");
        setError("");
        onClose();
    };

    const submit = async () => {
        if (!comment || reason === "") return;
        setSending(true);
        setError("");
        const trimmed = note.trim();
        const result = await reportReplayComment(comment.id, reason, trimmed === "" ? undefined : trimmed);
        setSending(false);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        onReported(comment);
        close();
    };

    return (
        <Dialog open={comment !== undefined} onClose={close} fullWidth maxWidth="xs">
            <DialogTitle>Report comment</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5, overflowWrap: "anywhere" }}>
                    @{comment?.username}: "{comment?.body}"
                </Typography>
                <RadioGroup value={reason} onChange={(event) => setReason(event.target.value as CommentReportReason)}>
                    {COMMENT_REPORT_REASONS.map((key) => (
                        <FormControlLabel key={key} value={key} control={<Radio size="small" />} label={REPORT_REASON_LABELS[key]} />
                    ))}
                </RadioGroup>
                <TextField
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    label="Details (optional)"
                    multiline
                    maxRows={4}
                    fullWidth
                    size="small"
                    sx={{ mt: 1.5 }}
                    slotProps={{ htmlInput: { maxLength: MAX_COMMENT_REPORT_NOTE_LENGTH } }}
                />
                {error !== "" &&
                <Typography variant="body2" role="alert" sx={{ color: "error.main", mt: 1 }}>
                    {error}
                </Typography>}
            </DialogContent>
            <DialogActions>
                <Button color="inherit" onClick={close}>Cancel</Button>
                <Button variant="contained" disabled={reason === "" || sending} onClick={submit}>Report</Button>
            </DialogActions>
        </Dialog>
    );
}

export default ReportDialog;
