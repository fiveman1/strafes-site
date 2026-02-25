import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DownloadIcon from '@mui/icons-material/Download';
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import IconButton from "@mui/material/IconButton";
import { ReactElement, useCallback, useEffect, useMemo } from "react";
import { ContextParams, getGameColor, mapsToCsv } from "../common/common";
import { darken, lighten, useTheme } from "@mui/material/styles";
import { Link as RouterLink, useOutletContext } from "react-router";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import Grid from "@mui/material/Grid";
import Pagination from "@mui/material/Pagination";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { formatGame, formatGameShort, formatTier, Game, Map as StrafesMap } from "shared";
import { filterMapsBySearch, sortAndFilterMaps } from "../common/sort";
import MapThumb from "./displays/MapThumb";
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../common/colors";
import useMediaQuery from "@mui/material/useMediaQuery";
import PersonIcon from '@mui/icons-material/Person';
import { grey } from "@mui/material/colors";
import { shortDateFormat } from "../common/datetime";
import Paper from "@mui/material/Paper";
import { MapTimesSort, useFilterGame, useFilterTiers, useMapSort } from "../common/states";
import MapFilterSortOptions from "./forms/MapFilterSortOptions";

function getColorForPopularity(map: StrafesMap, ninetyPercentile: number) {
    const plays = Math.min(map.loadCount, ninetyPercentile);
    const lerp = plays / ninetyPercentile;
    const low = 200;
    const hi = 360;
    const hue = Math.round(low + lerp * (hi - low));
    return `hsl(${hue}, 100%, 50%)`;
}

