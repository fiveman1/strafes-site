import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Paper, tablePaginationClasses, Typography, useMediaQuery } from "@mui/material";
import { Game, TimeSortBy, Style, Time, ALL_COURSES } from "shared";
import { getTimeData } from "../../../api/api";
import { DataGrid, GridColDef, GridColumnHeaderParams, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridPaginationModel, GridSortDirection, GridSortModel, MuiEvent, useGridApiRef } from "@mui/x-data-grid";
import { MAP_THUMB_SIZE } from "../../displays/MapLink";
import { GridApiCommunity } from "@mui/x-data-grid/internals";
import { makeCourseColumn, makeDateColumn, makeMapColumn, makePlacementColumn, makeTimeAndDateColumn, makeTimeColumn, makeUserColumn } from "./util/columns";
import { numDigits } from "../../../common/utils";
import { UNRELEASED_MAP_COLOR } from "../../../common/colors";
import NumberGridPagination from "./NumberGridPagination";
import { parseAsInteger, parseAsNumberLiteral, useQueryState } from "nuqs";

function makeColumns(game: Game, style: Style, hideCourse: boolean | undefined, hideUser: boolean | undefined,
    hideMap: boolean | undefined, showPlacement: boolean | undefined, showPlacementOrdinals: boolean | undefined,
    placementWidth: number, isCompact: boolean, sortBy: TimeSortBy) {
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
        if (hideCourse) {
            cols.push(makeMapColumn(game === Game.all, style === Style.all));
        }
        else if (isCompact) {
            cols.push(makeMapColumn(game === Game.all, style === Style.all, true));
        }
        else {
            cols.push(makeMapColumn(game === Game.all, style === Style.all, false));
            cols.push(makeCourseColumn());
        }
    }

    if (!hideUser) {
        cols.push(makeUserColumn<Time>(300));
    }

    if (showPlacement && showPlacementOrdinals) {
        cols.push(makePlacementColumn(false, isCompact));
    }

    if (isCompact) {
        cols.push(makeTimeAndDateColumn(sortBy));
        cols.push({
            type: "string",
            field: "date",
            sortingOrder: ["asc", "desc"]
        });
    }
    else {
        cols.push(makeTimeColumn());
        cols.push(makeDateColumn());
    }

    return cols;
}

interface ITimesCardProps {
    userId?: string
    mapId?: string
    game: Game
    style: Style
    course: number
    onlyWRs?: boolean
    hideUser?: boolean
    hideMap?: boolean
    showPlacement?: boolean
    defaultSort: TimeSortBy
    title?: string
    allowOnlyWRs?: boolean
    showPlacementOrdinals?: boolean
    onLoadTimes?: (times: Time[]) => void
    gridApiRef?: React.RefObject<GridApiCommunity | null>
    pageSize?: number
}

