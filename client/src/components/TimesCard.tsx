import React from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { Game, Map, Style } from "../api/interfaces";
import { formatGame, formatStyle, formatTime } from "../util/format";
import { getTimeData } from "../api/api";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridRenderCellParams } from "@mui/x-data-grid";

const dateFormat = Intl.DateTimeFormat(undefined, {
    year: "numeric",
    day: "2-digit",
    month: "2-digit"
});

const timeFormat = Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
});

export interface ITimesCardProps {
    userId?: string
    map?: Map
    game?: Game
    style: Style
    onlyWRs?: boolean
    hideUser?: boolean
    hideMap?: boolean
}

function makeColumns(hideUser?: boolean, hideMap?: boolean) {
    const cols: GridColDef[] = [];

    if (!hideUser) {
        cols.push({
            type: "string",
            field: "username",
            headerName: "User",
            flex: 300
        });
    }

    if (!hideMap) {
        cols.push({
            type: "string",
            field: "map",
            headerName: "Map",
            flex: 450
        });
    }

    cols.push({
        type: "string",
        field: "time",
        headerName: "Time",
        flex: 150,
        valueFormatter: formatTime
    });

    cols.push({
        type: "string",
        field: "date",
        headerName: "Date",
        flex: 170,
        renderCell: (params: GridRenderCellParams<any, string>) => {
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
        valueFormatter: formatGame
    });

    cols.push({
        type: "string",
        field: "style",
        headerName: "Style",
        flex: 210,
        valueFormatter: formatStyle
    });
    
    return cols;
}

function TimesCard(props: ITimesCardProps) {
    const { userId, map, game, style, onlyWRs, hideUser, hideMap } = props;

    const dataSource: GridDataSource = React.useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const timeData = await getTimeData(params.start, params.end, game, style, userId, map, onlyWRs);
            if (!timeData) {
                return { rows: [], rowCount: 0 }
            }
            return {
                rows: timeData.times,
                rowCount: timeData.pagination.totalItems
            }
        }
    }), [game, map, onlyWRs, style, userId])

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", maxHeight: 600}}>
        <Box display="flex">
            <Typography variant="caption" marginBottom={1}>
                Times
            </Typography>
        </Box>
        <DataGrid
            columns={makeColumns(hideUser, hideMap)}
            pagination
            dataSource={dataSource}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
                pagination: { 
                    paginationModel: { pageSize: 10 },
                },
            }}
            disableColumnFilter
            disableColumnSorting
            density="compact"
        />
    </Paper>
    );
}

export default TimesCard;