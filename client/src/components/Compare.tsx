import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, Link, Typography, useMediaQuery } from "@mui/material";
import GameSelector from "./forms/GameSelector";
import UserSearch from "./search/UserSearch";
import { Game, Style, Time, User, formatStyle, getAllowedStyles } from "shared";
import { useOutletContext } from "react-router";
import { getAllTimesForUser, getUserData } from "../api/api";
import { ContextParams } from "../common/common";
import { useCompareEntries, useComparePage, useGame, useUserSearch } from "../common/states";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { parseAsString, useQueryState } from "nuqs";
import {
    CompareEntry,
    CompareTime,
    CompareTimeInfo,
    ENTRY_COLORS,
    MAX_ENTRIES,
    deserializeEntries,
    findDuplicateEntries,
    isDuplicateEntry,
    serializeEntries,
} from "./compare/types";
import CompareEntryList from "./compare/CompareEntryList";
import CompareChart from "./compare/CompareChart";
import CompareTimesGrid from "./compare/CompareTimesGrid";

interface UserToTimes {
    [key: string]: {
        loading: boolean
        times?: Time[]
    } | undefined
}

interface IdToUser {
    [userId: string]: {
        user?: User,
        loading: boolean
    } | undefined
}

function getUserTimesFromState(userToTimes: UserToTimes, userId: string, game: Game, style: Style) {
    return userToTimes[`${userId},${game},${style}`];
}

