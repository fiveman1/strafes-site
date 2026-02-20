import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, darken, IconButton, Link, Paper, Popover, Skeleton, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { ContextParams, getAllowedGameForMap, getGameColor, MapDetailsProps } from "../common/common";
import { Game, MAX_TIER, Map, MapTierInfo, ModerationStatus, NO_TIER, TierVotingEligibilityInfo, TimeSortBy, formatGame, formatTier, getAllowedStyles, isEligibleForVoting } from "shared";
import StyleSelector from "./forms/StyleSelector";
import TimesCard from "./cards/grids/TimesCard";
import GameSelector from "./forms/GameSelector";
import CourseSelector from "./forms/CourseSelector";
import DownloadIcon from '@mui/icons-material/Download';
import { download, generateCsv, mkConfig } from "export-to-csv";
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../common/colors";
import { MapTimesSort, useCourse, useGameStyle } from "../common/states";
import MapSearch from "./search/MapSearch";
import { grey } from "@mui/material/colors";
import { sortMapsByName } from "../common/sort";
import MapSortSelector from "./forms/MapSortSelector";
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ColorChip from "./displays/ColorChip";
import MapThumb from "./displays/MapThumb";
import { getCurrentMapTierVote, voteForMapTier } from "../api/api";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import BlockIcon from '@mui/icons-material/Block';
import { dateTimeFormat, relativeTimeFormatter } from "../common/datetime";
import TimeAgo from "react-timeago";
import MapTierListSelector from "./forms/MapTierListSelector";
import WarningIcon from '@mui/icons-material/Warning';
import { BarPlot, ChartContainer, ChartsTooltip } from "@mui/x-charts";

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

    const { sortedMaps, loggedInUser } = useOutletContext() as ContextParams;

    const [ filterGame, setFilterGame ] = useState(Game.all);
    const [ filterTiers, setFilterTiers ] = useState(new Set(Array.from(Array(MAX_TIER + 1).keys()))); // A set containing the numbers 0, 1, 2, ..., MAX_TIER
    const [ sort, setSort ] = useState<MapTimesSort>("nameAsc");
    const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);
    const [ expanded, setExpanded ] = useState(localStorage.getItem("expandMapDetail") !== "false"); // Expanded by default
    const [ tierVoteInfo, setTierVoteInfo ] = useState<MapTierInfo>();
    const [ tierVoteLoading, setTierVoteLoading ] = useState(true);

    useEffect(() => {
        if (!loggedInUser || !selectedMap) {
            setTierVoteInfo(undefined);
            setTierVoteLoading(false);
            return;
        }

        let isLoading = true;
        setTierVoteLoading(true);
        
        const promise = async () => {
            const info = await getCurrentMapTierVote(selectedMap.id);
            if (!isLoading) {
                return;
            }
            setTierVoteInfo(info);
            setTierVoteLoading(false);
        }
        promise();

        return () => {
            isLoading = false;
        }
    }, [loggedInUser, selectedMap]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleExpand = (expanded: boolean) => {
        setExpanded(expanded);
        localStorage.setItem("expandMapDetail", expanded ? "true" : "false");
    };

    const onSelectFilterTier = (tier: number) => {
        setFilterTiers((tiers) => {
            const copy = new Set(tiers);
            if (copy.has(tier)) {
                copy.delete(tier);
            }
            else {
                copy.add(tier);
            }
            return copy;
        });
    };

    const open = Boolean(anchorEl);
    const id = open ? "filter-popover" : undefined;

    let maps = sortedMaps;
    if (filterGame !== Game.all) {
        maps = maps.filter((map) => map.game === filterGame);
    }

    maps = maps.filter((map) => filterTiers.has(map.tier ?? NO_TIER));

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
        case "tierAsc":
            compareFunc = (a, b) => a.tier === b.tier ? sortMapsByName(a, b) : (a.tier ?? 99) - (b.tier ?? 99);
            break;
        case "tierDesc":
            compareFunc = (a, b) => a.tier === b.tier ? sortMapsByName(a, b) : (b.tier ?? -99) - (a.tier ?? -99);
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
                <IconButton size="small" sx={{ ml: 0.5 }} onClick={() => handleExpand(!expanded)} disabled={selectedMap === undefined}>
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
                            <FilterAltIcon sx={{ mr: 1 }} />
                            <GameSelector game={filterGame} setGame={setFilterGame} label="Filter game" allowSelectAll disablePadding />
                        </Box>
                        <Box display="flex" alignItems="center" mt={2}>
                            <FilterAltIcon sx={{ mr: 1 }} />
                            <Box width="140px">
                                <Typography variant="caption" color="textSecondary" p={0.25}>
                                    Filter tier
                                </Typography>
                                <MapTierListSelector selectedTiers={Array.from(filterTiers)} onSelectTier={onSelectFilterTier} disableHoverHighlight showNone />
                            </Box>
                            <Box flexGrow={1} />
                            {filterTiers.size === 0 && <WarningIcon color="warning" />}
                        </Box>
                        <Box display="flex" alignItems="center" mt={3} mr={-1}>
                            <SortIcon sx={{ mr: 1 }} />
                            <MapSortSelector sort={sort} setSort={setSort} />
                        </Box>
                    </Box>
                </Popover>
            </Box>
            <MapSearch {...props} maps={maps} />
            {selectedMap && expanded ?
                <MapDetailSection selectedMap={selectedMap} tierVoteInfo={tierVoteInfo} setTierVoteInfo={setTierVoteInfo} tierVoteLoading={tierVoteLoading} />
                : undefined}
        </Paper>
    )
}

