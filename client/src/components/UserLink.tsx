import { Box, Link, LinkProps, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useOutletContext } from "react-router";
import { Game, Style, UserRole } from "../api/interfaces";
import { ContextParams, getUserRoleColor } from "../util/format";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ReactCountryFlag from "react-country-flag";
import { formatCountryCode } from "./CountrySelect";

export interface IUserLinkProps extends LinkProps {
    userId: string | number
    username: string
    userRole?: UserRole
    userCountry?: string
    game: Game
    strafesStyle: Style
}

function UserLink(props: IUserLinkProps) {
    const { userId, username, userRole, userCountry, game, strafesStyle, ...linkProps }  = props;
    const theme = useTheme();
    const { loggedInUser } = useOutletContext() as ContextParams;

    const isCurrentUser = loggedInUser && +userId === +loggedInUser.userId;

    return (
    <Link {...linkProps} 
        to={{pathname: `/users/${userId}`, search: `?style=${strafesStyle}&game=${game}`}} 
        component={RouterLink} 
        color={userRole ? getUserRoleColor(userRole, theme) : undefined}
        display="inline-block"
        maxWidth="100%"
    >
        <Box display="flex" flexDirection="row" alignItems="center">
            <Typography variant="inherit" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {username}
            </Typography>
            
            {userCountry ? 
            <ReactCountryFlag style={{marginLeft: 6}} title={formatCountryCode(userCountry)} countryCode={userCountry} svg /> 
            : undefined}
            
            {isCurrentUser ? 
            <Box display="flex" title="You">
                <AccountBoxIcon sx={{marginLeft: 0.75, fontSize: 20}} htmlColor={theme.palette.secondary.main} /> 
            </Box>
            : null}
        </Box>
    </Link>
    );
}

export default UserLink;