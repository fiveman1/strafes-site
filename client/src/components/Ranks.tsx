import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Paper, Typography } from "@mui/material";
import { Game, RankSortBy, Style } from "../api/interfaces";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse } from "@mui/x-data-grid";
import { formatRank, formatSkill } from "../util/format";
import { getRanks } from "../api/api";
import AutoSizer from "react-virtualized-auto-sizer";
import { makeUserColumn } from "./TimesCard";
import { yellow } from "@mui/material/colors";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

function makeColumns() {
    const cols: GridColDef[] = [];

    cols.push({
        type: "number",
        field: "placement",
        headerName: "#",
        width: 64,
        sortable: false
    });
    
    cols.push(makeUserColumn(240));

    cols.push({
        type: "number",
        field: "mainWrs",
        renderHeader: (params) => <EmojiEventsIcon htmlColor={yellow[800]} sx={{marginRight: "4px"}} />,
        align: "center",
        headerAlign: "center",
        width: 64,
        sortable: false,
        renderCell: (params) => <Typography variant="inherit" color={params.value === 0 ? "textSecondary" : undefined}>{params.value}</Typography>
    });

    cols.push({
        type: "string",
        field: "rank",
        headerName: "Rank",
        flex: 240,
        minWidth: 128, // min width to not cutoff Getting There (7)
        sortingOrder: ["asc"],
        valueFormatter: formatRank
    });

    cols.push({
        type: "string",
        field: "skill",
        headerName: "Skill",
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
    height: number
}

function RanksCard(props: IRanksCardProps) {
    const { game, style, height } = props;

    const [rowCount, setRowCount] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    const gridCols = makeColumns();

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
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", maxHeight: height }}>
        <Typography variant="caption" marginBottom={1}>
            Ranks
        </Typography>
        <DataGrid
            columns={gridCols}
            key={gridKey}
            loading={isLoading}
            pagination
            dataSource={dataSource}
            pageSizeOptions={[10, 25, 50]}
            rowCount={rowCount}
            initialState={{
                pagination: { 
                    paginationModel: { pageSize: 25 }
                },
                sorting: {
                    sortModel: [{ field: "rank", sort: "asc" }],
                }
            }}
            disableColumnFilter
            density="compact"
        />
    </Paper>
    );
}

function Ranks() {
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();
    
    useEffect(() => {
        document.title = "ranks - strafes"
    }, []);
    
    return (
    <Box padding={2} display="flex" flexDirection="column" flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Ranks
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1} flexGrow={1} minHeight={550}>
            <AutoSizer disableWidth>
                {({ height }) => <RanksCard game={game} style={style} height={height} />}
            </AutoSizer>
        </Box>
    </Box>
    );
}

export default Ranks;