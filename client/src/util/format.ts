import { lighten, PaletteMode, Theme } from "@mui/material";
import { Maps } from "../api/api";
import { bhop_styles, fly_trials_styles, Game, LoginUser, Map, SettingsValues, Style, surf_styles, UserRole } from "../api/interfaces";

export function formatGame(game: Game) {
    switch (game) {
        case Game.bhop:
            return "bhop";
        case Game.surf:
            return "surf";
        case Game.fly_trials:
            return "fly trials";
        case Game.all:
            return "all";
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
        case Style.low_gravity:
            return "low gravity";
        case Style.fly:
            return "fly";
        case Style.fly_sustain:
            return "fly sustain";
        case Style.rocket:
            return "rocket";
        case Style.rocket_strafe:
            return "rocket strafe";
        case Style.strafe_3d:
            return "3d strafe";
        case Style.all:
            return "all";
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

export function formatTime(time: number) {
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

const ranks = ["New","Newb","Bad","Okay","Not Bad","Decent","Getting There","Advanced","Good","Great","Superb","Amazing","Sick","Master","Insane","Majestic","Baby Jesus","Jesus","Half God","God"];

export function formatRank(rank: number) {
    return `${ranks[rank - 1]} (${rank})`;
}

export function formatSkill(skill: number) {
    return `${(skill * 100).toFixed(3)}%`
}

export interface MapCount {
    bhop: number
    surf: number
    flyTrials: number
}

export interface ContextParams {
    maps: Maps,
    sortedMaps: Map[]
    mapCounts: MapCount
    settings: SettingsValues
    loggedInUser: LoginUser | undefined
    setSettings: (val: React.SetStateAction<SettingsValues>) => void
    setMode: (mode: PaletteMode) => void
}

export function getAllowedStyles(game: Game) {
    switch (game) {
        case Game.bhop:
            return bhop_styles;
        case Game.surf:
            return surf_styles;
        case Game.fly_trials:
            return fly_trials_styles;
        case Game.all:
            return surf_styles;
        default:
            return [];
    }
}

function getOrdinal(num: number) {
    const remainder = num % 100;
    if (remainder > 13 || remainder < 11) {
        const n = remainder % 10;
        if (n === 1) return "st";
        else if (n === 2) return "nd";
        else if (n === 3) return "rd";
    }
    return "th";
}

export function formatPlacement(placement?: number) {
    if (placement === undefined) return "-";
    return `${placement}${getOrdinal(placement)}`;
}

export function formatDiff(diffMs: number) {
    const diff = diffMs / 1000;
    if (diff >= 60) {
        let minutes = Math.floor(diff / 60);
        let seconds = Math.round(diff % 60);
        if (seconds === 60) {
            minutes += 1;
            seconds = 0;
        }
        return `${minutes}m ${seconds}s`;
    }
    return `${diff.toFixed(3)}s`;
}

export const MAIN_COURSE = 0;
export const ALL_COURSES = -1;
export function formatCourse(course: number, short?: boolean) {
    course = Math.round(course);
    if (course < 0) {
        return "invalid";
    }
    else if (course === MAIN_COURSE) {
        return "main";
    }
    else {
        return short ? `b${course}` : `bonus ${course}`;
    }
}

export function formatUserRole(role: UserRole) {
    switch (role) {
        case UserRole.Faste:
            return "faste";
        case UserRole.MapMaker:
            return "map maker";
        case UserRole.MapAdmin:
            return "map admin";
        case UserRole.ChatMod:
            return "in-game chat moderator";
        case UserRole.InGameMod:
            return "in-game moderator";
        case UserRole.InGameHeadMod:
            return "in-game head moderator";
        case UserRole.Dev:
            return "developer";
        case UserRole.DatabaseMan:
            return "database developer";
        case UserRole.GameCreator:
            return "game creator";
        default:
            return "unknown";
    }
}

export function getUserRoleColor(role: UserRole, theme: Theme) {
    const color = getUserRoleColorCore(role);
    
    if (!color) {
        return theme.palette.text.primary;
    }
    
    if (theme.palette.mode === "dark") {
        return lighten(color, 0.2);
    }
    return color;
}

function getUserRoleColorCore(role: UserRole) {
    switch (role) {
        case UserRole.Faste:
            return "#b92eff";
        case UserRole.MapMaker:
            return "#f17a2b";
        case UserRole.MapAdmin:
            return "#ffc423";
        case UserRole.ChatMod:
            return "#1bcf78";
        case UserRole.InGameMod:
            return "#c176df";
        case UserRole.InGameHeadMod:
            return "#5c26f1";
        case UserRole.Dev:
            return "#3b92ff";
        case UserRole.DatabaseMan:
            return "#ff00d5";
        case UserRole.GameCreator:
            return "#7700ff";
        default:
            return undefined;
    }
}