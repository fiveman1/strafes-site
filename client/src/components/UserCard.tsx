import { Avatar, Box, LinearProgress, Link, Paper, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { User } from "../../../shared/interfaces";

export interface IUserCardProps {
    user?: User
    loading?: boolean
    minHeight?: number
}

function UserCard(props: IUserCardProps) {
    const { user, loading, minHeight } = props;

    if (loading) {
        return <Paper sx={{minHeight: minHeight}}>
            <LinearProgress sx={{marginBottom: "auto"}}></LinearProgress>
        </Paper>
    }
    
    return <Paper elevation={3} sx={{padding: loading ? 0 : 3, display: "flex", flexDirection: "row", minHeight: minHeight}}>
        {user ? <>
        <Box display="flex" marginBottom="4px" flexDirection="column" flexGrow={1}>
            <Box flexGrow={1}>
                <Typography variant="h4" marginBottom="4px">
                    {user.displayName}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                    @{user.username}
                </Typography>
                <Link href={`https://www.roblox.com/users/${user.id}/profile`} variant="subtitle2" color="info" underline="hover" >{user.id}</Link>
            </Box>
            <Box>
                <Typography variant="body2">
                    Joined Roblox on {new Date(user.joinedOn).toLocaleDateString()}
                </Typography>
            </Box>
        </Box>
        <Box padding={0.5} marginLeft={0.5} display="flex" alignItems="center">
            <Avatar sx={{height: 120, width: 120, bgcolor: grey[100]}} alt={user.displayName} src={user.thumbUrl} />
        </Box>
        </> : <></>}
    </Paper>
}

export default UserCard;