import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, useMediaQuery } from "@mui/material";
import { Game, Map, TimeSortBy, Style, Time } from "../api/interfaces";
import { ALL_COURSES } from "../util/format";
import { getTimeData } from "../api/api";
import { DataGrid, GridColDef, GridColumnHeaderParams, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridPaginationModel, MuiEvent, useGridApiRef } from "@mui/x-data-grid";
import { GridSortDirection, GridSortModel } from "@mui/x-data-grid/models/gridSortModel";
import { MAP_THUMB_SIZE } from "./MapLink";
import { GridApiCommunity } from "@mui/x-data-grid/internals";
import { makeCourseColumn, makeDateColumn, makeGameColumn, makeMapColumn, makePlacementColumn, makeStyleColumn, makeTimeAndDateColumn, makeTimeColumn, makeUserColumn } from "../util/columns";
import { numDigits } from "../util/utils";
import { UNRELEASED_MAP_COLOR } from "../util/colors";

function makeColumns(game: Game, style: Style, hideCourse: boolean | undefined, hideUser: boolean | undefined, 
    hideMap: boolean | undefined, showPlacement: boolean | undefined, showPlacementOrdinals: boolean | undefined, 
    notSortable: boolean | undefined, placementWidth: number, isCompact: boolean, sortBy: TimeSortBy) {
    const cols: GridColDef[]  = [];

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
        if (hideCourse) {
            cols.push(makeMapColumn());
        }
        else if (isCompact) {
            cols.push(makeMapColumn(true));
        }
        else {
            cols.push(makeMapColumn(false));
            cols.push(makeCourseColumn());
        }
    }

    if (!hideUser) {
        cols.push(makeUserColumn<Time>(280));
    }

    if (showPlacement && showPlacementOrdinals) {
        cols.push(makePlacementColumn(false, isCompact));
    }

    if (isCompact) {
        cols.push(makeTimeAndDateColumn(!notSortable, sortBy));
        cols.push({
            type: "string",
            field: "date",
            sortingOrder: !notSortable ? ["asc", "desc"] : [],
            sortable: !notSortable,
        });
    }
    else {
        cols.push(makeTimeColumn(!notSortable));
        cols.push(makeDateColumn(!notSortable));
    }

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
    const { hideMap } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    return (
    <Paper elevation={2} sx={{padding: smallScreen ? 1 : 2, display: "flex", flexDirection: "column", maxHeight: props.height ?? 590, "& .timesGrid": {margin: smallScreen ? 0.25 : 0}}}>
        <Box marginBottom={smallScreen ? -0.25 : 1} padding={smallScreen ? 1 : 0} display="flex" alignItems="center">
            <Typography variant="caption" flexGrow={1} marginRight={1}>
                {props.title ?? "Times"}
            </Typography>
            {hideMap ? <></> : 
            <>
            <Box bgcolor={UNRELEASED_MAP_COLOR} width="12px" height="12px" minWidth="12px" boxSizing="border-box" marginBottom="2px" />
            <Typography variant="caption" marginLeft={0.75}>
                = unreleased
            </Typography>
            </>}
        </Box>
        <TimesGrid {...props} />
    </Paper>
    );
}

function TimesGrid(props: ITimesCardProps) {
    const { userId, map, game, style, course, onlyWRs, hideUser, hideMap, showPlacement, defaultSort, allowOnlyWRs, showPlacementOrdinals, onLoadTimes, gridApiRef } = props;
    let apiRef = useGridApiRef();
    const [rowCountState, setRowCount] = useState(onlyWRs ? -1 : 0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentSortBy, setCurrentSortBy] = useState<TimeSortBy>(defaultSort);
    const [maxPage, setMaxPage] = useState(0);
    const isCompact = useMediaQuery(`@media screen and (max-width: 800px)`);

    const rowCount = onlyWRs ? -1 : rowCountState;

    if (gridApiRef) {
        apiRef = gridApiRef;
    }

    useEffect(() => {
        if (onlyWRs) {
            apiRef.current?.sortColumn("date", "desc");
        }
    }, [onlyWRs, apiRef]);

    const placementWidth = currentSortBy !== TimeSortBy.TimeAsc || numDigits(maxPage) > 3 ? 62 : 50;

    const getSort = useCallback((model: GridSortModel) => {
        const sort = model[0];
        let sortBy = defaultSort;
        if (sort) {
            if (sort.field === "time") {
                sortBy = sort.sort === "asc" ? TimeSortBy.TimeAsc : TimeSortBy.TimeDesc;
            }
            else if (sort.field === "date") {
                sortBy = sort.sort === "asc" ? TimeSortBy.DateAsc : TimeSortBy.DateDesc;
            }
        }
        return sortBy;
    }, [defaultSort]);

    const onSortChanged = (model: GridSortModel) => {
        const sortBy = getSort(model);
        setCurrentSortBy(sortBy);
    };

    const onPageChange = (model: GridPaginationModel) => {
        setMaxPage((model.page + 1) * model.pageSize);
    };

    const onColumnHeaderClicked = useCallback((params: GridColumnHeaderParams, event: MuiEvent<React.MouseEvent>) => {
        if (isCompact && !onlyWRs && params.field === "time") {
            event.preventDefault();
            event.defaultMuiPrevented = true;
            let field = "time";
            let direction: GridSortDirection = "asc";
            const model = apiRef.current?.getSortModel();
            const sortBy = model ? getSort(model) : TimeSortBy.TimeAsc;
            if (sortBy === TimeSortBy.TimeAsc) {
                field = "time";
                direction = "desc";
            }
            else if (sortBy === TimeSortBy.TimeDesc) {
                field = "date";
                direction = "asc";
            }
            else if (sortBy === TimeSortBy.DateAsc) {
                field = "date";
                direction = "desc";
            }
            else if (sortBy === TimeSortBy.DateDesc) {
                field = "time";
                direction = "asc";
            }
            apiRef.current?.sortColumn(field, direction);
        }
    }, [apiRef, getSort, isCompact, onlyWRs]);
    
    const gridCols = makeColumns(game, style, course !== ALL_COURSES, hideUser, hideMap, showPlacement, showPlacementOrdinals, onlyWRs, placementWidth, isCompact, currentSortBy);

    const gridKey = `${userId ?? ""},${map ? map.id : ""},${game},${style},${course},${!!onlyWRs}`;

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

    const rowHeight = useMemo(() => {
        if (isCompact) {
            return 100;
        }
        else if (!hideMap) {
            return Math.round(MAP_THUMB_SIZE * 1.6667);
        }
        return undefined;
    }, [hideMap, isCompact])

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
        rowHeight={rowHeight}
        columnHeaderHeight={isCompact ? 76 : 56}
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
        onSortModelChange={onSortChanged}
        onColumnHeaderClick={onColumnHeaderClicked}
        columnVisibilityModel={{
            date: isCompact ? false : true
        }}
        sx={{
            ".MuiDataGrid-iconButtonContainer": {
                display: isCompact ? "none !Important" : undefined
            }
        }}
    />
    );
}

export default TimesCard;