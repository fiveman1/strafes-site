import { Box, Link, Skeleton, Tooltip, Typography, useTheme } from "@mui/material";
import { User, formatUserRole } from "shared";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
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
    loading?: boolean
    user?: User
}

function UserCardAvatar(props: IUserDisplayProps) {
    const { user } = props;
    const { loginUser } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const isCurrentUser = loginUser && user && +user.userId === +loginUser.userId;

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <UserAvatar sx={{height: 72, width: 72}} username={user.username} userThumb={user.userThumb} />
            {isCurrentUser ?
            <Box
                title="You"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
            <UserCardAvatar user={user} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography component="h1" variant="h5" sx={{ lineHeight: 1.2 }}>
                    {user.displayName}
                    {country ? <CountryFlag countryCode={country} marginLeft={8} /> : undefined}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    <Link href={`https://www.roblox.com/users/${user.userId}/profile`} color="inherit" underline="hover">
                        @{user.username}
                    </Link>
                    {" · "}{user.userId}{" · "}
                    <Tooltip title={tooltipText} disableInteractive>
                        <span>Joined <TimeAgo date={dateValue} title="" formatter={relativeTimeFormatter} /></span>
                    </Tooltip>
                </Typography>
                {user.userRoles && user.userRoles.length > 0 &&
                <Box
                    component="ul"
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        m: 0,
                        mt: 0.25,
                        pl: 0,
                        listStyle: "none"
                    }}>
                    {user.userRoles.map((role) => (
                        <Box key={role} component="li" sx={{ display: "flex" }}>
                            <ColorChip color={getUserRoleColor(role, theme)} label={formatUserRole(role)} />
                        </Box>
                    ))}
                </Box>}
            </Box>
        </Box>
    );
}

function UserCard(props: IUserCardProps) {
    const { loading, user } = props;

    if (user && !loading) {
        return <UserDisplay user={user} />;
    }

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, height: 72, color: "text.secondary" }}>
            {loading ?
            <>
                <Skeleton variant="circular" width={72} height={72} />
                <Box>
                    <Skeleton width={160} height={32} />
                    <Skeleton width={220} />
                </Box>
            </>
            :
            <>
                <PermIdentityIcon sx={{ fontSize: 40 }} />
                <Typography variant="body2">
                    Search for a user to see their profile
                </Typography>
            </>}
        </Box>
    );
}

export default UserCard;
