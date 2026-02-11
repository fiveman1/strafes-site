import { useMemo } from "react";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { MapTimesSort, MapTimesSortRaw } from "../util/states";

interface IMapSortSelectorProps {
    sort: MapTimesSort
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
            return "popularity";
    }
}

function MapSortSelector(props: IMapSortSelectorProps) {
    const { sort, setSort } = props;
    
    // const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const rawSort: MapTimesSortRaw = useMemo(() => {
        switch (sort) {
            case "nameAsc":
            case "nameDesc":
                return "name"
            case "creatorAsc":
            case "creatorDesc":
                return "creator";
            case "dateAsc":
            case "dateDesc":
                return "date";
            case "countAsc":
            case "countDesc":
                return "count";
        }
    }, [sort]);

    const isAsc: boolean = useMemo(() => {
        switch (sort) {
            case "nameAsc":
            case "creatorAsc":
            case "dateAsc":
            case "countAsc":
                return true;
            default:
                return false
        }
    }, [sort]);

    const handleChangeSort = (event: SelectChangeEvent<MapTimesSortRaw>) => {
        const sortVal = convertToSort(event.target.value, isAsc);
        setSort(sortVal);
    };

    const onSwitchAsc = () => {
        const newIsAsc = !isAsc;
        const sortVal = convertToSort(rawSort, newIsAsc);
        setSort(sortVal);
    };

    return (
        <Box display="flex" alignItems="center">
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