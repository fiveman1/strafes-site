import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { LoginUser } from 'shared';
import { grey } from '@mui/material/colors';
import { logout } from '../api/api';
import { useLocation, useNavigate } from 'react-router';
import { Typography, useTheme } from '@mui/material';
import UserAvatar from './UserAvatar';

interface IAccountMenuProps {
    user: LoginUser
    disableSettings: boolean
}

function AccountMenu(props: IAccountMenuProps) {
    const { user, disableSettings } = props;
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                <Tooltip title="Account">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        <Avatar sx={{ width: 40, height: 40, bgcolor: grey[200], color: theme.palette.mode === "light" ? grey[500] : grey[800] }} alt={user.displayName} src={user.thumbnailUrl} />
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
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            '& .MuiAvatar-root': {
                                width: 48,
                                height: 48,
                                ml: -0.5,
                                mr: 1.25,
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem sx={{pointerEvents: "none"}}>
                    <Box display="flex" alignItems="center">
                        <UserAvatar username={user.username} userThumb={user.thumbnailUrl} />
                        <Box display="flex" flexDirection="column">
                            <Typography>
                                {user.displayName}
                            </Typography>
                            <Typography color="textSecondary">
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
                <MenuItem disabled={disableSettings} onClick={() => {
                    handleClose();
                    navigate(`/settings?backUrl=${encodeURIComponent(location.pathname + location.search)}`);
                }}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
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