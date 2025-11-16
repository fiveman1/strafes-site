import React, { useEffect, useMemo, useState } from "react";
import { PaletteMode, ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainAppBar from "./components/MainAppBar";
import Box from "@mui/material/Box";
import { pink, lightBlue } from "@mui/material/colors";
import { Outlet } from "react-router";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router';
import Link, { LinkProps } from '@mui/material/Link';
import { getMaps, Maps } from "./api/api";
import { ContextParams, MapCount } from "./util/format";
import { Breadcrumbs } from "@mui/material";
import { Game, Map } from "./api/interfaces";
import type {} from '@mui/x-data-grid/themeAugmentation';

const LinkBehavior = React.forwardRef<
    HTMLAnchorElement,
    Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
    const { href, ...other } = props;
    // Map href (Material UI) -> to (react-router)
    return <RouterLink ref={ref} to={href} {...other} />;
});

function App() {
    const storedTheme = localStorage.getItem("theme") as PaletteMode || "dark";
    const [themeMode, setThemeMode] = useState(storedTheme);
    const [maps, setMaps] = useState<Maps>({});

    useEffect(() => {
        getMaps().then(setMaps);
    }, []);

    const contextParams: ContextParams = useMemo(() => {
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
            sortedMaps: Object.values(maps).sort((a, b) => a.name > b.name ? 1 : -1),
            mapCounts: counts
        };
    }, [maps]);

    const theme = useMemo(() => createTheme({
        palette: {
            // SrafesNET red: #c61926
            primary: pink,
            secondary: lightBlue,
            mode: themeMode,
            DataGrid: {
                bg: themeMode === "light" ? "#ffffff" : "#121212"
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
    }), [themeMode]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <Box height="100%" display="flex" flexDirection="column">
                <MainAppBar themeMode={themeMode} setThemeMode={setThemeMode} />
                <Outlet context={contextParams}/>
                <Box marginTop="auto">
                <Breadcrumbs sx={{display: "flex", flexDirection: "column", alignItems: "center", marginTop: "auto", marginBottom: 2}}>
                    <Link href="https://www.roblox.com/games/5315046213/bhop">
                        bhop
                    </Link>
                    <Link href="https://www.roblox.com/games/5315066937/surf">
                        surf
                    </Link>
                    <Link href="https://discord.gg/Fw8E75X">
                        discord
                    </Link>
                    <Link href="https://github.com/fiveman1/strafes-site">
                        github
                    </Link>
                </Breadcrumbs>
                </Box>
            </Box>
        </ThemeProvider>
    );
}

export default App;