function MapListCard(props: MapCardProps) {
    const { map } = props;

    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";

    const gameColor = getGameColor(map.game, theme);
    const tierColor = getMapTierColor(map.tier);

    return (
        <Paper
            elevation={2}
            component={RouterLink}
            to={`/maps/${map.id}`}
            sx={{
                display: "flex",
                borderRadius: "6px",
                height: "70px",
                transition: ".2s ease",
                textDecoration: "none",
                ":hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                    bgcolor: isLightMode ? grey[100] : grey[900]
                }
            }}
        >
            <MapThumb
                size={70}
                map={map}
                sx={{
                    borderRadius: "6px 0px 0px 6px",
                    border: 0
                }}
            />
            <Box
                ml={1.75}
                mr={1}
                overflow="hidden"
                display="inline-flex"
                flexDirection="column"
                whiteSpace="nowrap"
                width="100%"
                justifyContent="center"
            >
                <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    height="32px"
                >
                    <Typography
                        variant="h6"
                        overflow="hidden"
                        color="textPrimary"
                        display="inline-block"
                        textOverflow="ellipsis"
                        flexGrow={1}
                    >
                        {map.name}
                    </Typography>
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        lineHeight={1.2}
                        ml={0.75}
                        sx={{
                            backgroundColor: gameColor,
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px",
                            padding: 0.4
                        }}
                    >
                        {formatGame(map.game)}
                    </Typography>
                </Box>
                <Box
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    height="24px"
                >
                    <Typography
                        variant="body2"
                        overflow="hidden"
                        color="textSecondary"
                        display="inline-block"
                        textOverflow="ellipsis"
                        flexGrow={1}
                    >
                        {map.creator}
                    </Typography>
                    <Typography 
                        variant="caption" 
                        fontWeight="bold" 
                        ml={0.75} 
                        sx={{
                            padding: 0.4,
                            lineHeight: 0.95,
                            backgroundColor: darken(tierColor, 0.4),
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px",
                            border: 1,
                            borderColor: tierColor
                        }}
                    >
                        {formatTier(map.tier, true)}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

function useCardSize() {
    const small = useMediaQuery("(max-width: 800px)");
    const medium = useMediaQuery("(max-width: 1225px)");
    if (small) return 190;
    if (medium) return 230;
    return 250;
}

function MapSquareCard(props: MapCardProps) {
    const { map } = props;
    const { highPercentileLoadCount: ninetiethPercentileLoadCount } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";

    const cardSize = useCardSize();

    const mapDate = new Date(map.date);
    const isUnreleased = new Date() < mapDate;

    const nameSpace = cardSize < 230 ? 36 : 48;
    const nameHeight = nameSpace + "px";

    const creatorSpace = 32;
    const creatorHeight = creatorSpace + "px";

    const gameColor = getGameColor(map.game, theme);
    const tierColor = getMapTierColor(map.tier);
    const popColor = getColorForPopularity(map, ninetiethPercentileLoadCount);

    return (
        <Box
            width={cardSize}
            height={cardSize}
            display="flex"
            flexDirection="column"
            component={RouterLink}
            to={`/maps/${map.id}`}
            sx={{
                userSelect: "none",
                transition: "transform .1s ease",
                ":hover": {
                    transform: "translateY(-2px)",
                    "& .mapCard": { boxShadow: 6 },
                    "& .mapImg": { transform: "scale(1.08)" },
                    "& .mapCreator": { bgcolor: darken(tierColor, 0.15) }
                }
            }}
        >
            <Box
                className="mapCard"
                position="relative"
                borderRadius="6px"
                boxShadow={2}
                bgcolor={isLightMode ? grey[300] : grey[800]}
                overflow="hidden"
                sx={{
                    transition: ".4s ease",
                }}
            >
                <MapThumb
                    className="mapImg"
                    size={cardSize}
                    map={map}
                    useLargeThumb
                    disableUnreleasedColor
                    sx={{
                        borderRadius: "6px 6px 8px 8px",
                        border: 0,
                        transition: "transform .4s ease"
                    }}
                />
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-end"
                    position="absolute"
                    top="8px"
                    right="8px"
                >
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                            width: "fit-content",
                            padding: 0.4,
                            lineHeight: 1.1,
                            overflow: "hidden",
                            backgroundColor: gameColor,
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px"
                        }}
                    >
                        {cardSize < 230 ? formatGameShort(map.game) : formatGame(map.game)}
                    </Typography>
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        mt={0.4}
                        sx={{
                            width: "fit-content",
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
                        }}
                    >
                        {formatTier(map.tier)}
                    </Typography>
                </Box>
                <Box
                    display="flex"
                    flexDirection="column"
                    position="absolute"
                    top="8px"
                    left="8px"
                >
                    <Typography
                        display="inline-block"
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                            width: "fit-content",
                            padding: 0.4,
                            lineHeight: 1.0,
                            overflow: "hidden",
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px",
                            bgcolor: isUnreleased ? UNRELEASED_MAP_COLOR : grey[700],
                            border: 1,
                            borderColor: isUnreleased ? lighten(UNRELEASED_MAP_COLOR, 0.3) : grey[500]
                        }}
                    >
                        {shortDateFormat.format(mapDate)}
                    </Typography>
                    <Typography
                        mt={0.4}
                        display="inline-block"
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                            width: "fit-content",
                            padding: 0.4,
                            lineHeight: 1.0,
                            overflow: "hidden",
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px",
                            bgcolor: darken(popColor, 0.15),
                            border: 1,
                            borderColor: popColor
                        }}
                    >
                        {map.loadCount} plays
                    </Typography>
                </Box>
                <Box
                    sx={{
                        position: "absolute",
                        bottom: creatorHeight,
                        height: nameHeight,
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        bgcolor: "#80808050",
                        backdropFilter: "blur(16px)",
                    }}
                >
                    <Box
                        display="inline-flex"
                        height={nameHeight}
                        width={cardSize}
                        pl={1.25}
                        pr={1.25}
                        alignItems="center"
                    >
                        <Typography
                            variant={cardSize < 230 ? "h6" : "h5"}
                            title={map.name}
                            fontWeight="bold"
                            color="white"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            sx={{
                                textShadow: "black 1px 1px 1px"
                            }}
                        >
                            {map.name}
                        </Typography>
                    </Box>
                </Box>
                <Box
                    className="mapCreator"
                    sx={{
                        position: "absolute",
                        bottom: "0px",
                        height: creatorHeight,
                        width: "100%",
                        borderRadius: "0 0 6px 6px",
                        boxShadow: 0,
                        bgcolor: darken(tierColor, 0.25),
                        transition: ".4s ease"
                    }}
                >
                    <Box
                        display="inline-flex"
                        height={creatorHeight}
                        width={cardSize}
                        justifyContent="flex-end"
                        alignItems="center"
                        p={1}
                    >
                        <PersonIcon
                            fontSize="inherit"
                            htmlColor="white"
                        />
                        <Typography
                            variant="subtitle2"
                            color="white"
                            title={map.creator}
                            ml={0.5}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                        >
                            {map.creator}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

interface MapCardProps {
    map: StrafesMap
}

function useListStyle() {
    return useMediaQuery("(max-width: 700px)");
}

function MapCard(props: MapCardProps) {
    const { map } = props;
    const useList = useListStyle();

    return (
        <Grid size={useList ? 12 : undefined}>
            {useList ? <MapListCard map={map} /> : <MapSquareCard map={map} />}
        </Grid>
    )
}

interface MapBrowserProps {
    maps: StrafesMap[]
    page: number
    setPage: (page: number) => void
}

const PAGE_SIZE = 12;

