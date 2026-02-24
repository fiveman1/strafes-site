import React, { useCallback, useEffect, useState } from "react";
import { Autocomplete, autocompleteClasses, AutocompleteHighlightChangeReason, Box, darken, FilterOptionsState, InputAdornment, Popper, styled, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { formatGame, formatTier, Map as StrafesMap } from "shared";
import { List as VirtualizedList, RowComponentProps, ListImperativeAPI, useListCallbackRef } from "react-window";
import { getGameColor, MapDetailsProps } from "../../common/common";
import SearchIcon from '@mui/icons-material/Search';
import MapThumb from "../displays/MapThumb";
import { getMapTierColor } from "../../common/colors";
import { filterMapsBySearch } from "../../common/sort";

// Virtualization magic adapted from https://mui.com/material-ui/react-autocomplete/

type ItemData = Array<[React.ReactElement, StrafesMap]>;
interface MyRowComponentProps {
    itemData: ItemData
}

function MapRowComponent(props: RowComponentProps & MyRowComponentProps) {
    const { itemData, index, style } = props;
    const theme = useTheme();

    const dataSet = itemData[index];
    const { ...optionProps } = dataSet[0];
    const mapOption = dataSet[1];

    const tier = mapOption.tier;
    const tierColor = getMapTierColor(tier);

    return (
        <Typography
            component="li"
            {...optionProps}
            key={mapOption.id}
            style={style}
        >
            <MapThumb size={70} map={mapOption} />
            <Box ml={1.75} overflow="hidden" display="inline-flex" flexDirection="column" whiteSpace="nowrap" width="100%">
                <Box display="inline-flex" alignItems="center" justifyContent="center" width="100%" height="32px">
                    <Typography 
                        variant="h6" 
                        overflow="hidden" 
                        color="textPrimary" 
                        display="inline-block" 
                        textOverflow="ellipsis" 
                        flexGrow={1}
                    >
                        {mapOption.name}
                    </Typography>
                    <Typography 
                        variant="caption"
                        fontWeight="bold" 
                        lineHeight={1.2}
                        ml={0.75}
                        sx={{
                            backgroundColor: getGameColor(mapOption.game, theme),
                            textAlign: "center", 
                            color: "white",
                            textShadow: "black 1px 1px 1px",
                            borderRadius: "6px",
                            padding: 0.4
                        }}
                    >
                        {formatGame(mapOption.game)}
                    </Typography>
                </Box>
                <Box display="inline-flex" alignItems="center" justifyContent="center" width="100%" height="24px">
                    <Typography 
                        variant="body2" 
                        overflow="hidden" 
                        color="textSecondary" 
                        display="inline-block" 
                        textOverflow="ellipsis"
                        flexGrow={1}
                    >
                        {mapOption.creator}
                    </Typography>
                    <Typography variant="caption" fontWeight="bold" ml={0.75} sx={{
                        padding: 0.4,
                        lineHeight: 0.95,
                        backgroundColor: darken(tierColor, 0.4),
                        textAlign: "center",
                        color: "white",
                        textShadow: "black 1px 1px 1px",
                        borderRadius: "6px",
                        border: 1,
                        borderColor: tierColor
                    }}>
                        {formatTier(tier, true)}
                    </Typography>
                </Box>
            </Box>
        </Typography>
    );
}

interface ListboxComponentProps {
    setListRef: React.Dispatch<React.SetStateAction<ListImperativeAPI | null>>
    selectedMapId: number | undefined
}

// Adapter for react-window v2
const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement> & ListboxComponentProps> (
function ListboxComponent(props, ref) {
    const { children, setListRef, selectedMapId, ...other } = props;
    const [ listRef, setMyListRef ] = useListCallbackRef();
    const smallScreen = useMediaQuery("@media screen and (max-height: 1000px)");

    const itemData = children as ItemData;

    const selectedIndex = itemData.findIndex((item) => item[1].id === selectedMapId);

    const itemCount = itemData.length;
    const itemSize = 80;
    const rowCount = smallScreen ? 6 : 8;

    // Separate className for List, other props for wrapper div (ARIA, handlers)
    const { className, ...otherProps } = other;
    delete otherProps.style;

    useEffect(() => {
        if (listRef && selectedIndex !== -1) {
            listRef.scrollToRow({index: selectedIndex, align: "start"});
        }
    }, [listRef, selectedIndex]);

    const updateListRef = useCallback((ref: ListImperativeAPI) => {
        setListRef(ref);
        setMyListRef(ref);
    }, [setListRef, setMyListRef]);

    return (
        <div ref={ref} {...otherProps} >
            <VirtualizedList
                listRef={updateListRef}
                className={className}
                key="map-search-list"
                rowCount={itemCount}
                rowHeight={itemSize}
                rowComponent={MapRowComponent}
                rowProps={{ itemData }}
                style={{
                    height: (itemSize * Math.min(itemCount, rowCount)),
                    width: "100%",
                }}
                overscanCount={15}
                tagName="ul"
            />
        </div>
    );
});

const StyledPopper = styled(Popper)({
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: "border-box",
        padding: 0,
        margin: 0
    },
});

