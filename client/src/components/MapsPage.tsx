import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, IconButton, Link, Paper, Popover, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router";
import { ContextParams, getAllowedGameForMap, getGameColor, MapDetailsProps } from "../util/common";
import { Game, Map, TimeSortBy, formatGame, getAllowedStyles } from "shared";
import StyleSelector from "./StyleSelector";
import TimesCard from "./TimesCard";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import GameSelector from "./GameSelector";
import CourseSelector from "./CourseSelector";
import DownloadIcon from '@mui/icons-material/Download';
import { download, generateCsv, mkConfig } from "export-to-csv";
import { UNRELEASED_MAP_COLOR } from "../util/colors";
import { MapTimesSort, useCourse, useGameStyle } from "../util/states";
import MapSearch from "./MapSearch";
import { grey } from "@mui/material/colors";
import { sortMapsByName } from "../util/sort";
import MapSortSelector from "./MapSortSelector";
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ColorChip from "./ColorChip";

const shortDateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short"
});

const longDateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
});

function dateCompareFunc(a: Map, b: Map, isAsc: boolean) {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA === dateB) {
        return sortMapsByName(a, b);
    }
    return isAsc ? dateB - dateA : dateA - dateB;
}

function MapInfoCard(props: MapDetailsProps) {
    const { selectedMap } = props;

    const { sortedMaps } = useOutletContext() as ContextParams;

    const [filterGame, setFilterGame] = useState(Game.all);
    const [sort, setSort] = useState<MapTimesSort>("nameAsc");
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleExpand = (expanded: boolean) => {
        setExpanded(expanded);
    }

    const open = Boolean(anchorEl);
    const id = open ? "filter-popover" : undefined;

    let maps = sortedMaps;
    if (filterGame !== Game.all) {
        maps = maps.filter((map) => map.game === filterGame);
    }

    let compareFunc: (a: Map, b: Map) => number;
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

    maps.sort(compareFunc);

    return (
        <Paper elevation={2} sx={{ padding: 2, display: "flex", flexDirection: "column", overflowWrap: "break-word" }}>
            <Box marginBottom={1} display="flex">
                <Box flexGrow={1}>
                    <Typography variant="caption">
                        Map
                    </Typography>
                </Box>
                <IconButton aria-describedby={id} size="small" onClick={handleClick}>
                    <TuneIcon />
                </IconButton>
                <IconButton size="small" sx={{ml: 0.5}} onClick={() => handleExpand(!expanded)} disabled={selectedMap === undefined}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: "center",
                        horizontal: "left",
                    }}
                    transformOrigin={{
                        vertical: "center",
                        horizontal: "right"
                    }}
                >
                    <Box display="flex" flexDirection="column" flexWrap="wrap" padding={2}>
                        <Box display="flex" alignItems="center">
                            <FilterAltIcon sx={{mr: 1}} />
                            <GameSelector game={filterGame} setGame={setFilterGame} label="Filter game" allowSelectAll disablePadding />
                        </Box>
                        <Box display="flex" alignItems="center" mt={3} mr={-1}>
                            <SortIcon sx={{mr: 1}} />
                            <MapSortSelector sort={sort} setSort={setSort} />
                        </Box>
                    </Box>
                </Popover>
            </Box>
            <MapSearch {...props} maps={maps} />
            {selectedMap && expanded ? 
            <MapDetailSection selectedMap={selectedMap} />
            : undefined}
        </Paper>
    )
}

