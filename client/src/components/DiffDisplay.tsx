import Box from "@mui/material/Box";
import { formatDiff, formatTime } from "../util/format";
import { green, red } from "@mui/material/colors";
import { darken, useTheme } from "@mui/material";
import { convertToHSL, HSLToHex } from "../util/colors";
import { normalize } from "../util/utils";

interface IDiffDisplayProps {
    ms: number,
    diff?: number
}

function DiffDisplay(props: IDiffDisplayProps) {
    const { ms, diff } = props;
    
    const theme = useTheme();

    if (diff === undefined) {
        return undefined;
    }

    let diffColor : string;
    if (diff > 0) {
        diffColor = theme.palette.mode === "dark" ? red["A400"] : darken(red["A400"], 0.2);
        const wrTime = ms - diff;
        let ratio = diff / wrTime;
        const maxRatio = 0.05;
        // Desaturate the color, if it's 5% worse than WR then use full saturation,
        // otherwise we will scale it linearly on a normalized scale between 0% to 5%.
        if (ratio < maxRatio) {
            ratio = normalize(ratio, 0, maxRatio, 0.55, 1);
            const hsl = convertToHSL(diffColor);
            hsl.s *= ratio;
            diffColor = HSLToHex(hsl);
        }
    }
    else {
        diffColor = theme.palette.mode === "dark" ? green["A400"] : darken(green["A400"], 0.3);
    }

    let diffText = "WR";
    const formatted = formatDiff(Math.abs(diff));
    if (diff > 0) {
        diffText = `+${formatted}`;
    }
    else if (diff < 0) {
        diffText = `-${formatted}`;
    }
    
    return (
        <Box display="inline-block" color={diffColor}>
            {`(${diffText})`}
        </Box>
    );
}

export default DiffDisplay;