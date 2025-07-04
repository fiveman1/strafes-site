import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { Game, Style } from "../api/interfaces";
import { formatGame } from "../util/format";
import { useLocation, useNavigate } from "react-router";

export function useGame() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramGame = Game.bhop;
    const gameParam = queryParams.get("game");
    if (gameParam !== null && !isNaN(+gameParam) && Game[+gameParam] !== undefined) {
        paramGame = +gameParam;
    }
    return useState(paramGame);
}

export interface IGameSelectorProps {
    game: Game
    setGame: (game: Game) => void
    style: Style
    setStyle: (style: Style) => void
}

function GameSelector(props: IGameSelectorProps) {
    const { game, setGame, style, setStyle } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    useEffect(() => {
        if (game === Game.surf && style === Style.scroll) {
            setStyle(Style.autohop);
        }
    }, [game, style, setStyle]);

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const value = event.target.value;
        const queryParams = new URLSearchParams(location.search);
        if (value === Game.surf && style === Style.scroll) {
            queryParams.set("style", Style.autohop.toString());
            setStyle(Style.autohop);
        }
        queryParams.set("game", value.toString());
        navigate({ search: queryParams.toString() }, { replace: true });
        setGame(value);
    };

    const games = Object.values(Game).filter(value => typeof value === "number") as Game[];

    return (
        <Box padding={smallScreen ? 0.5 : 1.5}>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Game</InputLabel>
                <Select
                    value={game}
                    label="Game"
                    onChange={handleChangeGame}
                >
                    {games.map((game) => <MenuItem value={game}>{formatGame(game)}</MenuItem>)}
                </Select>
            </FormControl>
        </Box>
    );
}

export default GameSelector;