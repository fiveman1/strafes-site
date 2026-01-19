import { useState } from "react";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, useMediaQuery } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export type MapTimesSort = "nameAsc" | "nameDesc" | "creatorAsc" | "creatorDesc" | "dateAsc" | "dateDesc" | "countAsc" | "countDesc";
type MapTimesSortRaw = "name" | "creator" | "date" | "count";
const SORTS = ["nameAsc" , "nameDesc" , "creatorAsc" , "creatorDesc" , "dateAsc" , "dateDesc" , "countAsc" , "countDesc"];
function isMapSort(value: string): value is MapTimesSort {
    return SORTS.includes(value);
}

export function useMapSort() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    let paramSort: MapTimesSort = "nameAsc";
    const sortParam = queryParams.get("sort");
    if (sortParam && isMapSort(sortParam)) {
        paramSort = sortParam;
    }
    return useState<MapTimesSort>(paramSort);
}

export interface IMapSortSelectorProps {
    setSort: (sort: MapTimesSort) => void
}

function convertToSort(sortVal: MapTimesSortRaw, isAsc: boolean): MapTimesSort {
    switch (sortVal) {
        case "name":
            return isAsc ? "nameAsc" : "nameDesc";
        case "creator":
            return isAsc ? "creatorAsc" : "creatorDesc";
        case "date":
            return isAsc ? "dateAsc" : "dateDesc";
        case "count":
            return isAsc ? "countAsc" : "countDesc";
    }
}

function translateSort(val: MapTimesSortRaw): string {
    switch (val) {
        case "name":
            return "name";
        case "creator":
            return "creator";
        case "date":
            return "release date";
        case "count":
            return "load count";
    }
}

function MapSortSelector(props: IMapSortSelectorProps) {
    const { setSort } = props;
    
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const location = useLocation();
    const navigate = useNavigate();

    let paramRawSort: MapTimesSortRaw = "name";
    let paramIsAsc = true;
    const queryParams = new URLSearchParams(location.search);
    const sortParam = queryParams.get("sort");
    if (sortParam && isMapSort(sortParam)) {
        switch (sortParam) {
            case "nameAsc":
                paramRawSort = "name";
                paramIsAsc = true;
                break;
            case "nameDesc":
                paramRawSort = "name";
                paramIsAsc = false;
                break;
            case "creatorAsc":
                paramRawSort = "creator";
                paramIsAsc = true;
                break;
            case "creatorDesc":
                paramRawSort = "creator";
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
            case "countAsc":
                paramRawSort = "count";
                paramIsAsc = true;
                break;
            case "countDesc":
                paramRawSort = "count";
                paramIsAsc = false;
                break;
        }
    }
    const [ rawSort, setRawSort ] = useState<MapTimesSortRaw>(paramRawSort);
    const [ isAsc, setIsAsc ] = useState(paramIsAsc);

    const handleChangeSort = (event: SelectChangeEvent<MapTimesSortRaw>) => {
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
        <Box padding={smallScreen ? 1 : 1.5} display="flex" alignItems="center">
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Sort</InputLabel>
                <Select
                    value={rawSort}
                    label="Sort"
                    onChange={handleChangeSort}
                >
                    {(["name", "creator", "date", "count"] as MapTimesSortRaw[]).map((sort) => <MenuItem value={sort}>{translateSort(sort)}</MenuItem>)}
                </Select>
            </FormControl>
            <IconButton color="inherit" onClick={onSwitchAsc} sx={{marginLeft: 1}}> 
                {isAsc ? <ArrowDownwardIcon/> : <ArrowUpwardIcon/>}
            </IconButton>
        </Box>
    );
}

export default MapSortSelector;