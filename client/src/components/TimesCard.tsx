import React, { useEffect, useMemo } from "react";
import { Box, Link, Paper, Tooltip, Typography } from "@mui/material";
import { Game, Map, TimeSortBy, Style, Time } from "../api/interfaces";
import { formatGame, formatStyle, formatTime } from "../util/format";
import { getTimeData } from "../api/api";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridRenderCellParams, useGridApiRef } from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
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

function makeColumns(hideUser?: boolean, hideMap?: boolean, showPlacement?: boolean, notSortable?: boolean) {
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
                    <UserLink userId={time.userId} username={time.username} />
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
                    <Link href={`/maps/${time.mapId}`} underline="hover" fontWeight="bold">
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
        minWidth: 100,
        sortingOrder: notSortable ? [] : ["desc", "asc"],
        sortable: !notSortable,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            if (!params.value) {
                return <></>
            }
            const dateValue = new Date(params.value);
            return (
                <Tooltip placement="right" title={timeFormat.format(dateValue)}>
                    <Box display="inline-block">
                        {dateFormat.format(dateValue)}
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
        flex: 210,
        minWidth: 100,
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
}

function TimesCard(props: ITimesCardProps) {
    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", maxHeight: 600}}>
        <Typography variant="caption" marginBottom={1}>
            Times
        </Typography>
        <TimesGrid {...props} />
    </Paper>
    );
}

function TimesGrid(props: ITimesCardProps) {
    const { userId, map, game, style, onlyWRs, hideUser, hideMap, showPlacement, defaultSort } = props;
    const apiRef = useGridApiRef();

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

            const timeData = await getTimeData(params.start, params.end, sortBy, game, style, userId, map, onlyWRs);
            if (!timeData) {
                return { rows: [], rowCount: 0 }
            }
            return {
                rows: timeData.times,
                rowCount: timeData.pagination.totalItems
            }
        }
    }), [game, map, onlyWRs, style, userId, defaultSort])

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
        columns={makeColumns(hideUser, hideMap, showPlacement, onlyWRs)}
        apiRef={apiRef}
        pagination
        dataSource={dataSource}
        pageSizeOptions={[10, 25, 50]}
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