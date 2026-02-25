import { lighten, PaletteMode, Theme } from "@mui/material";
import { Maps } from "../api/api";
import { formatGame, Game, LoginUser, Map, SettingsValues, Style, TierVotingEligibilityInfo, UserRole } from "shared";
import { download, generateCsv, mkConfig } from "export-to-csv";

export interface MapCount {
    bhop: number
    surf: number
    flyTrials: number
}

export interface ContextParams {
    maps: Maps,
    sortedMaps: Map[]
    mapCounts: MapCount
    highPercentileLoadCount: number
    loggedInUser: LoginUser | undefined
    settings: SettingsValues
    setSettings: (val: SettingsValues) => void
    setMode: (mode: PaletteMode) => void
    votingInfo: TierVotingEligibilityInfo | undefined
}

export function getUserRoleColor(role: UserRole, theme: Theme) {
    const color = getUserRoleColorCore(role);
    
    if (!color) {
        return theme.palette.primary.main;
    }
    
    if (theme.palette.mode === "dark") {
        return lighten(color, 0.1);
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
            return "#e79ddd";
        case UserRole.InGameHeadMod:
            return "#e96ed8";
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
    setSelectedMap: (map: Map | undefined) => void
}

export function getGameColor(game: Game, theme: Theme) {
    const color = getGameColorCore(game);

    if (!color) {
        return theme.palette.primary.main;
    }

    if (theme.palette.mode === "dark") {
        return lighten(color, 0.1);
    }
    return color;
}

function getGameColorCore(game: Game) {
    switch (game) {
        case Game.bhop:
            return "#df2a2a";
        case Game.surf:
            return "#186ae4";
        case Game.fly_trials:
            return "#31d310";
        default:
            return undefined;
    }
}

export function getStyleColor(style: Style, theme: Theme) {
    const color = getStyleColorCore(style);

    if (!color) {
        return theme.palette.primary.main;
    }

    return color;
}

function getStyleColorCore(style: Style) {
    switch (style) {
        case Style.autohop:
        case Style.fly:
            return "#df5d2a";
        case Style.scroll:
        case Style.fly_sustain:
            return "#74c926";
        case Style.sideways:
        case Style.rocket:
            return "#df2aa9";
        case Style.hsw:
        case Style.strafe_3d:
            return "#e478d5";
        case Style.wonly:
        case Style.rocket_strafe:
            return "#2aa6df";
        case Style.aonly:
            return "#2a54df";
        case Style.backwards:
            return "#3c2adf";
        case Style.faste:
            return "#b92eff";
        case Style.low_gravity:
            return "#df2a8e";
        case Style.all:
            return "#df2a33";
    }
}

export function mapsToCsv(sortedMaps: Map[]) {
    if (sortedMaps.length < 1) {
        return;
    }

    const csvConfig = mkConfig({
        filename: "maps", columnHeaders: [
            "id", "name", "creator", "game", "release_date", "load_count", "courses", "tier"
        ]
    });
    const mapData: Record<string, number | string | boolean | null | undefined>[] = [];
    for (const map of sortedMaps) {
        mapData.push({
            id: map.id,
            name: map.name,
            creator: map.creator,
            game: formatGame(map.game),
            release_date: map.date,
            load_count: map.loadCount,
            courses: map.modes,
            tier: map.tier ?? 0
        });
    }
    const csv = generateCsv(csvConfig)(mapData);
    download(csvConfig)(csv);
}