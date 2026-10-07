import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, IconButton, Link, Paper, Skeleton, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate, useOutletContext, useParams, Link as RouterLink } from "react-router";
import { ContextParams, getAllowedGameForMap, getGameColor, MapDetailsProps, mapsToCsv } from "../common/common";
import { Game, MAX_TIER, Map, MapTierInfo, ModerationStatus, TierVoteEligibility, TimeSortBy, formatGame, formatTier, getAllowedStyles, isEligibleForVoting } from "shared";
import StyleSelector from "./forms/StyleSelector";
import TimesCard from "./cards/grids/TimesCard";
import GameSelector from "./forms/GameSelector";
import CourseSelector from "./forms/CourseSelector";
import DownloadIcon from '@mui/icons-material/Download';
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../common/colors";
import { useCourse, useFilterGame, useFilterTiers, useGameStyle, useMapSort, useMapTierVote, useVoteEligibility } from "../common/states";
import MapSearch from "./search/MapSearch";
import { sortAndFilterMaps } from "../common/sort";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ColorChip from "./displays/ColorChip";
import MapThumb from "./displays/MapThumb";
import { voteForMapTier } from "../api/api";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import BlockIcon from '@mui/icons-material/Block';
import { dateTimeFormat, relativeTimeFormatter } from "../common/datetime";
import TimeAgo from "react-timeago";
import MapTierListSelector from "./forms/MapTierListSelector";
import { BarPlot, ChartContainer, ChartsTooltip } from "@mui/x-charts";
import MapFilterSortOptions from "./forms/MapFilterSortOptions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "../api/queries";
import RecordCard from "./cards/RecordCard";

const longDateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
});

function MapInfoCard(props: MapDetailsProps) {
    const { selectedMap } = props;

    const { sortedMaps } = useOutletContext() as ContextParams;

    const [ filterGame, setFilterGame ] = useFilterGame();
    const [ filterTiers, setFilterTiers ] = useFilterTiers();
    const [ sort, setSort ] = useMapSort();
    const [ expanded, setExpanded ] = useState(localStorage.getItem("expandMapDetail") !== "false"); // Expanded by default

    const handleExpand = useCallback((expanded: boolean) => {
        setExpanded(expanded);
        localStorage.setItem("expandMapDetail", expanded ? "true" : "false");
    }, []);

    const onSelectFilterTier = useCallback((tier: number) => {
        setFilterTiers((tiers) => {
            const set = new Set(tiers);
            if (set.has(tier)) {
                set.delete(tier);
            }
            else {
                set.add(tier);
            }
            return Array.from(set).sort();
        });
    }, [setFilterTiers]);

    const selectedTiers = useMemo(() => {
        return Array.from(filterTiers);
    }, [filterTiers]);

    const maps = useMemo(() => {
        return sortAndFilterMaps(sortedMaps, filterGame, new Set(filterTiers), sort);
    }, [filterGame, filterTiers, sort, sortedMaps]);

    return (
        <Paper sx={{ padding: 2, display: "flex", flexDirection: "column", overflowWrap: "break-word" }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5
                }}>
                <MapSearch {...props} maps={maps} />
                <MapFilterSortOptions 
                    filterGame={filterGame} 
                    setFilterGame={setFilterGame} 
                    selectedTiers={selectedTiers} 
                    onSelectFilterTier={onSelectFilterTier}
                    sort={sort}
                    setSort={setSort}
                />
                <IconButton size="small" onClick={() => handleExpand(!expanded)} disabled={selectedMap === undefined} aria-label={expanded ? "Hide map details" : "Show map details"}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
            {selectedMap && expanded ?
                <MapDetailSection selectedMap={selectedMap} />
                : undefined}
        </Paper>
    );
}

interface MapDetailSectionProps {
    selectedMap: Map
}

function MapDetailSection(props: MapDetailSectionProps) {
    const { selectedMap } = props;
    
    const smallScreen = useMediaQuery("@media screen and (max-width: 720px)");
    const theme = useTheme();

    const imageSize = smallScreen ? 175 : 200;
    const mapDate = new Date(selectedMap.date);
    const isUnreleased = new Date() < mapDate;
    let releasedText = isUnreleased ? "Releases on " : "Released on ";
    releasedText += longDateFormat.format(mapDate);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: smallScreen ? "column" : "row",
                gap: smallScreen ? 2 : 3,
                marginTop: 2.5
            }}>
            <Box
                sx={{
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    width: imageSize,
                    height: imageSize,
                    borderRadius: "10px",
                    bgcolor: "action.hover"
                }}>
                <MapThumb size={imageSize} map={selectedMap} useLargeThumb sx={{ borderRadius: "10px" }} />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    minWidth: 0
                }}>
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        columnGap: 1.25,
                        rowGap: 0.5
                    }}>
                    <Typography component="h1" variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, mr: 0.25 }}>
                        {selectedMap.name}
                    </Typography>
                    <ColorChip label={formatGame(selectedMap.game)} color={getGameColor(selectedMap.game, theme)} />
                    <ColorChip label={formatTier(selectedMap.tier)} color={getMapTierColor(selectedMap.tier)} />
                    {isUnreleased && <ColorChip label="Unreleased" color={UNRELEASED_MAP_COLOR} />}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    by {selectedMap.creator}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {releasedText} · {selectedMap.loadCount.toLocaleString()} plays
                </Typography>
                {(selectedMap.game === Game.bhop || selectedMap.game === Game.surf) && 
                <MapTierVotingSection selectedMap={selectedMap} />}
            </Box>
        </Box>
    );
}

