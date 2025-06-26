import React, { useState } from "react";
import { PaletteMode, ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainAppBar from "./components/MainAppBar";
import Box from "@mui/material/Box";
import { pink, lightBlue } from "@mui/material/colors";
import { Outlet } from "react-router";
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router';
import { LinkProps } from '@mui/material/Link';

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

    const theme = createTheme({
        palette: {
            // SrafesNET red: #c61926
            primary: pink,
            secondary: lightBlue,
            mode: themeMode
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
    });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box height="100%" display="flex" flexDirection="column">
                <MainAppBar themeMode={themeMode} setThemeMode={setThemeMode} />
                <Outlet />
            </Box>
        </ThemeProvider>
    );
}

export default App;