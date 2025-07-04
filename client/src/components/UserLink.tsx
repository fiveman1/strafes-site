import { Link } from "@mui/material";
import { Link as RouterLink } from "react-router";
import { Game, Style } from "../api/interfaces";

function UserLink(props: {userId: string | number, username: string, game: Game, style: Style}) {
    const {userId, username, game, style}  = props;
    return (
    <Link to={{pathname: `/users/${userId}`, search: `?style=${style}&game=${game}`}} component={RouterLink} underline="hover" fontWeight="bold">
        {username}
    </Link>
    );
}

export default UserLink;