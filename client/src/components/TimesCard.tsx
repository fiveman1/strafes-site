import React, { useEffect, useMemo, useState } from "react";
import { Box, Link, Paper, Tooltip, Typography } from "@mui/material";
import { Game, Map, TimeSortBy, Style, Time } from "../api/interfaces";
import { formatGame, formatStyle, formatTime } from "../util/format";
import { getTimeData } from "../api/api";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridRenderCellParams, useGridApiRef } from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { Link as RouterLink } from "react-router";
import UserLink from "./UserLink";

const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

function makeColumns(game: Game, style: Style, hideUser?: boolean, hideMap?: boolean, showPlacement?: boolean, notSortable?: boolean) {
    const cols: GridColDef[] = [];

    if (showPlacement) {
        cols.push({
            type: "number",
            field: "placement",
            headerName: "#",
            width: 64,
            sortable: false
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
                    <UserLink userId={time.userId} username={time.username} game={game} style={style} />
                );
            }
        });
    }

    if (!hideMap) {
        cols.push({
            type: "string",
            field: "map",
            headerName: "Map",
            flex: 300,
            minWidth: 160,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Time, string>) => {
                const time = params.row;
                return (
                    <Link to={{pathname: `/maps/${time.mapId}`, search: `?style=${style}`}} component={RouterLink} underline="hover" fontWeight="bold">
                        {time.map}
                    </Link>
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

    cols.push({
        type: "string",
        field: "game",
        headerName: "Game",
        flex: 110,
        minWidth: 70,
        valueFormatter: formatGame,
        sortable: false
    });

    cols.push({
        type: "string",
        field: "style",
        headerName: "Style",
        flex: 150,
        minWidth: 110,
        valueFormatter: formatStyle,
        sortable: false
    });
    
    return cols;
}

export interface ITimesCardProps {
    userId?: string
    map?: Map
    game?: Game
    style: Style
    onlyWRs?: boolean
    hideUser?: boolean
    hideMap?: boolean
    showPlacement?: boolean
    defaultSort: TimeSortBy
    height?: number
    title?: string
    allowOnlyWRs?: boolean
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
    const { userId, map, game, style, onlyWRs, hideUser, hideMap, showPlacement, defaultSort, allowOnlyWRs } = props;
    const apiRef = useGridApiRef();
    const [rowCount, setRowCount] = useState(onlyWRs ? -1 : 0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (onlyWRs) {
            setRowCount(-1);
        }
    }, [onlyWRs]);

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            if (!allowOnlyWRs && !userId && !map) return { rows: [], rowCount: 0 }
            
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
            setIsLoading(true);
            const timeData = await getTimeData(params.start, params.end, sortBy, game, style, userId, map, onlyWRs);
            setIsLoading(false);

            if (onlyWRs) {
                if (!timeData) {
                    return { rows: [], pageInfo: { hasNextPage: false } }
                }
                const times = timeData.times;
                const hasMore = times.length >= (params.end - +params.start);
                if (rowCount === -1 && !hasMore) {
                    setRowCount(+params.start + times.length);
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
        }
    }), [game, map, onlyWRs, style, userId, defaultSort, rowCount, allowOnlyWRs])

    useEffect(() => {
        if (onlyWRs) {
            apiRef.current?.sortColumn("date", "desc");
        }
    }, [onlyWRs, apiRef]);

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
        columns={makeColumns(game ?? Game.bhop, style, hideUser, hideMap, showPlacement, onlyWRs)}
        key={`${userId ?? ""},${map ?? ""},${game},${style},${onlyWRs ?? false}`}
        apiRef={apiRef}
        loading={isLoading}
        pagination
        dataSource={dataSource}
        pageSizeOptions={[10, 25, 50]}
        rowCount={rowCount}
        initialState={{
            pagination: { 
                paginationModel: { pageSize: 10 },
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