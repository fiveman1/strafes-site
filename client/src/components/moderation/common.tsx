import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { CommentHiddenBy, Game, ModUser, ReplayCommentStatus, Style } from "shared";
import UserLink from "../displays/UserLink";

export function ModUserLink(props: { user: ModUser, avatarSize?: number, game?: Game, style?: Style }) {
    const { user, avatarSize, game, style } = props;
    return (
        <UserLink
            userId={user.userId}
            username={user.username ?? `User ${user.userId}`}
            userRoles={user.userRoles}
            userCountry={user.userCountry}
            userThumb={user.userThumb}
            game={game}
            strafesStyle={style}
            avatarSize={avatarSize}
            showAt={user.username !== undefined}
            underline="hover"
            sx={{ fontWeight: 600, verticalAlign: "middle", minWidth: 0 }}
        />
    );
}

export function StatusChip(props: { status: ReplayCommentStatus, hiddenBy?: CommentHiddenBy }) {
    const { status, hiddenBy } = props;
    switch (status) {
        case "visible":
            return <Chip size="small" variant="outlined" color="success" label="Visible" />;
        case "pending":
            return <Chip size="small" color="warning" label="Waiting for review" />;
        case "hidden":
            return <Chip size="small" color="error" variant="outlined" label={hiddenBy === "runner" ? "Hidden by the runner" : "Hidden by a moderator"} />;
        case "deleted":
            return <Chip size="small" variant="outlined" label="Deleted by the author" />;
    }
}

interface PageControlsProps {
    page: number
    hasNext: boolean
    onPage: (page: number) => void
    // Shown between the buttons, like "Page 2 of 5"
    label?: string
}

export function PageControls(props: PageControlsProps) {
    const { page, hasNext, onPage, label } = props;
    if (page === 1 && !hasNext) return null;
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 2 }}>
            <Button size="small" disabled={page <= 1} onClick={() => onPage(page - 1)}>Newer</Button>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{label ?? `Page ${page}`}</Typography>
            <Button size="small" disabled={!hasNext} onClick={() => onPage(page + 1)}>Older</Button>
        </Box>
    );
}

export function Loading() {
    return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
        </Box>
    );
}

export function LoadFailed() {
    return (
        <Typography sx={{ color: "error.main", py: 4, textAlign: "center" }}>
            Couldn't load this, try refreshing.
        </Typography>
    );
}
