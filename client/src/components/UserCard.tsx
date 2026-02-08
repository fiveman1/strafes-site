import { Box, Link, Paper, Tooltip, Typography, useTheme } from "@mui/material";
import { User, formatCountryCode, formatUserRole } from "shared";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import CircularProgress from '@mui/material/CircularProgress';
import { ContextParams, getUserRoleColor } from "../util/common";
import { useOutletContext } from "react-router";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import TimeAgo from "react-timeago";
import ReactCountryFlag from "react-country-flag";
import { dateTimeFormat, relativeTimeFormatter } from "../util/datetime";
import UserAvatar from "./UserAvatar";

interface IUserDisplayProps {
    user: User
}

interface IUserCardProps {
    minHeight?: number
    loading?: boolean
    user?: User
}

function UserCardAvatar(props: IUserDisplayProps) {
    const { user } = props;
    const { loggedInUser } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const isCurrentUser = loggedInUser && user && +user.userId === +loggedInUser.userId;

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <UserAvatar sx={{height: 120, width: 120}} username={user.username} userThumb={user.userThumb} />
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
    );
}

function UserDisplay(props: IUserDisplayProps) {
    const { user } = props;
    const theme = useTheme();

    const dateValue = new Date(user.joinedOn);
    const tooltipText = dateTimeFormat.format(dateValue);

    return (<>
        <Box display="flex" flexDirection="column" minWidth="0" sx={{overflowWrap: "break-word"}}>
            <Box display="flex" flexDirection="column" flexGrow={1} justifyContent="flex-start">
                <Box display="inline-block">
                    <Typography variant="h4" sx={{wordBreak: "break-word"}} display="inline-block">
                        {user.displayName}
                        {user.userCountry ? <ReactCountryFlag style={{marginLeft: 8, marginTop: -8}} title={formatCountryCode(user.userCountry)} countryCode={user.userCountry} svg /> : undefined}
                    </Typography>
                </Box>
                <Box display="inline-flex">
                    <Link
                        href={`https://www.roblox.com/users/${user.userId}/profile`}
                        color="secondary"
                        display="inline-flex"
                        sx={{verticalAlign: "top", wordBreak: "break-word"}}
                    >
                        <Typography variant="subtitle2" >
                            @{user.username}
                        </Typography>
                    </Link>
                </Box>
                <Typography variant="body2" color="textSecondary">
                    {user.userId}
                </Typography>
            </Box>
            <Box display="flex" flexDirection="column">
                {user.userRole === undefined ? undefined :
                <Typography variant="body2" color={getUserRoleColor(user.userRole, theme)}>
                    {formatUserRole(user.userRole)}
                </Typography>
                }
                <Box display="inline-flex">
                    <Tooltip title={tooltipText} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -6]}}]}}}>
                        <Typography variant="body2">
                            Joined <TimeAgo date={dateValue} title="" formatter={relativeTimeFormatter} />
                        </Typography>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
        <Box minWidth="128px" padding={0.25} display="flex" alignItems="center" justifyContent="right" flexGrow={1}>
            <UserCardAvatar user={user} />
        </Box>
    </>);
}

function UserCard(props: IUserCardProps) {
    const { minHeight, loading, user } = props;
    
    return (
    <Paper elevation={2} sx={{padding: 3, display: "flex", flexDirection: "row", minHeight: minHeight, minWidth: 0}}>
        {user && !loading ? <UserDisplay user={user} /> 
        : 
        <Box display="flex" alignItems="center" width="100%">
            {loading ? 
            <Box flexGrow={1} display="flex" justifyContent="center">
                <CircularProgress size="72px" />
            </Box>
            : 
            <PermIdentityIcon sx={{ fontSize: 72, flexGrow: 1 }} />}
        </Box>}
    </Paper>);
}

export default UserCard;