function Compare() {
    const { maps } = useOutletContext() as ContextParams;
    const [game, setGameState] = useGame();
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    const [selectedSlice, setSelectedSlice] = useState<number>();
    const [, setPage] = useComparePage();

    const [idToUser, setIdToUserState] = useState<IdToUser>({});
    const setIdToUser = (userId: string, loading: boolean, user?: User) => {
        setIdToUserState((prev) => {
            let info = prev[userId];
            if (!info) {
                info = { loading };
            } else {
                info.loading = loading;
            }
            info.user = user;
            prev[userId] = info;
            return { ...prev };
        });
    };

    const [userTimes, setUserTimesState] = useState<UserToTimes>({});
    const setUserTimes = (userId: string, game: Game, style: Style, loading: boolean, times?: Time[]) => {
        setUserTimesState((prev) => {
            const key = `${userId},${game},${style}`;
            let info = prev[key];
            if (!info) {
                info = { loading };
            } else {
                info.loading = loading;
            }
            info.times = times;
            prev[key] = info;
            return { ...prev };
        });
    };

    // URL state for entries
    const [entriesRaw, setEntriesRaw] = useCompareEntries();
    const entries = useMemo(() => deserializeEntries(entriesRaw), [entriesRaw]);
    const setEntries = (newEntries: CompareEntry[]) => {
        setEntriesRaw(serializeEntries(newEntries));
        setSelectedSlice(undefined);
        setPage(1);
    };

    // Backward compatibility: migrate old user1/user2 params
    const [oldUser1, setOldUser1] = useQueryState("user1", parseAsString.withOptions({ history: "replace" }));
    const [oldUser2, setOldUser2] = useQueryState("user2", parseAsString.withOptions({ history: "replace" }));
    const [oldStyle] = useQueryState("style", parseAsString.withOptions({ history: "replace" }));

    useEffect(() => {
        if (entries.length === 0 && (oldUser1 || oldUser2)) {
            const migrated: CompareEntry[] = [];
            const defaultStyle = oldStyle ? Number(oldStyle) as Style : Style.autohop;
            if (oldUser1) {
                migrated.push({ userId: oldUser1, style: defaultStyle });
                setOldUser1(null);
            }
            if (oldUser2) {
                migrated.push({ userId: oldUser2, style: defaultStyle });
                setOldUser2(null);
            }
            setEntriesRaw(serializeEntries(migrated));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // User search state
    const [userSearch] = useUserSearch();

    // Add user from search
    const onAddUser = (userId: string | undefined) => {
        if (!userId || entries.length >= MAX_ENTRIES) return;
        const allowedStyles = getAllowedStyles(game);
        const defaultStyle = allowedStyles[0] ?? Style.autohop;
        if (isDuplicateEntry(entries, userId, defaultStyle)) return;
        setEntries([...entries, { userId, style: defaultStyle }]);
    };

    const setGame = useCallback((game: Game) => {
        setGameState(game);
        setSelectedSlice(undefined);
        // Validate styles when game changes
        const allowedStyles = getAllowedStyles(game);
        let changed = false;
        const newEntries = entries.map((entry) => {
            if (!allowedStyles.includes(entry.style)) {
                changed = true;
                return { ...entry, style: allowedStyles[0] };
            }
            return entry;
        });
        if (changed) {
            setEntriesRaw(serializeEntries(newEntries));
        }
    }, [entries, setEntriesRaw, setGameState]);

    // Data fetching for all entries
    useEffect(() => {
        for (const entry of entries) {
            const { userId, style } = entry;

            // Fetch user profile if not cached
            if (!idToUser[userId]) {
                setIdToUser(userId, true);
                getUserData(userId).then((user) => {
                    setIdToUser(userId, false, user);
                });
            }

            // Fetch times if not cached
            if (!getUserTimesFromState(userTimes, userId, game, style)) {
                setUserTimes(userId, game, style, true);
                getAllTimesForUser(userId, game, style).then((times) => {
                    setUserTimes(userId, game, style, false, times);
                });
            }
        }
    }, [entries, game, idToUser, userTimes]);

    // Derive loading state and entry times
    const { entryTimes, isLoading } = useMemo(() => {
        let isLoading = false;
        const entryTimes: (Time[] | undefined)[] = [];

        for (const entry of entries) {
            const userInfo = idToUser[entry.userId];
            if (userInfo?.loading) isLoading = true;

            const timesInfo = getUserTimesFromState(userTimes, entry.userId, game, entry.style);
            if (timesInfo?.loading) isLoading = true;
            entryTimes.push(timesInfo?.times);
        }

        return { entryTimes, isLoading };
    }, [entries, game, idToUser, userTimes]);

    // Build merged comparison data
    const allComparedTimes = useMemo(() => {
        // Need at least 2 entries with loaded times
        const loadedCount = entryTimes.filter(t => t !== undefined).length;
        if (loadedCount < 2 || isLoading) return [];

        const mapToTimeInfo = new Map<number, CompareTimeInfo>();

        for (let i = 0; i < entries.length; i++) {
            const times = entryTimes[i];
            if (!times) continue;

            const entry = entries[i];
            const user = idToUser[entry.userId]?.user;
            const color = ENTRY_COLORS[i % ENTRY_COLORS.length];

            for (const time of times) {
                const compareTime: CompareTime = {
                    username: user?.username ?? "...",
                    userId: user?.userId ?? 0,
                    userThumb: user?.userThumb,
                    userColor: color,
                    time: time.time,
                    date: time.date,
                    id: `${time.id}-${i}`,
                    style: time.style,
                    entryIndex: i,
                };

                const existing = mapToTimeInfo.get(time.mapId);
                if (existing) {
                    existing.times.push(compareTime);
                    existing.times.sort((a, b) => +a.time - +b.time);
                } else {
                    mapToTimeInfo.set(time.mapId, {
                        map: time.map,
                        mapId: time.mapId,
                        mapThumb: maps[time.mapId]?.largeThumb,
                        times: [compareTime],
                    });
                }
            }
        }

        return Array.from(mapToTimeInfo.values());
    }, [entries, entryTimes, idToUser, isLoading, maps]);

    // Check for duplicate entries (same user + same style)
    const duplicateWarning = useMemo(() => {
        const dupes = findDuplicateEntries(entries);
        if (dupes.length === 0) return undefined;
        const descriptions = dupes.map((d) => {
            const user = idToUser[d.userId]?.user;
            const name = user?.username ?? d.userId;
            return `${name} (${formatStyle(d.style)})`;
        });
        return `Duplicate entries: ${descriptions.join(", ")}. Each user + style combination must be unique.`;
    }, [entries, idToUser]);

    // Page title
    useEffect(() => {
        if (entries.length === 0) {
            document.title = "compare - strafes";
            return;
        }
        const names = entries.map((entry) => {
            const user = idToUser[entry.userId]?.user;
            return user ? `@${user.username}` : "<>";
        });
        document.title = `${names.join(" vs ")} - compare - strafes`;
    }, [entries, idToUser]);

    return (
        <Box display="flex" flexDirection="column" flexGrow={1}>
            {/* Breadcrumbs + Search row */}
            <Box display="flex" flexDirection={smallScreen ? "column" : "row"} height={smallScreen ? undefined : "48px"} mb={smallScreen ? 0 : 0.5}>
                <Breadcrumbs separator={<NavigateNextIcon />} sx={{ p: 1, flexGrow: 1, flexBasis: "60%", alignItems: "center", display: "flex" }}>
                    <Link underline="hover" color="inherit" href="/">
                        Home
                    </Link>
                    <Typography color="textPrimary">
                        Compare
                    </Typography>
                </Breadcrumbs>
                <Box padding={smallScreen ? 1 : 0.25} pt={0.25} pb={0.25} flexBasis="40%" minWidth="270px" maxWidth={smallScreen ? undefined : "500px"} display="flex" alignItems="center">
                    <UserSearch
                        setUserId={onAddUser}
                        userSearch={userSearch}
                        disableNavigate
                        disabled={entries.length >= MAX_ENTRIES}
                    />
                </Box>
            </Box>

            <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
                <GameSelector game={game} setGame={setGame} />
            </Box>

            {/* Compare users/entries */}
            <Box padding={1}>
                <CompareEntryList
                    entries={entries}
                    setEntries={setEntries}
                    idToUser={idToUser}
                    game={game}
                />
            </Box>

            {/* Pie chart */}
            <Box padding={1}>
                <CompareChart
                    entries={entries}
                    idToUser={idToUser}
                    entryTimes={entryTimes}
                    isLoading={isLoading}
                    selectedSlice={selectedSlice}
                    setSelectedSlice={setSelectedSlice}
                    duplicateWarning={duplicateWarning}
                />
            </Box>

            {/* Paginated times grid */}
            <Box padding={1}>
                <CompareTimesGrid
                    allTimes={allComparedTimes}
                    numEntries={entries.length}
                    isLoading={isLoading}
                    selectedSlice={selectedSlice}
                    duplicateWarning={duplicateWarning}
                />
            </Box>
        </Box>
    );
}

export default Compare;
