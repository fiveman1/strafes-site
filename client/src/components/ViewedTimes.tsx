import { Box, Paper, Typography } from "@mui/material";
import { Time } from "../api/interfaces";
import { MAP_THUMB_SIZE } from "./MapLink";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { makeCourseColumn, makeDateColumn, makeGameColumn, makeMapColumn, makePlacementColumn, makeStyleColumn, makeTimeColumn, makeUserColumn } from "./TimesCard";

interface IViewedTimesProps {
    times: Time[]
}

function ViewedTimes(props: IViewedTimesProps) {

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column", maxHeight: 720}}>
        <Box marginBottom={1} display="flex">
            <Typography variant="caption" flexGrow={1} marginRight={2}>
                {"Viewed Times"}
            </Typography>
            <Typography color="info" variant="body2" display="inline-block" marginRight="2px">*</Typography>
            <Typography variant="caption">
                = less than 24 hours ago
            </Typography>
        </Box>
        <ViewedTimesGrid {...props} />
    </Paper>
    );
}

function makeColumns() {
    const cols: GridColDef[] = [];

    cols.push(makeMapColumn());

    cols.push(makeCourseColumn());

    cols.push(makeUserColumn(300, true));

    cols.push(makePlacementColumn(true));

    cols.push(makeTimeColumn(true));

    cols.push(makeDateColumn(true));
    
    cols.push(makeGameColumn());
    
    cols.push(makeStyleColumn());
    
    return cols;
}

function ViewedTimesGrid(props: IViewedTimesProps) {
    const { times } = props;

    return (
    <DataGrid
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
    />
    );
}

export default ViewedTimes;