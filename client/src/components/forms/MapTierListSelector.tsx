import { alpha, darken, lighten, useTheme } from "@mui/material/styles";
import { getMapTierColor } from "../../common/colors";
import { EASE_OUT } from "../../common/common";
import Box from "@mui/material/Box";
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
    const color = getMapTierColor(tier);

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
            component="button"
            onClick={onClick}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 24,
                height: 24,
                m: 0.25,
                px: tier === NO_TIER ? 0.75 : 0,
                border: 0,
                borderRadius: "6px",
                fontFamily: "inherit",
                fontSize: "0.75rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                userSelect: "none",
                color: emphasized ? (isLightMode ? darken(color, 0.55) : lighten(color, 0.35)) : "text.secondary",
                bgcolor: emphasized ? alpha(color, isLightMode ? 0.25 : 0.2) : "action.hover",
                transition: `transform 150ms ${EASE_OUT}, background-color 150ms ease, color 150ms ease`,
                cursor: readOnly ? undefined : "pointer",
                touchAction: "manipulation",

                "@media (hover: hover) and (pointer: fine)": {
                    "&:hover": {
                        transform: readOnly ? undefined : "scale(1.1)"
                    }
                },

                "&:focus-visible": {
                    outline: 2,
                    outlineColor: "primary.main",
                    outlineOffset: 1
                }
            }}>
            {tier === NO_TIER ? formatTier(undefined) : tier}
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
            sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                opacity: disabled ? 0.38 : undefined,
                pointerEvents: interactable ? undefined : "none"
            }}>
            {items}
        </Box>
    );
}

export default MapTierListSelector;