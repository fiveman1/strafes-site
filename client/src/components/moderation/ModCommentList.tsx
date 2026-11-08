import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MAX_COMMENT_MODERATION_REASON_LENGTH, ModComment } from "shared";
import { ModAction, resolveModComment } from "../../api/api";
import BanDialog, { BanTarget } from "./BanDialog";
import useModFeedback from "./useModFeedback";
import ModCommentCard from "./ModCommentCard";

interface ModCommentListProps {
    comments: ModComment[]
    emptyText: string
}

function ModCommentList(props: ModCommentListProps) {
    const { comments, emptyText } = props;
    const { notify, refresh, snackbar } = useModFeedback();
    const [busyId, setBusyId] = useState<string | undefined>(undefined);
    // Targets stay set after closing, so the dialogs don't go blank while they fade out
    const [hideTarget, setHideTarget] = useState<ModComment | undefined>(undefined);
    const [hideOpen, setHideOpen] = useState(false);
    const [hideReason, setHideReason] = useState("");
    const [banTarget, setBanTarget] = useState<BanTarget | undefined>(undefined);
    const [banOpen, setBanOpen] = useState(false);

    const act = async (comment: ModComment, action: ModAction, reason?: string) => {
        setBusyId(comment.id);
        const result = await resolveModComment(comment.id, action, reason);
        if (!result.ok) {
            notify(result.error);
        }
        await refresh();
        setBusyId(undefined);
    };

    const onAction = (comment: ModComment, action: ModAction) => {
        if (action === "hide") {
            setHideTarget(comment);
            setHideOpen(true);
        }
        else {
            act(comment, action);
        }
    };

    const closeHide = () => {
        setHideOpen(false);
        setHideReason("");
    };

    const confirmHide = () => {
        if (!hideTarget) return;
        const reason = hideReason.trim();
        act(hideTarget, "hide", reason === "" ? undefined : reason);
        closeHide();
    };

    return (
        <>
            {comments.length === 0 ?
            <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
                {emptyText}
            </Typography>
            :
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {comments.map((comment) => (
                    <ModCommentCard
                        key={comment.id}
                        comment={comment}
                        busy={busyId === comment.id}
                        onAction={onAction}
                        onBan={(comment) => {
                            setBanTarget({ userId: comment.author.userId, username: comment.author.username });
                            setBanOpen(true);
                        }}
                    />
                ))}
            </Box>}

            <Dialog open={hideOpen} onClose={closeHide} fullWidth maxWidth="xs">
                <DialogTitle>Hide comment</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, overflowWrap: "anywhere" }}>
                        @{hideTarget?.author.username}: "{hideTarget?.body}"
                    </Typography>
                    <TextField
                        value={hideReason}
                        onChange={(event) => setHideReason(event.target.value)}
                        label="Reason (optional)"
                        size="small"
                        fullWidth
                        multiline
                        maxRows={4}
                        autoFocus
                        slotProps={{ htmlInput: { maxLength: MAX_COMMENT_MODERATION_REASON_LENGTH } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button color="inherit" onClick={closeHide}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmHide}>Hide</Button>
                </DialogActions>
            </Dialog>

            <BanDialog
                open={banOpen}
                target={banTarget}
                onClose={() => setBanOpen(false)}
                onBanned={() => {
                    notify(`Banned ${banTarget?.username ? "@" + banTarget.username : "the user"} from commenting`);
                    refresh();
                }}
            />
            {snackbar}
        </>
    );
}

export default ModCommentList;
