import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, useMediaQuery } from "@mui/material";
import { Game, Map, TimeSortBy, Style, Time } from "../api/interfaces";
import { ALL_COURSES } from "../util/format";
import { getTimeData } from "../api/api";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridPaginationModel, useGridApiRef } from "@mui/x-data-grid";
import { GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { MAP_THUMB_SIZE } from "./MapLink";
import { GridApiCommunity } from "@mui/x-data-grid/internals";
import { makeCourseColumn, makeDateColumn, makeGameColumn, makeMapColumn, makePlacementColumn, makeStyleColumn, makeTimeColumn, makeUserColumn } from "../util/columns";
import { numDigits } from "../util/utils";

function makeColumns(game: Game, style: Style, hideCourse: boolean | undefined, hideUser: boolean | undefined, 
    hideMap: boolean | undefined, showPlacement: boolean | undefined, showPlacementOrdinals: boolean | undefined, 
    notSortable: boolean | undefined, placementWidth: number) {
    const cols: GridColDef[] = [];

    if (showPlacement && !showPlacementOrdinals) {
        cols.push({
            type: "number",
            field: "placement",
            headerName: "#",
            width: placementWidth,
            sortable: false,
            valueFormatter: (value) => value
        });
    }

    if (!hideMap) {
        cols.push(makeMapColumn());
        if (!hideCourse) {
            cols.push(makeCourseColumn());
        }
    }

    if (!hideUser) {
        cols.push(makeUserColumn<Time>(300));
    }

    if (showPlacement && showPlacementOrdinals) {
        cols.push(makePlacementColumn(false));
    }

    cols.push(makeTimeColumn(!notSortable));

    cols.push(makeDateColumn(!notSortable));

    if (game === Game.all) {
        cols.push(makeGameColumn());
    }

    if (style === Style.all) {
        cols.push(makeStyleColumn());
    }
    
    return cols;
}

interface ITimesCardProps {
    userId?: string
    map?: Map
    game: Game
    style: Style
    course: number
    onlyWRs?: boolean
    hideUser?: boolean
    hideMap?: boolean
    showPlacement?: boolean
    defaultSort: TimeSortBy
    height?: number
    title?: string
    allowOnlyWRs?: boolean
    showPlacementOrdinals?: boolean
    onLoadTimes?: (times: Time[]) => void
    gridApiRef?: React.RefObject<GridApiCommunity | null> 
}

function TimesCard(props: ITimesCardProps) {
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    return (
    <Paper elevation={2} sx={{padding: smallScreen ? 1 : 2, display: "flex", flexDirection: "column", maxHeight: props.height ?? 590, "& .timesGrid": {margin: smallScreen ? 0.25 : 0}}}>
        <Box marginBottom={smallScreen ? -0.25 : 1} padding={smallScreen ? 1 : 0} display="flex">
            <Typography variant="caption">
                {props.title ?? "Times"}
            </Typography>
        </Box>
        <TimesGrid {...props} />
    </Paper>
    );
}

function TimesGrid(props: ITimesCardProps) {
    const { userId, map, game, style, course, onlyWRs, hideUser, hideMap, showPlacement, defaultSort, allowOnlyWRs, showPlacementOrdinals, onLoadTimes, gridApiRef } = props;
    let apiRef = useGridApiRef();
    const [rowCount, setRowCount] = useState(onlyWRs ? -1 : 0);
    const [isLoading, setIsLoading] = useState(false);
    const [sortBy, setSortBy] = useState<TimeSortBy>(defaultSort);
    const [maxPage, setMaxPage] = useState(0);
    const [placementWidth, setPlacementWidth] = useState(50);

    if (gridApiRef) {
        apiRef = gridApiRef;
    }

    useEffect(() => {
        if (onlyWRs) {
            apiRef.current?.sortColumn("date", "desc");
        }
    }, [onlyWRs, apiRef]);

    useEffect(() => {
        if (sortBy !== TimeSortBy.TimeAsc || numDigits(maxPage) > 3) {
            setPlacementWidth(62);
        }
        else {
            setPlacementWidth(50);
        }
    }, [maxPage, sortBy]);

    const getSort = useCallback((model: GridSortModel) => {
        const sort = model.at(0);
        let sortBy = defaultSort;
        if (sort) {
            if (sort.field === "time") {
                sortBy = sort.sort === "asc" ? TimeSortBy.TimeAsc : TimeSortBy.TimeDesc;
            }
            else if (sort.field === "date") {
                sortBy = sort.sort === "asc" ? TimeSortBy.DateAsc : TimeSortBy.DateDesc;
            }
        }
        setSortBy(sortBy);
        return sortBy;
    }, [defaultSort]);

    const onPageChange = useCallback((model: GridPaginationModel) => {
        setMaxPage((model.page + 1) * model.pageSize);
    }, []);
    
    const gridCols = useMemo(() => {
        return makeColumns(game, style, course !== ALL_COURSES, hideUser, hideMap, showPlacement, showPlacementOrdinals, onlyWRs, placementWidth);
    }, [course, game, hideMap, hideUser, onlyWRs, placementWidth, showPlacement, showPlacementOrdinals, style]);

    const gridKey = useMemo(() => {
        // Set row count to unknown when changing settings in WR only mode
        if (onlyWRs) {
            setRowCount(-1);
        }
        return `${userId ?? ""},${map ? map.id : ""},${game},${style},${course},${!!onlyWRs}`;
    }, [course, game, map, onlyWRs, style, userId]);

    const updateRowData = useCallback(async (start: number, end: number, sortBy: TimeSortBy) => {
        if (!allowOnlyWRs && !userId && !map) {
            setRowCount(0);
            return { rows: [], rowCount: 0 }
        }
        
        setIsLoading(true);
        const timeData = await getTimeData(start, end, sortBy, course, game, style, userId, map, onlyWRs);
        setIsLoading(false);

        if (onLoadTimes && timeData?.times) {
            onLoadTimes(timeData.times);
        }

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
    }, [allowOnlyWRs, course, game, map, onLoadTimes, onlyWRs, style, userId]);

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const sortBy = getSort(params.sortModel);
            return await updateRowData(+params.start, params.end, sortBy);
        }
    }), [getSort, updateRowData]);

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
        className="timesGrid"
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
        disableRowSelectionOnClick
        onPaginationModelChange={onPageChange}
        onSortModelChange={getSort}
    />
    );
}

export default TimesCard;