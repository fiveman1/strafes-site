import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PaletteMode, ThemeProvider, alpha, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router';
import Link, { LinkProps } from '@mui/material/Link';
import { ContextParams, MapCount } from "./common/common";
import { Breadcrumbs, useMediaQuery } from "@mui/material";
import { Game, Map, SettingsValues } from "shared";
import type {} from '@mui/x-data-grid/themeAugmentation';
import { sortMapsByName } from "./common/sort";
import { saveSettingsToLocalStorage, useLoginUser, useMaps, useSettings } from "./common/states";
import RobloxIcon from "./components/icons/RobloxIcon";
import DiscordIcon from "./components/icons/DiscordIcon";
import GithubIcon from "./components/icons/GithubIcon";
import MainAppBar from "./components/other/MainAppBar";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import ConsentDialog from "./components/ConsentDialog";

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;

    return <RouterLink ref={ref} to={href} {...other} />;
});

function App() {
    const { data: maps } = useMaps();

    const loginUserQuery = useLoginUser();
    const loggedInUser = loginUserQuery.data ?? undefined;
    const loggedInUserLoading = loginUserQuery.isLoading;

    const [ settings, setSettingsState ] = useSettings();
    const [ mode, setMode ] = useState<PaletteMode>(localStorage.getItem("theme") as PaletteMode || "dark");

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

        setMode(settings.theme);
    }, [settings.theme, settingsOpen]);

    const theme = useMemo(() => {
        const isLight = mode === "light";
        const surface = isLight ? "#ffffff" : "#11121d";
        const border = isLight ? "rgba(45, 32, 55, 0.12)" : "rgba(255, 255, 255, 0.12)";

        return createTheme({
            palette: {
                primary: {
                    main: "#ff4f9a",
                    light: "#ff86ba",
                    dark: "#ce246d",
                    contrastText: "#ffffff"
                },
                secondary: {
                    main: isLight ? "#087ea4" : "#5dd9ff",
                    light: "#9beaff",
                    dark: "#077a9e"
                },
                mode: mode,
                background: {
                    default: isLight ? "#f7f5fa" : "#080911",
                    paper: surface
                },
                text: {
                    primary: isLight ? "#211d28" : "#f7f5fb",
                    secondary: isLight ? "#6d6676" : "#aaa7b8"
                },
                divider: border,
                DataGrid: {
                    bg: surface
                }
            },
            shape: {
                borderRadius: 16
            },
            typography: {
                fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
                h1: { fontWeight: 700, letterSpacing: "-0.04em" },
                h2: { fontWeight: 700, letterSpacing: "-0.035em" },
                h3: { fontWeight: 700, letterSpacing: "-0.03em" },
                h4: { fontWeight: 700, letterSpacing: "-0.025em" },
                h5: { fontWeight: 600, letterSpacing: "-0.015em" },
                h6: { fontWeight: 600, letterSpacing: "-0.01em" },
                button: { fontWeight: 600, letterSpacing: "-0.01em" }
            },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        html: { backgroundColor: isLight ? "#f4f3f7" : "#09090f" },
                        body: {
                            backgroundColor: isLight ? "#f7f5fa" : "#080911",
                            backgroundImage: isLight
                                ? "radial-gradient(circle at 48% -12%, rgba(255, 79, 154, 0.13), transparent 36rem), radial-gradient(circle at 92% 35%, rgba(93, 217, 255, 0.08), transparent 30rem)"
                                : "radial-gradient(circle at 48% -12%, rgba(255, 79, 154, 0.22), transparent 40rem), radial-gradient(circle at 92% 38%, rgba(93, 217, 255, 0.10), transparent 34rem)",
                            backgroundAttachment: "fixed"
                        },
                        "#root": {
                            position: "relative",
                            isolation: "isolate",
                            backgroundImage: isLight
                                ? "linear-gradient(rgba(46, 32, 56, 0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(46, 32, 56, 0.022) 1px, transparent 1px)"
                                : "linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px)",
                            backgroundSize: "64px 64px"
                        },
                        "#root::before, #root::after": {
                            content: '\"\"',
                            position: "fixed",
                            zIndex: -1,
                            width: "min(46vw, 680px)",
                            aspectRatio: "1",
                            borderRadius: "50%",
                            pointerEvents: "none",
                            filter: "blur(100px)",
                            opacity: isLight ? 0.22 : 0.28,
                            willChange: "transform"
                        },
                        "#root::before": {
                            top: "-22%",
                            left: "-13%",
                            background: "#ff4f9a",
                            animation: "ambientDriftA 18s ease-in-out infinite alternate"
                        },
                        "#root::after": {
                            right: "-15%",
                            bottom: "-30%",
                            background: isLight ? "#5dd9ff" : "#22bde9",
                            animation: "ambientDriftB 22s ease-in-out infinite alternate"
                        },
                        "@keyframes ambientDriftA": {
                            from: { transform: "translate3d(0, 0, 0) scale(0.9)" },
                            to: { transform: "translate3d(12vw, 10vh, 0) scale(1.12)" }
                        },
                        "@keyframes ambientDriftB": {
                            from: { transform: "translate3d(0, 0, 0) scale(1)" },
                            to: { transform: "translate3d(-10vw, -8vh, 0) scale(0.86)" }
                        },
                        "@keyframes pageEnter": {
                            from: { opacity: 0, transform: "translate3d(0, 8px, 0)", filter: "blur(3px)" },
                            to: { opacity: 1, transform: "translate3d(0, 0, 0)", filter: "blur(0)" }
                        },
                        "@keyframes cardEnter": {
                            from: { opacity: 0, transform: "translate3d(0, 14px, 0) scale(0.985)" },
                            to: { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
                        },
                        "@keyframes glowPulse": {
                            "0%, 100%": { opacity: 0.55, transform: "scaleX(0.86)" },
                            "50%": { opacity: 1, transform: "scaleX(1.08)" }
                        },
                        "@keyframes routeLoadingBlur": {
                            from: { opacity: 0.18, backdropFilter: "blur(1px)", WebkitBackdropFilter: "blur(1px)" },
                            to: { opacity: 1, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }
                        },
                        "::selection": {
                            backgroundColor: alpha("#ec3b83", 0.32)
                        },
                        "*": {
                            scrollbarWidth: "thin",
                            scrollbarColor: `${alpha(isLight ? "#202027" : "#ffffff", 0.22)} transparent`
                        },
                        "h1, h2, h3": {
                            letterSpacing: "-0.03em"
                        },
                        "@media (prefers-reduced-motion: reduce)": {
                            "*, *::before, *::after": {
                                animationDuration: "0.01ms !important",
                                animationIterationCount: "1 !important",
                                scrollBehavior: "auto !important",
                                transitionDuration: "0.01ms !important"
                            }
                        }
                    }
                },
                MuiLink: {
                    defaultProps: {
                        component: LinkBehavior,
                    } as LinkProps,
                    styleOverrides: {
                        root: {
                            textUnderlineOffset: "3px",
                            textDecorationThickness: "1px"
                        }
                    }
                },
                MuiButtonBase: {
                    defaultProps: {
                        LinkComponent: LinkBehavior,
                    },
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            width: "calc(100% - 32px)",
                            maxWidth: "1450px",
                            top: 12,
                            margin: "0 auto 12px",
                            color: isLight ? "#202027" : "#f4f4f6",
                            backgroundColor: alpha(isLight ? "#ffffff" : "#10111a", isLight ? 0.72 : 0.62),
                            backgroundImage: "none",
                            border: `1px solid ${border}`,
                            borderRadius: 18,
                            overflow: "hidden",
                            boxShadow: isLight ? "0 14px 50px rgba(60, 32, 70, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.8)" : "0 18px 60px rgba(0, 0, 0, 0.38), 0 0 34px rgba(255, 79, 154, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
                            backdropFilter: "blur(30px) saturate(180%)",
                            WebkitBackdropFilter: "blur(30px) saturate(180%)",
                            "&::after": {
                                content: '\"\"',
                                position: "absolute",
                                inset: "0 14% auto",
                                height: 1,
                                background: "linear-gradient(90deg, transparent, rgba(255, 79, 154, 0.65), rgba(93, 217, 255, 0.45), transparent)"
                            },
                            "@media (max-width: 600px)": {
                                width: "calc(100% - 16px)",
                                top: 8,
                                marginBottom: 8,
                                borderRadius: 15
                            }
                        }
                    }
                },
                MuiToolbar: {
                    styleOverrides: {
                        root: {
                            minHeight: "64px"
                        }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundColor: alpha(surface, isLight ? 0.70 : 0.56),
                            backgroundImage: isLight ? "linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.28))" : "linear-gradient(145deg, rgba(255,255,255,0.045), rgba(255,255,255,0.008))",
                            border: `1px solid ${border}`,
                            backdropFilter: "blur(26px) saturate(165%)",
                            WebkitBackdropFilter: "blur(26px) saturate(165%)",
                            transition: "border-color 220ms ease, box-shadow 220ms ease, background-color 220ms ease",
                            boxShadow: isLight
                                ? "0 1px 2px rgba(20, 20, 30, 0.04), 0 14px 38px rgba(35, 20, 38, 0.055)"
                                : "0 1px 2px rgba(0, 0, 0, 0.20), 0 18px 48px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                        }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            backgroundColor: alpha(surface, isLight ? 0.70 : 0.56),
                            backgroundImage: isLight ? "linear-gradient(145deg, rgba(255,255,255,0.76), rgba(255,255,255,0.3))" : "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.008))",
                            border: `1px solid ${border}`,
                            backdropFilter: "blur(26px) saturate(170%)",
                            WebkitBackdropFilter: "blur(26px) saturate(170%)",
                            boxShadow: isLight
                                ? "0 14px 38px rgba(35, 20, 38, 0.055)"
                                : "0 16px 42px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.035)"
                        }
                    }
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            textTransform: "none",
                            transition: "transform 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                            "&:active": {
                                transform: "scale(0.975)"
                            }
                        },
                        outlined: {
                            borderColor: alpha(isLight ? "#202027" : "#ffffff", 0.18)
                        }
                    }
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 12,
                            transition: "transform 180ms ease, background-color 180ms ease, color 180ms ease",
                            "&:active": {
                                transform: "scale(0.92)"
                            }
                        }
                    }
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            borderRadius: 13,
                            backgroundColor: alpha(surface, isLight ? 0.68 : 0.48),
                            transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: alpha("#ec3b83", 0.55)
                            },
                            "&.Mui-focused": {
                                boxShadow: `0 0 0 3px ${alpha("#ff4f9a", 0.15)}, 0 10px 32px ${alpha("#ff4f9a", 0.10)}`
                            }
                        },
                        notchedOutline: {
                            borderColor: alpha(isLight ? "#202027" : "#ffffff", 0.14)
                        }
                    }
                },
                MuiMenu: {
                    styleOverrides: {
                        paper: {
                            marginTop: 6,
                            borderRadius: 14,
                            boxShadow: isLight ? "0 18px 45px rgba(45, 25, 55, 0.14)" : "0 20px 52px rgba(0, 0, 0, 0.46), 0 0 28px rgba(255, 79, 154, 0.06)"
                        },
                        list: {
                            padding: 6
                        }
                    }
                },
                MuiMenuItem: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            margin: "2px 0"
                        }
                    }
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: {
                            borderRadius: 20,
                            boxShadow: isLight ? "0 28px 80px rgba(45, 25, 55, 0.18)" : "0 30px 90px rgba(0, 0, 0, 0.58), 0 0 44px rgba(255, 79, 154, 0.08)"
                        }
                    }
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: 9,
                            backdropFilter: "blur(12px)",
                            fontWeight: 600
                        }
                    }
                },
                MuiTabs: {
                    styleOverrides: {
                        indicator: {
                            height: 3,
                            borderRadius: 3,
                            boxShadow: "0 0 14px rgba(255, 79, 154, 0.65)"
                        }
                    }
                },
                MuiLinearProgress: {
                    styleOverrides: {
                        root: {
                            backgroundColor: alpha("#ff4f9a", 0.10)
                        },
                        bar: {
                            boxShadow: "0 0 16px rgba(255, 79, 154, 0.8)"
                        }
                    }
                },
                MuiBreadcrumbs: {
                    styleOverrides: {
                        root: {
                            color: isLight ? "#73737f" : "#9595a1"
                        },
                        separator: {
                            color: alpha(isLight ? "#202027" : "#ffffff", 0.24)
                        }
                    }
                },
                MuiDataGrid: {
                    styleOverrides: {
                        root: {
                            border: 0,
                            borderRadius: 10,
                            overflow: "hidden"
                        },
                        columnHeaders: {
                            backgroundColor: isLight ? "#f7f7f9" : "#191922",
                            borderBottom: `1px solid ${border}`
                        },
                        columnHeader: {
                            fontWeight: 600
                        },
                        cell: {
                            borderColor: border
                        },
                        row: {
                            transition: "background-color 120ms ease",
                            "&:hover": {
                                backgroundColor: alpha("#ec3b83", isLight ? 0.045 : 0.065)
                            }
                        },
                        footerContainer: {
                            borderColor: border
                        }
                    }
                },
                MuiTooltip: {
                    styleOverrides: {
                        tooltip: {
                            borderRadius: 8,
                            fontSize: "0.75rem",
                            padding: "7px 10px"
                        }
                    }
                },
                MuiPaginationItem: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            fontWeight: 500
                        }
                    }
                },
                MuiSwitch: {
                    styleOverrides: {
                        root: {
                            marginLeft: 2,
                            marginRight: 2
                        }
                    }
                }
            },
        }
    )}, [mode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <ConsentDialog />
            <MainAppBar loggedInUser={loggedInUser} isUserLoading={loggedInUserLoading} disableSettings={settingsOpen} />
            <Box
                component="main"
                display="flex"
                flexGrow={1}
                flexDirection="column"
                width="100%"
                maxWidth="1480px"
                padding={smallScreen ? 1 : 2.5}
                margin="0 auto auto"
            >
                <Box
                    key={location.pathname}
                    display="flex"
                    flexGrow={1}
                    flexDirection="column"
                    sx={{ animation: "pageEnter 360ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
                >
                    <NuqsAdapter>
                        <Outlet context={contextParams}/>
                    </NuqsAdapter>
                </Box>
            </Box>
            <Box component="footer" mt={4}>
                <Breadcrumbs separator="·" sx={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "20px 16px 22px", "& ol": {"justifyContent": "center"}, "& a": {color: "text.secondary", fontSize: "0.875rem"}}}>
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
