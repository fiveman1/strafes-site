import React, { CSSProperties, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Card, CardActionArea, CardContent, CardMedia, colors, darken, Grid, IconButton, lighten, Paper, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useLocation, useOutletContext, useParams } from "react-router";
import { ContextParams } from "../util/common";
import { Game, Map, Style, TimeSortBy, formatGame, getAllowedStyles } from "shared";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import StyleSelector from "./StyleSelector";
import TimesCard from "./TimesCard";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import GameSelector from "./GameSelector";
import CourseSelector from "./CourseSelector";
import DownloadIcon from '@mui/icons-material/Download';
import { download, generateCsv, mkConfig } from "export-to-csv";
import MapSortSelector from "./MapSortSelector";
import { sortMapsByName } from "../util/sort";
import { UNRELEASED_MAP_COLOR } from "../util/colors";
import { AcceptedData } from "export-to-csv/output/lib/types";
import { MapTimesSort, useCourse, useGame, useMapSort, useStyle } from "../util/states";

const CARD_SIZE = 180;
const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short"
});

function MapRow(props: {data: {itemsPerRow: number, maps: Map[], mapStyle: Style, game: Game, sort: MapTimesSort, filterGame: Game, selectedMap?: Map}, index: number, style: CSSProperties}) {
    const { data, index, style } = props;
    const { maps, itemsPerRow, mapStyle, game, sort, filterGame, selectedMap } = data;

    const rowMaps: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, maps.length);
    for (let i = fromIndex; i < toIndex; ++i) {
        const selected = selectedMap?.id === maps[i].id;
        rowMaps.push(<MapCard key={i} map={maps[i]} selected={selected} style={mapStyle} game={game} sort={sort} filterGame={filterGame}/>);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowMaps}
    </Box>
    );
}

function MapCard(props: {map: Map, selected?: boolean, style: Style, game: Game, sort: MapTimesSort, filterGame: Game}) {
    const { map, selected, style, game, sort, filterGame } = props;
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";
    const isUnreleased = new Date() < new Date(map.date);
    
    const titleColor = isLightMode && selected ? "white" : undefined;
    const creatorColor = selected ? (isLightMode ? colors.grey[50] : colors.grey[200]) : theme.palette.text.secondary;
    let bgColor = selected ? theme.palette.primary[500] : undefined;
    let hoverColor = selected ? (theme.palette.primary[isLightMode ? 600 : 400]) : undefined;
    const questionMarkColor = selected ? "white" : undefined;
    const border = isUnreleased ? UNRELEASED_MAP_COLOR : undefined;

    if (isUnreleased) {
        bgColor = selected ? UNRELEASED_MAP_COLOR : undefined;
        hoverColor = selected ? (isLightMode ? colors.amber[800] : darken(UNRELEASED_MAP_COLOR, 0.1)) : undefined;
    }

    const real_height = CARD_SIZE - 16;
    
    let allowedGame = map.game;
    if (game === Game.fly_trials) {
        allowedGame = Game.fly_trials;
    }
    const allowedStyles = getAllowedStyles(allowedGame);
    const styleForLink = allowedStyles.includes(style) ? style : allowedStyles[0];
    let href = selected ? "/maps" : `/maps/${map.id}`;
    href += `?style=${styleForLink}&game=${allowedGame}&course=0&sort=${sort}&filterGame=${filterGame}`;

    return (
    <Box padding="8px">
        <Card elevation={2} id={"mapCard" + map.id}
            sx={{width: real_height * 2, 
                height: real_height, 
                display: "flex",
                flexDirection: "row",
                ":hover": { boxShadow: 10 },
                border: border ? 2 : undefined,
                borderColor: border,
                
            }}
        >
            <CardActionArea
                href={href}
                sx={{ 
                    height: "100%",
                    backgroundColor: bgColor,
                    borderRadius: border ? 0 : undefined,
                    display: "flex",
                    flexDirection: "row",
                    transition: "background-color .3s ease",
                    ":hover": { backgroundColor: hoverColor, "& img": { transform: "scale(1.15)" } }
                }}
            >
                <CardContent sx={{height: "100%", padding: 1.5, width: real_height, display: "flex", flexDirection: "column", overflowWrap: "break-word"}}>
                    <Box display="flex" flexDirection="column" maxHeight="100%">
                        <Typography variant="h6" overflow="hidden" textOverflow="ellipsis" color={titleColor} minHeight={32} maxHeight={96}>
                            {map.name}
                        </Typography>
                        <Typography variant="subtitle1" overflow="hidden" textOverflow="ellipsis" color={creatorColor}>
                            {map.creator}
                        </Typography>
                    </Box>
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
                            transition: "transform .3s ease"
                        }} 
                    />
                    
                </Box>
                : <QuestionMarkIcon sx={{ fontSize: real_height, color: questionMarkColor }} />}
                <Typography position="absolute" top="8px" right="8px" variant="body2" fontWeight="bold" sx={{ 
                    padding: 0.5,
                    overflow:"hidden", 
                    backgroundColor: theme.palette.primary.main,
                    textAlign: "center", 
                    color: "white",
                    textShadow: "black 1px 1px 1px",
                    borderRadius: "6px"
                }}>
                    {formatGame(map.game)}
                </Typography>
                <Typography position="absolute" bottom="8px" right="8px" variant="body1" fontWeight="bold" sx={{ 
                    padding: 0.5,
                    overflow:"hidden", 
                    textOverflow:"ellipsis", 
                    backdropFilter: "blur(8px)", 
                    textAlign: "center", 
                    color: "white",
                    textShadow: "black 3px 3px 3px",
                    borderRadius: "12px"
                }}>
                    {dateFormat.format(new Date(map.date))}
                </Typography>
            </CardActionArea>
        </Card>
    </Box>
    );
}

