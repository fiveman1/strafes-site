import React, { useState } from "react";
import Button from '@mui/material/Button';
import ThemeSelector, { IThemeSelectorProps } from "./ThemeSelector";
import Box from "@mui/material/Box";
import { AppBar, Link, Menu, MenuItem, Toolbar } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useLocation } from "react-router";

interface IMainAppBarProps extends IThemeSelectorProps {
    
}

export enum NavigatorPage {
    Home = "Home",
    Users = "Users",
    Maps = "Maps",
    Gloabls = "Globals",
    Ranks = "Ranks",
    Compare = "Compare"
}

function getCurrentPage(path: string) {
    if (path.startsWith("/users")) {
        return NavigatorPage.Users;
    }
    else if (path.startsWith("/maps")) {
        return NavigatorPage.Maps;
    }
    else if (path.startsWith("/rank")) {
        return NavigatorPage.Ranks;
    }
    else if (path.startsWith("/globals")) {
        return NavigatorPage.Gloabls;
    }
    else if (path.startsWith("/compare")) {
        return NavigatorPage.Compare;
    }
    else {
        return NavigatorPage.Home;
    }
}

function MainAppBar(props: IMainAppBarProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const location = useLocation();
    const navPage = getCurrentPage(location.pathname);
    
    const openNavMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const closeNavMenu = () => {
        setAnchorEl(null);
    }

    const navMenuWidth = 125;

    return (
        <AppBar position="sticky">
            <Toolbar sx={{ justifyContent: "space-between" }}>
                <Link href="/" variant="h6" color="inherit" underline="hover" minWidth={84} >
                    strafes
                </Link>
                <Box>
                    <Button sx={{width: navMenuWidth, textTransform: "none"}} size="large" variant="outlined" color="inherit" endIcon={open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />} onClick={openNavMenu} >
                        {navPage}
                    </Button>
                    <Menu anchorEl={anchorEl} open={open} onClose={closeNavMenu} slotProps={{list: {sx: {width: navMenuWidth}}}} >
                        <Link href="/" variant="inherit" color="inherit" underline="none">
                            <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Home} >
                                {NavigatorPage.Home}
                            </MenuItem>
                        </Link>
                        <Link href="/users" variant="inherit" color="inherit" underline="none">
                            <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Users} >
                                {NavigatorPage.Users}
                            </MenuItem>
                        </Link>
                        <Link href="/globals" variant="inherit" color="inherit" underline="none">
                            <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Gloabls} >
                                {NavigatorPage.Gloabls}
                            </MenuItem>
                        </Link>
                        <Link href="/maps" variant="inherit" color="inherit" underline="none">
                            <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Maps} >
                                {NavigatorPage.Maps}
                            </MenuItem>
                        </Link>
                        <Link href="/ranks" variant="inherit" color="inherit" underline="none">
                            <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Ranks} >
                                {NavigatorPage.Ranks}
                            </MenuItem>
                        </Link>
                        <Link href="/compare" variant="inherit" color="inherit" underline="none">
                            <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Compare} >
                                {NavigatorPage.Compare}
                            </MenuItem>
                        </Link>
                    </Menu>
                </Box>
                <Box minWidth={84} display="flex" justifyContent="flex-end">
                    <ThemeSelector themeMode={props.themeMode} setThemeMode={props.setThemeMode} />
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default MainAppBar;