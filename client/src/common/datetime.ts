import { Suffix, Unit } from "react-timeago";

export const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

export const dateTimeFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
});

export const shortDateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short"
});

// So react-timeago has this makeIntlFormatter that you're supposed to be able to import and use out of the box,
// but they forgot to export it. So basically I'm making my own version of it.
export const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, {
    style: "long",
    numeric: "auto"
})

export function relativeTimeFormatter(value: number, unit: Unit, suffix: Suffix) {
    return relativeTimeFormat.format(suffix === "ago" ? -value : value, unit);
}