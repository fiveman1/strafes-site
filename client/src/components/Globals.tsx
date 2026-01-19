import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import { Typography, useMediaQuery } from "@mui/material";
import TimesCard from "./TimesCard";
import { TimeSortBy } from "../api/interfaces";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import AutoSizer from "react-virtualized-auto-sizer";
import { ALL_COURSES, MAIN_COURSE } from "../util/format";
import IncludeBonusCheckbox, { useIncludeBonuses } from "./IncludeBonusCheckbox";

function Globals() {
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const [includeBonuses, setIncludeBonuses] = useIncludeBonuses();

    useEffect(() => {
        document.title = "globals - strafes"
    }, []);

    return (
    <Box padding={smallScreen ? 1 : 2} flexGrow={1} display="flex" flexDirection="column">
        <Typography variant="h2" padding={1}>
            Globals
        </Typography>
        <Typography variant="body2" padding={1}>
            Each record in the list below is a world record (1st place). This list gets updated hourly.
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} allowSelectAll />
            <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
            <IncludeBonusCheckbox includeBonuses={includeBonuses} setIncludeBonuses={setIncludeBonuses} />
        </Box>
        <Box padding={1} flexGrow={1} minHeight={540}>
            <AutoSizer disableWidth>
                {({ height }) => 
                <TimesCard 
                    title="World Records" 
                    height={height} 
                    defaultSort={TimeSortBy.DateDesc} 
                    game={game} 
                    style={style} 
                    course={includeBonuses ? ALL_COURSES : MAIN_COURSE} 
                    onlyWRs 
                    allowOnlyWRs 
                />}
            </AutoSizer>
        </Box>
    </Box>
    );
}

export default Globals;