import { Box, PaletteMode, Typography } from "@mui/material";
import React, { useState } from "react";
import { Game, Style } from "../api/interfaces";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";
import ThemeSelector from "./ThemeSelector";
import NumberSpinner from "./NumberSpinner";
import { dateFormat, relativeTimeFormat } from "./DateDisplay";

export function useSettings() {
    const theme = localStorage.getItem("theme") as PaletteMode || "dark";
    
    const sGame = localStorage.getItem("game");
    let game = Game.bhop;
    if (sGame && Game[+sGame] !== undefined) {
        game = +sGame;
    }

    const sStyle = localStorage.getItem("style");
    let style = Style.autohop;
    if (sStyle && Style[+sStyle] !== undefined) {
        style = +sStyle;
    }

    const sMaxDays = localStorage.getItem("maxDays");
    let maxDays = 30;
    if (sMaxDays && !isNaN(+sMaxDays) && +sMaxDays >= 0) {
        maxDays = +sMaxDays;
    }

    return useState<SettingsValues>({
        defaultGame: game,
        defaultStyle: style,
        maxDaysRelativeDates: maxDays,
        theme: theme
    });
}

export interface SettingsValues {
    defaultGame: Game
    defaultStyle: Style
    maxDaysRelativeDates: number
    theme: PaletteMode
}

interface ISettingsProps {
    settings: SettingsValues,
    setSettings: (val: React.SetStateAction<SettingsValues>) => void
}

function Settings(props: ISettingsProps) {
    const { settings, setSettings } = props;

    const setGame = (game: Game) => setSettings((settings) => {
        settings.defaultGame = game; 
        localStorage.setItem("game", game.toString());
        return {...settings};
    });

    const setStyle = (style: Style) => setSettings((settings) => {
        settings.defaultStyle = style;
        localStorage.setItem("style", style.toString());
        return {...settings};
    });

    const threeDaysAgo = new Date().getTime() - (3 * 24 * 60 * 60 * 1000);
    
    return (
    <Box marginBottom={1} display="flex" flexDirection="column" flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Settings
        </Typography>
        <Typography variant="h6" padding={1}>
            Defaults
        </Typography>
        <Typography variant="body2" padding={1}>
            These are the defaults used when loading a page for the first time (unless there was existing context).
        </Typography>
        <Box padding={0.5} marginTop={1} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector 
                game={settings.defaultGame} 
                setGame={setGame} 
                style={settings.defaultStyle}
                setStyle={setStyle}
                disableNavigate
            />
            <StyleSelector
                style={settings.defaultStyle}
                setStyle={setStyle} 
                game={settings.defaultGame}
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
                themeMode={settings.theme} 
                setThemeMode={(theme) => setSettings((settings) => {
                    settings.theme = theme;
                    localStorage.setItem("theme", theme);
                    return {...settings};
                })} 
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
                value={settings.maxDaysRelativeDates}
                onValueChange={(value) => setSettings((settings) => {
                    settings.maxDaysRelativeDates = value ?? 30;
                    settings.maxDaysRelativeDates = Math.round(settings.maxDaysRelativeDates);
                    localStorage.setItem("maxDays", settings.maxDaysRelativeDates.toString());
                    return {...settings};
                })}
            />
        </Box>
    </Box>
    );
}

export default Settings;