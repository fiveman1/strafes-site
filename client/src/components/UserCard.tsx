import { Avatar, Box, LinearProgress, Link, Paper, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { User } from "../api/interfaces";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';

export interface IUserCardProps {
    user?: User
    loading?: boolean
    minHeight?: number
}

function UserCard(props: IUserCardProps) {
    const { user, loading, minHeight } = props;

    if (loading) {
        return <Paper elevation={2} sx={{minHeight: minHeight}}>
            <LinearProgress sx={{marginBottom: "auto"}}></LinearProgress>
        </Paper>
    }
    
    return <Paper elevation={2} sx={{padding: 3, display: "flex", flexDirection: "row", minHeight: minHeight, minWidth: 0}}>
        {user ? <>
        <Box display="flex" flexDirection="column" minWidth="0" sx={{overflowWrap: "break-word"}}>
            <Box display="flex" flexDirection="column" flexGrow={1}>
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
        <Box display="flex" alignItems="center" justifyItems="center" width="100%">
            <PermIdentityIcon sx={{ fontSize: 72, flexGrow: 1 }}></PermIdentityIcon>
        </Box>}
    </Paper>
}

export default UserCard;