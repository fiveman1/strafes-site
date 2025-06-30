import { Maps } from "../api/api";
import { Game, Map, Style } from "../api/interfaces";

export function formatGame(game: Game) {
    switch (game) {
        case Game.bhop:
            return "bhop";
        case Game.surf:
            return "surf";
        default:
            return "unknown";
    }
}

export function formatStyle(style: Style) {
    switch (style) {
        case Style.aonly:
            return "a-only";
        case Style.autohop:
            return "autohop";
        case Style.backwards:
            return "backwards";
        case Style.faste:
            return "faste";
        case Style.hsw:
            return "half-sideways";
        case Style.scroll:
            return "scroll";
        case Style.sideways:
            return "sideways";
        case Style.wonly:
            return "w-only";
        default:
            return "unknown";
    }
}

function formatTimeHelper(time: number, digits: number) {
    let timeStr = time.toString();
    while (timeStr.length < digits) {
        timeStr = "0" + timeStr;
    }
    return timeStr;
}

export function formatTime(timeStr: string) {
    const time = +timeStr;
    if (time > 86400000) {
        const days = Math.floor(time / 86400000);
        if (days > 999) {
            return ">999 days";
        }
        if (days === 1) {
            return "~1 day";
        }
        return `~${days} days`;
    }
    const millis = formatTimeHelper(time % 1000, 3)
    const seconds = formatTimeHelper(Math.floor(time / 1000) % 60, 2)
    const minutes = formatTimeHelper(Math.floor(time / (1000 * 60)) % 60, 2)
    const hours = formatTimeHelper(Math.floor(time / (1000 * 60 * 60)) % 24, 2)
    if (hours === "00") {
        return minutes + ":" + seconds + "." + millis
    }
    return hours + ":" + minutes + ":" + seconds
}

export interface ContextParams {
    maps: Maps,
    sortedMaps: Map[]
}