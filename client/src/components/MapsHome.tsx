import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DownloadIcon from '@mui/icons-material/Download';
import IconButton from "@mui/material/IconButton";
import { useCallback, useEffect, useMemo } from "react";
import { ContextParams, mapsToCsv } from "../common/common";
import { useOutletContext } from "react-router";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import Pagination from "@mui/material/Pagination";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Game, Map as StrafesMap } from "shared";
import { filterMapsBySearch, sortAndFilterMaps } from "../common/sort";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapTimesSort, useFilterGame, useFilterTiers, useMapSort } from "../common/states";
import GameSelector from "./forms/GameSelector";
import MapSortSelector from "./forms/MapSortSelector";
import MapTierListSelector from "./forms/MapTierListSelector";
import MapCard from "./cards/MapCard";

interface MapBrowserProps {
    maps: StrafesMap[]
    page: number
    setPage: (page: number) => void
}

const PAGE_SIZE = 18;

function MapBrowser(props: MapBrowserProps) {
    const { maps, page, setPage } = props;

    const count = Math.ceil(maps.length / PAGE_SIZE);

    const start = (page - 1) * PAGE_SIZE;
    const pagedMaps = maps.slice(start, start + PAGE_SIZE);

    const startNum = Math.min((page - 1) * PAGE_SIZE + 1, maps.length);
    const endNum = Math.min(page * PAGE_SIZE, maps.length);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column"
            }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(auto-fill, minmax(200px, 1fr))" },
                    gap: { xs: 1.5, sm: 2 }
                }}>
                {pagedMaps.map((map) => <MapCard map={map} key={map.id} />)}
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    mt: 2.5
                }}>
                <Typography variant="body2" color="textSecondary">
                    {`${startNum}–${endNum} of ${maps.length} maps`}
                </Typography>
                <Pagination
                    shape="rounded"
                    size="small"
                    count={count}
                    page={page}
                    onChange={(e, p) => setPage(p)}
                />
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
    const reallySmall = useMediaQuery("(max-width: 360px)");

    return (
        <TextField
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={reallySmall ? "Name or creator" : "Search by name or creator"}
            fullWidth
            label=""
            variant="outlined"
            type="search"
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
                        <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                    )
                }
            }}
        />
    );
}

function MapsHome() {
    const { sortedMaps } = useOutletContext() as ContextParams;
    
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
        const filtered = sortAndFilterMaps(sortedMaps, filterGame, new Set(filterTiers), sort);
        return filterMapsBySearch(filtered, searchText);
    }, [filterGame, filterTiers, searchText, sort, sortedMaps]);

    return (
        <Box sx={{
            flexGrow: 1,
            padding: 1
        }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2
                }}>
                <Typography component="h1" variant="h5">
                    Maps
                </Typography>
                <Tooltip title="Download maps as .csv" placement="left">
                    <span>
                        <IconButton size="small" disabled={sortedMaps.length < 1} onClick={onDownloadMapCsv} aria-label="Download maps as .csv">
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2
                }}>
                <MapSearchBar inputValue={searchText} setInputValue={onChangeSearch} />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    columnGap: { xs: 1, sm: 2 },
                    rowGap: 1.5,
                    mb: 2.5
                }}>
                <GameSelector game={filterGame} setGame={onSetFilterGame} allowSelectAll disablePadding />
                <MapSortSelector sort={sort} setSort={onSetSort} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Typography variant="body2" color="textSecondary">
                        Tier
                    </Typography>
                    <MapTierListSelector selectedTiers={filterTiers} onSelectTier={onSelectFilterTier} disableHoverHighlight showNone />
                </Box>
            </Box>
            <MapBrowser maps={maps} page={page} setPage={setPage} />
        </Box>
    );
}

export default MapsHome;
