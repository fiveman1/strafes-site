import { useCallback } from "react";
import Button from '@mui/material/Button';
import Box from "@mui/material/Box";
import { AppBar, CircularProgress, Link, Toolbar, Typography } from "@mui/material";
import { useLocation } from "react-router";
import { LoginUser, Map } from "shared";
import { login } from "../../api/api";
import AccountMenu from "./AccountMenu";
import GlobalSearch from "../search/GlobalSearch";

interface IMainAppBarProps {
    loggedInUser: LoginUser | undefined
    isUserLoading: boolean
    disableSettings: boolean
    maps: Map[]
}

const COMPACT = "@media (max-width: 840px)";

function MainAppBar(props: IMainAppBarProps) {
    const { loggedInUser, isUserLoading, disableSettings, maps } = props;
    const location = useLocation();
    const onLogin = useCallback(async () => {
        const url = await login(window.location.pathname.slice(1) + window.location.search);
        if (url) window.location.href = url; // Force external redirect
    }, []);

    const pages = [
        { name: "Users", href: loggedInUser ? `/users/${loggedInUser.userId}` : "/users", match: "/users" },
        { name: "Globals", href: "/globals", match: "/globals" },
        { name: "Maps", href: "/maps", match: "/maps" },
        { name: "Ranks", href: "/ranks", match: "/ranks" },
        { name: "Compare", href: "/compare", match: "/compare" }
    ];

    return (
        <AppBar position="sticky">
            <Toolbar
                disableGutters
                sx={{
                    flexWrap: "wrap",
                    columnGap: 1.5,
                    width: "100%",
                    maxWidth: "1440px",
                    mx: "auto",
                    px: { xs: 2, sm: 3 },
                    [COMPACT]: {
                        pt: 1,
                        pb: 0.75,
                        rowGap: 0.75
                    }
                }}>
                <Link
                    href="/"
                    color="inherit"
                    underline="none"
                    aria-label="strafes home"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        mr: 1
                    }}>
                    <Box
                        component="img"
                        src="/android-chrome-192x192.png"
                        alt=""
                        sx={{
                            height: 28,
                            width: 28,
                            borderRadius: "7px"
                        }} />
                    <Typography
                        sx={{
                            fontFamily: '"Goldman", sans-serif',
                            fontWeight: 700,
                            letterSpacing: "-0.03em",
                            [COMPACT]: { display: "none" }
                        }}
                    >
                        strafes
                    </Typography>
                </Link>
                <Box
                    component="nav"
                    sx={{
                        display: "flex",
                        gap: 0.25,
                        [COMPACT]: {
                            order: 1,
                            width: "100%",
                            mx: -1,
                            overflowX: "auto",
                            scrollbarWidth: "none"
                        }
                    }}>
                    {pages.map((page) => {
                        const selected = location.pathname.startsWith(page.match);
                        return (
                            <Link
                                key={page.name}
                                href={page.href}
                                underline="none"
                                aria-current={selected ? "page" : undefined}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    height: 32,
                                    px: 1.25,
                                    borderRadius: "6px",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    color: selected ? "text.primary" : "text.secondary",
                                    bgcolor: selected ? "action.selected" : "transparent",
                                    transition: "color 150ms ease, background-color 150ms ease",
                                    "&:hover": {
                                        color: "text.primary",
                                        bgcolor: selected ? "action.selected" : "action.hover"
                                    }
                                }}>
                                {page.name}
                            </Link>
                        );
                    })}
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        justifyContent: "flex-end",
                        minWidth: 0
                    }}>
                    <Box sx={{ width: "100%", maxWidth: 320, [COMPACT]: { maxWidth: "none" } }}>
                        <GlobalSearch maps={maps} />
                    </Box>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        minWidth: 42
                    }}>
                    {loggedInUser ?
                    <AccountMenu user={loggedInUser} disableSettings={disableSettings} />
                    :
                    (isUserLoading ?
                    <CircularProgress size={18} color="inherit" sx={{ mr: 1.5, opacity: 0.5 }} />
                    :
                    <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        onClick={onLogin}
                        sx={{ height: 36, whiteSpace: "nowrap" }}
                    >
                        Log in
                    </Button>)}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default MainAppBar;
