import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { Game, Style } from "../api/interfaces";
import { formatStyle } from "../util/format";

export interface IStyleSelectorProps {
    game?: Game
    style: Style
    setStyle: (style: Style) => void
}

function StyleSelector(props: IStyleSelectorProps) {
    const { game, style, setStyle } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
        setStyle(event.target.value);
    };

    if (game === Game.surf && style === Style.scroll) {
        setStyle(Style.autohop);
    }

    const styles = Object.values(Style).filter(value => typeof value === "number" && (game === Game.bhop || value !== Style.scroll)) as Style[];

    return (
        <Box padding={smallScreen ? 0.5 : 1.5}>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Style</InputLabel>
                <Select
                    value={style}
                    label="Style"
                    onChange={handleChangeStyle}
                >
                    {styles.map((style) => <MenuItem value={style}>{formatStyle(style)}</MenuItem>)}
                </Select>
            </FormControl>
        </Box>
    );
}

export default StyleSelector;