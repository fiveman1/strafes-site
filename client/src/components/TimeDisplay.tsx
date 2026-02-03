import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime } from "../util/format";
import DiffDisplay from "./DiffDisplay";

interface ITimeDisplayProps {
    ms: number,
    diff?: number
    hideDiff?: boolean
}

function TimeDisplay(props: ITimeDisplayProps) {
    const { ms, diff, hideDiff } = props;

    if (hideDiff) {
        return (
            <Typography variant="inherit">
                {formatTime(ms)}
            </Typography>
        );
    }
    
    return (
        <Box display="flex" flexDirection="row" alignItems="center">
            <Typography variant="inherit" width="72px">
                {formatTime(ms)}
            </Typography>
            <DiffDisplay ms={ms} diff={diff} />
        </Box>
    );
}

export default TimeDisplay;