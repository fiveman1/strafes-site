import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { Game, formatGame, Map } from "shared";
import { getAllowedGameForMap } from "../util/common";

interface IGameSelectorProps {
    game: Game
    setGame: (game: Game) => void
    allowSelectAll?: boolean
    label?: string
    selectedMap?: Map
    disablePadding?: boolean
}

function GameSelector(props: IGameSelectorProps) {
    const { game, setGame, allowSelectAll, label, selectedMap, disablePadding } = props;

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const game = event.target.value;
        setGame(game);
    };

    const games = selectedMap ? getAllowedGameForMap(selectedMap) : [Game.bhop, Game.surf, Game.fly_trials];
    if (allowSelectAll) {
        games.push(Game.all);
    }
    const realGame = games.includes(game) ? game : games[0];

    return (
        <Box padding={disablePadding ? 0 : 1}>
            <FormControl sx={{ width: "150px" }} disabled={games.length <= 1}>
                <InputLabel>{label ?? "Game"}</InputLabel>
                <Select
                    value={realGame}
                    label={label ?? "Game"}
                    onChange={handleChangeGame}
                >
                    {games.map((game) => <MenuItem value={game}>{formatGame(game)}</MenuItem>)}
                </Select>
            </FormControl>
        </Box>
    );
}

export default GameSelector;