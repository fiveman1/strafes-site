import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Link, Paper, Tooltip, Typography } from "@mui/material";
import { Game, Map, TimeSortBy, Style, Time } from "../api/interfaces";
import { ContextParams, formatGame, formatPlacement, formatStyle, formatTime } from "../util/format";
import { getTimeData } from "../api/api";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridRenderCellParams, useGridApiRef } from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { Link as RouterLink, useOutletContext } from "react-router";
import UserLink from "./UserLink";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { brown, grey, yellow } from "@mui/material/colors";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

const MAP_THUMB_SIZE = 50;

interface IMapLinkProps {
    id: number
    name: string
    style: Style
    game: Game
}

function MapLink(props: IMapLinkProps) {
    const { id, name, style, game } = props;
    const { maps } = useOutletContext() as ContextParams;
    const mapInfo = maps[id];
    
    let thumb = "";
    if (mapInfo?.smallThumb) {
        thumb = mapInfo.smallThumb;
    }
    
    return (
        <Link to={{pathname: `/maps/${id}`, search: `?style=${style}&game=${game}`}} 
            component={RouterLink} 
            underline="hover" 
            fontWeight="bold" 
            display="inline-block"
            maxWidth="100%"
        >
            <Box display="flex" flexDirection="row" alignItems="center">
            {
                thumb ? 
                <Box 
                    component="img" 
                    height={MAP_THUMB_SIZE} 
                    width={MAP_THUMB_SIZE} 
                    src={thumb} 
                    alt={name} 
                    marginRight="10px"
                />
                : 
                <QuestionMarkIcon htmlColor="white" sx={{ fontSize: MAP_THUMB_SIZE, marginRight: "10px" }} />
            }
                <Typography variant="inherit" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {name}
                </Typography>
            </Box>
        </Link>
    );
}

const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

function makeColumns(game: Game, style: Style, hideUser?: boolean, hideMap?: boolean, showPlacement?: boolean, showPlacementOrdinals?: boolean, notSortable?: boolean) {
    const cols: GridColDef[] = [];

    if (showPlacement && !showPlacementOrdinals) {
        cols.push({
            type: "number",
            field: "placement",
            headerName: "#",
            width: 64,
            sortable: false
        });
    }

    if (!hideMap) {
        cols.push({
            type: "string",
            field: "map",
            headerName: "Map",
            flex: 350,
            minWidth: 215,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Time, string>) => {
                const time = params.row;
                return (
                    <MapLink id={time.mapId} name={time.map} style={time.style} game={time.game} />
                );
            }
        });
    }

    if (!hideUser) {
        cols.push({
            type: "string",
            field: "username",
            headerName: "User",
            flex: 300,
            minWidth: 160,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Time, string>) => {
                const time = params.row;
                return (
                    <UserLink userId={time.userId} username={time.username} game={time.game} style={time.style} />
                );
            }
        });
    }

    if (showPlacement && showPlacementOrdinals) {
        cols.push({
            type: "number",
            field: "placement",
            headerName: "Placement",
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Time, string>) => {
                const time = params.row;
                const placement = time.placement;
                let iconColor = "";
                switch (placement) {
                    case 1:
                        iconColor = yellow[800];
                        break;
                    case 2:
                        iconColor = grey[500];
                        break;
                    case 3:
                        iconColor = brown[400];
                        break;
                }
                return (
                    <Box display="flex" flexDirection="row" alignItems="center">
                        <Box flexGrow={1} display="flex" flexDirection="row" alignItems="center" justifyContent="left">
                        {iconColor ? <EmojiEventsIcon htmlColor={iconColor} sx={{fontSize: "24px", marginLeft: "4px"}} /> : <></>}
                        </Box>
                        <Typography variant="inherit" fontFamily="monospace">
                            {formatPlacement(placement)}
                        </Typography>
                    </Box>
                );
            }
        });
    }

    cols.push({
        type: "string",
        field: "time",
        headerName: "Time",
        flex: 150,
        minWidth: 100,
        valueFormatter: formatTime,
        sortingOrder: notSortable ? [] : ["asc", "desc"],
        sortable: !notSortable
    });

    cols.push({
        type: "string",
        field: "date",
        headerName: "Date",
        flex: 170,
        minWidth: 105,
        sortingOrder: notSortable ? [] : ["desc", "asc"],
        sortable: !notSortable,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            if (!params.value) {
                return <></>
            }
            const dateValue = new Date(params.value);
            const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
            const lessThanOneDay = dateValue.getTime() > oneDayAgo;
            return (
                <Tooltip placement="right" title={timeFormat.format(dateValue)}>
                    <Box display="inline-block">
                        {dateFormat.format(dateValue)}
                        {lessThanOneDay ? <Typography color="info" variant="inherit" display="inline-block" marginLeft="1px">*</Typography> : undefined}
                    </Box>
                </Tooltip>
            );
        }
    });

    if (game === Game.all) {
        cols.push({
            type: "string",
            field: "game",
            headerName: "Game",
            flex: 110,
            minWidth: 75,
            valueFormatter: formatGame,
            sortable: false
        });
    }

    if (style === Style.all) {
        cols.push({
            type: "string",
            field: "style",
            headerName: "Style",
            flex: 150,
            minWidth: 110,
            valueFormatter: formatStyle,
            sortable: false
        });
    }
    
    return cols;
}

