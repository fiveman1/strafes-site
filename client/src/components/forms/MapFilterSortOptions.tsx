import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import GameSelector from "./GameSelector";
import Typography from "@mui/material/Typography";
import MapSortSelector from "./MapSortSelector";
import MapTierListSelector from "./MapTierListSelector";
import { Game } from "shared";
import { useCallback, useState } from "react";
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import WarningIcon from '@mui/icons-material/Warning';
import { MapTimesSort } from "../../common/states";

interface MapFilterSortOptionsProps {
    filterGame: Game
    setFilterGame: (game: Game) => void
    selectedTiers: number[]
    onSelectFilterTier: (tier: number) => void
    sort: MapTimesSort
    setSort: (sort: MapTimesSort) => void

}

function MapFilterSortOptions(props: MapFilterSortOptionsProps) {
    const { filterGame, setFilterGame, selectedTiers, onSelectFilterTier, sort, setSort } = props;
    const [ anchorEl, setAnchorEl ] = useState<HTMLButtonElement | null>(null);

    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const open = Boolean(anchorEl);
    const id = open ? "filter-popover" : undefined;

    return (
        <>
            <IconButton aria-describedby={id} size="small" onClick={handleClick}>
                <TuneIcon />
            </IconButton>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "center",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "center",
                    horizontal: "right"
                }}
            >
                <Box display="flex" flexDirection="column" flexWrap="wrap" padding={2}>
                    <Box display="flex" alignItems="center">
                        <FilterAltIcon sx={{ mr: 1 }} />
                        <GameSelector game={filterGame} setGame={setFilterGame} label="Filter game" allowSelectAll disablePadding />
                    </Box>
                    <Box display="flex" alignItems="center" mt={2}>
                        <FilterAltIcon sx={{ mr: 1 }} />
                        <Box width="140px">
                            <Typography variant="caption" color="textSecondary" p={0.25}>
                                Filter tier
                            </Typography>
                            <MapTierListSelector selectedTiers={selectedTiers} onSelectTier={onSelectFilterTier} disableHoverHighlight showNone />
                        </Box>
                        <Box flexGrow={1} />
                        {selectedTiers.length === 0 && <WarningIcon color="warning" />}
                    </Box>
                    <Box display="flex" alignItems="center" mt={3} mr={-1}>
                        <SortIcon sx={{ mr: 1 }} />
                        <MapSortSelector sort={sort} setSort={setSort} />
                    </Box>
                </Box>
            </Popover>
        </>
    );
}

export default MapFilterSortOptions;