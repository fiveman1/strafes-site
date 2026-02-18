import React from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { formatTier, MAX_TIER } from "shared";

interface TierSelectorProps {
    tier: number
    setTier: (tier: number) => void;
}

function TierSelector(props: TierSelectorProps) {
    const { tier, setTier } = props;

    const handleChangeTier = (event: SelectChangeEvent<number>) => {
        const tier = event.target.value;
        setTier(tier);
    };

    const items: React.ReactElement[] = [
        <MenuItem value={-1}>all</MenuItem>,
        <MenuItem value={0}>{formatTier(undefined)}</MenuItem>
    ];

    for (let i = 1; i <= MAX_TIER; ++i) {
        items.push(<MenuItem value={i}>{formatTier(i)}</MenuItem>);
    }

    return (
        <Box>
            <FormControl sx={{ width: "150px" }}>
                <InputLabel>Filter tier</InputLabel>
                <Select
                    value={tier}
                    label="Filter tier"
                    onChange={handleChangeTier}
                >
                    {items}
                </Select>
            </FormControl>
        </Box>
    );
}

export default TierSelector;