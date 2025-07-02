import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { Game } from "../api/interfaces";
import { formatGame } from "../util/format";

export interface IGameSelectorProps {
    game: Game
    setGame: (game: Game) => void
}

function GameSelector(props: IGameSelectorProps) {
    const { game, setGame } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const value = event.target.value;
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