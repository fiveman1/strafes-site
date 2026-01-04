import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatDiff, formatTime } from "../util/format";
import { green, red } from "@mui/material/colors";
import { darken, useTheme } from "@mui/material";

interface ITimeDisplayProps {
    ms: number,
    diff?: number
}

function TimeDisplay(props: ITimeDisplayProps) {
    const { ms, diff } = props;
    
    const theme = useTheme();

    const diffColor = (diff ?? 0) > 0 ? 
        theme.palette.mode === "dark" ? red["A400"] : darken(red["A400"], 0.2) :
        theme.palette.mode === "dark" ? green["A400"] : darken(green["A400"], 0.3);
    
    return (
        <Box display="flex" flexDirection="row" alignItems="center">
            <Typography variant="inherit" width="72px">
                {formatTime(ms)}
            </Typography>
            {diff !== undefined ? 
            <Box display="inline-block"  color={diffColor}>
                {`(${diff > 0 ? "+" : "-"}${formatDiff(Math.abs(diff))})`}
            </Box>
            : <></>}
        </Box>
    );
}

export default TimeDisplay;