import { Game, Style } from "./interfaces.js";

export function safeQuoteText(str: string) {
    return str.replaceAll("\"", "&quot;");
}

export function formatGame(game?: Game) {
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

export function formatStyle(style?: Style) {
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

export function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;
}