function MapDetailSection(props: { selectedMap?: Map }) {
    const { selectedMap } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 720px)");
    const theme = useTheme();

    if (!selectedMap) {
        return undefined;
    }

    const isLightMode = theme.palette.mode === "light";
    const imageBgColor = isLightMode ? grey[400] : grey[800];

    const imageSize = smallScreen ? 175 : 200;
    const mapDate = new Date(selectedMap.date);
    const isUnreleased = new Date() < mapDate;
    let releasedText = isUnreleased ? "Releases on " : "Released on ";
    releasedText += longDateFormat.format(mapDate);
    const gameColor = getGameColor(selectedMap.game, theme);

    return (
        <Box display="flex" flexDirection={smallScreen ? "column" : "row"} marginTop={2} alignItems="center" justifyContent="center">
            <Box display="flex" flexDirection="column" paddingRight={smallScreen ? 0 : 8} paddingLeft={smallScreen ? 0 : 8} paddingBottom={smallScreen ? 1.5 : 0} >
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" marginBottom={4} flexGrow={1}>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        margin={0.5}
                        color={isLightMode ? "primary" : "textPrimary"}
                    >
                        {selectedMap.name}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                        by {selectedMap.creator}
                    </Typography>
                </Box>
                <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                    {isUnreleased ?
                        <ColorChip label="Unreleased" color={UNRELEASED_MAP_COLOR} />
                        :
                        <></>}
                    <Typography variant="body2">
                        {releasedText}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Server load count: {selectedMap.loadCount}
                    </Typography>
                </Box>
            </Box>
            <Box
                minWidth={imageSize}
                width={imageSize}
                height={imageSize}
                borderRadius="10px"
                bgcolor={imageBgColor}
                overflow="hidden"
                position="relative"
            >
                {selectedMap.largeThumb ?
                    <Box
                        width="100%"
                        height="100%"
                        component="img"
                        src={selectedMap.largeThumb}
                        alt={selectedMap.name}
                    />
                    :
                    <QuestionMarkIcon sx={{ fontSize: imageSize, minWidth: imageSize, alignSelf: "center", color: "white" }} />}
                <Typography position="absolute" top="8px" right="8px" variant="body2" fontWeight="bold" sx={{
                    padding: 0.4,
                    overflow: "hidden",
                    backgroundColor: gameColor,
                    textAlign: "center",
                    color: "white",
                    textShadow: "black 1px 1px 1px",
                    borderRadius: "6px"
                }}>
                    {formatGame(selectedMap.game)}
                </Typography>
                <Typography position="absolute" bottom="6px" right="6px" variant="body1" fontWeight="bold" sx={{
                    padding: 0.75,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    backdropFilter: "blur(8px)",
                    textAlign: "center",
                    color: "white",
                    textShadow: "black 3px 3px 3px",
                    borderRadius: "8px"
                }}>
                    {shortDateFormat.format(mapDate)}
                </Typography>
            </Box>
        </Box>
    );
}