interface MapSearchProps extends MapDetailsProps {
    maps: StrafesMap[]
}

const ADORNMENT_SIZE = 40;

function MapSearch(props: MapSearchProps) {
    const { maps, selectedMap, setSelectedMap } = props;
    
    const [ listRef, setListRef ] = useListCallbackRef(null);
    const [ inputValue, setIntputValue ] = useState("");

    const onSelect = useCallback((map: StrafesMap | undefined) => {
        setSelectedMap(map);
    }, [setSelectedMap]);

    // Scroll to right element when using arrow keys
    const onHighlightChange = useCallback((option: StrafesMap | null, reason: AutocompleteHighlightChangeReason) => {
        if (reason !== "keyboard" || !option || !listRef) {
            return;
        }

        const realInputValue = selectedMap?.name === inputValue ? "" : inputValue;
        const currentOptions = filterMapsBySearch(maps, realInputValue);
        const index = currentOptions.findIndex((val) => val.id === option.id);
        if (index !== -1) {
            listRef.scrollToRow({index: index});
        }
    }, [inputValue, listRef, maps, selectedMap?.name]);

    const onFilterOptionsChange = useCallback((options: StrafesMap[], state: FilterOptionsState<StrafesMap>) => {
        return filterMapsBySearch(options, state.inputValue);
    }, []);

    return (
    <Autocomplete
        sx={{
            // Disable the "x" shown by some (Safari and Chrome) browsers for type=search fields, since we already have an "x" button
            "[type=\"search\"]::-webkit-search-decoration": { appearance: "none" },
            "[type=\"search\"]::-webkit-search-cancel-button": { appearance: "none" }
        }}
        fullWidth
        disableListWrap
        inputMode="search"
        value={selectedMap ?? null}
        inputValue={inputValue}
        filterOptions={onFilterOptionsChange}
        onChange={(e, v) => onSelect(v ?? undefined)}
        onInputChange={(e, v) => setIntputValue(v)}
        onHighlightChange={(e, opt, reason) => onHighlightChange(opt, reason)}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        options={maps}
        autoComplete
        autoHighlight
        blurOnSelect
        disableClearable={selectedMap !== undefined}
        renderInput={(params) =>
            <TextField {...params}
                placeholder="Search by name or creator"
                fullWidth
                label=""
                variant="outlined"
                type="search"
                slotProps={{
                    htmlInput: {
                        ...params.inputProps,
                        maxLength: 50
                    },
                    input: { 
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position="start" sx={{display: "flex", justifyContent: "center", mr: 0.75, width: `${ADORNMENT_SIZE}px`}}>
                                {selectedMap ?
                                <MapThumb size={ADORNMENT_SIZE} map={selectedMap} />
                                :  
                                <SearchIcon />}
                            </InputAdornment> 
                        )
                    }
                }}
            />
        }
        renderOption={(props, option) =>
            [props, option] as React.ReactNode
        }
        slots={{
            popper: StyledPopper,
        }}
        slotProps={{
            listbox: {
                component: ListboxComponent,
                setListRef: setListRef,
                selectedMapId: selectedMap?.id
            // It is pretty much impossible to get MUI to accept a type that includes listRef, so we're going to cheat.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        }}
        getOptionLabel={(option) => option.name}
    />
    );
}

export default MapSearch;