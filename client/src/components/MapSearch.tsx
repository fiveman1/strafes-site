import React, { useCallback, useState } from "react";
import { Autocomplete, AutocompleteChangeReason, autocompleteClasses, AutocompleteHighlightChangeReason, Box, InputAdornment, Popper, styled, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { formatGame, Map as StrafesMap } from "shared";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { UNRELEASED_MAP_COLOR } from "../util/colors";
import { List as VirtualizedList, RowComponentProps, ListImperativeAPI, useListCallbackRef } from "react-window";
import { getGameColor, MapDetailsProps } from "../util/common";

// Virtualization magic adapted from https://mui.com/material-ui/react-autocomplete/

const LISTBOX_PADDING = 8; // px

type ItemData = Array<[React.ReactElement, StrafesMap]>;
interface MyRowComponentProps {
    itemData: ItemData
}

function MapRowComponent(props: RowComponentProps & MyRowComponentProps) {
    const { itemData, index, style } = props;
    const theme = useTheme();

    const dataSet = itemData[index];
    const inlineStyle = {
        ...style,
        top: ((style.top as number) ?? 0) + LISTBOX_PADDING,
    };

    const { ...optionProps } = dataSet[0];

    const mapOption = dataSet[1];
    const thumb = mapOption.smallThumb;
    const isUnreleased = !mapOption ? false : new Date() < new Date(mapOption.date);
    return (
        <Typography
            component="li"
            {...optionProps}
            key={mapOption.id}
            style={inlineStyle}
        >
            {thumb ?
            <Box
                component="img"
                height={70}
                width={70}
                src={thumb}
                alt={mapOption.name}
                border={isUnreleased ? 1 : 0}
                borderColor={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
                borderRadius="5px"
                sx={{aspectRatio: 1}} // Makes sure browser reserves the right amount of space while image still loading
            />
            :
            <QuestionMarkIcon htmlColor={isUnreleased ? UNRELEASED_MAP_COLOR : "textPrimary"} sx={{ fontSize: 70 }} />}
            <Box ml={1.75} overflow="hidden" display="inline-flex" flexDirection="column" whiteSpace="nowrap" width="100%">
                <Box display="inline-flex" alignItems="center" justifyContent="center" width="100%">
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
                        ml={1}
                        variant="caption"
                        fontWeight="bold" 
                        lineHeight={1.2}
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
                <Typography variant="body1" overflow="hidden" color="textSecondary" display="inline-block" textOverflow="ellipsis">
                    {mapOption.creator}
                </Typography>
            </Box>
        </Typography>
    );
}

interface ListboxComponentProps {
    setListRef: React.Dispatch<React.SetStateAction<ListImperativeAPI | null>>
}

// Adapter for react-window v2
const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement> & ListboxComponentProps> (
function ListboxComponent(props, ref) {
    const { children, setListRef, ...other } = props;
    const itemData: ItemData = [];
    const smallScreen = useMediaQuery("@media screen and (max-height: 1000px)");

    (children as ItemData).forEach((item) => {
        itemData.push(item);
        if ('children' in item && Array.isArray(item.children)) {
            itemData.push(...item.children);
        }
    });

    const itemCount = itemData.length;
    const itemSize = 80;
    const rowCount = smallScreen ? 6 : 8;

    // Separate className for List, other props for wrapper div (ARIA, handlers)
    const { className, ...otherProps } = other;
    delete otherProps.style;

    return (
        <div ref={ref} {...otherProps}>
            <VirtualizedList
                listRef={setListRef}
                className={className}
                key={itemCount}
                rowCount={itemCount}
                rowHeight={itemSize}
                rowComponent={MapRowComponent}
                rowProps={{ itemData }}
                style={{
                    height: (itemSize * Math.min(itemCount, rowCount)) + 2 * LISTBOX_PADDING,
                    width: "100%",
                }}
                overscanCount={5}
                tagName="ul"
            />
        </div>
    );
});

const StyledPopper = styled(Popper)({
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: "border-box",
        "& ul": {
            padding: 0,
            margin: 0,
        },
    },
});

interface MapSearchProps extends MapDetailsProps {
    maps: StrafesMap[]
}

function MapSearch(props: MapSearchProps) {
    const { maps, selectedMap, setSelectedMap } = props;
    
    const [ open, setOpen ] = useState(false);
    const [ listRef, setListRef ] = useListCallbackRef(null);
    const [ inputValue, setIntputValue ] = useState("");

    const filterOptions = useCallback((options: StrafesMap[], inputValue: string): StrafesMap[] => {
        const filteredMaps: StrafesMap[] = [];
        const alreadyFilteredMaps = new Set<number>();
        const search = inputValue.toLowerCase();

        // Selected map first if no input
        if (search === "" && selectedMap) {
            filteredMaps.push(selectedMap);
            alreadyFilteredMaps.add(selectedMap.id);
        }

        // Exact map name matches
        for (const map of options) {
            if (!alreadyFilteredMaps.has(map.id) && map.name.toLowerCase().startsWith(search)) {
                filteredMaps.push(map);
                alreadyFilteredMaps.add(map.id);
            }
        }

        // Near map name matches
        for (const map of options) {
            if (!alreadyFilteredMaps.has(map.id) && map.name.toLowerCase().includes(search)) {
                filteredMaps.push(map);
                alreadyFilteredMaps.add(map.id);
            }
        }

        // Exact creator matches
        for (const map of options) {
            if (!alreadyFilteredMaps.has(map.id) && map.creator.toLowerCase().startsWith(search)) {
                filteredMaps.push(map);
                alreadyFilteredMaps.add(map.id);
            }
        }

        // Near creator matches
        for (const map of options) {
            if (!alreadyFilteredMaps.has(map.id) && map.creator.toLowerCase().includes(search)) {
                filteredMaps.push(map);
                alreadyFilteredMaps.add(map.id);
            }
        }

        return filteredMaps;
    }, [selectedMap]);

    const onSelect = useCallback((map: StrafesMap | undefined, reason: AutocompleteChangeReason) => {
        if (reason === "clear") {
            // Always close the seach when clearing it out
            setOpen(false);
        }

        setSelectedMap(map);
    }, [setSelectedMap]);

    // Scroll to right element when using arrow keys
    const onHighlightChange = useCallback((option: StrafesMap | null, reason: AutocompleteHighlightChangeReason) => {
        if (reason !== "keyboard" || !option || !listRef) {
            return;
        }

        const realInputValue = selectedMap?.name === inputValue ? "" : inputValue;
        const currentOptions = filterOptions(maps, realInputValue);
        const index = currentOptions.findIndex((val) => val.id === option.id);
        if (index >= 0) {
            listRef.scrollToRow({index: index});
        }
    }, [filterOptions, inputValue, listRef, maps, selectedMap?.name]);

    const isUnreleased = !selectedMap ? false : new Date() < new Date(selectedMap.date);
    const adornmentSize = 40;

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
        filterOptions={(options, state) => filterOptions(options, state.inputValue)}
        onChange={(e, v, r) => onSelect(v ?? undefined, r)}
        onInputChange={(e, v) => setIntputValue(v)}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onHighlightChange={(e, opt, reason) => onHighlightChange(opt, reason)}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        options={maps}
        autoComplete
        autoHighlight
        blurOnSelect
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
                            selectedMap ?
                            <InputAdornment position="start" sx={{display: "flex", justifyContent: "center", mr: 0.75, width: `${adornmentSize}px`}}>
                                {selectedMap.smallThumb ?
                                <Box
                                    component="img"
                                    height={adornmentSize}
                                    width={adornmentSize}
                                    src={selectedMap.smallThumb}
                                    alt={selectedMap.name}
                                    border={isUnreleased ? 1 : 0}
                                    borderColor={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
                                    borderRadius="5px"
                                />
                                :
                                <QuestionMarkIcon htmlColor={isUnreleased ? UNRELEASED_MAP_COLOR : "textPrimary"} sx={{ fontSize: adornmentSize }} />}
                            </InputAdornment> : undefined
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
                setListRef: setListRef
            // It is pretty much impossible to get MUI to accept a type that includes listRef, so we're going to cheat.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        }}
        getOptionLabel={(option) => option.name}
    />
    );
}

export default MapSearch;