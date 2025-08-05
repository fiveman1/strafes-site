import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { bhop_styles, Game, Style } from "../api/interfaces";
import { formatStyle, getAllowedStyles } from "../util/format";
import { useLocation, useNavigate } from "react-router";

export function useStyle() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramStyle = Style.autohop;
    const styleParam = queryParams.get("style");
    if (styleParam !== null && !isNaN(+styleParam) && Style[+styleParam] !== undefined) {
        paramStyle = +styleParam;
    }
    return useState(paramStyle);
}

export interface IStyleSelectorProps {
    game?: Game
    style: Style
    setStyle: (style: Style) => void
    allowSelectAll?: boolean
}

function StyleSelector(props: IStyleSelectorProps) {
    const { game, style, setStyle, allowSelectAll } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (game === undefined) {
            return;
        }
        const allowedStyles = getAllowedStyles(game);
        if (!allowedStyles.includes(style) && !(allowSelectAll && style === Style.all)) {
            const defaultStyle = allowedStyles[0] ?? Style.autohop;
            const queryParams = new URLSearchParams(location.search);
            queryParams.set("style", defaultStyle.toString());
            navigate({ search: queryParams.toString() }, { replace: true });
            setStyle(defaultStyle);
        }
    }, [game, style, setStyle, location.search, navigate, allowSelectAll]);

    const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
        const style = event.target.value;
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("style", style.toString());
        navigate({ search: queryParams.toString() }, { replace: true });
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

    return (
        <Box padding={smallScreen ? 0.5 : 1.5}>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Style</InputLabel>
                <Select
                    value={realStyle}
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