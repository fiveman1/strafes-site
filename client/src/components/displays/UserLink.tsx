import { Box, Link, LinkProps, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useOutletContext } from "react-router";
import { Game, Style, UserInfo } from "shared";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { ContextParams, getUserRoleColor } from "../../common/common";
import UserAvatar from "./UserAvatar";
import CountryFlag from "./CountryFlag";

interface IUserLinkProps extends LinkProps, UserInfo {
    // The user's page opens on this game and style. Without them it opens on the viewer's defaults.
    game?: Game
    strafesStyle?: Style
    // 24 by default
    avatarSize?: number
    hideAvatar?: boolean
    hideYouIcon?: boolean
    // @username
    showAt?: boolean
}

function UserLink(props: IUserLinkProps) {
    const { userId, username, userRoles, userCountry, userThumb, game, strafesStyle, avatarSize, hideAvatar, hideYouIcon, showAt, ...linkProps }  = props;
    const theme = useTheme();
    const { loginUser } = useOutletContext() as ContextParams;

    const isCurrentUser = !hideYouIcon && loginUser && userId === loginUser.userId;
    const userRole = userRoles ? userRoles[0] : undefined;
    const size = `${avatarSize ?? 24}px`;
    const avatarGap = (avatarSize ?? 24) < 24 ? 0.5 : 1;

    return (
        <Link
            {...linkProps}
            to={{pathname: `/users/${userId}`, search: game !== undefined && strafesStyle !== undefined ? `?style=${strafesStyle}&game=${game}` : ""}}
            component={RouterLink}
            color={userRole ? getUserRoleColor(userRole, theme) : "textPrimary"}
            sx={[{
                display: "inline-block",
                maxWidth: "100%"
            }, ...(Array.isArray(linkProps.sx) ? linkProps.sx : [linkProps.sx])]}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                }}>
                {!hideAvatar &&
                <UserAvatar username={username} userThumb={userThumb} sx={{mr: avatarGap, width: size, height: size, flexShrink: 0}} />}
                <Typography
                    variant="inherit"
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}>
                    {showAt ? "@" : ""}{username}
                </Typography>

                {userCountry ? 
                <CountryFlag countryCode={userCountry} marginLeft={6} />
                : undefined}

                {isCurrentUser ? 
                <Box title="You" sx={{
                    display: "flex"
                }}>
                    <AccountBoxIcon sx={{marginLeft: 0.75, fontSize: 18}} htmlColor={theme.palette.secondary.main} /> 
                </Box>
                : null}
            </Box>
        </Link>
    );
}

export default UserLink;
