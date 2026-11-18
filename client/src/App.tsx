import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { PaletteMode, ThemeProvider } from '@mui/material/styles';
import { createSiteTheme } from "./common/theme";
import CssBaseline from '@mui/material/CssBaseline';
import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router";
import Link from '@mui/material/Link';
import { ContextParams, MapCount } from "./common/common";
import { Alert, Button, useMediaQuery } from "@mui/material";
import { Game, Map, SettingsValues } from "shared";
import { sortMapsByName } from "./common/sort";
import { saveSettingsToLocalStorage, useLoginUser, useMaps, useSettings } from "./common/states";
import RobloxIcon from "./components/icons/RobloxIcon";
import DiscordIcon from "./components/icons/DiscordIcon";
import GithubIcon from "./components/icons/GithubIcon";
import MainAppBar from "./components/other/MainAppBar";
import NavigationProgress from "./components/other/NavigationProgress";
import { ErrorWithReason } from "./components/displays/LoadError";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

function App() {
    const mapsQuery = useMaps();
    const maps = mapsQuery.data;

    const loginUserQuery = useLoginUser();
    const loggedInUser = loginUserQuery.data ?? undefined;
    const loggedInUserLoading = loginUserQuery.isLoading;

    const [ settings, setSettingsState ] = useSettings();
    const [ mode, setMode ] = useState<PaletteMode>(localStorage.getItem("theme") as PaletteMode || "dark");

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();
    const isReplays = location.pathname.startsWith("/replays");

    const setSettings = useCallback((settings: SettingsValues) => {
        setMode(settings.theme);
        setSettingsState({...settings});
        saveSettingsToLocalStorage(settings);
    }, [setSettingsState]);

    const mapInfo = useMemo(() => {
        const counts : MapCount = {
            bhop: 0,
            surf: 0,
            flyTrials: 0
        }
        const now = new Date();
        const mapList = Object.values(maps ?? {}) as Map[];

        for (const map of mapList) {
            const date = new Date(map.date);
            if (date > now) {
                continue;
            }

            ++counts.flyTrials;
            if (map.game === Game.bhop) {
                ++counts.bhop;
            }
            else if (map.game === Game.surf) {
                ++counts.surf;
            }
        }

        const sortedByPopularity = [...mapList].sort((a, b) => a.loadCount - b.loadCount);
        let highPercentileLoadCount = 0;
        if (sortedByPopularity.length > 0) {
            highPercentileLoadCount = sortedByPopularity[Math.round((sortedByPopularity.length - 1) * 0.98)].loadCount;
        }

        return {
            maps: maps ?? {},
            sortedMaps: [...mapList].sort(sortMapsByName),
            mapCounts: counts,
            highPercentileLoadCount: highPercentileLoadCount
        };
    }, [maps]);

    const contextParams: ContextParams = useMemo(() => {
        return {
            maps: mapInfo.maps,
            sortedMaps: mapInfo.sortedMaps,
            mapCounts: mapInfo.mapCounts,
            highPercentileLoadCount: mapInfo.highPercentileLoadCount,
            settings: settings,
            loginUser: loggedInUser ?? undefined,
            setSettings: setSettings,
            setMode: setMode
        };
    }, [loggedInUser, mapInfo.mapCounts, mapInfo.maps, mapInfo.highPercentileLoadCount, mapInfo.sortedMaps, setSettings, settings]);

    useEffect(() => {
        if (loggedInUser?.settings) {
            setSettings(loggedInUser.settings);
        }
    }, [loggedInUser?.settings, setSettings]);

    const settingsOpen = location.pathname.startsWith("/settings");
    useEffect(() => {
        // Potentially reset theme when navigating to/from settings
        setMode(settings.theme);
    }, [settings.theme, settingsOpen]);

    const theme = useMemo(() => createSiteTheme(mode), [mode]);

    useLayoutEffect(() => {
        const style = document.createElement("style");
        style.textContent = "*,*::before,*::after{transition:none !important}";
        document.head.appendChild(style);
        void document.body.offsetHeight;
        const frame = requestAnimationFrame(() => style.remove());
        return () => {
            cancelAnimationFrame(frame);
            style.remove();
        };
    }, [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <NavigationProgress />
            <MainAppBar loggedInUser={loggedInUser} isUserLoading={loggedInUserLoading} maps={mapInfo.sortedMaps} />
            <Box
                component="main"
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    flexDirection: "column",
                    width: "100%",
                    // the replay player fills whatever space the window has
                    maxWidth: isReplays ? "none" : "1440px",
                    px: smallScreen ? 1 : 2,
                    // less space above and below the replay player, where height is what limits its size
                    py: (smallScreen || isReplays) ? 1 : 2,
                    marginBottom: "auto",
                    marginX: "auto"
                }}>
                {/* Every page uses these, and without them it looks empty or logged out rather than broken */}
                {(mapsQuery.isError || loginUserQuery.isError) &&
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            disabled={mapsQuery.isFetching || loginUserQuery.isFetching}
                            onClick={() => {
                                if (mapsQuery.isError) mapsQuery.refetch();
                                if (loginUserQuery.isError) loginUserQuery.refetch();
                            }}>
                            Try again
                        </Button>
                    }>
                    <ErrorWithReason
                        issue={mapsQuery.isError && loginUserQuery.isError ? "Couldn't load maps or check if you're logged in."
                            : mapsQuery.isError ? "Couldn't load maps, so some may be missing."
                            : "Couldn't check if you're logged in."}
                        error={mapsQuery.isError ? mapsQuery.error : loginUserQuery.error}
                    />
                </Alert>}
                <NuqsAdapter>
                    <Outlet context={contextParams}/>
                </NuqsAdapter>
            </Box>
            <Box
                component="footer"
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    columnGap: 2.5,
                    rowGap: 1,
                    px: 2,
                    py: 2.5,
                    borderTop: 1,
                    borderColor: "divider",
                    "& a": {
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        color: "text.secondary",
                        fontSize: "0.8125rem",
                        transition: "color 150ms ease",
                        "&:hover": {
                            color: "text.primary"
                        }
                    }
                }}>
                <Link href="https://www.roblox.com/games/5315046213/bhop" underline="none">
                    <RobloxIcon size={16} color="currentColor" />
                    bhop
                </Link>
                <Link href="https://www.roblox.com/games/5315066937/surf" underline="none">
                    <RobloxIcon size={16} color="currentColor" />
                    surf
                </Link>
                <Link href="https://discord.gg/Fw8E75X" underline="none" aria-label="Discord">
                    <DiscordIcon size={18} color="currentColor" />
                </Link>
                <Link href="https://github.com/fiveman1/strafes-site" underline="none" aria-label="GitHub">
                    <GithubIcon size={18} color="currentColor" />
                </Link>
                <Link href="/terms" underline="none">
                    terms
                </Link>
                <Link href="/privacy" underline="none">
                    privacy
                </Link>
            </Box>
        </ThemeProvider>
    );
}

export default App;
