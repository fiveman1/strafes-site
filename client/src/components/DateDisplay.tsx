import { PopperPlacementType, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useOutletContext } from "react-router";
import TimeAgo from "react-timeago";
import { ContextParams } from "../util/format";
import { dateFormat, dateTimeFormat, relativeTimeFormatter } from "../util/datetime";

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

interface IDateDisplayProps {
    date: string
    fontWeight?: string | number
    tooltipPlacement?: PopperPlacementType
    color?: string
}

function DateDisplay(props: IDateDisplayProps) {
    const { date, fontWeight, tooltipPlacement, color } = props;
    const context = useOutletContext() as ContextParams;

    const dateValue = new Date(date);
    const maxDaysAgo = new Date().getTime() - (context.settings.maxDaysRelativeDates * 24 * 60 * 60 * 1000);
    const lessThanMaxDaysAgo = dateValue.getTime() > maxDaysAgo;
    const placement = tooltipPlacement ? tooltipPlacement : "right";
    const tooltipText = lessThanMaxDaysAgo ? dateTimeFormat.format(dateValue) : timeFormat.format(dateValue);
    
    return (
        <Typography variant="inherit" display="inline-flex" fontWeight={fontWeight} color={color}>
            <Tooltip placement={placement} title={tooltipText} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -6]}}]}}} >
                {lessThanMaxDaysAgo ? <TimeAgo date={dateValue} title="" formatter={relativeTimeFormatter} /> : <Box component="span">{dateFormat.format(dateValue)}</Box>}
            </Tooltip>
        </Typography>
    );
}

export default DateDisplay;