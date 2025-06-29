import React from "react";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { Game, Style } from "../api/interfaces";
import { formatStyle } from "../util/format";

export interface IStyleSelectorProps {
    game?: Game
    style: Style
    setStyle: (style: Style) => void
}

function StyleSelector(props: IStyleSelectorProps) {
    const { game, style, setStyle } = props;

    const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
        setStyle(event.target.value);
    };

    if (game === Game.surf && style === Style.scroll) {
        setStyle(Style.autohop);
    }

    const styles = Object.values(Style).filter(value => typeof value === "number" && (game === Game.bhop || value !== Style.scroll)) as Style[];
    styles.sort((a, b) => (formatStyle(a) > formatStyle(b) ? 1 : -1))

    return (
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
    );
}

export default StyleSelector;