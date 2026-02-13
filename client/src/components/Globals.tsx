import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, Link, Paper, Typography } from "@mui/material";
import TimesCard from "./cards/grids/TimesCard";
import { LeaderboardCount, LeaderboardSortBy, TimeSortBy, ALL_COURSES, MAIN_COURSE } from "shared";
import GameSelector from "./forms/GameSelector";
import StyleSelector from "./forms/StyleSelector";
import IncludeBonusCheckbox from "./forms/IncludeBonusCheckbox";
import { Game, Style } from "shared";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridRenderCellParams } from "@mui/x-data-grid";
import { yellow } from "@mui/material/colors";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getLeaderboardPage } from "../api/api";
import DateDisplay from "./displays/DateDisplay";
import { makeUserColumn } from "./cards/grids/util/columns";
import { useGameStyle, useIncludeBonuses } from "../common/states";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NumberGridPagination from "./cards/grids/NumberGridPagination";

function Globals() {
    const {game, setGame, style, setStyle} = useGameStyle(undefined, true);

    const [includeBonuses, setIncludeBonuses] = useIncludeBonuses();

    useEffect(() => {
        document.title = "globals - strafes"
    }, []);

    return (
    <Box flexGrow={1} display="flex" flexDirection="column">
        <Breadcrumbs separator={<NavigateNextIcon />} sx={{p: 1}}>
            <Link underline="hover" color="inherit" href="/">
                Home
            </Link>
            <Typography color="textPrimary">
                Globals
            </Typography>
        </Breadcrumbs>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} allowSelectAll />
            <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
            <IncludeBonusCheckbox includeBonuses={includeBonuses} setIncludeBonuses={setIncludeBonuses} />
        </Box>
        <Box padding={1} flexGrow={1}>
            <TimesCard 
                title="World Records" 
                defaultSort={TimeSortBy.DateDesc} 
                game={game} 
                style={style} 
                course={includeBonuses ? ALL_COURSES : MAIN_COURSE} 
                onlyWRs 
                allowOnlyWRs 
            />
        </Box>
        <Box padding={1} flexGrow={1}>
            <LeaderboardCard game={game} style={style} />
        </Box>
    </Box>
    );
}

function makeColumns(game: Game, style: Style) {
    const cols: GridColDef[] = [];

    cols.push(makeUserColumn<LeaderboardCount>(60, false, game, style))

    cols.push({
        type: "number",
        field: "count",
        renderHeader: () => <><EmojiEventsIcon htmlColor={yellow[800]} sx={{marginRight: "6px"}} /><Typography variant="inherit" fontWeight="bold">Main</Typography></>,
        flex: 20,
        minWidth: 110,
        sortingOrder: ["desc", "asc"],
        renderCell: (params) => <Typography variant="inherit" color={params.value === 0 ? "textSecondary" : undefined}>{params.value}</Typography>
    });

    cols.push({
        type: "number",
        field: "bonusCount",
        renderHeader: () => <><EmojiEventsIcon htmlColor={yellow[800]} sx={{marginRight: "6px"}} /><Typography variant="inherit" fontWeight="bold">Bonus</Typography></>,
        flex: 20,
        minWidth: 95,
        sortable: false,
        renderCell: (params) => <Typography variant="inherit" color={params.value === 0 ? "textSecondary" : undefined}>{params.value}</Typography>
    });

    cols.push({
        type: "string",
        field: "earliestDate",
        headerName: "Earliest WR",
        flex: 20,
        minWidth: 125,
        sortable: false,
        renderCell: (params: GridRenderCellParams<LeaderboardCount, string>) => {
            return <DateDisplay date={params.row.earliestDate} />
        }
    });

    cols.push({
        type: "string",
        field: "latestDate",
        headerName: "Latest WR",
        flex: 20,
        minWidth: 125,
        sortable: false,
        renderCell: (params: GridRenderCellParams<LeaderboardCount, string>) => {
            return <DateDisplay date={params.row.latestDate} />
        }
    });
    
    return cols;
}

interface IRanksCardProps {
    game: Game
    style: Style
}

function LeaderboardCard(props: IRanksCardProps) {
    const { game, style } = props;

    const [rowCount, setRowCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const gridCols = makeColumns(game, style);

    const gridKey = useMemo(() => {
        return `${game},${style}`;
    }, [game, style]);

    const updateRowData = useCallback(async (start: number, end: number, sort: LeaderboardSortBy) => {
        setIsLoading(true);
        const page = await getLeaderboardPage(start, end, game, style, sort);
        setIsLoading(false);

        if (page === undefined) {
            setRowCount(0);
            return { rows: [], rowCount: 0 };
        }

        setRowCount(page.total);
        return {
            rows: page.data,
            rowCount: page.total
        };
    }, [game, style]);

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const sort = params.sortModel.at(0);
            let sortBy = LeaderboardSortBy.MainDesc;
            if (sort) {
                if (sort.field === "count") {
                    sortBy = sort.sort === "asc" ? LeaderboardSortBy.MainAsc : LeaderboardSortBy.MainDesc;
                }
            }
            return await updateRowData(+params.start, params.end, sortBy);
        }
    }), [updateRowData]);

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column" }}>
        <Box marginBottom={1} display="flex">
            <Typography variant="caption" flexGrow={1} marginRight={2}>
                Leaderboards
            </Typography>
        </Box>
        <DataGrid
            columns={gridCols}
            key={gridKey}
            loading={isLoading}
            pagination
            dataSource={dataSource}
            pageSizeOptions={[15]}
            rowCount={rowCount}
            initialState={{
                pagination: { 
                    paginationModel: { pageSize: 15 }
                },
                sorting: {
                    sortModel: [{ field: "count", sort: "desc" }],
                }
            }}
            getRowId={(row) => row.userId}
            disableColumnFilter
            density="compact"
            disableRowSelectionOnClick
            slotProps={{
                basePagination: {
                    material: {
                        ActionsComponent: (props) => <NumberGridPagination rowCount={rowCount} {...props} />
                    }
                }
            }}
        />
    </Paper>
    );
}

export default Globals;