function MapBrowser(props: MapBrowserProps) {
    const { maps, page, setPage } = props;
    const useList = useListStyle();

    const count = Math.ceil(maps.length / PAGE_SIZE);

    const start = (page - 1) * PAGE_SIZE;
    const pagedMaps = maps.slice(start, start + PAGE_SIZE);

    const items = useMemo(() => {
        const items: ReactElement[] = [];
        for (const map of pagedMaps) {
            items.push(<MapCard map={map} key={map.id} />);
        }
        return items;
    }, [pagedMaps]);

    const startNum = Math.min((page - 1) * PAGE_SIZE + 1, maps.length);
    const endNum = Math.min(page * PAGE_SIZE, maps.length);

    return (
        <Box display="flex" justifyContent="center">
            <Box display="flex" flexDirection="column" width="100%" maxWidth={useList ? "100%" : "1100px"}>
                <Grid container spacing={useList ? 0.75 : 2} justifyContent="center">
                    {items}
                </Grid>
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" mt={2}>
                    <Pagination
                        shape="rounded"
                        size={useList ? "small" : "medium"}
                        count={count}
                        page={page}
                        onChange={(e, p) => setPage(p)}
                    />
                    <Typography variant="body2" p={1}>
                        {`Showing ${startNum} - ${endNum} of ${maps.length} maps`}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

interface MapSearchBarProps {
    inputValue: string
    setInputValue: (val: string) => void
}

function MapSearchBar(props: MapSearchBarProps) {
    const { inputValue, setInputValue } = props;
    const useList = useListStyle();
    const reallySmall = useMediaQuery("(max-width: 360px)");;

    return (
        <TextField
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={reallySmall ? "Name or creator" : "Search by name or creator"}
            fullWidth
            label=""
            variant="outlined"
            type="search"
            size={useList ? "small" : "medium"}
            autoFocus
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
            slotProps={{
                htmlInput: {
                    maxLength: 50
                },
                input: {
                    startAdornment: (
                        <InputAdornment position="start" sx={{ display: "flex", justifyContent: "center", mr: 0.75, width: useList ? undefined : "40px" }}>
                            <SearchIcon />
                        </InputAdornment>
                    )
                }
            }}
        />
    );
}

function MapsHome() {
    const { sortedMaps } = useOutletContext() as ContextParams;
    
    const useList = useListStyle();
    const [ filterGame, setFilterGame ] = useFilterGame();
    const [ filterTiers, setFilterTiers ] = useFilterTiers();
    const [ sort, setSort ] = useMapSort();

    const [ page, setPage ] = useQueryState("page",
        parseAsInteger
            .withDefault(1)
            .withOptions({ history: "replace" })
    );

    const [ searchText, setSearchText ] = useQueryState("search",
        parseAsString
            .withDefault("")
            .withOptions({ history: "replace" })
    );

    useEffect(() => {
        document.title = "maps - strafes";
    }, []);

    const onChangeSearch = useCallback((value: string) => {
        setSearchText(value);
        setPage(1);
    }, [setPage, setSearchText]);

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
        setPage(1);
    }, [setFilterTiers, setPage]);

    const onSetFilterGame = useCallback((game: Game) => {
        setFilterGame(game);
        setPage(1);
    }, [setFilterGame, setPage]);

    const onSetSort = useCallback((sort: MapTimesSort) => {
        setSort(sort);
        setPage(1);
    }, [setPage, setSort]);

    const onDownloadMapCsv = useCallback(() => {
        mapsToCsv(sortedMaps);
    }, [sortedMaps]);

    const maps = useMemo(() => {
        const filtered = filterMapsBySearch(sortedMaps, searchText);
        return sortAndFilterMaps(filtered, filterGame, new Set(filterTiers), sort);
    }, [filterGame, filterTiers, searchText, sort, sortedMaps]);

    return (
        <Box flexGrow={1}>
            <Box display="flex" alignItems="center">
                <Breadcrumbs separator={<NavigateNextIcon />} sx={{ p: 1, flexGrow: 1 }}>
                    <Link underline="hover" color="inherit" href="/">
                        Home
                    </Link>
                    <Typography color="textPrimary">
                        Maps
                    </Typography>
                </Breadcrumbs>
                <Tooltip title="Download maps as .csv" placement="left" arrow>
                    <Box display="flex" width="34px" height="34px">
                        <IconButton size="small" disabled={sortedMaps.length < 1} onClick={onDownloadMapCsv}>
                            <DownloadIcon />
                        </IconButton>
                    </Box>
                </Tooltip>
            </Box>
            <Box padding={useList ? 0.5 : 1} pb={1} display="flex">
                <MapSearchBar inputValue={searchText} setInputValue={onChangeSearch} />
                <Box ml={useList ? 0.5 : 1} display="flex" alignItems="center">
                    <MapFilterSortOptions 
                        filterGame={filterGame} 
                        setFilterGame={onSetFilterGame} 
                        selectedTiers={filterTiers} 
                        onSelectFilterTier={onSelectFilterTier}
                        sort={sort}
                        setSort={onSetSort}
                    />
                </Box>
            </Box>
            <Box padding={useList ? 0.5 : 1}>
                <MapBrowser maps={maps} page={page} setPage={setPage} />
            </Box>
        </Box>
    );
}

export default MapsHome;