function TimesCard(props: ITimesCardProps) {
    const { hideMap } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    return (
        <Paper elevation={2} sx={{ padding: smallScreen ? 1 : 2, display: "flex", flexDirection: "column", "& .timesGrid": { margin: smallScreen ? 0.25 : 0 } }}>
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

function getGridKey(userId: string | undefined, mapId: string | undefined, game: Game, style: Style, course: number, onlyWRs: boolean | undefined, currentSortBy: TimeSortBy) {
    return `${userId ?? ""}|${mapId ?? ""}|${game}|${style}|${course}|${!!onlyWRs}|${currentSortBy}`;
}

function TimesGrid(props: ITimesCardProps) {
    const { userId, mapId, game, style, course, onlyWRs, hideUser, hideMap,
        showPlacement, defaultSort, allowOnlyWRs, showPlacementOrdinals, onLoadTimes,
        gridApiRef, pageSize: propPageSize } = props;

    let apiRef = useGridApiRef();

    const [rowCount, setRowCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    const under800px = useMediaQuery(`@media screen and (max-width: 800px)`);
    const under1000px = useMediaQuery(`@media screen and (max-width: 1000px)`);
    const shortScreen = useMediaQuery("@media screen and (max-height: 1000px)");

    const [currentSortBy, setCurrentSortBy] = useQueryState("sort", 
        parseAsNumberLiteral([TimeSortBy.DateAsc, TimeSortBy.DateDesc, TimeSortBy.TimeAsc, TimeSortBy.TimeDesc])
        .withDefault(defaultSort)
        .withOptions({ history: "replace" })
    );

    const [start, setStart] = useQueryState("start",
        parseAsInteger
        .withDefault(1)
        .withOptions({ history: "replace" })
    );

    const [gridKey, setGridKey] = useState(getGridKey(userId, mapId, game, style, course, onlyWRs, currentSortBy));

    let pageSize = propPageSize ?? 10;
    if (shortScreen) pageSize = 10;

    const initPage = Math.floor(start / pageSize);
    const [maxVisisbleRow, setMaxVisisbleRow] = useState((initPage + 1) * pageSize);

    let isCompact = false;
    if (game === Game.all || style === Style.all) {
        isCompact = under1000px;
    }
    else {
        isCompact = under800px;
    }

    if (gridApiRef) {
        apiRef = gridApiRef;
    }

    useEffect(() => {
        apiRef.current?.setPageSize(pageSize);
    }, [apiRef, pageSize]);

    // Reset page to 0 when changing something that would load new data
    useEffect(() => {
        const newKey = getGridKey(userId, mapId, game, style, course, onlyWRs, currentSortBy);
        if (newKey !== gridKey) {
            apiRef.current?.setPage(0);
            setGridKey(newKey);
        }
    }, [userId, mapId, game, style, course, onlyWRs, currentSortBy, apiRef, gridKey]);

    const placementWidth = currentSortBy !== TimeSortBy.TimeAsc || numDigits(maxVisisbleRow) > 3 ? (numDigits(rowCount) > 5 ? 70 : 62) : 50;

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
        const start = (model.page * model.pageSize) + 1;
        setStart(start);
        setMaxVisisbleRow((model.page + 1) * model.pageSize);
    };

    const onColumnHeaderClicked = useCallback((params: GridColumnHeaderParams, event: MuiEvent<React.MouseEvent>) => {
        if (isCompact && params.field === "time") {
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
    }, [apiRef, getSort, isCompact]);

    const gridCols = useMemo(() => makeColumns(game, style, course !== ALL_COURSES, hideUser, hideMap, showPlacement, showPlacementOrdinals, placementWidth, isCompact, currentSortBy),
        [course, currentSortBy, game, hideMap, hideUser, isCompact, placementWidth, showPlacement, showPlacementOrdinals, style]);

    const updateRowData = useCallback(async (start: number, end: number, sortBy: TimeSortBy) => {
        if (!allowOnlyWRs && !userId && !mapId) {
            setRowCount(0);
            return { rows: [], rowCount: 0 }
        }

        setIsLoading(true);
        const timeData = await getTimeData(start, end, sortBy, course, game, style, userId, mapId, onlyWRs);
        setIsLoading(false);

        if (onLoadTimes && timeData?.times) {
            onLoadTimes(timeData.times);
        }

        if (!timeData) {
            setRowCount(0);
            return { rows: [], rowCount: 0 }
        }
        setRowCount(timeData.pagination.totalItems);
        return {
            rows: timeData.times,
            rowCount: timeData.pagination.totalItems
        }
    }, [allowOnlyWRs, course, game, mapId, onLoadTimes, onlyWRs, style, userId]);

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const sortBy = getSort(params.sortModel);
            return await updateRowData(+params.start, params.end, sortBy);
        }
    }), [getSort, updateRowData]);

    let sort: GridSortModel;
    switch (currentSortBy) {
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
            apiRef={apiRef}
            loading={isLoading}
            pagination
            dataSource={dataSource}
            pageSizeOptions={propPageSize !== undefined && propPageSize !== 10 ? [10, propPageSize] : [10]}
            rowCount={rowCount}
            rowHeight={rowHeight}
            columnHeaderHeight={isCompact ? 76 : 56}
            initialState={{
                pagination: {
                    paginationModel: { 
                        pageSize: pageSize, 
                        page: initPage
                    },
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
                date: !isCompact
            }}
            slotProps={{
                basePagination: {
                    material: {
                        ActionsComponent: (props) => <NumberGridPagination rowCount={rowCount} {...props} />
                    }
                }
            }}
            sx={{
                ".MuiDataGrid-iconButtonContainer": {
                    display: isCompact ? "none !important" : undefined
                },
                [`& .${tablePaginationClasses.selectLabel}`]: {
                    display: "none", // Hide select rows per page
                },
                [`& .${tablePaginationClasses.input}`]: {
                    display: "none", // Hide select rows per page
                },
            }}
        />
    );
}

export default TimesCard;