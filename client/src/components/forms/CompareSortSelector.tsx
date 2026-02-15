import { useState } from "react";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { CompareTimesSort, CompareTimesSortRaw } from "../../common/states";

interface ICompareSortSelectorProps {
    sort: CompareTimesSort
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
        case "diff":
            return isAsc ? "diffAsc" : "diffDesc";
    }
}

function CompareSortSelector(props: ICompareSortSelectorProps) {
    const { sort, setSort } = props;
    
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    let paramRawSort: CompareTimesSortRaw = "diff";
    let paramIsAsc = true;
    switch (sort) {
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
        case "diffAsc":
            paramRawSort = "diff";
            paramIsAsc = true;
            break;
        case "diffDesc":
            paramRawSort = "diff";
            paramIsAsc = false;
            break;
    }
    const [ rawSort, setRawSort ] = useState<CompareTimesSortRaw>(paramRawSort);
    const [ isAsc, setIsAsc ] = useState(paramIsAsc);

    const handleChangeSort = (event: SelectChangeEvent<CompareTimesSortRaw>) => {
        const sortVal = convertToSort(event.target.value, isAsc);
        setRawSort(event.target.value);
        setSort(sortVal);
    };

    const onSwitchAsc = () => {
        const newIsAsc = !isAsc;
        const sortVal = convertToSort(rawSort, newIsAsc);
        setIsAsc(newIsAsc);
        setSort(sortVal);
    };

    return (
        <Box padding={smallScreen ? 0.5 : 1.5} display="flex" alignItems="center">
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Sort</InputLabel>
                <Select
                    value={rawSort}
                    label="Sort"
                    onChange={handleChangeSort}
                >
                    {["diff", "date", "map", "time"].map((sort) => <MenuItem value={sort}>{sort}</MenuItem>)}
                </Select>
            </FormControl>
            <IconButton color="inherit" onClick={onSwitchAsc} sx={{marginLeft: 1}}> 
                {isAsc ? <ArrowDownwardIcon/> : <ArrowUpwardIcon/>}
            </IconButton>
        </Box>
    );
}

export default CompareSortSelector;