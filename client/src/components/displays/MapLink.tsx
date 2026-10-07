import { Box, Link, Typography, useTheme } from "@mui/material";
import { Game, Style, formatCourse, formatGameShort, formatStyleShort, formatTier } from "shared";
import { ContextParams, getGameColor, getStyleColor } from "../../common/common";
import { Link as RouterLink, useOutletContext } from "react-router";
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../../common/colors";
import MapThumb from "./MapThumb";
import ColorChip from "./ColorChip";

export const MAP_THUMB_SIZE = 40;

interface IMapLinkProps {
    id: number
    name: string
    style: Style
    game: Game
    course: number
    showCourse?: boolean
    showGame?: boolean
    showStyle?: boolean
}

function MapLink(props: IMapLinkProps) {
    const { id, name, style, game, course, showCourse, showGame, showStyle } = props;
    const { maps } = useOutletContext() as ContextParams;
    const theme = useTheme();

    const mapInfo = maps[id];

    const isUnreleased = !mapInfo ? false : new Date() < new Date(mapInfo.date);

    const tier = mapInfo?.tier;

    return (
        <Link
            to={{pathname: `/maps/${id}`, search: `?style=${style}&game=${game}&course=${course}`}}
            component={RouterLink}
            underline="none"
            color="textPrimary"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.25,
                maxWidth: "100%",
                height: "100%",

                "&:hover .map-name": {
                    textDecoration: "underline"
                }
            }}>
            <MapThumb size={MAP_THUMB_SIZE} map={mapInfo} sx={{ flexShrink: 0 }} />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    minWidth: 0
                }}>
                <Typography
                    className="map-name"
                    variant="inherit"
                    noWrap
                    sx={{
                        lineHeight: 1.2,
                        fontWeight: 500,
                        textUnderlineOffset: "3px",
                        color: isUnreleased ? UNRELEASED_MAP_COLOR : undefined
                    }}>
                    {name}
                </Typography>
                {showCourse &&
                <Typography variant="caption" color="textSecondary" noWrap sx={{ lineHeight: 1.2 }}>
                    {formatCourse(course)}
                </Typography>}
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <ColorChip color={getMapTierColor(tier)} label={formatTier(tier, showGame || showStyle)} />
                    {showGame && <ColorChip color={getGameColor(game, theme)} label={formatGameShort(game)} />}
                    {showStyle && <ColorChip color={getStyleColor(style, theme)} label={formatStyleShort(style)} />}
                </Box>
            </Box>
        </Link>
    );
}

export default MapLink;
