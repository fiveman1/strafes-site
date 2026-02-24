import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DownloadIcon from '@mui/icons-material/Download';
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import IconButton from "@mui/material/IconButton";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { ContextParams, getGameColor, mapsToCsv } from "../common/common";
import { darken, useTheme } from "@mui/material/styles";
import { useOutletContext } from "react-router";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import Grid from "@mui/material/Grid";
import Pagination from "@mui/material/Pagination";
import { parseAsInteger, useQueryState } from "nuqs";
import { formatGame, formatTier, Map as StrafesMap } from "shared";
import { filterMapsBySearch } from "../common/sort";
import MapThumb from "./displays/MapThumb";
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../common/colors";
import useMediaQuery from "@mui/material/useMediaQuery";
import PersonIcon from '@mui/icons-material/Person';
import { grey } from "@mui/material/colors";

const shortDateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short"
});

interface MapCardProps {
    map: StrafesMap
}

function MapCard(props: MapCardProps) {
    const { map } = props;
    const theme = useTheme();
    
    const isLightMode = theme.palette.mode === "light";
    const small = useMediaQuery("(max-width: 480px)");
    const med = useMediaQuery("(max-width: 800px)");
    const large = useMediaQuery("(max-width: 1225px)");
    
    let cardSize = 275;
    if (small) cardSize = 160;
    else if (med) cardSize = 190;
    else if (large) cardSize = 230;

    const mapDate = new Date(map.date);
    const isUnreleased = new Date() < mapDate;

    const nameSpace = 48;
    const nameHeight = nameSpace + "px";

    const creatorSpace = 36;
    const creatorHeight = creatorSpace + "px";

    const gameColor = getGameColor(map.game, theme);
    const tierColor = getMapTierColor(map.tier);

    return (
        <Grid key={map.id} >
            <Box 
                width={cardSize} 
                height={cardSize} 
                display="flex" 
                flexDirection="column"
            >
                <Box 
                    height={cardSize} 
                    position="relative" 
                    borderRadius="6px" 
                    boxShadow={2}
                    bgcolor={isLightMode ? grey[400] : grey[800]}
                >
                    <MapThumb 
                        size={cardSize} 
                        map={map} 
                        useLargeThumb  
                        sx={{ 
                            zIndex: -1, 
                            borderRadius: "6px 6px 8px 8px", 
                            border: 0 
                        }}
                    />
                    <Box 
                        display="flex" 
                        position="absolute" 
                        top="8px" 
                        right="8px"
                    >
                        <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            sx={{
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
                            {formatGame(map.game)}
                        </Typography>
                        <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            ml={0.5} 
                            sx={{
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
                    <Typography 
                        position="absolute" 
                        top="4px" 
                        left="4px" 
                        variant="body1" 
                        fontWeight="bold" 
                        sx={{
                            padding: 0.7,
                            lineHeight: 1.1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            backdropFilter: "blur(8px)",
                            textAlign: "center",
                            color: "white",
                            textShadow: "black 3px 3px 3px",
                            borderRadius: "8px",
                            bgcolor: isUnreleased ? UNRELEASED_MAP_COLOR + "80" : undefined
                        }}
                    >
                        {shortDateFormat.format(mapDate)}
                    </Typography>
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: creatorHeight,
                            height: nameHeight,
                            width: "100%",
                            overflow:"hidden", 
                            textOverflow:"ellipsis",
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
                                variant="h5" 
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
                        sx={{
                            position: "absolute",
                            bottom: "0px",
                            height: creatorHeight,
                            width: "100%",
                            borderRadius: "0 0 6px 6px", 
                            boxShadow: 0,
                            bgcolor: darken(tierColor, 0.25)
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
        </Grid>
    )
}

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
    
    const items = useMemo(() => {
        const items: ReactElement[] = [];
        for (const map of pagedMaps) {
            items.push(<MapCard map={map} />);
        }
        return items;
    }, [pagedMaps]);

    return (
        <Box display="flex" flexDirection="column">
            <Grid container spacing={2} justifyContent="center">
                {items}
            </Grid>
            <Box display="flex" justifyContent="center" mt={2}>
                <Pagination 
                    count={count} 
                    page={page} 
                    onChange={(e, p) => setPage(p)} 
                />
            </Box>
        </Box>
    );
}

interface MapSearchBarProps {
    setInputValue: (val: string) => void
}

function MapSearchBar(props: MapSearchBarProps) {
    const { setInputValue } = props;

    return (
        <TextField
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by name or creator"
            fullWidth
            label=""
            variant="outlined"
            type="search"
            autoFocus
            slotProps={{
                htmlInput: {
                    maxLength: 50
                },
                input: { 
                    startAdornment: (
                        <InputAdornment position="start" sx={{display: "flex", justifyContent: "center", mr: 0.75, width: `40px`}}>
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
    
    const [ page, setPage ] = useQueryState("page", 
        parseAsInteger
        .withDefault(1)
        .withOptions({ history: "replace" })
    );

    const [ searchText, setSearchText ] = useState("");

    useEffect(() => {
        document.title = "maps - strafes";
    }, []);

    const onChangeSearch = useCallback((value: string) => {
        setSearchText(value);
        setPage(1);
    }, [setPage]);
    
    const onDownloadMapCsv = useCallback(() => {
        mapsToCsv(sortedMaps);
    }, [sortedMaps]);

    const maps = filterMapsBySearch(sortedMaps, searchText);
    
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
            <Box padding={1}>
                <MapSearchBar setInputValue={onChangeSearch} />
            </Box>
            <Box padding={1}>
                <MapBrowser maps={maps} page={page} setPage={setPage} />
            </Box>
        </Box>
    );
}

export default MapsHome;