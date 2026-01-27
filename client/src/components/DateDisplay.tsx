import { PopperPlacementType } from "@mui/material";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import TimeAgo, { Suffix, Unit } from "react-timeago";

const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

const dateTimeFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
});

interface IDateDisplayProps {
    date: string
    bold?: boolean
    tooltipPlacement?: PopperPlacementType
}

// So react-timeago has this makeIntlFormatter that you're supposed to be able to import and use out of the box,
// but they forgot to export it. So basically I'm making my own version of it.
const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, {
    style: "long",
    numeric: "auto"
})

function relativeTimeFormatter(value: number, unit: Unit, suffix: Suffix) {
    return relativeTimeFormat.format(suffix === "ago" ? -value : value, unit);
}

function DateDisplay(props: IDateDisplayProps) {
    const { date, bold, tooltipPlacement } = props;
    const dateValue = new Date(date);
    const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
    const lessThanThirtyDaysAgo = dateValue.getTime() > thirtyDaysAgo;
    const placement = tooltipPlacement ? tooltipPlacement : "right";
    const tooltipText = lessThanThirtyDaysAgo ? dateTimeFormat.format(dateValue) : timeFormat.format(dateValue);
    
    return (
        <Tooltip placement={placement} title={tooltipText} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -6]}}]}}} >
            <Box display="inline-block" fontWeight={bold ? "bold" : undefined}>
                {lessThanThirtyDaysAgo ? <TimeAgo date={dateValue} title="" formatter={relativeTimeFormatter} /> : dateFormat.format(dateValue)}
            </Box>
        </Tooltip>
    );
}

export default DateDisplay;