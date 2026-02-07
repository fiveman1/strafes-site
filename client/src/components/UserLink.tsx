import { Avatar, Box, Link, LinkProps, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useOutletContext } from "react-router";
import { formatCountryCode, Game, Style, UserInfo } from "shared";
import { ContextParams, getUserRoleColor } from "../util/common";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ReactCountryFlag from "react-country-flag";
import { grey } from "@mui/material/colors";

interface IUserLinkProps extends LinkProps, UserInfo {
    game: Game
    strafesStyle: Style
}

function UserLink(props: IUserLinkProps) {
    const { userId, username, userRole, userCountry, userThumb, game, strafesStyle, ...linkProps }  = props;
    const theme = useTheme();
    const { loggedInUser } = useOutletContext() as ContextParams;

    const isCurrentUser = loggedInUser && userId === loggedInUser.userId;

    return (
    <Link {...linkProps} 
        to={{pathname: `/users/${userId}`, search: `?style=${strafesStyle}&game=${game}`}} 
        component={RouterLink} 
        color={userRole ? getUserRoleColor(userRole, theme) : undefined}
        display="inline-block"
        maxWidth="100%"
    >
        <Box display="flex" flexDirection="row" alignItems="center">
            <Avatar sx={{ bgcolor: grey[200], color: theme.palette.mode === "light" ? grey[500] : grey[800], mr: 1, width: "28px", height: "28px" }} alt={username} src={userThumb} />
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