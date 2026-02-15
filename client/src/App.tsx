import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PaletteMode, ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from "@mui/material/Box";
import { pink, lightBlue } from "@mui/material/colors";
import { Outlet, useLocation } from "react-router";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router';
import Link, { LinkProps } from '@mui/material/Link';
import { getLoggedInUser, getMaps, getSettings, Maps } from "./api/api";
import { ContextParams, MapCount } from "./common/common";
import { Breadcrumbs, useMediaQuery } from "@mui/material";
import { Game, LoginUser, Map, SettingsValues } from "shared";
import type {} from '@mui/x-data-grid/themeAugmentation';
import { sortMapsByName } from "./common/sort";
import { saveSettingsToLocalStorage, useSettings } from "./common/states";
import RobloxIcon from "./components/icons/RobloxIcon";
import DiscordIcon from "./components/icons/DiscordIcon";
import GithubIcon from "./components/icons/GithubIcon";
import MainAppBar from "./components/other/MainAppBar";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

function App() {
    const [maps, setMaps] = useState<Maps>({});
    const [loggedInUser, setLoggedInUser] = useState<LoginUser>();
    const [loggedInUserLoading, setLoggedInUserLoading] = useState(true);
    const [settings, setSettingsState] = useSettings();
    const [mode, setMode] = useState<PaletteMode>(localStorage.getItem("theme") as PaletteMode || "dark");
    const [areSettingsReady, setSettingsReady] = useState(false);
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();

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

    const contextParams: ContextParams = {
        maps: mapInfo.maps,
        sortedMaps: mapInfo.sortedMaps,
        mapCounts: mapInfo.mapCounts,
        settings: settings,
        loggedInUser: loggedInUser,
        isAuthorized: loggedInUser !== undefined,
        setSettings: setSettings,
        setMode: setMode
    };

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
            <MainAppBar loggedInUser={loggedInUser} isUserLoading={loggedInUserLoading} disableSettings={!areSettingsReady || settingsOpen} />
            <Box component="main" display="flex" flexGrow={1} flexDirection="column" padding={smallScreen ? 1 : 2} marginBottom="auto">
                <NuqsAdapter>
                    <Outlet context={contextParams}/>
                </NuqsAdapter>
            </Box>
            <Box component="footer">
                <Breadcrumbs separator="-" sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "auto 16px 16px 16px", "& ol": {"justifyContent": "center"}}}>
                    <Link href="https://www.roblox.com/games/5315046213/bhop" display="flex" underline="hover">
                        bhop
                        <RobloxIcon size={24} color={theme.palette.primary.main} style={{marginLeft: 4}} />
                    </Link>
                    <Link href="https://www.roblox.com/games/5315066937/surf" display="flex" underline="hover">
                        surf
                        <RobloxIcon size={24} color={theme.palette.primary.main} style={{marginLeft: 4}} />
                    </Link>
                    <Link href="https://discord.gg/Fw8E75X" display="flex">
                        <DiscordIcon size={24} color={theme.palette.primary.main} />
                    </Link>
                    <Link href="https://github.com/fiveman1/strafes-site" display="flex">
                        <GithubIcon size={24} color={theme.palette.primary.main} />
                    </Link>
                    <Link href="/terms" display="flex" underline="hover">
                        terms
                    </Link>
                    <Link href="/privacy" display="flex" underline="hover">
                        privacy
                    </Link>
                </Breadcrumbs>
            </Box>
        </ThemeProvider>
    );
}

export default App;