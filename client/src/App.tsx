import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PaletteMode, ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainAppBar from "./components/MainAppBar";
import Box from "@mui/material/Box";
import { pink, lightBlue } from "@mui/material/colors";
import { Outlet, useLocation } from "react-router";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router';
import Link, { LinkProps } from '@mui/material/Link';
import { getLoggedInUser, getMaps, getSettings, Maps } from "./api/api";
import { ContextParams, MapCount } from "./util/format";
import { Breadcrumbs, useMediaQuery } from "@mui/material";
import { Game, LoginUser, Map, SettingsValues } from "./api/interfaces";
import type {} from '@mui/x-data-grid/themeAugmentation';
import { sortMapsByName } from "./util/sort";
import { saveSettingsToLocalStorage, useSettings } from "./util/states";

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

function checkHeaderHeight() {
    const header = document.querySelector("header");
    if (header) {
        const styles = window.getComputedStyle(header);
        const headerHeight = styles.height;
        document.documentElement.style.setProperty("--sl-header-height", headerHeight);
    }
}

function App() {
    const [maps, setMaps] = useState<Maps>({});
    const [loggedInUser, setLoggedInUser] = useState<LoginUser>();
    const [loggedInUserLoading, setLoggedInUserLoading] = useState(true);
    const [settings, setSettingsState] = useSettings();
    const [mode, setMode] = useState<PaletteMode>(localStorage.getItem("theme") as PaletteMode || "dark");
    const [areSettingsReady, setSettingsReady] = useState(false);
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();

    useEffect(() => {
        window.addEventListener("resize", checkHeaderHeight);
        window.addEventListener("orientationchange", checkHeaderHeight);
        
        checkHeaderHeight();
        
        return () => {
            window.removeEventListener("resize", checkHeaderHeight);
            window.removeEventListener("orientationchange", checkHeaderHeight);
        }
    }, []);

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

        for (const map of (Object.values(maps) as Map[])) {
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

        return {
            maps: maps,
            sortedMaps: Object.values(maps).sort(sortMapsByName),
            mapCounts: counts
        };
    }, [maps]);

    const contextParams: ContextParams = useMemo(() => {
        return {
            maps: mapInfo.maps,
            sortedMaps: mapInfo.sortedMaps,
            mapCounts: mapInfo.mapCounts,
            settings: settings,
            loggedInUser: loggedInUser,
            isAuthorized: loggedInUser !== undefined,
            setSettings: setSettings,
            setMode: setMode
        };
    }, [loggedInUser, mapInfo.mapCounts, mapInfo.maps, mapInfo.sortedMaps, setSettings, settings]);

    useEffect(() => {
        getMaps().then(setMaps);
        getLoggedInUser().then((user) => {
            setLoggedInUser(user);
            setLoggedInUserLoading(false);
        });
    }, []);

    useEffect(() => {
        if (contextParams.isAuthorized) {
            getSettings().then((result) => {
                setSettingsReady(true);
                if (result) {
                    setSettings(result);
                }
            });
        }
    }, [contextParams.isAuthorized, setSettings]);

    const settingsOpen = location.pathname.startsWith("/settings");
    useEffect(() => {
        // Potentially reset theme when navigating to/from settings
        setMode(settings.theme);
    }, [settings.theme, settingsOpen]);

    const theme = useMemo(() => {
        return createTheme({
            palette: {
                // SrafesNET red: #c61926
                primary: pink,
                secondary: lightBlue,
                mode: mode,
                DataGrid: {
                    bg: mode === "light" ? "#ffffff" : "#121212"
                }
            },
            components: {
                MuiLink: {
                    defaultProps: {
                        component: LinkBehavior,
                    } as LinkProps,
                },
                MuiButtonBase: {
                    defaultProps: {
                        LinkComponent: LinkBehavior,
                    },
                },
            },
        }
    )}, [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <MainAppBar loggedInUser={loggedInUser} isUserLoading={loggedInUserLoading} disableSettings={!areSettingsReady || location.pathname.startsWith("/settings")} />
            <Box height="calc(100vh - var(--sl-header-height, 64px))" display="flex" flexDirection="column" overflow="auto">
                <Box display="flex" flexGrow={1} flexDirection="column" padding={smallScreen ? 1 : 2} marginBottom="auto">
                    <Outlet context={contextParams}/>
                </Box>
                <Box>
                    <Breadcrumbs separator="-" sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "auto 16px 16px 16px", "& ol": {"justifyContent": "center"}}}>
                        <Link href="https://www.roblox.com/games/5315046213/bhop" display="flex" underline="hover">
                            bhop
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{marginLeft: 4}}>
                                <path fill={theme.palette.primary.main} d="M6,2L2,18l16,4l4-16L6,2z M13.635,14.724l-4.358-1.09l1.089-4.358l4.358,1.09L13.635,14.724z"></path>
                            </svg>
                        </Link>
                        <Link href="https://www.roblox.com/games/5315066937/surf" display="flex" underline="hover">
                            surf
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style={{marginLeft: 4}}>
                                <path fill={theme.palette.primary.main} d="M6,2L2,18l16,4l4-16L6,2z M13.635,14.724l-4.358-1.09l1.089-4.358l4.358,1.09L13.635,14.724z"></path>
                            </svg>
                        </Link>
                        <Link href="https://discord.gg/Fw8E75X" display="flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                                <path fill={theme.palette.primary.main} d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                            </svg>
                        </Link>
                        <Link href="https://github.com/fiveman1/strafes-site" display="flex">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
                                <path fill={theme.palette.primary.main} d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
                            </svg>
                        </Link>
                        <Link href="/terms" display="flex" underline="hover">
                            terms
                        </Link>
                        <Link href="/privacy" display="flex" underline="hover">
                            privacy
                        </Link>
                    </Breadcrumbs>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;