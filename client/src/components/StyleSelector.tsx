import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { bhop_styles, Game, Style } from "../api/interfaces";
import { ContextParams, formatStyle, getAllowedStyles } from "../util/format";
import { useLocation, useNavigate, useOutletContext } from "react-router";

export function useStyle() {
    const location = useLocation();
    const context = useOutletContext() as ContextParams;
    const queryParams = new URLSearchParams(location.search);
    
    let paramStyle = context.settings.defaultStyle;
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
    label?: string
    disableNavigate?: boolean
}

function StyleSelector(props: IStyleSelectorProps) {
    const { game, style, setStyle, allowSelectAll, label, disableNavigate } = props;
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
            if (!disableNavigate) navigate({ search: queryParams.toString() }, { replace: true });
            setStyle(defaultStyle);
        }
    }, [game, style, setStyle, location.search, navigate, allowSelectAll, disableNavigate]);

    const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
        const style = event.target.value;
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("style", style.toString());
        if (!disableNavigate) navigate({ search: queryParams.toString() }, { replace: true });
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