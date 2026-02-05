import { Box } from "@mui/material";
import TimeDisplay from "./TimeDisplay";
import DateDisplay from "./DateDisplay";
import { Time } from "shared";
import DiffDisplay from "./DiffDisplay";

function TimeDateColumn(props: {time: Time}) {
    const { time } = props;

    return (
        <Box display="flex" flexDirection="column" height="100%" lineHeight="normal" justifyContent="center" alignItems="center">
            <TimeDisplay ms={time.time} hideDiff />
            <DiffDisplay ms={time.time} diff={time.wrDiff} />
            <DateDisplay date={time.date} color="text.secondary" />
        </Box>
    );
}

export default TimeDateColumn;