import React, { CSSProperties, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Card, CardActionArea, CardContent, CardMedia, colors, Grid, Paper, TextField, Typography, useTheme } from "@mui/material";
import { useLocation, useOutletContext, useParams } from "react-router";
import { ContextParams, formatGame, getAllowedStyles } from "../util/format";
import { Game, Map, Style, TimeSortBy } from "../api/interfaces";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import StyleSelector, { useStyle } from "./StyleSelector";
import TimesCard from "./TimesCard";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import GameSelector, { useGame } from "./GameSelector";

const CARD_SIZE = 180;

function MapRow(props: {data: {itemsPerRow: number, maps: Map[], mapStyle: Style, game: Game, selectedMap?: Map}, index: number, style: CSSProperties}) {
    const { data, index, style } = props;
    const { maps, itemsPerRow, mapStyle, game, selectedMap } = data;

    const rowMaps: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, maps.length);
    for (let i = fromIndex; i < toIndex; ++i) {
        const selected = selectedMap?.id === maps[i].id;
        rowMaps.push(<MapCard key={i} map={maps[i]} selected={selected} style={mapStyle} game={game} />);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowMaps}
    </Box>
    );
}

function MapCard(props: {map: Map, selected?: boolean, style: Style, game: Game}) {
    const { map, selected, style, game } = props;
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";
    const creatorColor = selected ? (isLightMode ? colors.grey[50] : colors.grey[200]) : theme.palette.text.secondary;
    const bgColor = selected ? (theme.palette.primary[isLightMode ? 400 : 600]) : undefined;
    const hoverColor = selected ? (theme.palette.primary[isLightMode ? 300 : 500]) : undefined;
    const titleColor = isLightMode && selected ? "common.white" : undefined;
    const real_height = CARD_SIZE - 16;
    
    let allowedGame = map.game;
    if (game === Game.fly_trials) {
        allowedGame = Game.fly_trials;
    }
    const allowedStyles = getAllowedStyles(allowedGame);
    const styleForLink = allowedStyles.includes(style) ? style : allowedStyles[0];

    return (
    <Box padding="8px">
        <Card elevation={2} id={"mapCard" + map.id}
            sx={{width: real_height * 2, 
                height: real_height, 
                display: "flex",
                flexDirection: "row",
                ":hover": {boxShadow: 10}}}>
            <CardActionArea
                href={`/maps/${map.id}?style=${styleForLink}&game=${allowedGame}`}
                sx={{ 
                    height: "100%",
                    backgroundColor: bgColor,
                    display: "flex",
                    flexDirection: "row",
                    ":hover": { backgroundColor: hoverColor, "& img": { transform: "scale(1.15)" } }
                }}
            >
                <CardContent sx={{height: "100%", width: real_height, display: "flex", flexDirection: "column", overflowWrap: "break-word"}}>
                    <Box flexGrow={1}>
                        <Typography maxHeight="64px" variant="h6" overflow="hidden" textOverflow="ellipsis" color={titleColor}>
                            {map.name}
                        </Typography>
                        <Typography variant="subtitle1" overflow="hidden" textOverflow="ellipsis" color={creatorColor} maxHeight={84} >
                            {map.creator}
                        </Typography>
                    </Box>
                    <Typography variant="caption" marginLeft="auto" color={titleColor}>
                        {formatGame(map.game)}
                    </Typography>
                </CardContent>
                {map.largeThumb ? 
                <Box width={real_height} height={real_height} overflow="hidden">
                    <CardMedia 
                        component="img" 
                        image={map.largeThumb} 
                        alt={map.name} 
                        sx={{
                            width: real_height, 
                            height: real_height, 
                            transition: "transform .5s ease"
                        }} 
                    />
                </Box>
                : <QuestionMarkIcon sx={{ fontSize: real_height }} />}
            </CardActionArea>
            
        </Card>
    </Box>
    );
}

