import { useEffect } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { Game, Style, formatGame, getAllowedStyles } from "shared";
import { useLocation, useNavigate } from "react-router";

interface IGameSelectorProps {
    game: Game
    setGame: (game: Game) => void
    style?: Style
    setStyle?: (style: Style) => void
    allowedGames?: Game[]
    allowSelectAll?: boolean
    label?: string
    paramName?: string
    disableNavigate?: boolean
}

function GameSelector(props: IGameSelectorProps) {
    const { game, setGame, style, setStyle, allowedGames, allowSelectAll, label, paramName, disableNavigate } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    useEffect(() => {
        if (!style || !setStyle) {
            return;
        }
        const allowedStyles = getAllowedStyles(game);
        if (!allowedStyles.includes(style) && !(allowSelectAll && style === Style.all)) {
            const defaultStyle = allowedStyles[0];
            setStyle(defaultStyle);
        }
    }, [game, style, setStyle, allowSelectAll]);

    useEffect(() => {
        if (allowedGames && !allowedGames.includes(game)) {
            const queryParams = new URLSearchParams(location.search);
            queryParams.set(paramName ?? "game", allowedGames[0].toString());
            if (!disableNavigate) navigate({ search: queryParams.toString() }, { replace: true });
            setGame(allowedGames[0]);
        }
    }, [allowedGames, game, location.search, navigate, setGame, paramName, disableNavigate]);

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const game = event.target.value;
        const queryParams = new URLSearchParams(location.search);
        const allowedStyles = getAllowedStyles(game);
        if (style && setStyle && !allowedStyles.includes(style) && !(allowSelectAll && style === Style.all)) {
            const defaultStyle = allowedStyles[0];
            queryParams.set("style", defaultStyle.toString());
            setStyle(defaultStyle);
        }
        queryParams.set(paramName ?? "game", game.toString());
        if (!disableNavigate) navigate({ search: queryParams.toString() }, { replace: true });
        setGame(game);
    };

    const games = allowedGames ? allowedGames : [Game.bhop, Game.surf, Game.fly_trials];
    if (!allowedGames && allowSelectAll) {
        games.push(Game.all);
    }
    const realGame = games.includes(game) ? game : games[0];

    return (
        <Box padding={smallScreen ? 1 : 1.5}>
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