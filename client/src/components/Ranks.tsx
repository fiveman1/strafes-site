import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Paper, Typography } from "@mui/material";
import { Game, Rank, RankSortBy, Style } from "../api/interfaces";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";
import { DataGrid, GridColDef, GridDataSource, GridGetRowsParams, GridGetRowsResponse, GridRenderCellParams } from "@mui/x-data-grid";
import UserLink from "./UserLink";
import { formatRank, formatSkill } from "../util/format";
import { getRanks } from "../api/api";
import AutoSizer from "react-virtualized-auto-sizer";

function makeColumns() {
    const cols: GridColDef[] = [];

    cols.push({
        type: "number",
        field: "placement",
        headerName: "#",
        width: 64,
        sortable: false
    });
    
    cols.push({
        type: "string",
        field: "username",
        headerName: "User",
        flex: 240,
        minWidth: 160,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Rank, string>) => {
            const rank = params.row;
            return (
                <UserLink userId={rank.userId} username={rank.username} />
            );
        }
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

    const dataSource: GridDataSource = useMemo(() => ({
        getRows: async (params: GridGetRowsParams): Promise<GridGetRowsResponse> => {
            const sort = params.sortModel.at(0);
            const sortBy = sort?.field === "skill" ? RankSortBy.SkillAsc : RankSortBy.RankAsc;

            const ranks = await getRanks(params.start, params.end, sortBy, game, style);
            if (ranks === undefined) {
                return { rows: [], pageInfo: {hasNextPage: false} }
            }
            const hasMore = ranks.length >= (params.end - +params.start);
            if (rowCount === -1 && !hasMore) {
                setRowCount(+params.start + ranks.length);
            }
            return {
                rows: ranks,
                pageInfo: {hasNextPage: hasMore}
            }
        }
    }), [game, style, rowCount]);

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", maxHeight: height }}>
        <Typography variant="caption" marginBottom={1}>
            Ranks
        </Typography>
        <DataGrid
            columns={makeColumns()}
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
    const [game, setGame] = useState(Game.bhop);
    const [style, setStyle] = useState(Style.autohop);
    
    useEffect(() => {
        document.title = "strafes - ranks"
    }, []);
    
    return (
    <Box padding={2} display="flex" flexDirection="column" flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Ranks
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} />
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