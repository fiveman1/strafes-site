import React, { useEffect, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { Game, Style } from "../api/interfaces";
import { formatGame, getAllowedStyles } from "../util/format";
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
    allowedGames?: Game[]
}

function GameSelector(props: IGameSelectorProps) {
    const { game, setGame, style, setStyle, allowedGames } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    useEffect(() => {
        const allowedStyles = getAllowedStyles(game);
        if (!allowedStyles.includes(style)) {
            const defaultStyle = allowedStyles[0];
            setStyle(defaultStyle);
        }
    }, [game, style, setStyle]);

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const game = event.target.value;
        const queryParams = new URLSearchParams(location.search);
        const allowedStyles = getAllowedStyles(game);
        if (!allowedStyles.includes(style)) {
            const defaultStyle = allowedStyles[0];
            queryParams.set("style", defaultStyle.toString());
            setStyle(defaultStyle);
        }
        queryParams.set("game", game.toString());
        navigate({ search: queryParams.toString() }, { replace: true });
        setGame(game);
    };

    const games = allowedGames ? allowedGames : Object.values(Game).filter(value => typeof value === "number") as Game[];

    return (
        <Box padding={smallScreen ? 0.5 : 1.5}>
            <FormControl sx={{ width: "150px" }} disabled={games.length <= 1}>
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