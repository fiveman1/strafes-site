import { Box, Typography } from "@mui/material";
import { Time } from "shared";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { makeCourseColumn, makeDateColumn, makeMapColumn, makePlacementColumn, makeTimeColumn, makeUserColumn } from "./util/columns";
import { MAP_THUMB_SIZE } from "../../displays/MapLink";

interface IViewedTimesProps {
    times: Time[]
}

function ViewedTimes(props: IViewedTimesProps) {
    return (
        <Box sx={{display: "flex", flexDirection: "column"}}>
            <Typography component="h2" variant="subtitle2" sx={{marginBottom: 1}}>
                Viewed Times
            </Typography>
            <ViewedTimesGrid {...props} />
        </Box>
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
        autoHeight
        pagination
        pageSizeOptions={[20, 50]}
        rowHeight={Math.round(MAP_THUMB_SIZE * 1.6667)}
        initialState={{
            pagination: {
                paginationModel: { pageSize: 20 },
            },
            sorting: {
                sortModel: [{ field: "placement", sort: "asc" }]
            }
        }}
        density="compact"
        disableColumnMenu={false}
        disableRowSelectionOnClick
    />
    );
}

export default ViewedTimes;