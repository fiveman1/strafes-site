import { Link } from "@mui/material";

function UserLink(props: {userId: string | number, username: string}) {
    const {userId, username}  = props;
    return (
    <Link href={`/users/${userId}`} underline="hover" fontWeight="bold">
        {username}
    </Link>
    );
}

export default UserLink;