function MapList(props: {width: number, filteredMaps: Map[], style: Style, game: Game, selectedMap?: Map}) {
    const { width, filteredMaps, style, game, selectedMap } = props;
    const listRef = useRef<FixedSizeList>(null);

    const itemsPerRow = Math.floor((width - 12) / (CARD_SIZE * 2)) || 1;
    const rowCount = Math.ceil(filteredMaps.length / itemsPerRow);

    useEffect(() => {
        if (selectedMap && listRef.current) {
            let selectedIndex = -1;
            for (let i = 0; i < filteredMaps.length; ++i) {
                const map = filteredMaps[i];
                if (map.id === selectedMap.id) {
                    selectedIndex = i;
                    break;
                }
            }
            if (selectedIndex !== -1) {
                const selectedRow = Math.floor(selectedIndex / itemsPerRow);
                listRef.current.scrollToItem(selectedRow);
            }
        }
    // Not including itemsPerRow or filteredMaps as deps because I only want to scroll to the selected row when:
    // 1. Loading a map for the first time (from a direct link), or
    // 2. Clicking on a map
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMap, listRef])
    
    return (
        <FixedSizeList 
            style={{scrollbarWidth: "thin"}} height={CARD_SIZE * 2} width={width} 
            itemCount={rowCount} itemSize={CARD_SIZE} ref={listRef}
            itemData={{maps: filteredMaps, itemsPerRow: itemsPerRow, selectedMap: selectedMap, mapStyle: style, game: game}}
        >
            {MapRow}
        </FixedSizeList>
    );
}

function MapsPage() {
    const { id } = useParams();
    const { maps, sortedMaps } = useOutletContext() as ContextParams;

    const [searchText, setSearchText] = useState("");
    const [selectedMap, setSelectedMap] = useState<Map>();
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();
    const location = useLocation();

    useEffect(() => {
        document.title = selectedMap ? `strafes - maps - ${selectedMap.name}` : "strafes - maps";
    }, [selectedMap]);
    
    useEffect(() => {
        const mapId = id && !isNaN(+id) ? +id : undefined;
        if (mapId) {
            const map = maps[mapId];
            setSelectedMap(map);
            const queryParams = new URLSearchParams(location.search);
            const gameParam = queryParams.get("game");
            if (gameParam) {
                setGame(+gameParam);
            }
        }
    }, [selectedMap, id, maps, setGame, location.search]);

    const onSearchTextChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);
    }

    let filteredMaps: Map[] = [];
    if (searchText) {
        const validMaps = new Set<number>();
        const search = searchText.toLowerCase();
        // Show exact map name matches first
        for (const map of sortedMaps) {
            if (!validMaps.has(map.id) && map.name.toLowerCase().startsWith(search)) {
                filteredMaps.push(map);
                validMaps.add(map.id);
            }
        }
        // Show near map name matches last
        for (const map of sortedMaps) {
            if (!validMaps.has(map.id) && map.name.toLowerCase().includes(search)) {
                filteredMaps.push(map);
                validMaps.add(map.id);
            }
        }
        // Exact creator matches
        for (const map of sortedMaps) {
            if (!validMaps.has(map.id) && map.creator.toLowerCase().startsWith(search)) {
                filteredMaps.push(map);
                validMaps.add(map.id);
            }
        }
        // Near creator matches
        for (const map of sortedMaps) {
            if (!validMaps.has(map.id) && map.creator.toLowerCase().includes(search)) {
                filteredMaps.push(map);
                validMaps.add(map.id);
            }
        }
        // Always make sure selected map exists
        if (selectedMap && !validMaps.has(selectedMap.id)) {
            filteredMaps.push(selectedMap);
        }
    }
    else {
        filteredMaps = sortedMaps;
    }

    let allowedGames: Game[] | undefined;
    if (selectedMap) {
        if (selectedMap.game === Game.fly_trials) {
            allowedGames = [Game.fly_trials];
        }
        else {
            allowedGames = [selectedMap.game, Game.fly_trials];
        }
    }

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Maps
        </Typography>
        <Box padding={1} marginBottom={1}>
            <Paper elevation={2} sx={{padding: 3, display:"flex", alignItems: "center"}}>
                <Box width="100%">
                    <Typography variant="subtitle1" marginBottom={2}>Search by name or creator as you type</Typography>
                    <TextField onChange={onSearchTextChanged} fullWidth label="Name" variant="outlined" />
                </Box>
            </Paper>
        </Box>
        <Grid container height={CARD_SIZE * 2} sx={{scrollbarWidth: "thin"}}>
            <AutoSizer disableHeight>
            {({ width }) => <MapList width={width} filteredMaps={filteredMaps} style={style} game={game} selectedMap={selectedMap} />}
            </AutoSizer>
        </Grid>
        <Box padding={0.5} marginTop={1} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} allowedGames={allowedGames} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1}>
            <TimesCard defaultSort={TimeSortBy.TimeAsc} map={selectedMap} game={game} style={style} hideMap showPlacement />
        </Box>
    </Box>
    );
}

export default MapsPage;