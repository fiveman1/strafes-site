import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { darken } from "@mui/system";

interface ColorChipProps {
    color: string
    label: string
}

function ColorChip(props: ColorChipProps) {
    const { color, label } = props;

    return (
        <Box sx={{
            display: "inline-flex"
        }}>
            <Typography
                variant="body2"
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    fontWeight: "bold",
                    border: `1px solid ${color}`,
                    bgcolor: darken(color, 0.3),
                    borderRadius: "8px",
                    color: "white",
                    px: 0.5,
                    py: 0.25,
                    my: 0.25,
                    textShadow: "black 1px 1px 1px"
                }}>
                {label}
            </Typography>
        </Box>
    );
}

export default ColorChip;