function getEligibleReason(voteEligibility: TierVoteEligibility | undefined, game: Game) {
    if (!voteEligibility) {
        return "";
    }
    if (voteEligibility.moderationStatus === ModerationStatus.Whitelisted) {
        return "You are eligible (whitelisted)";
    }
    if (game === Game.bhop && voteEligibility.bhopCompletions >= 20) {
        return `You are eligible (${voteEligibility.bhopCompletions} bhop completions)`;
    }
    if (game === Game.surf && voteEligibility.surfCompletions >= 20) {
        return `You are eligible (${voteEligibility.surfCompletions} surf completions)`;
    }
    return "";
}

function getIneligibleReason(voteEligibility: TierVoteEligibility | undefined, game: Game) {
    if (!voteEligibility) {
        return "You are not logged in";
    }
    if (voteEligibility.moderationStatus === ModerationStatus.Blacklisted) {
        return "You are blacklisted";
    }
    if (voteEligibility.moderationStatus === ModerationStatus.Pending) {
        return "You are pending moderation review";
    }
    if (game === Game.bhop && voteEligibility.bhopCompletions < 20) {
        return `You have less than 20 bhop completions (${voteEligibility.bhopCompletions})`;
    }
    if (game === Game.surf && voteEligibility.surfCompletions < 20) {
        return `You have less than 20 surf completions (${voteEligibility.surfCompletions})`;
    }
    return "";
}

function MapTierVotingSection(props: MapDetailSectionProps) {
    const { selectedMap } = props;
    const { loginUser } = useOutletContext() as ContextParams;
    const voteEligibilityQuery = useVoteEligibility(loginUser);
    const voteEligibility = voteEligibilityQuery.data ?? undefined;
    const theme = useTheme();
    const queryClient = useQueryClient();

    const tierVoteQuery = useMapTierVote(loginUser, selectedMap.id);
    const voteData = tierVoteQuery.data ?? undefined;
    const voteLoading = tierVoteQuery.isLoading;

    const onMutateVote = useCallback((info: { mapId: number, tier: number | null }) => {
        const { mapId, tier } = info;
        const fakeTier: MapTierInfo | null = tier === null ? null : {
            userId: loginUser?.userId ?? 0,
            mapId: mapId,
            tier: tier,
            weight: 0,
            updatedAt: ""
        };
        queryClient.setQueryData(queries.maps.tierVote(loginUser, selectedMap.id).queryKey, fakeTier);
        return voteForMapTier(mapId, tier);
    }, [loginUser, queryClient, selectedMap.id]);

    const onMutateVoteSuccess = useCallback((data: MapTierInfo | null) => {
        queryClient.setQueryData(queries.maps.tierVote(loginUser, selectedMap.id).queryKey, data);
    }, [loginUser, queryClient, selectedMap.id]);
    
    const voteMutation = useMutation({
        mutationFn: onMutateVote,
        onSuccess: onMutateVoteSuccess
    });

    const isLightMode = theme.palette.mode === "light";
    const isEligible = (voteEligibility && isEligibleForVoting(voteEligibility, selectedMap.game));
    const reason = isEligible ? getEligibleReason(voteEligibility, selectedMap.game) : getIneligibleReason(voteEligibility, selectedMap.game);

    const onChange = useCallback((val: number) => {
        const tier = val === voteData?.tier ? null : val;
        voteMutation.mutate({ mapId: selectedMap.id, tier: tier });
    }, [selectedMap.id, voteData?.tier, voteMutation]);

    const tierAxisNames: number[] = [];
    const colors: string[] = [];
    for (let i = 1; i <= MAX_TIER; ++i) {
        tierAxisNames.push(i);
        colors.push(getMapTierColor(i, isLightMode ? 80 : 100));
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                marginTop: 1.5
            }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 0.25
                }}>
                <Typography component="legend" variant="body2" sx={{
                    mr: 0.5,
                    fontWeight: 500
                }}>
                    Tier voting
                </Typography>
                {isEligible ? 
                <Tooltip title={reason} placement="right" arrow>
                    <HowToRegIcon sx={{fontSize: 18}} color="success" /> 
                </Tooltip>
                : 
                <Tooltip title={reason} placement="right" arrow>
                    <BlockIcon sx={{fontSize: 18, color: "text.secondary"}} />
                </Tooltip>}
            </Box>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    ml: -0.25
                }}>
                {voteLoading ?
                <Skeleton height="28px" width="200px"></Skeleton>
                :
                <MapTierListSelector 
                    selectedTiers={voteData ? [voteData.tier] : []}
                    onSelectTier={onChange}
                    disabled={!isEligible}
                    readOnly={voteMutation.isPending}
                />}
            </Box>
            {selectedMap.tier !== undefined &&
            <Box
                sx={{
                    display: "flex",
                    pt: 0.5,
                    pb: 0.25
                }}>
                <ChartContainer 
                    width={28 * MAX_TIER} 
                    height={22}
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
                    yAxis={[{
                        position: "none", 
                        domainLimit: "strict"
                    }]}
                    margin={0}
                    series={[{
                        type: "bar",
                        data: selectedMap.votes.weighted,
                        label: "Weight",
                        valueFormatter: (val, { dataIndex }) => {
                            const weighted = val ?? 0;
                            const unweighted = selectedMap.votes.unweighted[dataIndex];
                            return `${weighted} (${unweighted} vote${unweighted === 1 ? "" : "s"})`;
                        }
                    }]}
                >
                    <BarPlot />
                    <ChartsTooltip />
                </ChartContainer>
            </Box>}
            {voteData?.updatedAt &&
            <Tooltip title={dateTimeFormat.format(new Date(voteData.updatedAt))} disableInteractive slotProps={{popper: {modifiers: [{name: "offset", options: {offset: [0, -12]}}]}}} >
                <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{
                        mt: 0.5,
                        alignSelf: "flex-start"
                    }}>
                    Submitted {<TimeAgo date={voteData.updatedAt} title="" formatter={relativeTimeFormatter} />}
                </Typography>
            </Tooltip>}
        </Box>
    );
}

