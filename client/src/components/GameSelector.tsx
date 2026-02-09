import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
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
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const game = event.target.value;
        setGame(game);
    };

    const games = selectedMap ? getAllowedGameForMap(selectedMap) : [Game.bhop, Game.surf, Game.fly_trials];
    if (allowSelectAll) {
        games.push(Game.all);
    }
    const realGame = games.includes(game) ? game : games[0];

    let padding = 0;
    if (!disablePadding) padding = smallScreen ? 1 : 1.5;

    return (
        <Box padding={padding}>
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