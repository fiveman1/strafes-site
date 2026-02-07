import { PaletteMode } from "@mui/material";
import { useState } from "react";
import { Game, getAllowedStyles, SettingsValues, Style, UserSearchData } from "shared";
import { useOutletContext, useSearchParams } from "react-router";
import { ContextParams } from "./common";

export function useSettings() {
    const theme = localStorage.getItem("theme") as PaletteMode || "dark";

    const sGame = localStorage.getItem("game");
    let game = Game.bhop;
    if (sGame && Game[+sGame] !== undefined) {
        game = +sGame;
    }

    const sStyle = localStorage.getItem("style");
    let style = Style.autohop;
    if (sStyle && Style[+sStyle] !== undefined) {
        style = +sStyle;
    }

    const sMaxDays = localStorage.getItem("maxDays");
    let maxDays = 30;
    if (sMaxDays && !isNaN(+sMaxDays) && +sMaxDays >= 0) {
        maxDays = +sMaxDays;
    }

    const country = localStorage.getItem("country") ?? undefined;

    return useState<SettingsValues>({
        defaultGame: game,
        defaultStyle: style,
        maxDaysRelativeDates: maxDays,
        theme: theme,
        country: country
    });
}

export function saveSettingsToLocalStorage(settings: SettingsValues) {
    localStorage.setItem("game", settings.defaultGame.toString());
    localStorage.setItem("style", settings.defaultStyle.toString());
    localStorage.setItem("theme", settings.theme);
    localStorage.setItem("maxDays", settings.maxDaysRelativeDates.toString());
    localStorage.setItem("country", settings.country ?? "");
}

export type MapTimesSort = "nameAsc" | "nameDesc" | "creatorAsc" | "creatorDesc" | "dateAsc" | "dateDesc" | "countAsc" | "countDesc";
export type MapTimesSortRaw = "name" | "creator" | "date" | "count";
const MAP_SORTS = ["nameAsc", "nameDesc", "creatorAsc", "creatorDesc", "dateAsc", "dateDesc", "countAsc", "countDesc"];
export function isMapSort(value: string): value is MapTimesSort {
    return MAP_SORTS.includes(value);
}

export function useMapSort() {
    const [queryParams] = useSearchParams();

    let paramSort: MapTimesSort = "nameAsc";
    const sortParam = queryParams.get("sort");
    if (sortParam && isMapSort(sortParam)) {
        paramSort = sortParam;
    }
    return useState<MapTimesSort>(paramSort);
}

export type CompareTimesSort = "mapAsc" | "mapDesc" | "dateAsc" | "dateDesc" | "timeAsc" | "timeDesc" | "diffAsc" | "diffDesc";
export type CompareTimesSortRaw = "map" | "date" | "time" | "diff";
const COMPARE_SORTS = ["mapAsc", "mapDesc", "dateAsc", "dateDesc", "timeAsc", "timeDesc", "diffAsc", "diffDesc"];
export function isCompareTimesSort(value: string): value is CompareTimesSort {
    return COMPARE_SORTS.includes(value);
}

export function useCompareSort() {
    const [queryParams] = useSearchParams();

    let paramSort: CompareTimesSort = "diffAsc";
    const sortParam = queryParams.get("sort");
    if (sortParam && isCompareTimesSort(sortParam)) {
        paramSort = sortParam;
    }
    return useState<CompareTimesSort>(paramSort);
}

export function useCourse() {
    const [queryParams] = useSearchParams();

    let paramCourse = 0;
    const styleParam = queryParams.get("course");
    if (styleParam !== null && !isNaN(+styleParam) && +styleParam >= 0) {
        paramCourse = +styleParam;
    }
    return useState(paramCourse);
}

export function useGame(searchName: string = "game", defaultGame?: Game, allowAll?: boolean, disableNav?: boolean): [Game, (game: Game, disableNav?: boolean) => void] {
    const [searchParams, setSearchParams] = useSearchParams();
    const context = useOutletContext() as ContextParams;
    
    let paramGame = defaultGame ?? context.settings.defaultGame;
    const gameParam = searchParams.get(searchName);
    if (gameParam !== null && !isNaN(+gameParam) && Game[+gameParam] !== undefined && (allowAll || +gameParam !== Game.all)) {
        paramGame = +gameParam;
    }
    
    const [game, setGameState] = useState(paramGame);
    const setGame = (game: Game) => {
        setGameState(game);
        if (disableNav) return;
        setSearchParams((params) => {
            params.set(searchName, game.toString());
            return params;
        }, {replace: true});
    };
    return [game, setGame];
}

