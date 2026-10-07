import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";
import { formatGame, formatTier, Map as StrafesMap } from "shared";
import { EASE_OUT, getGameColor } from "../../common/common";
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../../common/colors";
import { shortDateFormat } from "../../common/datetime";
import MapThumb from "../displays/MapThumb";
import ColorChip from "../displays/ColorChip";

interface MapCardProps {
    map: StrafesMap
}

function MapCard(props: MapCardProps) {
    const { map } = props;
    const theme = useTheme();

    const mapDate = new Date(map.date);
    const isUnreleased = new Date() < mapDate;

    return (
        <Box
            component={RouterLink}
            to={`/maps/${map.id}`}
            sx={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                overflow: "hidden",
                color: "text.primary",
                textDecoration: "none",
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: "10px",
                transition: "border-color 150ms ease",

                "&:focus-visible": {
                    outline: 2,
                    outlineColor: "primary.main",
                    outlineOffset: 2
                },
                "@media (hover: hover) and (pointer: fine)": {
                    "&:hover": {
                        borderColor: "text.secondary",
                        "& .mapImg": { transform: "scale(1.04)" }
                    }
                }
            }}>
            <Box
                sx={{
                    display: "grid",
                    placeItems: "center",
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                    bgcolor: "action.hover",
                    borderBottom: 1,
                    borderColor: "divider"
                }}>
                <MapThumb
                    className="mapImg"
                    size={56}
                    map={map}
                    useLargeThumb
                    disableUnreleasedColor
                    sx={map.largeThumb ? {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 0,
                        outline: 0,
                        transition: `transform 300ms ${EASE_OUT}`
                    } : { color: "text.disabled" }}
                />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    p: 1.5
                }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" noWrap title={map.name} sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {map.name}
                    </Typography>
                    <ColorChip color={getMapTierColor(map.tier)} label={formatTier(map.tier)} />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" color="textSecondary" noWrap title={map.creator} sx={{ flexGrow: 1 }}>
                        {map.creator}
                    </Typography>
                    <ColorChip color={getGameColor(map.game, theme)} label={formatGame(map.game)} />
                </Box>
                <Typography variant="caption" noWrap sx={{ color: isUnreleased ? UNRELEASED_MAP_COLOR : "text.secondary" }}>
                    {isUnreleased ? "Releases " : ""}{shortDateFormat.format(mapDate)} · {map.loadCount.toLocaleString()} plays
                </Typography>
            </Box>
        </Box>
    );
}

export default MapCard;
