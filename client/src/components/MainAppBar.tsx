import React, { useState } from "react";
import Button from '@mui/material/Button';
import Box from "@mui/material/Box";
import { AppBar, ButtonGroup, CircularProgress, Link, Menu, MenuItem, Toolbar, useMediaQuery } from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useLocation } from "react-router";
import LoginIcon from '@mui/icons-material/Login';
import { LoginUser } from "shared";
import { login } from "../api/api";
import AccountMenu from "./AccountMenu";
import useAppBarHeight from "../util/states";

interface IMainAppBarProps {
    loggedInUser: LoginUser | undefined
    isUserLoading: boolean
    disableSettings: boolean
}

enum NavigatorPage {
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
    else if (path === "/") {
        return NavigatorPage.Home;
    }
    return undefined;
}

interface IAppMenuProps {
    loggedInUser: LoginUser | undefined
}

function AppLinks(props: IAppMenuProps) {
    const { loggedInUser } = props;
    const location = useLocation();
    const navPage = getCurrentPage(location.pathname);
    const appBarHeight = useAppBarHeight();

    let userLink = "/users";
    if (loggedInUser) {
        userLink += `/${loggedInUser.userId}`
    }

    return (
        <Box display="flex" flexDirection="row" justifyContent="space-evenly" width="80%" height={`${appBarHeight}px`}>
            <Button href={userLink} 
                color="inherit" 
                size="large" 
                fullWidth 
                sx={{
                    transition: "border .3s ease",
                    borderRadius: 0, 
                    textTransform: "none", 
                    borderBottom: navPage === NavigatorPage.Users ? "2px solid white" : "2px solid transparent",
                    marginTop: "2px"
                }}>
                {NavigatorPage.Users}
            </Button>
            <Button href="/globals" 
                color="inherit" 
                size="large" 
                fullWidth 
                sx={{
                    transition: "border .3s ease",
                    borderRadius: 0, 
                    textTransform: "none", 
                    borderBottom: navPage === NavigatorPage.Gloabls ? "2px solid white" : "2px solid transparent",
                    marginTop: "2px"
                }}>
                {NavigatorPage.Gloabls}
            </Button>
            <Button href="/maps" 
                color="inherit" 
                size="large" 
                fullWidth 
                sx={{
                    transition: "border .3s ease",
                    borderRadius: 0, 
                    textTransform: "none", 
                    borderBottom: navPage === NavigatorPage.Maps ? "2px solid white" : "2px solid transparent",
                    marginTop: "2px"
                }}>
                {NavigatorPage.Maps}
            </Button>
            <Button href="/ranks" 
                color="inherit" 
                size="large" 
                fullWidth 
                sx={{
                    transition: "border .3s ease",
                    borderRadius: 0, 
                    textTransform: "none", 
                    borderBottom: navPage === NavigatorPage.Ranks ? "2px solid white" : "2px solid transparent",
                    marginTop: "2px"
                }}>
                {NavigatorPage.Ranks}
            </Button>
            <Button href="/compare" 
                color="inherit" 
                size="large" 
                fullWidth 
                sx={{
                    transition: "border .3s ease",
                    borderRadius: 0, 
                    textTransform: "none", 
                    borderBottom: navPage === NavigatorPage.Compare ? "2px solid white" : "2px solid transparent",
                    marginTop: "2px"
                }}>
                {NavigatorPage.Compare}
            </Button>
        </Box>
    );
}

function AppMenu(props: IAppMenuProps) {
    const { loggedInUser } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const location = useLocation();
    const navPage = getCurrentPage(location.pathname);

    let userLink = "/users";
    if (loggedInUser) {
        userLink += `/${loggedInUser.userId}`
    }
    
    const openNavMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const closeNavMenu = () => {
        setAnchorEl(null);
    };

    const navMenuWidth = 125;

    return (
        <Box>
            <Button sx={{width: navMenuWidth, textTransform: "none"}} size="large" variant="outlined" color="inherit" endIcon={open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />} onClick={openNavMenu} >
                {navPage ?? NavigatorPage.Home}
            </Button>
            <Menu anchorEl={anchorEl} open={open} onClose={closeNavMenu} slotProps={{list: {sx: {width: navMenuWidth}}}} >
                <Link href="/" variant="inherit" color="inherit" underline="none">
                    <MenuItem onClick={closeNavMenu} selected={navPage === NavigatorPage.Home} >
                        {NavigatorPage.Home}
                    </MenuItem>
                </Link>
                <Link href={userLink} variant="inherit" color="inherit" underline="none">
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
    );
}

function MainAppBar(props: IMainAppBarProps) {
    const { loggedInUser, isUserLoading, disableSettings } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const useAppMenu = useMediaQuery("@media screen and (max-width: 800px)");

    const onLogin = async () => {
        const url = await login();
        if (url) window.location.href = url; // Force external redirect
    };

    const outerWidth = smallScreen ? 75 : 100;

    return (
        <AppBar position="sticky">
            <Toolbar sx={{ justifyContent: "space-between" }}>
                <Link href="/" variant="h6" color="inherit" underline="hover" minWidth={outerWidth} >
                    strafes
                </Link>
                {useAppMenu ? <AppMenu loggedInUser={loggedInUser} /> : <AppLinks loggedInUser={loggedInUser} />}
                <Box minWidth={outerWidth} display="flex" justifyContent="flex-end">
                    <ButtonGroup>
                        {loggedInUser ? 
                        <AccountMenu user={loggedInUser} disableSettings={disableSettings} /> 
                        : 
                        (isUserLoading ? 
                        <Box width="50px" height="50px" padding="5px" display="flex" justifyContent="center" alignItems="center">
                            <CircularProgress size={32} />
                        </Box>
                        : 
                        <Button variant="outlined" size={smallScreen ? "small" : "medium"} sx={{ width: outerWidth, whiteSpace: "nowrap", textTransform: "none"}} 
                            startIcon={<LoginIcon />} 
                            onClick={onLogin}>
                            Login
                        </Button>)}
                    </ButtonGroup>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default MainAppBar;