export function useStyle(allowAll?: boolean): [Style, (style: Style) => void] {
    const [searchParams] = useSearchParams();
    const context = useOutletContext() as ContextParams;

    let paramStyle = context.settings.defaultStyle;
    const styleParam = searchParams.get("style");
    if (styleParam !== null && !isNaN(+styleParam) && Style[+styleParam] !== undefined && (allowAll || +styleParam !== Style.all)) {
        paramStyle = +styleParam;
    }

    return useState(paramStyle);
}

export function useGameStyle(defaultGame?: Game, allowAll?: boolean, disableNav?: boolean) {
    const [, setSearchParams] = useSearchParams();
    const [game, setGameState] = useGame("game", defaultGame, allowAll, true);
    const [style, setStyleState] = useStyle(allowAll);

    const setGame = (game: Game) => {
        setGameState(game);
        const allowedStyles = getAllowedStyles(game);
        let newStyle = style;
        if (!allowedStyles.includes(style) && !(allowAll && style === Style.all)) {
            newStyle = allowedStyles[0];
            setStyleState(newStyle);
        }
        if (disableNav) return newStyle;
        setSearchParams((params) => {
            params.set("game", game.toString());
            params.set("style", newStyle.toString());
            return params;
        }, {replace: true});
        return newStyle;
    }

    const setStyle = (style: Style) => {
        setStyleState(style);
        if (disableNav) return;
        setSearchParams((params) => {
            params.set("game", game.toString());
            params.set("style", style.toString());
            return params;
        }, {replace: true});
    }

    return {game, setGame, style, setStyle};
}

export function useIncludeBonuses() {
    const [queryParams] = useSearchParams();

    let paramBonuses = true;
    if (queryParams.get("bonuses") === "false") {
        paramBonuses = false;
    }
    return useState(paramBonuses);
}

export interface UserSearchInfo {
    userText: string
    setUserText: React.Dispatch<React.SetStateAction<string>>
    selectedUser: UserSearchData
    setSelectedUser: React.Dispatch<React.SetStateAction<UserSearchData>>
    options: readonly UserSearchData[]
    setOptions: React.Dispatch<React.SetStateAction<readonly UserSearchData[]>>
    loadingOptions: boolean
    setIsLoadingOptions: React.Dispatch<React.SetStateAction<boolean>>
}

export function useUserSearch(): [UserSearchInfo, (search: UserSearchInfo) => void] {
    const [userText, setUserText] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserSearchData>({ username: "" });
    const [options, setOptions] = useState<readonly UserSearchData[]>([]);
    const [loadingOptions, setIsLoadingOptions] = useState(false);

    const search = {
        userText: userText,
        setUserText: setUserText,
        selectedUser: selectedUser,
        setSelectedUser: setSelectedUser,
        options: options,
        setOptions: setOptions,
        loadingOptions: loadingOptions,
        setIsLoadingOptions: setIsLoadingOptions
    };

    const setUserSearch = (search: UserSearchInfo) => {
        setUserText(search.userText);
        setSelectedUser(search.selectedUser);
        setOptions(search.options);
        setIsLoadingOptions(search.loadingOptions);
    }

    return [search, setUserSearch];
}

import { useMediaQuery, useTheme } from '@mui/material';

// https://github.com/mui/material-ui/issues/10739#issuecomment-1484828925
export default function useAppBarHeight(): number {
    const {
        mixins: { toolbar },
        breakpoints,
    } = useTheme();

    const queryDesktop = breakpoints.up("sm");
    const queryLandscape = `${breakpoints.up("xs")} and (orientation: landscape)`;

    const isDesktop = useMediaQuery(queryDesktop);
    const isLandscape = useMediaQuery(queryLandscape);

    const cssToolbar =
        toolbar[isDesktop ? queryDesktop : isLandscape ? queryLandscape : ""];

    return ((cssToolbar ?? toolbar) as { minHeight: number })?.minHeight ?? 0;
}