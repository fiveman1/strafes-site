import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

function DateDisplay(props: { date: string }) {
    const { date } = props;
    const dateValue = new Date(date);
    const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
    const lessThanOneDay = dateValue.getTime() > oneDayAgo;
    return (
        <Tooltip placement="right" title={timeFormat.format(dateValue)}>
            <Box display="inline-block">
                {dateFormat.format(dateValue)}
                {lessThanOneDay ? <Typography color="info" variant="inherit" display="inline-block" marginLeft="1px">*</Typography> : undefined}
            </Box>
        </Tooltip>
    );
}

export default DateDisplay;