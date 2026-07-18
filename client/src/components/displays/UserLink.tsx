import { Box, Link, LinkProps, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useOutletContext } from "react-router";
import { Game, Style, UserInfo } from "shared";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { ContextParams, getUserRoleColor } from "../../common/common";
import UserAvatar from "./UserAvatar";
import CountryFlag from "./CountryFlag";

interface IUserLinkProps extends LinkProps, UserInfo {
    game: Game
    strafesStyle: Style
}

function UserLink(props: IUserLinkProps) {
    const { userId, username, userRoles, userCountry, userThumb, game, strafesStyle, ...linkProps }  = props;
    const theme = useTheme();
    const { loginUser } = useOutletContext() as ContextParams;

    const isCurrentUser = loginUser && userId === loginUser.userId;
    const userRole = userRoles ? userRoles[0] : undefined;

    return (
    <Link {...linkProps}
        to={{pathname: `/users/${userId}`, search: `?style=${strafesStyle}&game=${game}`}} 
        component={RouterLink} 
        color={userRole ? getUserRoleColor(userRole, theme) : undefined}
        display="inline-block"
        maxWidth="100%"
    >
        <Box display="flex" flexDirection="row" alignItems="center">
            <UserAvatar username={username} userThumb={userThumb} sx={{mr: 1, width: "28px", height: "28px"}} />
            <Typography variant="inherit" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {username}
            </Typography>

            {userCountry ? 
            <CountryFlag countryCode={userCountry} marginLeft={6} />
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
