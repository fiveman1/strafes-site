import { Avatar, Box, Link, Paper, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { User } from "../api/interfaces";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from "react";
import { getUserData } from "../api/api";

export interface IUserCardProps {
    userId?: string
    minHeight?: number
    loading: boolean
    setIsLoading: (loading: boolean) => void
    user?: User
    setUserInfo: (user?: User) => void
}

function UserCard(props: IUserCardProps) {
    const { userId, minHeight, loading, setIsLoading, user, setUserInfo } = props;

    useEffect(() => {
        if (!userId) {
            setUserInfo(undefined);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        getUserData(userId).then((userData) => {
            setIsLoading(false);
            setUserInfo(userData);
        });
    }, [userId, setIsLoading, setUserInfo]);
    
    return <Paper elevation={2} sx={{padding: 3, display: "flex", flexDirection: "row", minHeight: minHeight, minWidth: 0}}>
        {user && !loading ? <>
        <Box display="flex" flexDirection="column" minWidth="0" sx={{overflowWrap: "break-word"}}>
            <Box display="flex" flexDirection="column" flexGrow={1} justifyContent="flex-start">
                <Typography variant="h4">
                    {user.displayName}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                    @{user.username}
                </Typography>
                <Link href={`https://www.roblox.com/users/${user.id}/profile`} variant="subtitle2" color="info" underline="hover">
                    {user.id}
                </Link>
            </Box>
            <Box>
                <Typography variant="body2">
                    Joined Roblox on {new Date(user.joinedOn).toLocaleDateString()}
                </Typography>
            </Box>
        </Box>
        <Box minWidth="128px" padding={0.25} display="flex" alignItems="center" justifyContent="right" flexGrow={1}>
            <Avatar sx={{height: 120, width: 120, bgcolor: grey[100]}} alt={user.displayName} src={user.thumbUrl} />
        </Box>
        </> : 
        <Box display="flex" alignItems="center" width="100%">
            {loading ? 
            <Box flexGrow={1} display="flex" justifyContent="center">
                <CircularProgress size="72px" />
            </Box>
            : 
            <PermIdentityIcon sx={{ fontSize: 72, flexGrow: 1 }} />}
        </Box>}
    </Paper>
}

export default UserCard;