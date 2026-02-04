import { PaletteMode } from "@mui/material";
import { useState } from "react";
import { Game, SettingsValues, Style, UserSearchData } from "../api/interfaces";
import { useLocation, useOutletContext } from "react-router";
import { ContextParams } from "./format";

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
const MAP_SORTS = ["nameAsc" , "nameDesc" , "creatorAsc" , "creatorDesc" , "dateAsc" , "dateDesc" , "countAsc" , "countDesc"];
export function isMapSort(value: string): value is MapTimesSort {
    return MAP_SORTS.includes(value);
}

export function useMapSort() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramSort: MapTimesSort = "nameAsc";
    const sortParam = queryParams.get("sort");
    if (sortParam && isMapSort(sortParam)) {
        paramSort = sortParam;
    }
    return useState<MapTimesSort>(paramSort);
}

export type CompareTimesSort = "mapAsc" | "mapDesc" | "dateAsc" | "dateDesc" | "timeAsc" | "timeDesc" | "diffAsc" | "diffDesc";
export type CompareTimesSortRaw = "map" | "date" | "time" | "diff";
const COMPARE_SORTS = ["mapAsc" , "mapDesc" , "dateAsc" , "dateDesc" , "timeAsc" ,"timeDesc", "diffAsc", "diffDesc"];
export function isCompareTimesSort(value: string): value is CompareTimesSort {
    return COMPARE_SORTS.includes(value);
}

export function useCompareSort() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramSort: CompareTimesSort = "diffAsc";
    const sortParam = queryParams.get("sort");
    if (sortParam && isCompareTimesSort(sortParam)) {
        paramSort = sortParam;
    }
    return useState<CompareTimesSort>(paramSort);
}

export function useCourse() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramCourse = 0;
    const styleParam = queryParams.get("course");
    if (styleParam !== null && !isNaN(+styleParam) && +styleParam >= 0) {
        paramCourse = +styleParam;
    }
    return useState(paramCourse);
}

export function useGame(paramName: string = "game", defaultGame?: Game) {
    const location = useLocation();
    const context = useOutletContext() as ContextParams;
    const queryParams = new URLSearchParams(location.search);
    let paramGame = defaultGame ?? context.settings.defaultGame;
    const gameParam = queryParams.get(paramName);
    if (gameParam !== null && !isNaN(+gameParam) && Game[+gameParam] !== undefined) {
        paramGame = +gameParam;
    }
    return useState(paramGame);
}

export function useStyle() {
    const location = useLocation();
    const context = useOutletContext() as ContextParams;
    const queryParams = new URLSearchParams(location.search);
    
    let paramStyle = context.settings.defaultStyle;
    const styleParam = queryParams.get("style");
    if (styleParam !== null && !isNaN(+styleParam) && Style[+styleParam] !== undefined) {
        paramStyle = +styleParam;
    }
    return useState(paramStyle);
}

export function useIncludeBonuses() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

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
    const [selectedUser, setSelectedUser] = useState<UserSearchData>({username: ""});
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