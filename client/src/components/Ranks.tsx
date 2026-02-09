import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, Link, Paper, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { Game, Rank, RankSortBy, Style, formatRank, formatSkill } from "shared";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridPaginationModel } from "@mui/x-data-grid";
import { RANK_HELP_TEXT, SKILL_HELP_TEXT } from "../util/common";
import { getRanks } from "../api/api";
import { yellow } from "@mui/material/colors";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { makeUserColumn } from "../util/columns";
import { numDigits } from "../util/utils";
import { useGameStyle } from "../util/states";
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

function makeColumns(placementWidth: number) {
    const cols: GridColDef[] = [];

    cols.push({
        type: "number",
        field: "placement",
        headerName: "#",
        width: placementWidth,
        sortable: false,
        valueFormatter: (value) => value
    });
    
    cols.push(makeUserColumn<Rank>(270));

    cols.push({
        type: "number",
        field: "mainWrs",
        renderHeader: () => (
            <Tooltip title="World Records" >
                <EmojiEventsIcon htmlColor={yellow[800]} sx={{marginRight: "4px"}} />
            </Tooltip>
        ),
        align: "center",
        headerAlign: "center",
        width: 64,
        sortable: false,
        renderCell: (params) => <Typography variant="inherit" color={params.value === 0 ? "textSecondary" : undefined}>{params.value}</Typography>
    });

    cols.push({
        type: "string",
        field: "rank",
        renderHeader: () => (
            <Tooltip arrow title={RANK_HELP_TEXT} placement="top-start">
                <Typography variant="inherit" fontWeight={500}>
                    Rank
                    <InfoOutlineIcon sx={{marginLeft: "4px"}} fontSize="inherit" color="secondary" />
                </Typography>
            </Tooltip>
        ),
        flex: 240,
        minWidth: 128, // min width to not cutoff Getting There (7)
        sortingOrder: ["asc"],
        valueFormatter: formatRank
    });

    cols.push({
        type: "string",
        field: "skill",
        renderHeader: () => (
            <Tooltip arrow title={SKILL_HELP_TEXT} placement="top-start">
                <Typography variant="inherit" fontWeight={500}>
                    Skill
                    <InfoOutlineIcon sx={{marginLeft: "4px"}} fontSize="inherit" color="secondary" />
                </Typography>
            </Tooltip>
        ),
        flex: 160,
        minWidth: 101, // min width to not cutoff column header when sorted
        sortingOrder: ["asc"],
        valueFormatter: formatSkill
    });
    
    return cols;
}

interface IRanksCardProps {
    game: Game
    style: Style
}

function RanksCard(props: IRanksCardProps) {
    const { game, style } = props;

    const [rowCount, setRowCount] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [maxPage, setMaxPage] = useState(0);
    const [placementWidth, setPlacementWidth] = useState(50);
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");

    const gridCols = makeColumns(placementWidth);

    useEffect(() => {
        if (numDigits(maxPage) > 3) {
            setPlacementWidth(62);
        }
        else {
            setPlacementWidth(50);
        }
    }, [maxPage]);

    const onPageChange = useCallback((model: GridPaginationModel) => {
        setMaxPage((model.page + 1) * model.pageSize);
    }, []);

    const gridKey = useMemo(() => {
        return `${game},${style}`;
    }, [game, style]);

    const updateRowData = useCallback(async (start: number, end: number, sortBy: RankSortBy) => {
        setIsLoading(true);
        const ranks = await getRanks(start, end, sortBy, game, style);
        setIsLoading(false);

        if (ranks === undefined) {
            return { rows: [], pageInfo: {hasNextPage: false} }
        }
        const hasMore = ranks.length >= (end - start);
        if (!hasMore) {
            setRowCount(start + ranks.length);
        }
        return {
            rows: ranks,
            pageInfo: {hasNextPage: hasMore}
        }
    }, [game, style]);

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const sort = params.sortModel.at(0);
            const sortBy = sort?.field === "skill" ? RankSortBy.SkillAsc : RankSortBy.RankAsc;
            return await updateRowData(+params.start, params.end, sortBy);
        }
    }), [updateRowData]);

    return (
    <Paper elevation={2} sx={{padding: smallScreen ? 1 : 2, display: "flex", flexDirection: "column", "& .ranksGrid": {margin: smallScreen ? 0.25 : 0}}}>
        <Box marginBottom={smallScreen ? -0.25 : 1} padding={smallScreen ? 1 : 0} display="flex">
            <Typography variant="caption">
                Ranks
            </Typography>
        </Box>
        <DataGrid
            className="ranksGrid"
            columns={gridCols}
            key={gridKey}
            loading={isLoading}
            pagination
            dataSource={dataSource}
            pageSizeOptions={[20]}
            rowCount={rowCount}
            initialState={{
                pagination: { 
                    paginationModel: { pageSize: 20 }
                },
                sorting: {
                    sortModel: [{ field: "rank", sort: "asc" }],
                }
            }}
            disableColumnFilter
            density="compact"
            disableRowSelectionOnClick
            onPaginationModelChange={onPageChange}
        />
    </Paper>
    );
}

function Ranks() {
    const {game, setGame, style, setStyle} = useGameStyle();
    
    useEffect(() => {
        document.title = "ranks - strafes"
    }, []);
    
    return (
    <Box display="flex" flexDirection="column" flexGrow={1}>
        <Breadcrumbs separator={<NavigateNextIcon />} sx={{p: 1}}>
            <Link underline="hover" color="inherit" href="/">
                Home
            </Link>
            <Typography color="textPrimary">
                Ranks
            </Typography>
        </Breadcrumbs>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1} flexGrow={1}>
            <RanksCard game={game} style={style} />
        </Box>
    </Box>
    );
}

export default Ranks;