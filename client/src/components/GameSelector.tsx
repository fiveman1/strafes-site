import React from "react";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { Game } from "../api/interfaces";
import { formatGame } from "../util/format";

export interface IGameSelectorProps {
    game: Game
    setGame: (game: Game) => void
}

function GameSelector(props: IGameSelectorProps) {
    const { game, setGame } = props;

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const value = event.target.value;
        setGame(value);
    };

    const games = Object.values(Game).filter(value => typeof value === "number") as Game[];

    return (
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
    );
}

export default GameSelector;