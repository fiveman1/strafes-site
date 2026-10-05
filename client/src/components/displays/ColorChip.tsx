import Box from "@mui/material/Box";
import { alpha, darken, lighten, SxProps, Theme, useTheme } from "@mui/material/styles";

interface ColorChipProps {
    color: string
    label: string
    sx?: SxProps<Theme>
}

function ColorChip(props: ColorChipProps) {
    const { color, label, sx } = props;
    const isLight = useTheme().palette.mode === "light";

    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                height: 20,
                px: 0.75,
                borderRadius: "5px",
                fontSize: "0.75rem",
                fontWeight: 500,
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: isLight ? darken(color, 0.55) : lighten(color, 0.35),
                bgcolor: alpha(color, isLight ? 0.2 : 0.16),
                ...sx
            }}>
            {label}
        </Box>
    );
}

export default ColorChip;
