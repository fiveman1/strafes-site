import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Card, CardActionArea, CardContent, colors, Grid, Paper, TextField, Typography, useTheme } from "@mui/material";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { ContextParams, formatGame } from "../util/format";
import { Map, Style } from "../api/interfaces";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import StyleSelector from "./StyleSelector";
import TimesCard from "./TimesCard";

const CARD_SIZE = 180;

function MapRow(props: {data: {itemsPerRow: number, maps: Map[], selectedMap?: Map}, index: number, style: any}) {
    const { data, index, style } = props;
    const { maps, itemsPerRow, selectedMap } = data;

    const rowMaps: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, maps.length);
    for (let i = fromIndex; i < toIndex; ++i) {
        rowMaps.push(<MapCard key={i} map={maps[i]} selected={selectedMap?.id === maps[i].id} />);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowMaps}
    </Box>
    );
}

function MapCard(props: {map: Map, selected?: boolean}) {
    const { map, selected } = props;
    const theme = useTheme();
    const navigate = useNavigate();

    const isLightMode = theme.palette.mode === "light";
    const creatorColor = selected ? (isLightMode ? colors.grey[50] : colors.grey[200]) : theme.palette.text.secondary;
    const bgColor = selected ? (theme.palette.primary[isLightMode ? 400 : 600]) : undefined;
    const hoverColor = selected ? (theme.palette.primary[isLightMode ? 300 : 500]) : undefined;
    const titleColor = isLightMode && selected ? "common.white" : undefined;

    return (
    <Box padding="8px">
        <Card elevation={2} 
            sx={{width: CARD_SIZE - 16, 
                height: CARD_SIZE - 16, 
                ":hover": {boxShadow: 10}}}>
            <CardActionArea 
                onClick={() => {
                    navigate("/maps/" + map.id, {replace: true});
                }} 
                sx={{ 
                height: "100%",
                backgroundColor: bgColor,
                ":hover": { backgroundColor: hoverColor }}}>
                <CardContent sx={{height: "100%", display: "flex", flexDirection: "column", overflowWrap: "break-word"}}>
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
            </CardActionArea>
        </Card>
    </Box>
    );
}

function MapsPage() {
    const { id } = useParams();
    const { maps, sortedMaps } = useOutletContext() as ContextParams;

    const [searchText, setSearchText] = useState<string>("");
    const [selectedMap, setSelectedMap] = useState<Map>();
    const [style, setStyle] = useState<Style>(Style.autohop);
    
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

    let filteredMaps: Map[];
    if (searchText) {
        filteredMaps = [];
        const validMaps = new Set<number>();
        const search = searchText.toLowerCase();
        // Show exact map name matches first
        for (const map of sortedMaps) {
            if (map.name.toLowerCase().startsWith(search)) {
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
            if (!validMaps.has(map.id) && map.name.toLowerCase().includes(search)) {
                filteredMaps.push(map);
                validMaps.add(map.id);
            }
        }
    }
    else {
        filteredMaps = sortedMaps;
    }

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Maps
        </Typography>
        <Box padding={1} marginBottom={1}>
            <Paper elevation={2} sx={{padding: 3, display:"flex", alignItems: "center"}}>
                <Box width="100%">
                    <Typography variant="subtitle1" marginBottom={2}>Search by map name as you type</Typography>
                    <TextField onChange={onSearchTextChanged} fullWidth label="Name" variant="outlined" />
                </Box>
            </Paper>
        </Box>
        <Grid container height={CARD_SIZE * 2} sx={{scrollbarWidth: "thin"}}>
            <AutoSizer disableHeight>
            {({ width }) => {
                const itemsPerRow = Math.floor((width - 12) / (CARD_SIZE)) || 1;
                const rowCount = Math.ceil(filteredMaps.length / itemsPerRow);
                return (
                    <FixedSizeList 
                        style={{scrollbarWidth: "thin"}} height={CARD_SIZE * 2} width={width} 
                        itemCount={rowCount} itemSize={CARD_SIZE} 
                        itemData={{maps: filteredMaps, itemsPerRow: itemsPerRow, selectedMap: selectedMap}}
                    >
                        {MapRow}
                    </FixedSizeList>
                );
            }}
            </AutoSizer>
        </Grid>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <Box padding={1.5}>
                <StyleSelector game={selectedMap?.game} style={style} setStyle={setStyle} />
            </Box>
        </Box>
        <Box padding={1}>
            <TimesCard map={selectedMap} game={selectedMap?.game} style={style} hideMap />
        </Box>
    </Box>
    );
}

export default MapsPage;