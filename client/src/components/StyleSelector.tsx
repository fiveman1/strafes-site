import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { bhop_styles, Style, formatStyle, getAllowedStyles, Game } from "shared";

interface IStyleSelectorProps {
    game: Game
    style: Style
    setStyle: (style: Style) => void
    allowSelectAll?: boolean
    label?: string
}

function StyleSelector(props: IStyleSelectorProps) {
    const { game, style, setStyle, allowSelectAll, label } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
        const style = event.target.value;
        setStyle(style);
    };

    let styles = game === undefined ? [...bhop_styles] : [...getAllowedStyles(game)];
    if (styles.length === 0) {
        styles = [...bhop_styles];
    }

    if (allowSelectAll) {
        styles.push(Style.all);
    }
    
    const realStyle = styles.includes(style) ? style : styles[0];
    const inputLabel = label ?? "Style";

    return (
        <Box padding={smallScreen ? 1 : 1.5}>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>{inputLabel}</InputLabel>
                <Select
                    value={realStyle}
                    label={inputLabel}
                    onChange={handleChangeStyle}
                >
                    {styles.map((style) => <MenuItem value={style}>{formatStyle(style)}</MenuItem>)}
                </Select>
            </FormControl>
        </Box>
    );
}

export default StyleSelector;