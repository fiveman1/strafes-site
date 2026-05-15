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
        <Box display="inline-flex">
            <Typography 
                display="inline-flex"
                alignItems="center"
                variant="body2" 
                fontWeight="bold"
                color={"white"} 
                border={`1px solid ${color}`} 
                bgcolor={darken(color, 0.3)}
                borderRadius="8px"
                px={0.5}
                py={0.25}
                my={0.25}
                sx={{
                    textShadow: "black 1px 1px 1px"
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

export default ColorChip;