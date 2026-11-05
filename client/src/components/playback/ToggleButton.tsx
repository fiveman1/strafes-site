import Typography from "@mui/material/Typography";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { alpha, lighten } from "@mui/system";
import { useTheme } from "@mui/material/styles";
import React from "react";

const ICON_SX = { mr: 0.5 };

interface ToggleButtonProps {
    label: string
    active: boolean
    onClick: () => void
    /** Shown while active, an eye by default. */
    activeIcon?: React.ElementType
    /** Shown while inactive, a crossed out eye by default. */
    inactiveIcon?: React.ElementType
}

/** An on/off button with an icon, highlighted while on, like the player's HUD toggles. */
function ToggleButton(props: ToggleButtonProps) {
    const { label, active, onClick, activeIcon: ActiveIcon = VisibilityIcon, inactiveIcon: InactiveIcon = VisibilityOffIcon } = props;
    const theme = useTheme();

    return (
        <Typography
            variant="subtitle2"
            className={active ? "active" : undefined}
            component="button"
            onClick={onClick}
            sx={{
                // doubled class so these beat menus' own button styles, like the player's round buttons
                "&&": {
                    display: "flex",
                    fontWeight: "bold",
                    py: 0.5,
                    pl: 0.75,
                    pr: 0.75,
                    borderRadius: "8px",
                    cursor: "pointer",
                    userSelect: "none",
                    color: "white",
                    transition: "background .15s ease",
                    border: 0
                },
                "&&.active": {
                    bgcolor: `${alpha(theme.palette.primary.main, 0.7)}`,
                    "&:hover": {
                        bgcolor: `${alpha(lighten(theme.palette.primary.main, 0.2), 0.7)}`
                    }
                }
            }}>
            {active ? <ActiveIcon fontSize="small" sx={ICON_SX} /> : <InactiveIcon fontSize="small" sx={ICON_SX} />}
            {label}
        </Typography>
    );
}

export default ToggleButton;
