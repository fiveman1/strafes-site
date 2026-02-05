import { Avatar, Box, Button, IconButton, Link, PaletteMode, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Game, SettingsValues, Style } from "shared";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";
import ThemeSelector from "./ThemeSelector";
import NumberSpinner from "./NumberSpinner";
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { updateSettings } from "../api/api";
import { grey } from "@mui/material/colors";
import { useNavigate, useOutletContext, useSearchParams } from "react-router";
import { ContextParams } from "../util/format";
import CountrySelect from "./CountrySelect";
import { dateFormat, relativeTimeFormat } from "../util/datetime";

function areSettingsEquals(settings: SettingsValues, other: SettingsValues) {
    return settings.defaultGame === other.defaultGame &&
        settings.defaultStyle === other.defaultStyle &&
        settings.maxDaysRelativeDates === other.maxDaysRelativeDates &&
        settings.theme === other.theme &&
        settings.country === other.country;
}

function Settings() {
    const { settings, setSettings, setMode, loggedInUser } = useOutletContext() as ContextParams;

    const [mockSettings, setMockSettings] = useState({...settings});
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (!loggedInUser) {
            // In case you logout with settings open, navigate back to home page
            navigate("/");
        }
    }, [loggedInUser, navigate]);

    const isDirty = useMemo(() => {
        return !areSettingsEquals(settings, mockSettings);
    }, [mockSettings, settings]);

    const setGame = (game: Game) => setMockSettings((settings) => {
        settings.defaultGame = game;
        return {...settings};
    });

    const setStyle = (style: Style) => setMockSettings((settings) => {
        settings.defaultStyle = style;
        return {...settings};
    });

    const setMaxDays = (value: number | null) => setMockSettings((settings) => {
        settings.maxDaysRelativeDates = value ?? 30;
        settings.maxDaysRelativeDates = Math.round(settings.maxDaysRelativeDates);
        return {...settings};
    });

    const setCountry = (value: string | undefined) => setMockSettings((settings) => {
        settings.country = value;
        return {...settings};
    });

    const setThemeMode = (theme: PaletteMode) => {
        setMode(theme);
        setMockSettings((settings) => {
            settings.theme = theme;
            return {...settings};
        });
    };

    const handleExit = useCallback(() => {
        const backUrl = searchParams.get("backUrl");
        const url = backUrl ? decodeURIComponent(backUrl) : "/";
        navigate(url);
    }, [navigate, searchParams]);

    const onSave = useCallback(async () => {
        setIsSaving(true);
        const success = await updateSettings(mockSettings);
        setIsSaving(false);
        if (!success) {
            return;
        }
        setSettings({...mockSettings});
        handleExit();
    }, [handleExit, mockSettings, setSettings]);

    const threeDaysAgo = new Date().getTime() - (3 * 24 * 60 * 60 * 1000);
    
    if (!loggedInUser) {
        return <></>;
    }
    
    return (
    <Box display="flex" justifyContent="center" marginBottom={1} flexGrow={1}>
        <Box display="flex" flexDirection="column" width="1024px">
            <Box display="flex">
                <Typography variant="h2" padding={1} flexGrow={1}>
                    Settings
                </Typography>
                <Box display="flex" alignItems="flex-start">
                    <IconButton onClick={() => handleExit()} sx={{marginTop: 1}}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
            <Box display="flex" alignItems="center" padding={1.5}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: grey[100], marginRight: 1.25 }} alt={loggedInUser.displayName} src={loggedInUser.thumbnailUrl} />
                <Box display="flex" flexDirection="column">
                    <Typography>
                        {loggedInUser.displayName} 
                    </Typography>
                    <Box>
                        <Link 
                            href={loggedInUser.profileUrl}
                            color="secondary"
                            display="inline-flex"
                            sx={{verticalAlign: "top"}}
                        >
                            <Typography variant="subtitle2" overflow="hidden" whiteSpace="nowrap" >
                                @{loggedInUser.username}
                            </Typography>
                        </Link>
                    </Box>
                </Box>
            </Box>
            <Typography variant="h6" padding={1}>
                User Profile
            </Typography>
            <Typography variant="body2" padding={1}>
                These are settings about you that are displayed to other users across the site.
            </Typography>
            <CountrySelect country={mockSettings.country} setCountry={setCountry} />
            <Typography variant="h6" padding={1}>
                Defaults
            </Typography>
            <Typography variant="body2" padding={1}>
                These are the defaults used when loading a page for the first time (unless there was existing context).
            </Typography>
            <Box marginTop={1} display="flex" flexWrap="wrap" alignItems="center">
                <GameSelector 
                    game={mockSettings.defaultGame} 
                    setGame={setGame} 
                    style={mockSettings.defaultStyle}
                    setStyle={setStyle}
                    disableNavigate
                />
                <StyleSelector
                    style={mockSettings.defaultStyle}
                    setStyle={setStyle} 
                    game={mockSettings.defaultGame}
                    disableNavigate
                />
            </Box>
            <Typography variant="h6" padding={1}>
                Theme
            </Typography>
            <Typography variant="body2" padding={1}>
                Switch between light and dark theme.
            </Typography>
            <Box padding={2}>
                <ThemeSelector 
                    themeMode={mockSettings.theme} 
                    setThemeMode={setThemeMode} 
                />
            </Box>
            <Typography variant="h6" padding={1}>
                Relative Dates
            </Typography>
            <Typography variant="body2" padding={1}>
                Control when to use relative dates (i.e. "{relativeTimeFormat.format(-3, "days")}") instead of absolute dates (i.e. "{dateFormat.format(threeDaysAgo)}").
            </Typography>
            <Typography variant="body2" padding={1}>
                Recent dates are displayed using the relative format. You can configure how many days old dates are allowed to be displayed in relative format.
            </Typography>
            <Box padding={2} marginTop={-1} maxWidth="340px">
                <NumberSpinner 
                    size="small"
                    label="Max relative days old"
                    min={0}
                    max={9999}
                    value={mockSettings.maxDaysRelativeDates}
                    onValueChange={setMaxDays}
                />
            </Box>
            <Box display="flex" justifyContent="flex-end" padding={2}>
                
                <Button variant="contained" size="large" sx={{ width: "120px", marginRight: 2 }} 
                    disabled={!isDirty} 
                    startIcon={<SaveIcon />} 
                    onClick={onSave}
                    loading={isSaving}
                >
                    Save
                </Button>
                <Button variant="outlined" size="large" sx={{ width: "120px" }}
                    startIcon={<CancelIcon />} 
                    onClick={() => handleExit()}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    </Box>
    );
}

export default Settings;