import { PaletteMode } from '@mui/material/styles';
import NightsStay from "@mui/icons-material/NightsStay";
import Sunny from "@mui/icons-material/Sunny";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Button } from '@mui/material';

interface IThemeSelectorProps {
    themeMode: PaletteMode;
    setThemeMode: (value: PaletteMode) => void;
}

export default function ThemeSelector(props: IThemeSelectorProps) {
    const { themeMode, setThemeMode } = props;
    return (
        <ButtonGroup variant="outlined">
            <Button 
                startIcon={<Sunny/>}
                color={themeMode === "light" ? "primary" : "inherit"}
                aria-pressed={themeMode === "light"}
                onClick={() => {
                    setThemeMode("light");
                }}
            >
                Light
            </Button>
            <Button 
                startIcon={<NightsStay/>}
                color={themeMode === "dark" ? "primary" : "inherit"}
                aria-pressed={themeMode === "dark"}
                onClick={() => {
                    setThemeMode("dark");
                }}
            >
                Dark
            </Button>
        </ButtonGroup>
    );
}