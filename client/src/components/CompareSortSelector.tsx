import { useState } from "react";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export type CompareTimesSort = "mapAsc" | "mapDesc" | "dateAsc" | "dateDesc" | "timeAsc" | "timeDesc";
type CompareTimesSortRaw = "map" | "date" | "time";
const SORTS = ["mapAsc" , "mapDesc" , "dateAsc" , "dateDesc" , "timeAsc" ,"timeDesc"];
function isCompareTimesSort(value: string): value is CompareTimesSort {
    return SORTS.includes(value);
}

export function useCompareSort() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramSort: CompareTimesSort = "mapAsc";
    const sortParam = queryParams.get("sort");
    if (sortParam && isCompareTimesSort(sortParam)) {
        paramSort = sortParam;
    }
    return useState<CompareTimesSort>(paramSort);
}

export interface ICompareSortSelectorProps {
    setSort: (sort: CompareTimesSort) => void
}

function convertToSort(sortVal: CompareTimesSortRaw, isAsc: boolean): CompareTimesSort {
    switch (sortVal) {
        case "map":
            return isAsc ? "mapAsc" : "mapDesc";
        case "date":
            return isAsc ? "dateAsc" : "dateDesc";
        case "time":
            return isAsc ? "timeAsc" : "timeDesc";
    }
}

function CompareSortSelector(props: ICompareSortSelectorProps) {
    const { setSort } = props;
    
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();
    const navigate = useNavigate();

    let paramRawSort: CompareTimesSortRaw = "map";
    let paramIsAsc = true;
    const queryParams = new URLSearchParams(location.search);
    const sortParam = queryParams.get("sort");
    if (sortParam && isCompareTimesSort(sortParam)) {
        switch (sortParam) {
            case "mapAsc":
                paramRawSort = "map";
                paramIsAsc = true;
                break;
            case "mapDesc":
                paramRawSort = "map";
                paramIsAsc = false;
                break;
            case "dateAsc":
                paramRawSort = "date";
                paramIsAsc = true;
                break;
            case "dateDesc":
                paramRawSort = "date";
                paramIsAsc = false;
                break;
            case "timeAsc":
                paramRawSort = "time";
                paramIsAsc = true;
                break;
            case "timeDesc":
                paramRawSort = "time";
                paramIsAsc = false;
                break;
        }
    }
    const [ rawSort, setRawSort ] = useState<CompareTimesSortRaw>(paramRawSort);
    const [ isAsc, setIsAsc ] = useState(paramIsAsc);

    const handleChangeSort = (event: SelectChangeEvent<CompareTimesSortRaw>) => {
        const sortVal = convertToSort(event.target.value, isAsc);
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("sort", sortVal);
        navigate({ search: queryParams.toString() }, { replace: true });
        setRawSort(event.target.value);
        setSort(sortVal);
    };

    const onSwitchAsc = () => {
        const newIsAsc = !isAsc;
        const sortVal = convertToSort(rawSort, newIsAsc);
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("sort", sortVal);
        navigate({ search: queryParams.toString() }, { replace: true });
        setIsAsc(newIsAsc);
        setSort(sortVal);
    }

    return (
        <Box padding={smallScreen ? 0.5 : 1.5} display="flex" alignItems="center">
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Sort</InputLabel>
                <Select
                    value={rawSort}
                    label="Sort"
                    onChange={handleChangeSort}
                >
                    {["map", "date", "time"].map((sort) => <MenuItem value={sort}>{sort}</MenuItem>)}
                </Select>
            </FormControl>
            <IconButton color="inherit" onClick={onSwitchAsc} sx={{marginLeft: 1}}> 
                {isAsc ? <ArrowDownwardIcon/> : <ArrowUpwardIcon/>}
            </IconButton>
        </Box>
    );
}

export default CompareSortSelector;