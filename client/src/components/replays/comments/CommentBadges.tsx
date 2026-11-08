import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";

function Badge(props: { label: string, color: string }) {
    const { label, color } = props;
    return (
        <Typography
            variant="caption"
            sx={{
                px: 0.75,
                borderRadius: "4px",
                lineHeight: "18px",
                fontWeight: 600,
                bgcolor: alpha(color, 0.16),
                color: color
            }}>
            {label}
        </Typography>
    );
}

interface CommentBadgesProps {
    isRunner: boolean
    isOwn: boolean
    // Over the player, which is dark in either theme
    onDark?: boolean
}

function CommentBadges(props: CommentBadgesProps) {
    const { isRunner, isOwn, onDark } = props;
    const theme = useTheme();
    const shade = onDark ? "light" : "main";
    return (
        <>
            {isRunner && <Badge label="Runner" color={theme.palette.secondary[shade]} />}
            {isOwn && <Badge label="You" color={theme.palette.primary[shade]} />}
        </>
    );
}

export default CommentBadges;
