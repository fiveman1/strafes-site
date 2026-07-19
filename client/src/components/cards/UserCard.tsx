import { Box, Link, Paper, Tooltip, Typography, useTheme } from "@mui/material";
import { User, formatUserRole } from "shared";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import CircularProgress from '@mui/material/CircularProgress';
import { ContextParams, getUserRoleColor } from "../../common/common";
import { useOutletContext } from "react-router";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import TimeAgo from "react-timeago";
import { dateTimeFormat, relativeTimeFormatter } from "../../common/datetime";
import UserAvatar from "../displays/UserAvatar";
import ColorChip from "../displays/ColorChip";
import CountryFlag from "../displays/CountryFlag";

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
    const { loginUser } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const isCurrentUser = loginUser && user && +user.userId === +loginUser.userId;

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
    const { loginUser, settings } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const dateValue = new Date(user.joinedOn);
    const tooltipText = dateTimeFormat.format(dateValue);

    const country = (loginUser && user.userId === loginUser.userId) ? settings.country : user.userCountry; // To get around caching

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row"
            }}>
            <Box
                sx={{
                    minWidth: "108px",
                    display: "flex",
                    alignItems: "center",
                    mr: 1
                }}>
                <UserCardAvatar user={user} />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "0",
                    overflowWrap: "break-word"
                }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                        justifyContent: "flex-start"
                    }}>
                    <Box sx={{
                        display: "inline-block"
                    }}>
                        <Box
                            sx={{
                                lineHeight: 1,
                                display: "flex",
                                alignItems: "center",
                                wordBreak: "break-word"
                            }}>
                            <Typography variant="h5" >
                                {user.displayName}
                                {country ? <CountryFlag countryCode={country} marginLeft={8} /> : undefined}
                            </Typography>

                        </Box>
                    </Box>
                    <Box sx={{
                        display: "inline-flex"
                    }}>
                        <Link
                            href={`https://www.roblox.com/users/${user.userId}/profile`}
                            color="secondary"
                            sx={{
                                display: "inline-flex",
                                verticalAlign: "top",
                                wordBreak: "break-word"
                            }}>
                            <Typography variant="subtitle2" >
                                @{user.username}
                            </Typography>
                        </Link>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                        {user.userId}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column"
                    }}>
                    {user.userRoles === undefined ? undefined :
                    <Box
                        component="ul"
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            m: 0,
                            pl: 0,
                            listStyle: "none"
                        }}>
                        {user.userRoles.map((role) => {
                        return (
                            <Box key={role} component="li" sx={{
                                px: 0.375
                            }}>
                                <ColorChip color={getUserRoleColor(role, theme)} label={formatUserRole(role)} />
                            </Box>
                        );})}
                    </Box>}
                    <Box sx={{
                        display: "inline-flex"
                    }}>
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
            <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: center ? "center" : undefined
                }}>
            {user && !loading ?
                <UserDisplay user={user} />
            :
            loading ?
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        justifyContent: "center"
                    }}>
                    <CircularProgress size="72px" />
                </Box>
            :
                <PermIdentityIcon sx={{ fontSize: 72, flexGrow: 1 }} />}
            </Box>
        </Paper>
    );
}

export default UserCard;
