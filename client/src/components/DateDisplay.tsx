import { PopperPlacementType } from "@mui/material";
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

interface IDateDisplayProps {
    date: string
    bold?: boolean
    tooltipPlacement?: PopperPlacementType
    noRecentHighlight?: boolean
}

function DateDisplay(props: IDateDisplayProps) {
    const { date, bold, tooltipPlacement, noRecentHighlight } = props;
    const dateValue = new Date(date);
    const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
    const lessThanOneDay = dateValue.getTime() > oneDayAgo;
    const placement = tooltipPlacement ? tooltipPlacement : "right";
    return (
        <Tooltip placement={placement} title={timeFormat.format(dateValue)} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -6]}}]}}} >
            <Box display="inline-block" fontWeight={bold ? "bold" : undefined}>
                {dateFormat.format(dateValue)}
                {lessThanOneDay && !noRecentHighlight ? <Typography color="info" variant="inherit" display="inline-block" marginLeft="1px">*</Typography> : undefined}
            </Box>
        </Tooltip>
    );
}

export default DateDisplay;