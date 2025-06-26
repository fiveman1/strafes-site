import React from "react";
import { PaletteMode } from '@mui/material/styles';
import IconButton from "@mui/material/IconButton";
import NightsStay from "@mui/icons-material/NightsStay";
import Sunny from "@mui/icons-material/Sunny";
import ButtonGroup from "@mui/material/ButtonGroup";

export interface IThemeSelectorProps {
    themeMode: PaletteMode;
    setThemeMode: (value: PaletteMode) => void;
}

export default function ThemeSelector(props: IThemeSelectorProps) {
    return (
        <ButtonGroup>
            <IconButton color="inherit" disabled={props.themeMode === "light"} onClick={() => {
                const newThemeMode = "light";
                props.setThemeMode(newThemeMode);
                localStorage.setItem('theme', newThemeMode);
            }}> 
                <Sunny/> 
            </IconButton>
            <IconButton color="inherit" disabled={props.themeMode === "dark"} onClick={() => {
                const newThemeMode = "dark";
                props.setThemeMode(newThemeMode);
                localStorage.setItem('theme', newThemeMode);
            }}> 
                <NightsStay/>
            </IconButton>
        </ButtonGroup>
    )
}