import { Avatar, Box, Link, Paper, Typography, useTheme } from "@mui/material";
import { grey } from "@mui/material/colors";
import { User } from "../api/interfaces";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import CircularProgress from '@mui/material/CircularProgress';
import { ContextParams, formatUserRole, getUserRoleColor } from "../util/format";
import { useOutletContext } from "react-router";
import AccountBoxIcon from '@mui/icons-material/AccountBox';

export interface IUserCardProps {
    minHeight?: number
    loading: boolean
    user?: User
}

function UserCard(props: IUserCardProps) {
    const { minHeight, loading, user } = props;
    const theme = useTheme();
    const { loggedInUser } = useOutletContext() as ContextParams;

    const isCurrentUser = loggedInUser && user && +user.id === +loggedInUser.userId;
    
    return <Paper elevation={2} sx={{padding: 3, display: "flex", flexDirection: "row", minHeight: minHeight, minWidth: 0}}>
        {user && !loading ? <>
        <Box display="flex" flexDirection="column" minWidth="0" sx={{overflowWrap: "break-word"}}>
            <Box display="flex" flexDirection="column" flexGrow={1} justifyContent="flex-start">
                <Typography variant="h4">
                    {user.displayName}
                </Typography>
                <Box>
                    <Link 
                        href={`https://www.roblox.com/users/${user.id}/profile`}
                        color="secondary"
                        display="inline-flex"
                        sx={{verticalAlign: "top"}}
                    >
                        <Typography variant="subtitle2" overflow="hidden" whiteSpace="nowrap" >
                            @{user.username}
                        </Typography>
                    </Link>
                </Box>
                <Typography variant="body2" color="textSecondary">
                    {user.id}
                </Typography>
            </Box>
            <Box>
                {user.role === undefined ? undefined :
                <Typography variant="body2" color={getUserRoleColor(user.role, theme)}>
                    {formatUserRole(user.role)}
                </Typography>
                }
                <Typography variant="body2">
                    Joined Roblox on {new Date(user.joinedOn).toLocaleDateString()}
                </Typography>
            </Box>
        </Box>
        <Box minWidth="128px" padding={0.25} display="flex" alignItems="center" justifyContent="right" flexGrow={1}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Avatar sx={{height: 120, width: 120, bgcolor: grey[100]}} alt={user.displayName} src={user.thumbUrl} />
                {isCurrentUser ?
                <Box
                    title="You" 
                    sx={{
                        position: "absolute",
                        bottom: 5,
                        right: 5,
                        backgroundColor: theme.palette.common.white,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px"
                    }}
                >
                    <AccountBoxIcon sx={{fontSize: "36px"}} htmlColor={theme.palette.secondary.main} />
                </Box>
                : null}
            </Box>
            
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