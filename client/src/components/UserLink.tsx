import { Link, LinkProps } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { Game, Style } from "../api/interfaces";

export interface IUserLinkProps extends LinkProps {
    userId: string | number
    username: string
    game: Game
    strafesStyle: Style
}

function UserLink(props: IUserLinkProps) {
    const {userId, username, game, strafesStyle, ...linkProps}  = props;
    return (
    <Link {...linkProps} to={{pathname: `/users/${userId}`, search: `?style=${strafesStyle}&game=${game}`}} component={RouterLink}>
        {username}
    </Link>
    );
}

export default UserLink;