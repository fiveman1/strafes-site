import { Box, darken, Link, Typography, useTheme } from "@mui/material";
import { Game, Style, formatCourse, formatGameShort, formatStyleShort, formatTier } from "shared";
import { ContextParams, getGameColor, getStyleColor } from "../../common/common";
import { Link as RouterLink, useOutletContext } from "react-router";
import { getMapTierColor, UNRELEASED_MAP_COLOR } from "../../common/colors";
import MapThumb from "./MapThumb";

export const MAP_THUMB_SIZE = 50;

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
    const tierColor = getMapTierColor(tier);
    const gameColor = getGameColor(game, theme);
    const styleColor = getStyleColor(style, theme);
    
    return (
        <Link to={{pathname: `/maps/${id}`, search: `?style=${style}&game=${game}&course=${course}`}} 
            component={RouterLink} 
            underline="none" 
            fontWeight="bold" 
            display="inline-flex"
            maxWidth="100%"
            height="100%"
            alignItems="center"
            sx={{
                textDecoration: "none",
                ":hover": {
                    "& .map-name": {
                        textDecoration: "underline"
                    }
                }
            }}
        >
            <Box display="inline-flex" flexDirection="row" alignItems="center" height="100%" maxWidth="100%">
                <MapThumb size={MAP_THUMB_SIZE} map={mapInfo} />
                <Box display="inline-flex" marginLeft="10px" flexDirection="column" maxWidth="100%" minWidth={0} height="calc(100% - 8px)" justifyContent="space-evenly">
                    <Typography 
                        className="map-name"
                        lineHeight="normal"
                        variant="inherit"
                        fontWeight="bold"
                        color={isUnreleased ? UNRELEASED_MAP_COLOR : undefined} 
                        overflow="hidden" 
                        textOverflow="ellipsis" 
                        whiteSpace="nowrap"
                    >
                        {name}
                    </Typography>
                    {showCourse ? 
                    <Typography
                        lineHeight="normal"
                        variant="caption"
                        fontWeight="normal"
                        color="textPrimary"
                        overflow="hidden" 
                        textOverflow="ellipsis" 
                        whiteSpace="nowrap"
                    >
                        {formatCourse(course)}
                    </Typography>
                    : <></>}
                    <Box lineHeight="normal" display="inline-flex" alignItems="center">
                        <Typography 
                            lineHeight={1.0}
                            variant="caption" 
                            fontWeight="bold" 
                            sx={{
                                padding: 0.3,
                                backgroundColor: darken(tierColor, 0.4),
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px",
                                border: 1,
                                borderColor: tierColor
                            }}
                        >
                            {formatTier(tier, showGame || showStyle)}
                        </Typography>
                        {showGame &&
                        <Typography
                            lineHeight={1.0}
                            fontWeight="bold" 
                            variant="caption"
                            ml={0.5}
                            sx={{
                                padding: 0.3,
                                overflow: "hidden",
                                backgroundColor: gameColor,
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px",
                                border: 1,
                                borderColor: gameColor
                            }}
                        >
                            {formatGameShort(game)}
                        </Typography>}
                        {showStyle &&
                        <Typography
                            lineHeight={1.0}
                            fontWeight="bold" 
                            variant="caption"
                            ml={0.5}
                            sx={{
                                padding: 0.3,
                                overflow: "hidden",
                                backgroundColor: styleColor,
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px",
                                border: 1,
                                borderColor: styleColor
                            }}
                        >
                            {formatStyleShort(style)}
                        </Typography>}
                    </Box>
                </Box>
            </Box>
        </Link>
    );
}

export default MapLink;