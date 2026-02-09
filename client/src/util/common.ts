import { lighten, PaletteMode, Theme } from "@mui/material";
import { Maps } from "../api/api";
import { Game, LoginUser, Map, SettingsValues, Style, UserRole } from "shared";

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
    setSettings: (val: SettingsValues) => void
    setMode: (mode: PaletteMode) => void
    isAuthorized: boolean
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
            return "#ff00d5";
        case UserRole.Dev:
            return "#3b92ff";
        case UserRole.DatabaseMan:
            return "#ee0c1f";
        case UserRole.GameCreator:
            return "#7700ff";
        default:
            return undefined;
    }
}

export const RANK_HELP_TEXT = "Rank is based on the weighted sum of a user's times. Better placements are worth more.";
export const SKILL_HELP_TEXT = "Skill is based on the average percentile of a user's times. Maps with more completions have a higher weight.";

export function getAllowedGameForMap(map: Map | undefined) {
    if (map === undefined) {
        return [Game.bhop, Game.surf, Game.fly_trials];
    }

    const allowedGames = [map.game];
    if (map.game !== Game.fly_trials) {
        allowedGames.push(Game.fly_trials);
    }

    return allowedGames;
}

export interface MapDetailsProps {
    selectedMap: Map | undefined
    setSelectedMap: (map: Map | undefined, href: string) => void
    game: Game
    style: Style
}