function MapList(props: {width: number, filteredMaps: Map[], style: Style, game: Game, sort: MapTimesSort, filterGame: Game, selectedMap?: Map}) {
    const { width, filteredMaps, style, game, sort, filterGame, selectedMap } = props;
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
    }, [selectedMap, listRef, sort, filterGame])
    
    return (
        <FixedSizeList 
            style={{scrollbarWidth: "thin"}} height={CARD_SIZE * 2} width={width} 
            itemCount={rowCount} itemSize={CARD_SIZE} ref={listRef}
            itemData={{maps: filteredMaps, itemsPerRow: itemsPerRow, selectedMap: selectedMap, mapStyle: style, game: game, sort: sort, filterGame: filterGame}}
        >
            {MapRow}
        </FixedSizeList>
    );
}

const mapDateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
});

function MapInfoCard(props: {selectedMap?: Map}) {
    const { selectedMap } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 720px)");
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";

    if (!selectedMap) {
        return undefined;
    }

    const imageSize = smallScreen ? 250 : 300;
    const mapDate = new Date(selectedMap.date);
    const isUnreleased = new Date() < mapDate;
    let releasedText = isUnreleased ? "Releases on " : "Released on ";
    releasedText += mapDateFormat.format(mapDate);

    return (
        <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: smallScreen ? "column" : "row"}}>
            <Box display="flex" flexDirection="column" flexGrow={1} marginRight={smallScreen ? 0 : 2} marginBottom={smallScreen ? 1.5 : 0} sx={{overflowWrap: "break-word"}}>
                <Box display="flex" flexDirection="column" justifyContent="flex-start" marginBottom={4} flexGrow={1}>
                    <Typography variant="caption" marginBottom={1}>
                        Map Info
                    </Typography>
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                        <Typography variant="h4" fontWeight="bold" margin={0.5} sx={{
                            background: `radial-gradient(circle, ${theme.palette.primary.main}, ${isLightMode ? lighten(theme.palette.primary.main, 0.25) : theme.palette.text.primary})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}>
                            {selectedMap.name}
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                            by {selectedMap.creator}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    {isUnreleased ? 
                    <Typography variant="body2" color={UNRELEASED_MAP_COLOR}>
                        Unreleased
                    </Typography>
                    : 
                    <></>}
                    <Typography variant="body2">
                        {releasedText}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Server load count: {selectedMap.loadCount}
                    </Typography>
                    <Typography variant="body2" color="primary">
                        {formatGame(selectedMap.game)}
                    </Typography>
                </Box>
            </Box>
            {
            selectedMap.largeThumb ? 
            <Box
                alignSelf="center"
                minWidth={imageSize}
                width={imageSize} 
                height={imageSize} 
                borderRadius="4px" 
                overflow="hidden"
            >
                <Box 
                    width="100%"
                    height="100%"
                    component="img" 
                    src={selectedMap.largeThumb} 
                    alt={selectedMap.name} 
                />
            </Box>
                :
            <QuestionMarkIcon sx={{ fontSize: imageSize, minWidth: imageSize, alignSelf: "center" }}  />
            }
        </Paper>
    )
}

function dateCompareFunc(a: Map, b: Map, isAsc: boolean) {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA === dateB) {
        return sortMapsByName(a, b);
    }
    return isAsc ? dateB - dateA : dateA - dateB;
}

function MapsPage() {
    const { id } = useParams();
    const { maps, sortedMaps } = useOutletContext() as ContextParams;

    const [searchText, setSearchText] = useState("");
    const [selectedMap, setSelectedMap] = useState<Map>();
    const [game, setGame] = useGame();
    const [filterGame, setFilterGame] = useGame("filterGame", Game.all);
    const [style, setStyle] = useStyle();
    const [course, setCourse] = useCourse();
    const location = useLocation();
    const [sort, setSort] = useMapSort();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    useEffect(() => {
        document.title = selectedMap ? `maps - ${selectedMap.name} - strafes` : "maps - strafes";
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
        else {
            setSelectedMap(undefined);
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
    }
    else {
        filteredMaps = sortedMaps;
    }

    if (filterGame !== Game.all) {
        filteredMaps = filteredMaps.filter((map) => map.game === filterGame);
    }

    // Always make sure selected map exists
    if (selectedMap && !filteredMaps.find((map) => map.id === selectedMap.id)) {
        filteredMaps.push(selectedMap);
    }

    let compareFunc : ((a: Map, b: Map) => number);
    switch (sort) {
        case "nameAsc":
            compareFunc = sortMapsByName;
            break;
        case "nameDesc":
            compareFunc = (a, b) => sortMapsByName(a, b) * -1;
            break;
        case "creatorAsc":
            compareFunc = (a, b) => a.creator === b.creator ? sortMapsByName(a, b) : a.creator.toLowerCase() > b.creator.toLowerCase() ? 1 : -1;
            break;
        case "creatorDesc":
            compareFunc = (a, b) => a.creator === b.creator ? sortMapsByName(a, b) : a.creator.toLowerCase() < b.creator.toLowerCase() ? 1 : -1;
            break;
        case "dateAsc":
            compareFunc = (a, b) => dateCompareFunc(a, b, true);
            break;
        case "dateDesc":
            compareFunc = (a, b) => dateCompareFunc(a, b, false);
            break;
        case "countAsc":
            compareFunc = (a, b) => a.loadCount === b.loadCount ? sortMapsByName(a, b) : b.loadCount - a.loadCount;
            break;
        case "countDesc":
            compareFunc = (a, b) => a.loadCount === b.loadCount ? sortMapsByName(a, b) : a.loadCount - b.loadCount;
            break;
    }

    filteredMaps.sort(compareFunc);

    let allowedGames: Game[] | undefined;
    if (selectedMap) {
        if (selectedMap.game === Game.fly_trials) {
            allowedGames = [Game.fly_trials];
        }
        else {
            allowedGames = [selectedMap.game, Game.fly_trials];
        }
    }

    const onDownloadMapCsv = () => {
        if (sortedMaps.length < 1) {
            return;
        }

        const csvConfig = mkConfig({ filename: "maps", columnHeaders: [
            "id", "name", "creator", "game", "release_date", "load_count", "courses"
        ]});
        const mapData: Record<string, AcceptedData>[] = [];
        for (const map of sortedMaps) {
            mapData.push({
                id: map.id,
                name: map.name,
                creator: map.creator,
                game: formatGame(map.game),
                release_date: map.date,
                load_count: map.loadCount,
                courses: map.modes
            });
        }
        const csv = generateCsv(csvConfig)(mapData);
        download(csvConfig)(csv);
    };

    return (
    <Box flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Maps
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={filterGame} setGame={setFilterGame} label="Filter by game" paramName="filterGame" allowSelectAll />
            <MapSortSelector setSort={setSort} />
        </Box>
        <Box padding={1} marginBottom={1}>
            <Paper elevation={2} sx={{padding: 3, display:"flex", alignItems: "center"}}>
                <Box width="100%">
                    <Typography variant="subtitle1" marginBottom={2}>Search by name or creator as you type</Typography>
                    <TextField onChange={onSearchTextChanged} fullWidth label="Name" variant="outlined" type="search" slotProps={{htmlInput: {autoComplete: "one-time-code"}}}/>
                </Box>
            </Paper>
        </Box>
        <Grid container height={CARD_SIZE * 2} sx={{scrollbarWidth: "thin"}} paddingRight={smallScreen ? 1 : 0} paddingLeft={smallScreen ? 1 : 0}>
            <AutoSizer disableHeight>
            {({ width }) => <MapList width={width} filteredMaps={filteredMaps} style={style} game={game} sort={sort} filterGame={filterGame} selectedMap={selectedMap} />}
            </AutoSizer>
        </Grid>
        <Box padding={0.5} marginTop={1} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} allowedGames={allowedGames} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
            <CourseSelector course={course} setCourse={setCourse} map={selectedMap} />
        </Box>
        <Box padding={1}>
            <TimesCard defaultSort={TimeSortBy.TimeAsc} map={selectedMap} game={game} style={style} course={course} hideMap showPlacement />
        </Box>
        <Box padding={1}>
            <MapInfoCard selectedMap={selectedMap} />
        </Box>
        <Box padding={1} display="flex" flexDirection="row" justifyContent="flex-end">
            <Tooltip title="Download maps as .csv" placement="left" arrow>
                <Box>
                    <IconButton disabled={sortedMaps.length < 1} onClick={onDownloadMapCsv}>
                        <DownloadIcon />
                    </IconButton>
                </Box>
            </Tooltip>
        </Box>
    </Box>
    );
}

export default MapsPage;