import { darken, useTheme } from "@mui/material/styles";
import { getMapTierColor } from "../../common/colors";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTier, MAX_TIER, NO_TIER } from "shared";
import React, { useCallback, useState } from "react";

interface MapTierListItemProps {
    tier: number
    selected: boolean
    readOnly: boolean
    disableHoverHighlight: boolean
    onSelectTier: (tier: number) => void
}

function MapTierListItem(props: MapTierListItemProps) {
    const { tier, selected, readOnly, disableHoverHighlight, onSelectTier } = props;
    const theme = useTheme();

    const [ isHovered, setIsHovered ] = useState(false);

    const isLightMode = theme.palette.mode === "light";
    const emphasized = selected || (!disableHoverHighlight && isHovered)
    const color = tier === NO_TIER ? getMapTierColor(tier) : getMapTierColor(tier, emphasized ? 100 : (isLightMode ? 50 : 30));

    const onClick = useCallback(() => {
        if (readOnly) {
            return;
        }
        setIsHovered(false);
        onSelectTier(tier);
    }, [onSelectTier, readOnly, tier]);

    const onMouseMove = useCallback(() => {
        setIsHovered(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    return (
        <Box 
            component="span"
            p={0.25}
            onClick={onClick}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            sx={{
                transition: "scale 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                cursor: readOnly ? undefined : "pointer",
                ":hover": {
                    scale: readOnly ? undefined : 1.15
                }
            }}
        >
            {tier === NO_TIER ?
            <Typography 
                variant="caption"
                fontWeight="bold" 
                sx={{
                    padding: 0.4,
                    lineHeight: 0.95,
                    overflow: "hidden",
                    backgroundColor: darken(color, 0.4),
                    textAlign: "center",
                    color: "white",
                    textShadow: "black 1px 1px 1px",
                    borderRadius: "6px",
                    border: 1,
                    borderColor: color,
                    userSelect: "none",
                    opacity: emphasized ? undefined : 0.7
                }}
            >
                {formatTier(undefined)}
            </Typography>    
            :
            <Typography 
                variant="button"
                display="flex"
                justifyContent="center"
                sx={{
                    border: 1,
                    borderRadius: "4px",
                    width: 24,
                    height: 24,
                    color: isLightMode ? (emphasized ? "white" : darken(color, 0.1) ) : color,
                    bgcolor: isLightMode ? (emphasized ? darken(color, 0.1) : undefined) : undefined,
                    borderColor: isLightMode ? color : undefined,
                    userSelect: "none"
                }}
            >
                {tier}
            </Typography>}
        </Box>
    );
}

interface MapTierListSelectorProps {
    selectedTiers: number[]
    disabled?: boolean
    readOnly?: boolean
    disableHoverHighlight?: boolean
    showNone?: boolean
    onSelectTier: (tier: number) => void
}

function MapTierListSelector(props: MapTierListSelectorProps) {
    const { selectedTiers, disabled, readOnly, disableHoverHighlight, showNone, onSelectTier } = props;

    const items: React.ReactElement[] = [];
    const interactable = !readOnly && !disabled;

    for (let i = 1; i <= MAX_TIER; ++i) {
        items.push(<MapTierListItem key={i} tier={i} selected={selectedTiers.includes(i)} onSelectTier={onSelectTier} readOnly={!interactable} disableHoverHighlight={!!disableHoverHighlight} />);
    }

    if (showNone) {
        items.push(<MapTierListItem key={NO_TIER} tier={NO_TIER} selected={selectedTiers.includes(NO_TIER)} onSelectTier={onSelectTier} readOnly={!interactable} disableHoverHighlight={!!disableHoverHighlight} />)
    }

    return (
        <Box 
            component="span" 
            display="flex" 
            alignItems="center"
            flexWrap="wrap"
            sx={{
                opacity: disabled ? 0.38 : undefined,
                pointerEvents: interactable ? undefined : "none"
            }}
        >
            {items}
        </Box>
    );
}

export default MapTierListSelector;