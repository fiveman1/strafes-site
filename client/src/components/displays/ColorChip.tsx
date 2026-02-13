import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface ColorChipProps {
    color: string
    label: string
    outlined?: boolean
}

function ColorChip(props: ColorChipProps) {
    const { color, label, outlined } = props;

    return (
        <Box display="inline-flex">
            <Typography 
                display="inline-flex"
                alignItems="center"
                variant="body2" 
                color={outlined ? color : "white"} 
                border={outlined ? `1px solid ${color}` : undefined} 
                bgcolor={outlined ? undefined : color}
                borderRadius="16px"
                // lineHeight={1.85}
                pr={1.25} 
                pl={1.25} 
                pt={0.375}
                pb={0.375}
                mt={0.25} 
                mb={0.25}
                sx={{
                    textShadow: outlined ? undefined : "black 1px 1px 1px"
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

export default ColorChip;