interface MapDetailSectionProps {
    selectedMap: Map
    tierVoteInfo: MapTierInfo | undefined
    setTierVoteInfo: (info: MapTierInfo | undefined) => void
    tierVoteLoading: boolean
}

function MapDetailSection(props: MapDetailSectionProps) {
    const { selectedMap, tierVoteInfo, setTierVoteInfo, tierVoteLoading } = props;
    
    const smallScreen = useMediaQuery("@media screen and (max-width: 720px)");
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";
    const imageBgColor = isLightMode ? grey[400] : grey[800];

    const imageSize = smallScreen ? 175 : 230;
    const mapDate = new Date(selectedMap.date);
    const isUnreleased = new Date() < mapDate;
    let releasedText = isUnreleased ? "Releases on " : "Released on ";
    releasedText += longDateFormat.format(mapDate);
    const gameColor = getGameColor(selectedMap.game, theme);
    const tier = selectedMap.tier;
    const tierColor = getMapTierColor(tier);

    return (
        <Box display="flex" flexDirection="column" marginTop={2}>
            <Box display="flex" flexDirection={smallScreen ? "column" : "row"} alignItems="center" justifyContent="center">
                <Box display="flex" flexDirection="column" paddingRight={smallScreen ? 0 : 8} paddingLeft={smallScreen ? 0 : 8} paddingBottom={smallScreen ? 1.5 : 0} >
                    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" marginBottom={1.5} flexGrow={1}>
                        <Typography
                            variant="h4"
                            fontWeight="bold"
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
                    <Box display="flex" flexDirection="column" alignItems="center">
                        {(selectedMap.game === Game.bhop || selectedMap.game === Game.surf) && 
                        <MapTierVotingSection selectedMap={selectedMap} tierVoteInfo={tierVoteInfo} setTierVoteInfo={setTierVoteInfo} tierVoteLoading={tierVoteLoading} />}
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
                    <MapThumb size={imageSize} map={selectedMap} useLargeThumb />
                    <Box display="flex" position="absolute" top="8px" right="8px">
                        <Typography variant="body2" fontWeight="bold" sx={{
                            padding: 0.4,
                            lineHeight: 1.1,
                            overflow: "hidden",
                            backgroundColor: gameColor,
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px"
                        }}>
                            {formatGame(selectedMap.game)}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" ml={0.5} sx={{
                            padding: 0.4,
                            lineHeight: 1.0,
                            overflow: "hidden",
                            backgroundColor: darken(tierColor, 0.4),
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px",
                            border: 1,
                            borderColor: tierColor
                        }}>
                            {formatTier(tier)}
                        </Typography>
                    </Box>
                    <Typography position="absolute" bottom="4px" right="4px" variant="body1" fontWeight="bold" sx={{
                        padding: 0.7,
                        lineHeight: 1.1,
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
        </Box>
    );
}

