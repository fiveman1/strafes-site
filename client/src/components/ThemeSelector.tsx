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
    const {themeMode, setThemeMode} = props;
    return (
        <ButtonGroup>
            <IconButton color="inherit" onClick={() => {
                const newThemeMode = themeMode === "dark" ? "light" : "dark";
                setThemeMode(newThemeMode);
                localStorage.setItem("theme", newThemeMode);
            }}> 
                {themeMode === "dark" ? <Sunny/> : <NightsStay/>}
            </IconButton>
        </ButtonGroup>
    )
}