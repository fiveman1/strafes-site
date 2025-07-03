import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import TimesCard from "./TimesCard";
import { Game, Style, TimeSortBy } from "../api/interfaces";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";
import AutoSizer from "react-virtualized-auto-sizer";

function Globals() {
    const [game, setGame] = useState(Game.bhop);
    const [style, setStyle] = useState(Style.autohop);

    useEffect(() => {
        document.title = "strafes - globals"
    }, []);

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Globals
        </Typography>
        <Typography variant="body2" padding={1}>
            Each record in the list below is a world record (1st place).
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1} flexGrow={1} minHeight={540}>
            <AutoSizer disableWidth>
                {({ height }) => <TimesCard title="World Records" height={height} defaultSort={TimeSortBy.DateDesc} game={game} style={style} onlyWRs />}
            </AutoSizer>
        </Box>
    </Box>
    );
}

export default Globals;