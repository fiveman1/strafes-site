import { Box, Paper, Typography, useMediaQuery } from "@mui/material";
import { Time } from "shared";
import { MAP_THUMB_SIZE } from "./MapLink";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { makeCourseColumn, makeDateColumn, makeMapColumn, makePlacementColumn, makeTimeColumn, makeUserColumn } from "../util/columns";

interface IViewedTimesProps {
    times: Time[]
}

function ViewedTimes(props: IViewedTimesProps) {
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    return (
    <Paper elevation={2} sx={{padding: smallScreen ? 1 : 2, display: "flex", flexDirection: "column", maxHeight: 720, "& .viewedTimesGrid": {margin: smallScreen ? 0.25 : 0}}}>
        <Box marginBottom={smallScreen ? -0.25 : 1} padding={smallScreen ? 1 : 0} display="flex">
            <Typography variant="caption">
                Viewed Times
            </Typography>
        </Box>
        <ViewedTimesGrid {...props} />
    </Paper>
    );
}

function makeColumns() {
    const cols: GridColDef[] = [];

    cols.push(makeMapColumn(true, true));

    cols.push(makeCourseColumn());

    cols.push(makeUserColumn<Time>(300, true));

    cols.push(makePlacementColumn(true));

    cols.push(makeTimeColumn());

    cols.push(makeDateColumn());
    
    return cols;
}

function ViewedTimesGrid(props: IViewedTimesProps) {
    const { times } = props;

    return (
    <DataGrid
        className="viewedTimesGrid"
        columns={makeColumns()}
        rows={times}
        pagination
        pageSizeOptions={[25, 50, 100]}
        rowHeight={Math.round(MAP_THUMB_SIZE * 1.6667)}
        initialState={{
            pagination: { 
                paginationModel: { pageSize: 25 },
            },
            sorting: {
                sortModel: [{ field: "placement", sort: "asc" }]
            }
        }}
        density="compact"
        disableColumnFilter
        disableRowSelectionOnClick
    />
    );
}

export default ViewedTimes;