function MapsPage() {
    const { id } = useParams() as { id: string };
    const { maps, sortedMaps, loginUser } = useOutletContext() as ContextParams;

    const [initalLoadComplete, setInitalLoadComplete] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map>();
    const { game, setGame, style, setStyle } = useGameStyle();
    const [course, setCourse] = useCourse();
    const navigate = useNavigate();

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

        const urlParams = new URLSearchParams(location.search);

        let href = map ? `/maps/${map.id}` : "/maps";
        href += `?style=${styleForLink}&game=${allowedGame}&course=0`;
        const sortParam = urlParams.get("sort");
        if (sortParam) {
            href += `&sort=${sortParam}`;
        }

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

    const onDownloadMapCsv = useCallback(() => {
        mapsToCsv(sortedMaps);
    }, [sortedMaps]);

    return (
        <Box sx={{
            flexGrow: 1
        }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center"
                }}>
                <Breadcrumbs separator={<NavigateNextIcon />} sx={{ p: 1, flexGrow: 1 }}>
                    <Link underline="hover" color="inherit" component={RouterLink} to="/maps">
                        Maps
                    </Link>
                    {selectedMap &&
                    <Typography color="textPrimary">
                        {selectedMap.name}
                    </Typography>}
                </Breadcrumbs>
                <Tooltip title="Download maps as .csv" placement="left">
                    <span>
                        <IconButton size="small" disabled={sortedMaps.length < 1} onClick={onDownloadMapCsv} aria-label="Download maps as .csv">
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <Box sx={{
                padding: 1
            }}>
                <MapInfoCard selectedMap={selectedMap} setSelectedMap={onSelectMap} />
            </Box>
            <Box
                sx={{
                    padding: 0.5,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center"
                }}>
                <GameSelector game={game} setGame={setGame} selectedMap={selectedMap} />
                <StyleSelector game={game} style={style} setStyle={setStyle} />
                <CourseSelector course={course} setCourse={setCourse} map={selectedMap} />
            </Box>
            {loginUser &&
            <Box sx={{
                padding: 1
            }}>
                <RecordCard mapId={+id} userId={loginUser.userId} game={game} style={style} course={course} />
            </Box>}
            <Box sx={{
                padding: 1
            }}>
                <TimesCard defaultSort={TimeSortBy.TimeAsc} mapId={id} game={game} style={style} course={course} pageSize={20} hideMap showPlacement />
            </Box>
        </Box>
    );
}

export default MapsPage;