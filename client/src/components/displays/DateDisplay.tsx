import { PopperPlacementType, Typography, TypographyVariant } from "@mui/material";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { useOutletContext } from "react-router";
import TimeAgo from "react-timeago";
import { ContextParams } from "../../common/common";
import { dateFormat, dateTimeFormat, relativeTimeFormatter } from "../../common/datetime";
import { useNow } from "../../common/states";

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

interface IDateDisplayProps {
    date: string
    fontWeight?: string | number
    tooltipPlacement?: PopperPlacementType
    color?: string
    useDateTime?: boolean
    variant?: TypographyVariant
}

function DateDisplay(props: IDateDisplayProps) {
    const { date, fontWeight, tooltipPlacement, color, useDateTime, variant } = props;
    const [ now ] = useNow();
    const { settings } = useOutletContext() as ContextParams;

    const dateValue = new Date(date);
    const maxDaysAgo = now - (settings.maxDaysRelativeDates * 24 * 60 * 60 * 1000);
    const lessThanMaxDaysAgo = dateValue.getTime() > maxDaysAgo;
    const placement = tooltipPlacement ? tooltipPlacement : "right";
    const tooltipText = lessThanMaxDaysAgo ? dateTimeFormat.format(dateValue) : timeFormat.format(dateValue);

    return (
        <Typography variant={variant ?? "inherit"} display="inline-flex" fontWeight={fontWeight} color={color}>
            {(useDateTime && !lessThanMaxDaysAgo) ?
            <Box component="span">{dateTimeFormat.format(dateValue)}</Box>
            :
            <Tooltip placement={placement} title={tooltipText} disableInteractive slotProps={{ popper: { modifiers: [{ name: "offset", options: { offset: [0, -6] } }] } }} >
                {lessThanMaxDaysAgo ? 
                <TimeAgo date={dateValue} title="" formatter={relativeTimeFormatter} /> 
                : 
                <Box component="span">{useDateTime ? dateTimeFormat.format(dateValue) : dateFormat.format(dateValue)}</Box>}
            </Tooltip>}
        </Typography>
    );
}

export default DateDisplay;