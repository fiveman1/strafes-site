import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { PaletteMode, ThemeProvider, alpha, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router';
import Link, { LinkProps } from '@mui/material/Link';
import { ContextParams, EASE_OUT, MapCount } from "./common/common";
import { useMediaQuery } from "@mui/material";
import { Game, Map, SettingsValues } from "shared";
import type {} from '@mui/x-data-grid/themeAugmentation';
import { sortMapsByName } from "./common/sort";
import { saveSettingsToLocalStorage, useLoginUser, useMaps, useSettings } from "./common/states";
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
        // Potentially reset theme when navigating to/from settings
        setMode(settings.theme);
    }, [settings.theme, settingsOpen]);

    const theme = useMemo(() => {
        const isLight = mode === "light";
        const ink = isLight ? "#000000" : "#ffffff";
        const background = isLight ? "#f7f7f8" : "#0b0b0c";
        const surface = isLight ? "#ffffff" : "#121214";
        const raised = isLight ? "#ffffff" : "#1a1a1d";
        const border = alpha(ink, isLight ? 0.1 : 0.09);
        const borderStrong = alpha(ink, isLight ? 0.22 : 0.2);
        const hover = alpha(ink, isLight ? 0.04 : 0.055);
        const primary = isLight ? "#cf2572" : "#ee4b93";
        const popShadow = isLight
            ? "0 4px 8px rgba(0, 0, 0, 0.05), 0 12px 32px rgba(0, 0, 0, 0.1)"
            : "0 4px 8px rgba(0, 0, 0, 0.3), 0 16px 40px rgba(0, 0, 0, 0.5)";
        const popPaper = {
            backgroundColor: raised,
            borderColor: isLight ? border : borderStrong,
            borderRadius: 10,
            boxShadow: popShadow
        };

        return createTheme({
            palette: {
                primary: {
                    main: primary,
                    contrastText: "#ffffff"
                },
                secondary: {
                    main: isLight ? "#0e7f96" : "#5cc3d8"
                },
                mode: mode,
                background: {
                    default: background,
                    paper: surface
                },
                text: {
                    primary: isLight ? "#17171a" : "#ededee",
                    secondary: isLight ? "#66666f" : "#9a9aa2"
                },
                divider: border,
                action: {
                    hover: hover,
                    selected: alpha(ink, isLight ? 0.07 : 0.09)
                },
                DataGrid: {
                    bg: surface,
                    headerBg: surface
                }
            },
            shape: {
                borderRadius: 8
            },
            mixins: {
                toolbar: {
                    minHeight: 56
                }
            },
            typography: {
                fontFamily: '"Geist", system-ui, -apple-system, "Segoe UI", sans-serif',
                h1: { fontWeight: 600, letterSpacing: "-0.025em" },
                h2: { fontWeight: 600, letterSpacing: "-0.025em" },
                h3: { fontWeight: 600, letterSpacing: "-0.02em" },
                h4: { fontWeight: 600, letterSpacing: "-0.02em" },
                h5: { fontWeight: 600, letterSpacing: "-0.015em" },
                h6: { fontWeight: 600, letterSpacing: "-0.01em" },
                button: { fontWeight: 500 }
            },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            backgroundColor: background,
                            fontVariantNumeric: "tabular-nums"
                        },
                        "#root": {
                            scrollbarColor: `${borderStrong} transparent`
                        },
                        "::selection": {
                            backgroundColor: alpha(primary, 0.3)
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
                        disableRipple: true
                    },
                    styleOverrides: {
                        root: {
                            "&.Mui-focusVisible": {
                                outline: `2px solid ${primary}`,
                                outlineOffset: 2
                            }
                        }
                    }
                },
                MuiAppBar: {
                    defaultProps: {
                        elevation: 0
                    },
                    styleOverrides: {
                        root: {
                            color: "inherit",
                            backgroundColor: alpha(background, 0.8),
                            backgroundImage: "none",
                            border: 0,
                            borderBottom: `1px solid ${border}`,
                            borderRadius: 0,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)"
                        }
                    }
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundImage: "none",
                            border: `1px solid ${border}`,
                            borderRadius: 10,
                            boxShadow: "none"
                        }
                    }
                },
                MuiButton: {
                    defaultProps: {
                        disableElevation: true
                    },
                    styleOverrides: {
                        root: {
                            textTransform: "none",
                            transition: `transform 160ms ${EASE_OUT}, background-color 150ms ease, border-color 150ms ease, color 150ms ease`,
                            "&:active": {
                                transform: "scale(0.96)"
                            }
                        },
                        outlined: {
                            borderColor: borderStrong
                        }
                    }
                },
                MuiIconButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            transition: `transform 160ms ${EASE_OUT}, background-color 150ms ease, color 150ms ease`,
                            "&:hover": {
                                backgroundColor: hover
                            },
                            "&:active": {
                                transform: "scale(0.96)"
                            }
                        }
                    }
                },
                MuiFormControl: {
                    defaultProps: {
                        size: "small"
                    }
                },
                MuiTextField: {
                    defaultProps: {
                        size: "small"
                    }
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            backgroundColor: surface,
                            transition: "box-shadow 150ms ease",
                            "& .MuiOutlinedInput-notchedOutline": {
                                transition: "border-color 150ms ease"
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: borderStrong
                            },
                            "&.Mui-focused": {
                                boxShadow: `0 0 0 3px ${alpha(primary, 0.2)}`
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderWidth: 1
                            }
                        },
                        notchedOutline: {
                            borderColor: border
                        }
                    }
                },
                MuiMenu: {
                    styleOverrides: {
                        paper: popPaper,
                        list: {
                            padding: 4
                        }
                    },
                    defaultProps: {
                        transitionDuration: 0
                    }
                },
                MuiMenuItem: {
                    styleOverrides: {
                        root: {
                            borderRadius: 6,
                            minHeight: 34,
                            fontSize: "0.875rem",
                            "&.Mui-focusVisible": {
                                outline: "none"
                            }
                        }
                    }
                },
                MuiAutocomplete: {
                    styleOverrides: {
                        paper: popPaper,
                        listbox: {
                            padding: 4
                        },
                        option: {
                            borderRadius: 6
                        }
                    }
                },
                MuiPopover: {
                    styleOverrides: {
                        paper: popPaper
                    },
                    defaultProps: {
                        transitionDuration: 0
                    }
                },
                MuiDialog: {
                    styleOverrides: {
                        paper: {
                            ...popPaper,
                            borderRadius: 12
                        }
                    }
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: 6,
                            fontWeight: 500
                        }
                    }
                },
                MuiTabs: {
                    styleOverrides: {
                        indicator: {
                            height: 2
                        }
                    }
                },
                MuiLinearProgress: {
                    styleOverrides: {
                        root: {
                            height: 2,
                            backgroundColor: "transparent"
                        }
                    }
                },
                MuiBreadcrumbs: {
                    styleOverrides: {
                        root: {
                            color: isLight ? "#66666f" : "#9a9aa2",
                            fontSize: "0.875rem",
                            "& .MuiTypography-root": {
                                fontSize: "inherit"
                            }
                        },
                        separator: {
                            marginLeft: 4,
                            marginRight: 4,
                            color: borderStrong,
                            "& svg": {
                                fontSize: 18
                            }
                        }
                    }
                },
                MuiDataGrid: {
                    styleOverrides: {
                        root: {
                            border: `1px solid ${border}`,
                            borderRadius: 10,
                            overflow: "hidden",
                            backgroundColor: surface,
                            fontVariantNumeric: "tabular-nums",
                            "--DataGrid-rowBorderColor": border,
                            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
                                outline: "none"
                            }
                        },
                        columnHeader: {
                            color: isLight ? "#66666f" : "#9a9aa2",
                            fontSize: "0.8125rem"
                        },
                        columnHeaderTitle: {
                            fontWeight: 500
                        },
                        columnSeparator: {
                            opacity: 0,
                            transition: "opacity 150ms ease",
                            "&:hover": {
                                opacity: 1
                            }
                        },
                        virtualScroller: {
                            overflowY: "hidden"
                        },
                        row: {
                            "&:hover": {
                                backgroundColor: hover
                            }
                        },
                        footerContainer: {
                            borderColor: border,
                            minHeight: 48
                        }
                    },
                    defaultProps: {
                        localeText: {paginationDisplayedRows: ({ from, to, count }) => count === -1 ? `${from}–${to} of more than ${to}` : `${from}–${to} of ${count}`},
                        dataSourceKeepPreviousData: true,
                        disableColumnMenu: true
                    }
                },
                MuiTooltip: {
                    styleOverrides: {
                        tooltip: {
                            backgroundColor: isLight ? "#17171a" : "#26262a",
                            color: "#ededee",
                            border: `1px solid ${alpha("#ffffff", 0.1)}`,
                            borderRadius: 6,
                            fontSize: "0.75rem",
                            fontWeight: 400,
                            lineHeight: 1.45,
                            padding: "6px 8px"
                        },
                        arrow: {
                            color: isLight ? "#17171a" : "#26262a"
                        }
                    }
                },
                MuiPaginationItem: {
                    styleOverrides: {
                        root: {
                            borderRadius: 6,
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
                },
                MuiSelect: {
                    defaultProps: {
                        MenuProps: {
                            transitionDuration: 0
                        }
                    }
                }
            },
        }
    )}, [mode]);

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
            <MainAppBar loggedInUser={loggedInUser} isUserLoading={loggedInUserLoading} disableSettings={settingsOpen} maps={mapInfo.sortedMaps} />
            <Box
                component="main"
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    flexDirection: "column",
                    width: "100%",
                    maxWidth: location.pathname.startsWith("/replays") ? "1800px" : "1440px",
                    padding: smallScreen ? 1 : 2,
                    marginBottom: "auto",
                    marginX: "auto"
                }}>
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
