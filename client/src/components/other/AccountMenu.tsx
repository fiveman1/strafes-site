import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { LoginUserWithInfo } from 'shared';
import { grey } from '@mui/material/colors';
import { logout } from '../../api/api';
import { useLocation, useNavigate } from 'react-router';
import { Typography, useTheme } from '@mui/material';
import UserAvatar from '../displays/UserAvatar';
import { useInboxCount } from '../../common/inbox';

interface IAccountMenuProps {
    user: LoginUserWithInfo
}

function AccountMenu(props: IAccountMenuProps) {
    const { user } = props;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    // Pages can't be opened from the menu while they're already open
    const onInbox = location.pathname.startsWith("/inbox");
    const onSettings = location.pathname.startsWith("/settings");
    const onModeration = location.pathname.startsWith("/moderation");
    const unread = useInboxCount(user.userId);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                <Tooltip title={unread > 0 ? `Account (${unread} unread)` : "Account"}>
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        <Badge
                            badgeContent={unread}
                            max={99}
                            color="error"
                            overlap="circular"
                            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: grey[200], color: theme.palette.mode === "light" ? grey[500] : grey[800] }} alt={user.displayName} src={user.thumbnailUrl} />
                        </Badge>
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            mt: 1,
                            minWidth: 220,
                            '& .MuiAvatar-root': {
                                width: 36,
                                height: 36,
                                mr: 1.25,
                            }
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem sx={{pointerEvents: "none"}}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center"
                        }}>
                        <UserAvatar username={user.username} userThumb={user.thumbnailUrl} />
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column"
                            }}>
                            <Typography variant="body2" sx={{fontWeight: 500}}>
                                {user.displayName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                @{user.username}
                            </Typography>
                        </Box>
                    </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => {
                    handleClose();
                    navigate(`/users/${user.userId}`);
                }}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                </MenuItem>
                <MenuItem disabled={onInbox} onClick={() => {
                    handleClose();
                    navigate("/inbox");
                }}>
                    <ListItemIcon>
                        <InboxOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Inbox
                    {unread > 0 &&
                    <Box
                        component="span"
                        sx={{
                            ml: 'auto',
                            pl: 2,
                            color: 'error.main',
                            fontSize: '0.8125rem',
                            fontWeight: 700
                        }}>
                        {unread > 99 ? "99+" : unread}
                    </Box>}
                </MenuItem>
                <MenuItem disabled={onSettings} onClick={() => {
                    handleClose();
                    // window's, since nuqs changes the query params without React Router knowing
                    navigate(`/settings?backUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                }}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                {user.commentRole &&
                <MenuItem disabled={onModeration} onClick={() => {
                    handleClose();
                    navigate("/moderation");
                }}>
                    <ListItemIcon>
                        <ShieldOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Moderation
                </MenuItem>}
                <MenuItem onClick={async () => {
                    handleClose();
                    await logout();
                    navigate(0); // Refresh the page
                }}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </>
    );
}

export default AccountMenu;