function getIneligibleReason(voteInfo: TierVotingEligibilityInfo | undefined, game: Game) {
    if (!voteInfo) {
        return "You are not logged in";
    }
    if (voteInfo.moderationStatus === ModerationStatus.Blacklisted) {
        return "You are blacklisted";
    }
    if (voteInfo.moderationStatus === ModerationStatus.Pending) {
        return "You are pending moderation review";
    }
    if (game === Game.bhop && voteInfo.bhopCompletions < 20) {
        return `You have less than 20 bhop completions (${voteInfo.bhopCompletions})`;
    }
    if (game === Game.surf && voteInfo.surfCompletions < 20) {
        return `You have less than 20 surf completions (${voteInfo.surfCompletions})`;
    }
    return "";
}

function MapTierVotingSection(props: MapDetailSectionProps) {
    const { selectedMap, tierVoteInfo, setTierVoteInfo, tierVoteLoading } = props;
    const { votingInfo } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";
    const isEligible = (votingInfo && isEligibleForVoting(votingInfo, selectedMap.game));
    const reason = getIneligibleReason(votingInfo, selectedMap.game);
    const [ fakeTier, setFakeTier ] = useState(tierVoteInfo?.tier ?? null);
    const [ pendingUpdate, setPendingUpdate ] = useState(false);

    const onChange = useCallback(async (val: number) => {
        const tier = val === fakeTier ? null : val;
        setFakeTier(tier);
        setPendingUpdate(true);
        const info = await voteForMapTier(selectedMap.id, tier);
        setTierVoteInfo(info);
        setFakeTier(info ? info.tier : null);
        setPendingUpdate(false);
    }, [fakeTier, selectedMap.id, setTierVoteInfo]);

    useEffect(() => {
        setFakeTier(tierVoteInfo?.tier ?? null);
    }, [tierVoteInfo?.tier]);

    const tierAxisNames: number[] = [];
    const colors: string[] = [];
    for (let i = 1; i <= MAX_TIER; ++i) {
        tierAxisNames.push(i);
        colors.push(getMapTierColor(i, isLightMode ? 80 : 100));
    }

    return (
        <Box display="flex" flexDirection="column" marginTop={1.5}>
            <Box display="flex" alignItems="center" justifyContent="center" mb={0.25}>
                <Typography component="legend" variant="body2" mr={0.25}>
                    Tier voting
                </Typography>
                {isEligible ? 
                <HowToRegIcon sx={{fontSize: 20}} htmlColor={isLightMode ? "#00d800" : "#00ff00"} /> 
                : 
                <Tooltip title={reason} placement="right" arrow><BlockIcon sx={{fontSize: 20}} htmlColor="#ff0000" /></Tooltip>}
            </Box>
            <Box display="flex" alignItems="center" justifyContent="center">
                {tierVoteLoading ?
                <Skeleton height="28px" width="200px"></Skeleton>
                :
                <MapTierListSelector 
                    selectedTiers={fakeTier ? [fakeTier] : []} 
                    onSelectTier={onChange} 
                    disabled={!isEligible}
                    readOnly={pendingUpdate} 
                />}
            </Box>
            {selectedMap.tier !== undefined &&
            <Box display="flex" justifyContent="center" pt={0.25} pb={0.25}>
                <ChartContainer 
                    width={28 * MAX_TIER} 
                    height={24}
                    xAxis={[{
                        data: tierAxisNames,
                        scaleType: "band",
                        colorMap: {
                            type: "ordinal",
                            colors: colors
                        },
                        position: "none",
                        valueFormatter: (val) => formatTier(val)
                    }]}
                    yAxis={[{position: "none"}]}
                    margin={0}
                    series={[{
                        type: "bar",
                        data: selectedMap.votes.weighted,
                        valueFormatter: (val) => val === null ? "none" : val.toString()
                    }]}
                >
                    <BarPlot />
                    <ChartsTooltip />
                </ChartContainer>
            </Box>}
            {tierVoteInfo &&
            <Tooltip title={dateTimeFormat.format(new Date(tierVoteInfo.updatedAt))} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -12]}}]}}} >
                <Typography variant="caption" color="textSecondary" mt={0.5} textAlign="center">
                    Submitted {<TimeAgo date={tierVoteInfo.updatedAt} title="" formatter={relativeTimeFormatter} />}
                </Typography>
            </Tooltip>}
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
    const theme = useTheme();

    useEffect(() => {
        document.title = "maps - strafes";
    }, []);

    const onSelectMap = useCallback((map: Map | undefined) => {
        document.title = map ? `${map.name} - maps - strafes` : "maps - strafes";

        let allowedGame = map ? map.game : game;

        if (game === Game.fly_trials) {
            allowedGame = Game.fly_trials;
        }
        const allowedStyles = getAllowedStyles(allowedGame);
        const styleForLink = allowedStyles.includes(style) ? style : allowedStyles[0];

        let href = map ? `/maps/${map.id}` : "/maps";
        href += `?style=${styleForLink}&game=${allowedGame}&course=0`;

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
    }, [game, navigate, setCourse, setGame, style]);

    useEffect(() => {
        // Load map on initial load
        if (initalLoadComplete || selectedMap !== undefined) return;

        const mapId = id && !isNaN(+id) ? +id : undefined;
        if (mapId === undefined) return;

        const map = maps[mapId];
        if (map) {
            document.title = `${map.name} - maps - strafes`;
            setInitalLoadComplete(true);
            setSelectedMap(map);
            const allowedGames = getAllowedGameForMap(map);
            if (!allowedGames.includes(game)) {
                setGame(allowedGames[0]);
            }
        }
    }, [game, id, initalLoadComplete, maps, onSelectMap, selectedMap, setGame]);

    const onDownloadMapCsv = () => {
        if (sortedMaps.length < 1) {
            return;
        }

        const csvConfig = mkConfig({
            filename: "maps", columnHeaders: [
                "id", "name", "creator", "game", "release_date", "load_count", "courses", "tier"
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
                courses: map.modes,
                tier: map.tier ?? 0
            });
        }
        const csv = generateCsv(csvConfig)(mapData);
        download(csvConfig)(csv);
    };

    const breadcrumbs: React.ReactElement[] = [];
    if (selectedMap) {
        breadcrumbs.push(
            <Link underline="hover" color="inherit" component="button" onClick={() => onSelectMap(undefined)}>
                Maps
            </Link>,
            <Box display="flex" flexDirection="row" alignItems="center">
                <MapThumb size={30} map={selectedMap} sx={{ mr: 1.25 }} />
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
                <Breadcrumbs separator={<NavigateNextIcon />} sx={{ p: 1, flexGrow: 1 }}>
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
            <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
                <GameSelector game={game} setGame={setGame} selectedMap={selectedMap} />
                <StyleSelector game={game} style={style} setStyle={setStyle} />
                <CourseSelector course={course} setCourse={setCourse} map={selectedMap} />
            </Box>
            <Box padding={1}>
                <TimesCard defaultSort={TimeSortBy.TimeAsc} mapId={id} game={game} style={style} course={course} pageSize={20} hideMap showPlacement />
            </Box>
        </Box>
    );
}

export default MapsPage;