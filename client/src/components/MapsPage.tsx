import React, { CSSProperties, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { Card, CardActionArea, CardContent, CardMedia, colors, Grid, Paper, TextField, Typography, useTheme } from "@mui/material";
import { useOutletContext, useParams } from "react-router";
import { ContextParams, formatGame } from "../util/format";
import { Game, Map, Style, TimeSortBy } from "../api/interfaces";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import StyleSelector, { useStyle } from "./StyleSelector";
import TimesCard from "./TimesCard";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

const CARD_SIZE = 180;

function MapRow(props: {data: {itemsPerRow: number, maps: Map[], mapStyle: Style, selectedMap?: Map}, index: number, style: CSSProperties}) {
    const { data, index, style } = props;
    const { maps, itemsPerRow, mapStyle, selectedMap } = data;

    const rowMaps: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, maps.length);
    for (let i = fromIndex; i < toIndex; ++i) {
        const selected = selectedMap?.id === maps[i].id;
        rowMaps.push(<MapCard key={i} map={maps[i]} selected={selected} style={mapStyle} />);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowMaps}
    </Box>
    );
}

function MapCard(props: {map: Map, selected?: boolean, style: Style}) {
    const { map, selected, style } = props;
    const theme = useTheme();

    const isLightMode = theme.palette.mode === "light";
    const creatorColor = selected ? (isLightMode ? colors.grey[50] : colors.grey[200]) : theme.palette.text.secondary;
    const bgColor = selected ? (theme.palette.primary[isLightMode ? 400 : 600]) : undefined;
    const hoverColor = selected ? (theme.palette.primary[isLightMode ? 300 : 500]) : undefined;
    const titleColor = isLightMode && selected ? "common.white" : undefined;
    const real_height = CARD_SIZE - 16;

    return (
    <Box padding="8px">
        <Card elevation={2} id={"mapCard" + map.id}
            sx={{width: real_height * 2, 
                height: real_height, 
                display: "flex",
                flexDirection: "row",
                ":hover": {boxShadow: 10}}}>
            <CardActionArea
                href={`/maps/${map.id}?style=${style !== Style.scroll || map.game === Game.bhop ? style : Style.autohop}`}
                sx={{ 
                height: "100%",
                backgroundColor: bgColor,
                display: "flex",
                flexDirection: "row",
                ":hover": { backgroundColor: hoverColor }}}>
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
                <CardMedia component="img" sx={{width: real_height, height: real_height}} image={map.largeThumb}/>
                : <QuestionMarkIcon sx={{ fontSize: real_height, }} />}
            </CardActionArea>
            
        </Card>
    </Box>
    );
}

function MapList(props: {width: number, filteredMaps: Map[], style: Style, selectedMap?: Map}) {
    const { width, filteredMaps, style, selectedMap } = props;
    const listRef = useRef<FixedSizeList>(null);

    const itemsPerRow = Math.floor((width - 12) / (CARD_SIZE * 2)) || 1;
    const rowCount = Math.ceil(filteredMaps.length / itemsPerRow);

    useEffect(() => {
        if (selectedMap) {
            listRef.current?.scrollToItem(0);
        }
    }, [selectedMap, listRef])
    
    return (
        <FixedSizeList 
            style={{scrollbarWidth: "thin"}} height={CARD_SIZE * 2} width={width} 
            itemCount={rowCount} itemSize={CARD_SIZE} ref={listRef}
            itemData={{maps: filteredMaps, itemsPerRow: itemsPerRow, selectedMap: selectedMap, mapStyle: style}}
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
    const [style, setStyle] = useStyle();

    useEffect(() => {
        document.title = "strafes - maps";
    }, []);
    
    useEffect(() => {
        const mapId = id && !isNaN(+id) ? +id : undefined;
        if (mapId) {
            const map = maps[mapId];
            setSelectedMap(map);
        }
    }, [selectedMap, id, maps]);

    const onSearchTextChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);
    }

    let filteredMaps: Map[] = [];
    if (searchText) {
        const validMaps = new Set<number>();
        if (selectedMap) {
            // Always put selected map first
            filteredMaps.push(selectedMap);
            validMaps.add(selectedMap.id);
        }
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
        if (selectedMap) {
            // Always put selected map first
            filteredMaps.push(selectedMap);
            for (const map of sortedMaps) {
                if (map.id !== selectedMap?.id) {
                    filteredMaps.push(map);
                }
            }
        }
        else {
            filteredMaps = sortedMaps;
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
            {({ width }) => <MapList width={width} filteredMaps={filteredMaps} style={style} selectedMap={selectedMap} />}
            </AutoSizer>
        </Grid>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <Box padding={1.5}>
                <StyleSelector game={selectedMap?.game} style={style} setStyle={setStyle} />
            </Box>
        </Box>
        <Box padding={1}>
            <TimesCard defaultSort={TimeSortBy.TimeAsc} map={selectedMap} game={selectedMap?.game} style={style} hideMap showPlacement />
        </Box>
    </Box>
    );
}

export default MapsPage;