import { Link, LinkProps, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { Game, Style, UserRole } from "../api/interfaces";
import { getUserRoleColor } from "../util/format";

export interface IUserLinkProps extends LinkProps {
    userId: string | number
    username: string
    userRole?: UserRole
    game: Game
    strafesStyle: Style
}

function UserLink(props: IUserLinkProps) {
    const {userId, username, userRole, game, strafesStyle, ...linkProps}  = props;
    const theme = useTheme();

    return (
    <Link {...linkProps} to={{pathname: `/users/${userId}`, search: `?style=${strafesStyle}&game=${game}`}} component={RouterLink} color={userRole ? getUserRoleColor(userRole, theme) : undefined}>
        {username}
    </Link>
    );
}

export default UserLink;