import Avatar, { AvatarProps } from "@mui/material/Avatar";
import { grey } from "@mui/material/colors";
import { useTheme } from "@mui/system";

interface UserAvatarProps extends AvatarProps {
    username: string
    userThumb: string | undefined
}

function UserAvatar(props: UserAvatarProps) {
    const { username, userThumb, ...avatarProps } = props;
    const { sx, ...extraProps } = avatarProps;
    const theme = useTheme();
    
    return (
        <Avatar {...extraProps} sx={{ ...sx, bgcolor: grey[200], color: theme.palette.mode === "light" ? grey[500] : grey[800] }} alt={username} src={userThumb} />
    );
}

export default UserAvatar;