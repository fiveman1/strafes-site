import { Box } from "@mui/material";
import TimeDisplay from "./TimeDisplay";
import DateDisplay from "./DateDisplay";
import { Time } from "../api/interfaces";

function TimeDateColumn(props: {time: Time}) {
    const { time } = props;

    return (
        <Box display="flex" flexDirection="column" height="100%" lineHeight="normal" justifyContent="center" alignItems="center">
            <TimeDisplay ms={time.time} diff={time.wrDiff} multiLine />
            <Box height={"2px"} />
            <DateDisplay date={time.date} color="text.secondary" />
        </Box>
    );
}

export default TimeDateColumn;