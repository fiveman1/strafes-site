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
import ColorChip from "./ColorChip";

interface IUserDisplayProps {
    user: User
}

interface IUserCardProps {
    minHeight?: number
    loading?: boolean
    user?: User
    center?: boolean
}

function UserCardAvatar(props: IUserDisplayProps) {
    const { user } = props;
    const { loggedInUser } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const isCurrentUser = loggedInUser && user && +user.userId === +loggedInUser.userId;

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <UserAvatar sx={{height: 100, width: 100}} username={user.username} userThumb={user.userThumb} />
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

    return (
        <Box display="flex" flexDirection="row">
            <Box minWidth="108px" display="flex" alignItems="center" mr={1}>
                <UserCardAvatar user={user} />
            </Box>
            <Box display="flex" flexDirection="column" minWidth="0" sx={{overflowWrap: "break-word"}}>
                <Box display="flex" flexDirection="column" flexGrow={1} justifyContent="flex-start">
                    <Box display="inline-block">
                        <Box lineHeight={1} sx={{wordBreak: "break-word", }} display="flex" alignItems="center">
                            <Typography variant="h5" >
                                {user.displayName}
                                {user.userCountry ? <ReactCountryFlag style={{verticalAlign: "text-top", marginLeft: 8}} title={formatCountryCode(user.userCountry)} countryCode={user.userCountry} svg /> : undefined}
                            </Typography>
                            
                        </Box>
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
                    <ColorChip color={getUserRoleColor(user.userRole, theme)} label={formatUserRole(user.userRole)} />}
                    <Box display="inline-flex">
                        <Tooltip title={tooltipText} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -6]}}]}}}>
                            <Typography variant="body2">
                                Joined <TimeAgo date={dateValue} title="" formatter={relativeTimeFormatter} />
                            </Typography>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

function UserCard(props: IUserCardProps) {
    const { minHeight, loading, user, center } = props;
    
    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "row", minHeight: minHeight}}>
        <Box display="flex" width="100%" flexDirection="row" alignItems="center" justifyContent={center ? "center" : undefined}>
        {user && !loading ? 
            <UserDisplay user={user} /> 
        : 
        loading ? 
            <Box flexGrow={1} display="flex" justifyContent="center">
                <CircularProgress size="72px" />
            </Box>
        : 
            <PermIdentityIcon sx={{ fontSize: 72, flexGrow: 1 }} />}
        </Box>
    </Paper>);
}

export default UserCard;