export interface ITimesCardProps {
    userId?: string
    map?: Map
    game: Game
    style: Style
    onlyWRs?: boolean
    hideUser?: boolean
    hideMap?: boolean
    showPlacement?: boolean
    defaultSort: TimeSortBy
    height?: number
    title?: string
    allowOnlyWRs?: boolean
    showPlacementOrdinals?: boolean
}

function TimesCard(props: ITimesCardProps) {
    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", maxHeight: props.height ?? 590}}>
        <Box marginBottom={1} display="flex">
            <Typography variant="caption" flexGrow={1} marginRight={2}>
                {props.title ?? "Times"}
            </Typography>
            <Typography color="info" variant="body2" display="inline-block" marginRight="2px">*</Typography>
            <Typography variant="caption">
                = less than 24 hours ago
            </Typography>
        </Box>
        <TimesGrid {...props} />
    </Paper>
    );
}

function TimesGrid(props: ITimesCardProps) {
    const { userId, map, game, style, onlyWRs, hideUser, hideMap, showPlacement, defaultSort, allowOnlyWRs, showPlacementOrdinals } = props;
    const apiRef = useGridApiRef();
    const [rowCount, setRowCount] = useState(onlyWRs ? -1 : 0);
    const [isLoading, setIsLoading] = useState(false);

    // Reset row count to unknown when in only WRs mode after changing game or style
    useEffect(() => {
        if (onlyWRs) {
            setRowCount(-1);
        }
    }, [onlyWRs, game, style]);

    useEffect(() => {
        if (onlyWRs) {
            apiRef.current?.sortColumn("date", "desc");
        }
    }, [onlyWRs, apiRef]);
    
    const gridCols = useMemo(() => {
        return makeColumns(game, style, hideUser, hideMap, showPlacement && !onlyWRs, showPlacementOrdinals, onlyWRs);
    }, [game, hideMap, hideUser, onlyWRs, showPlacement, showPlacementOrdinals, style]);

    const gridKey = useMemo(() => {
        return `${userId ?? ""},${map ?? ""},${game},${style},${!!onlyWRs}`;
    }, [game, map, onlyWRs, style, userId]);

    const updateRowData = useCallback(async (start: number, end: number, sortBy: TimeSortBy) => {
        if (!allowOnlyWRs && !userId && !map) return { rows: [], rowCount: 0 }
        
        setIsLoading(true);
        const timeData = await getTimeData(start, end, sortBy, game, style, userId, map, onlyWRs);
        setIsLoading(false);

        if (onlyWRs) {
            if (!timeData) {
                return { rows: [], pageInfo: { hasNextPage: false } }
            }
            const times = timeData.times;
            const hasMore = times.length >= (end - start);
            if (!hasMore) {
                setRowCount(start + times.length);
            }
            return {
                rows: times,
                pageInfo: {hasNextPage: hasMore}
            }
        }
        else {
            if (!timeData) {
                setRowCount(0);
                return { rows: [], rowCount: 0 }
            }
            setRowCount(timeData.pagination.totalItems);
            return {
                rows: timeData.times,
                rowCount: timeData.pagination.totalItems
            }
        }
    }, [allowOnlyWRs, game, map, onlyWRs, style, userId]);

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const sort = params.sortModel.at(0);
            let sortBy = defaultSort;
            if (sort) {
                if (sort.field === "time") {
                    sortBy = sort.sort === "asc" ? TimeSortBy.TimeAsc : TimeSortBy.TimeDesc;
                }
                else if (sort.field === "date") {
                    sortBy = sort.sort === "asc" ? TimeSortBy.DateAsc : TimeSortBy.DateDesc;
                }
            }
            return await updateRowData(+params.start, params.end, sortBy);
        }
    }), [defaultSort, updateRowData]);

    let sort: GridSortModel;
    switch (defaultSort) {
        case TimeSortBy.TimeAsc:
            sort = [{ field: "time", sort: "asc" }];
            break;
        case TimeSortBy.TimeDesc:
            sort = [{ field: "time", sort: "desc" }];
            break;
        case TimeSortBy.DateAsc:
            sort = [{ field: "date", sort: "asc" }];
            break;
        case TimeSortBy.DateDesc:
            sort = [{ field: "date", sort: "desc" }];
            break;
    }

    return (
    <DataGrid
        columns={gridCols}
        key={gridKey}
        apiRef={apiRef}
        loading={isLoading}
        pagination
        dataSource={dataSource}
        pageSizeOptions={[25]}
        rowCount={rowCount}
        rowHeight={hideMap ? undefined : Math.round(MAP_THUMB_SIZE * 1.6667)}
        initialState={{
            pagination: { 
                paginationModel: { pageSize: 25 },
            },
            sorting: {
                sortModel: sort,
            }
        }}
        disableColumnFilter
        density="compact"
    />
    );
}

export default TimesCard;