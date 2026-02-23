import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DownloadIcon from '@mui/icons-material/Download';
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import IconButton from "@mui/material/IconButton";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { ContextParams, mapsToCsv } from "../common/common";
import { useTheme } from "@mui/material/styles";
import { useOutletContext } from "react-router";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from '@mui/icons-material/Search';
import Grid from "@mui/material/Grid";
import Pagination from "@mui/material/Pagination";
import { parseAsInteger, useQueryState } from "nuqs";
import { Map as StrafesMap } from "shared";
import { filterMapsBySearch } from "../common/sort";
import MapThumb from "./displays/MapThumb";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

interface MapCardProps {
    map: StrafesMap
}

function MapCard(props: MapCardProps) {
    const { map } = props;
    const theme = useTheme();

    const cardSize = 250;

    return (
        <Grid key={map.id} >
            
            <Box width={cardSize} height={cardSize + 100} display="flex" flexDirection="column">
                
                <Box height={cardSize} position="relative">
                    <MapThumb size={cardSize} map={map} useLargeThumb  sx={{ zIndex: -1, borderRadius: "6px 6px 0 0" }}/>
                    <Paper square elevation={1}
                    sx={{
                        position: "absolute",
                        bottom: "0px",
                        height: "48px",
                        width: "100%",
                        overflow:"hidden", 
                        textOverflow:"ellipsis",
                        boxShadow: 0
                    }}
                    >
                        <Box display="inline-block" height="48px" width={cardSize}>
                            <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                height="48px"
                                width={cardSize}
                                whiteSpace="nowrap"
                                sx={{
                                    padding: 1,
                                    overflow:"hidden", 
                                    textOverflow:"ellipsis", 
                                    textAlign: "center"
                                }}
                            >
                                {map.name}
                            </Typography>
                        </Box>
                    </Paper>
                    
                </Box>
                
                <Paper elevation={2} sx={{ height: "100px", display: "flex", flexDirection: "column", borderRadius: "0 0 6px 6px", boxShadow: 0 }}>
                    <Divider />
                    <Typography variant="subtitle2" color="textSecondary">
                        {map.creator}
                    </Typography>
                </Paper>
            </Box>
            
        </Grid>
    )
}

interface MapBrowserProps {
    maps: StrafesMap[]
    page: number
    setPage: (page: number) => void
}

const PAGE_SIZE = 15;

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
            <Box display="flex" justifyContent="center">
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
    const theme = useTheme();
    
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