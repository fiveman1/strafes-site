import { Box, Pagination, Paper, Typography, useMediaQuery } from "@mui/material";
import CompareSortSelector from "../forms/CompareSortSelector";
import CompareMapCard from "./CompareMapCard";
import { CompareTimeInfo, diffSortVal, getMostRecentDate, ITEMS_PER_PAGE, shouldIncludeTimes } from "./types";
import { CompareTimesSort, useCompareSort, useComparePage } from "../../common/states";
import { useMemo } from "react";

interface ICompareTimesGridProps {
    allTimes: CompareTimeInfo[]
    numEntries: number
    isLoading: boolean
    selectedSlice?: number
    duplicateWarning?: string
}

function sortTimes(times: CompareTimeInfo[], sort: CompareTimesSort): CompareTimeInfo[] {
    const sorted = [...times];
    switch (sort) {
        case "dateAsc":
            return sorted.sort((a, b) => getMostRecentDate(a) - getMostRecentDate(b));
        case "dateDesc":
            return sorted.sort((a, b) => getMostRecentDate(b) - getMostRecentDate(a));
        case "timeAsc":
            return sorted.sort((a, b) => +a.times[0].time - +b.times[0].time);
        case "timeDesc":
            return sorted.sort((a, b) => +b.times[0].time - +a.times[0].time);
        case "mapAsc":
            return sorted.sort((a, b) => a.map < b.map ? -1 : 1);
        case "mapDesc":
            return sorted.sort((a, b) => a.map > b.map ? -1 : 1);
        case "diffAsc":
            return sorted.sort((a, b) => diffSortVal(a, b, true));
        case "diffDesc":
            return sorted.sort((a, b) => diffSortVal(a, b, false));
        default:
            return sorted;
    }
}

function CompareTimesGrid(props: ICompareTimesGridProps) {
    const { allTimes, numEntries, isLoading, selectedSlice, duplicateWarning } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const [sort, setSort] = useCompareSort();
    const [page, setPage] = useComparePage();

    const filteredAndSorted = useMemo(() => {
        let times = allTimes;
        if (selectedSlice !== undefined) {
            times = times.filter((info) =>
                shouldIncludeTimes(info.times, numEntries, selectedSlice)
            );
        }
        return sortTimes(times, sort);
    }, [allTimes, numEntries, selectedSlice, sort]);

    const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
    const safePage = Math.min(page, Math.max(totalPages, 1));
    const pagedTimes = filteredAndSorted.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    if (duplicateWarning || isLoading || allTimes.length === 0) {
        return null;
    }

    const minCardWidth = smallScreen ? 200 : 320;

    return (
        <Paper elevation={2} sx={{ padding: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="caption">
                Times ({filteredAndSorted.length})
            </Typography>
            <Box display="flex" flexWrap="wrap" alignItems="center">
                <CompareSortSelector sort={sort} setSort={setSort} />
            </Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
                    gap: 2,
                    mt: 1,
                }}
            >
                {pagedTimes.map((info) => (
                    <CompareMapCard key={info.mapId} info={info} />
                ))}
            </Box>
            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                        shape="rounded"
                        count={totalPages}
                        page={safePage}
                        onChange={(_, p) => setPage(p)}
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Paper>
    );
}

export default CompareTimesGrid;
