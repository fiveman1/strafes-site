import React, { useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import TimesCard from "./TimesCard";
import { TimeSortBy } from "../api/interfaces";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import AutoSizer from "react-virtualized-auto-sizer";
import { formatGame, formatStyle } from "../util/format";

function Globals() {
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();

    useEffect(() => {
        document.title = "strafes - globals";
    }, []);

    const description = useMemo(() => {
        return `View the latest world records (game: ${formatGame(game)}, style: ${formatStyle(style)})`;
    }, [game, style]);

    return (
    <Box padding={2} flexGrow={1} display="flex" flexDirection="column">
        <meta content="strafes - globals" property="og:title" />
        <meta
            name="description"
            content={description}
        />
        <Typography variant="h2" padding={1}>
            Globals
        </Typography>
        <Typography variant="body2" padding={1}>
            Each record in the list below is a world record (1st place). This list gets updated hourly.
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} allowSelectAll />
            <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
        </Box>
        <Box padding={1} flexGrow={1} minHeight={540}>
            <AutoSizer disableWidth>
                {({ height }) => <TimesCard title="World Records" height={height} defaultSort={TimeSortBy.DateDesc} game={game} style={style} onlyWRs allowOnlyWRs />}
            </AutoSizer>
        </Box>
    </Box>
    );
}

export default Globals;