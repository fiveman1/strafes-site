import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatDiff, formatTime } from "../util/format";
import { green, red } from "@mui/material/colors";
import { darken, useTheme } from "@mui/material";
import { convertToHSL, HSLToHex } from "../util/colors";

interface ITimeDisplayProps {
    ms: number,
    diff?: number
}

function normalize(val: number, minVal: number, maxVal: number, newMin: number, newMax: number) {
  return newMin + (val - minVal) * (newMax - newMin) / (maxVal - minVal);
};

function TimeDisplay(props: ITimeDisplayProps) {
    const { ms, diff } = props;
    
    const theme = useTheme();

    let diffColor = (diff ?? 0) > 0 ? 
        theme.palette.mode === "dark" ? red["A400"] : darken(red["A400"], 0.2) :
        theme.palette.mode === "dark" ? green["A400"] : darken(green["A400"], 0.3);

    if (diff && diff > 0) {
        const wrTime = ms - diff;
        let ratio = diff / wrTime;
        const maxRatio = 0.05;
        // Desaturate the color, if it's 10% worse than WR then use full saturation,
        // otherwise we will scale it linearly on a normalized scale between 0% to 10%.
        if (ratio > maxRatio) {
            ratio = maxRatio;
        }
        ratio = normalize(ratio, 0, maxRatio, 0.55, 1);

        const hsl = convertToHSL(diffColor);
        hsl.s *= ratio;
        diffColor = HSLToHex(hsl);
    }
    
    return (
        <Box display="flex" flexDirection="row" alignItems="center">
            <Typography variant="inherit" width="72px">
                {formatTime(ms)}
            </Typography>
            {diff !== undefined ? 
            <Box display="inline-block"  color={diffColor}>
                {`(${diff > 0 ? `+${formatDiff(Math.abs(diff))}` : "WR"})`}
            </Box>
            : <></>}
        </Box>
    );
}

export default TimeDisplay;