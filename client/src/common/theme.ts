import { PaletteMode, alpha, createTheme } from "@mui/material/styles";
import { LinkProps } from "@mui/material/Link";
import LinkBehavior from "../components/other/LinkBehavior";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { EASE_OUT } from "./common";

/** The site's theme in light or dark mode. */
export function createSiteTheme(mode: PaletteMode) {
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
    const textPrimary = isLight ? "#17171a" : "#ededee";
    const textSecondary = isLight ? "#66666f" : "#9a9aa2";

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
                primary: textPrimary,
                secondary: textSecondary
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
                        color: textSecondary,
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
                        color: textSecondary,
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
    });
}
