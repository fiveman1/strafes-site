import { PaletteMode } from "@mui/material";
import { useEffect, useState } from "react";
import { allGames, allGamesWithAll, allStyles, allStylesWithAll, Game, getAllowedStyles, LoginUser, MAX_TIER, SettingsValues, Style, UserSearchData } from "shared";
import { useOutletContext } from "react-router";
import { ContextParams } from "./common";
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsNumberLiteral, parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { useMediaQuery, useTheme } from '@mui/material';
import { queries } from "../api/queries";
import { useQuery } from "@tanstack/react-query";
import { getLoggedInUser, getMaps } from "../api/api";

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

export type MapTimesSort = "nameAsc" | "nameDesc" | "creatorAsc" | "creatorDesc" | "dateAsc" | "dateDesc" | "countAsc" | "countDesc" | "tierAsc" | "tierDesc";
export type MapTimesSortRaw = "name" | "creator" | "date" | "count" | "tier";
const MAP_SORTS: MapTimesSort[] = ["nameAsc", "nameDesc", "creatorAsc", "creatorDesc", "dateAsc", "dateDesc", "countAsc", "countDesc", "tierAsc", "tierDesc"] as const;

export function useMapSort() {
    return useQueryState("mapSort",
        parseAsStringEnum<MapTimesSort>(MAP_SORTS)
            .withDefault("nameAsc")
            .withOptions({ history: "replace" })
    );
}

export type CompareTimesSort = "mapAsc" | "mapDesc" | "dateAsc" | "dateDesc" | "timeAsc" | "timeDesc" | "diffAsc" | "diffDesc";
export type CompareTimesSortRaw = "map" | "date" | "time" | "diff";
const COMPARE_SORTS: CompareTimesSort[] = ["mapAsc", "mapDesc", "dateAsc", "dateDesc", "timeAsc", "timeDesc", "diffAsc", "diffDesc"] as const;

export function useCompareSort() {
    return useQueryState("compareSort",
        parseAsStringEnum<CompareTimesSort>(COMPARE_SORTS)
            .withDefault("diffAsc")
            .withOptions({ history: "replace" })
    );
}

export function useCourse() {
    return useQueryState("course",
        parseAsInteger
            .withDefault(0)
            .withOptions({ history: "replace" })
    );
}

export function useGame(allowAll?: boolean) {
    const context = useOutletContext() as ContextParams;

    return useQueryState("game",
        parseAsNumberLiteral(allowAll ? allGamesWithAll : allGames)
            .withDefault(context.settings.defaultGame)
            .withOptions({ history: "replace", clearOnDefault: false })
    );
}

function useStyle(allowAll?: boolean) {
    const context = useOutletContext() as ContextParams;

    return useQueryState("style",
        parseAsNumberLiteral(allowAll ? allStylesWithAll : allStyles)
            .withDefault(context.settings.defaultStyle)
            .withOptions({ history: "replace", clearOnDefault: false })
    );
}

export function useGameStyle(allowAll?: boolean) {
    const [game, setGameState] = useGame(allowAll);
    const [style, setStyle] = useStyle(allowAll);

    const setGame = (game: Game) => {
        setGameState(game);
        const allowedStyles = getAllowedStyles(game);
        let newStyle = style;
        if (!allowedStyles.includes(style) && !(allowAll && style === Style.all)) {
            newStyle = allowedStyles[0];
            setStyle(newStyle);
        }
        return newStyle;
    };

    return { game, setGame, style, setStyle };
}

export function useGameStyleNoParams() {
    const context = useOutletContext() as ContextParams;
    const [game, setGameState] = useState(context.settings.defaultGame);
    const [style, setStyle] = useState(context.settings.defaultStyle);

    const setGame = (game: Game) => {
        setGameState(game);
        const allowedStyles = getAllowedStyles(game);
        let newStyle = style;
        if (!allowedStyles.includes(style)) {
            newStyle = allowedStyles[0];
            setStyle(newStyle);
        }
        return newStyle;
    };

    return { game, setGame, style, setStyle };
}

export function useIncludeBonuses() {
    return useQueryState("bonuses",
        parseAsBoolean
            .withDefault(true)
            .withOptions({ history: "replace" })
    );
}

export interface UserSearchInfo {
    userText: string
    setUserText: React.Dispatch<React.SetStateAction<string>>
    selectedUser: UserSearchData
    setSelectedUser: React.Dispatch<React.SetStateAction<UserSearchData>>
    options: readonly UserSearchData[]
    loadingOptions: boolean
}

export function useUserSearch(): UserSearchInfo {
    const [ userText, setUserText ] = useState("");
    const debounced = useDebounce(userText, 300);
    const [ selectedUser, setSelectedUser ] = useState<UserSearchData>({ username: "" });

    const optionsQuery = useQuery(queries.users.search(debounced));

    return {
        userText: userText,
        setUserText: setUserText,
        selectedUser: selectedUser,
        setSelectedUser: setSelectedUser,
        options: optionsQuery.data ?? [],
        loadingOptions: optionsQuery.isLoading || userText !== debounced
    };
}

// https://github.com/mui/material-ui/issues/10739#issuecomment-1484828925
export function useAppBarHeight(): number {
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

export function useFilterGame() {
    return useQueryState("filterGame",
        parseAsNumberLiteral(allGamesWithAll)
            .withDefault(Game.all)
            .withOptions({ history: "replace" })
    );
}

export function useFilterTiers() {
    return useQueryState("filterTiers",
        parseAsArrayOf(parseAsInteger)
            .withDefault(Array.from(Array(MAX_TIER + 1).keys()))
            .withOptions({ history: "replace" })
    );
}

export function useDebounce<T>(value: T, delay: number) {
    const [state, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay, setDebouncedValue]);

    return state;
}

export function useNow() {
    return useState(() => Date.now());
}

export function useCompareEntries() {
    return useQueryState("users",
        parseAsString
            .withDefault("")
            .withOptions({ history: "replace" })
    );
}

export function useComparePage() {
    return useQueryState("page",
        parseAsInteger
            .withDefault(1)
            .withOptions({ history: "replace" })
    );
}

export function useLoginUser()  {
    return useQuery({
        ...queries.auth.user,
        queryFn: () => getLoggedInUser()
    });
}

export function useVotingInfo(user: LoginUser | undefined) {
    return useQuery(queries.auth.tierVoting(user));
}

export function useMaps() {
    return useQuery({
       ...queries.maps.maps,
       queryFn: () => getMaps()
    });
}