function MapsPage() {
    const { id } = useParams();
    const { maps, sortedMaps } = useOutletContext() as ContextParams;

    const [initalLoadComplete, setInitalLoadComplete] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map>();
    const { game, setGame, style, setStyle } = useGameStyle();
    const [course, setCourse] = useCourse();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const theme = useTheme();

    useEffect(() => {
        document.title = "maps - strafes";
    }, []);

    const onSelectMap = useCallback((map: Map | undefined) => {
        document.title = map ? `maps - ${map.name} - strafes` : "maps - strafes";

        let allowedGame = map ? map.game : game;

        if (game === Game.fly_trials) {
            allowedGame = Game.fly_trials;
        }
        const allowedStyles = getAllowedStyles(allowedGame);
        const styleForLink = allowedStyles.includes(style) ? style : allowedStyles[0];

        let href = map ? `/maps/${map.id}` : "/maps";
        href += `?style=${styleForLink}&game=${allowedGame}&course=0`;

        searchParams.forEach((value, key) => {
            if (key === "game" || key === "style" || key === "course") return;
            href += `&${key}=${value}`;
        });

        setInitalLoadComplete(true);
        setSelectedMap(map);

        // Make sure game is set to a valid game
        const allowedGames = getAllowedGameForMap(map);
        if (!allowedGames.includes(game)) {
            setGame(allowedGames[0]);
        }

        // Reset course to main
        setCourse(0);

        if (href) navigate(href, { replace: true });
    }, [game, navigate, searchParams, setCourse, setGame, style]);

    useEffect(() => {
        // Load map on initial load
        if (initalLoadComplete || selectedMap !== undefined) return;

        const mapId = id && !isNaN(+id) ? +id : undefined;
        if (mapId === undefined) return;

        const map = maps[mapId];
        if (map) {
            document.title = `maps - ${map.name} - strafes`;
            setInitalLoadComplete(true);
            setSelectedMap(map);
        }
    }, [id, initalLoadComplete, maps, onSelectMap, selectedMap]);



    const onDownloadMapCsv = () => {
        if (sortedMaps.length < 1) {
            return;
        }

        const csvConfig = mkConfig({
            filename: "maps", columnHeaders: [
                "id", "name", "creator", "game", "release_date", "load_count", "courses"
            ]
        });
        const mapData: Record<string, number | string | boolean | null | undefined>[] = [];
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

    const breadcrumbs: React.ReactElement[] = [];
    if (selectedMap) {
        const mapDate = new Date(selectedMap.date);
        const isUnreleased = new Date() < mapDate;

        breadcrumbs.push(
            <Link underline="hover" color="inherit" component="button" onClick={() => onSelectMap(undefined)}>
                Maps
            </Link>,
            <Box display="flex" flexDirection="row" alignItems="center">
                {selectedMap.smallThumb ? 
                <Box 
                    component="img" 
                    height={30} 
                    width={30} 
                    src={selectedMap.smallThumb} 
                    alt={selectedMap.name}
                    border={isUnreleased ? 1 : 0}
                    borderColor={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
                    borderRadius="4px"
                    mr={1.25}
                />
                : 
                <QuestionMarkIcon htmlColor={isUnreleased ? UNRELEASED_MAP_COLOR : "textPrimary"} sx={{ fontSize: 30, mr: 1 }} />}
                <Typography color="textPrimary">
                    {selectedMap.name}
                    <Typography 
                        ml={1}
                        fontWeight="bold" 
                        variant="caption"
                        sx={{
                            padding: 0.4,
                            overflow: "hidden",
                            backgroundColor: getGameColor(selectedMap.game, theme),
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px"
                        }}
                    >
                        {formatGame(selectedMap.game)}
                    </Typography>
                </Typography>
            </Box>
        );
    }
    else {
        breadcrumbs.push(
            <Typography color="textPrimary">
                Maps
            </Typography>
        );
    }

    return (
        <Box flexGrow={1}>
            <Box display="flex" alignItems="center">
                <Breadcrumbs separator={<NavigateNextIcon />} sx={{p: 1, flexGrow: 1}}>
                    <Link underline="hover" color="inherit" href="/">
                        Home
                    </Link>
                    {breadcrumbs}
                </Breadcrumbs>
                <Tooltip title="Download maps as .csv" placement="left" arrow>
                    <Box display="flex" width="34px" height="34px">
                        <IconButton size="small" disabled={sortedMaps.length < 1} onClick={onDownloadMapCsv}>
                            <DownloadIcon />
                        </IconButton>
                    </Box>
                </Tooltip>
            </Box>
            <Box padding={1}>
                <MapInfoCard selectedMap={selectedMap} setSelectedMap={onSelectMap} />
            </Box>
            <Box padding={0.5} marginTop={1} display="flex" flexWrap="wrap" alignItems="center">
                <GameSelector game={game} setGame={setGame} selectedMap={selectedMap} />
                <StyleSelector game={game} style={style} setStyle={setStyle} />
                <CourseSelector course={course} setCourse={setCourse} map={selectedMap} />
            </Box>
            <Box padding={1}>
                <TimesCard defaultSort={TimeSortBy.TimeAsc} map={selectedMap} game={game} style={style} course={course} pageSize={20} hideMap showPlacement />
            </Box>
        </Box>
    );
}

export default MapsPage;