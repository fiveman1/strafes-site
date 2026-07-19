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
        <Link
            to={{pathname: `/maps/${id}`, search: `?style=${style}&game=${game}&course=${course}`}}
            component={RouterLink}
            underline="none"
            sx={{
                fontWeight: "bold",
                display: "inline-flex",
                maxWidth: "100%",
                height: "100%",
                alignItems: "center",
                textDecoration: "none",

                "&:hover .map-name": {
                    textDecoration: "underline !important"
                }
            }}>
            <Box
                sx={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    height: "100%",
                    maxWidth: "100%"
                }}>
                <MapThumb size={MAP_THUMB_SIZE} map={mapInfo} />
                <Box
                    sx={{
                        display: "inline-flex",
                        marginLeft: "10px",
                        flexDirection: "column",
                        maxWidth: "100%",
                        minWidth: 0,
                        height: "calc(100% - 8px)",
                        justifyContent: "space-evenly"
                    }}>
                    <Typography
                        className="map-name"
                        variant="inherit"
                        color={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
                        sx={{
                            lineHeight: "normal",
                            fontWeight: "bold",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                        {name}
                    </Typography>
                    {showCourse ? 
                    <Typography
                        variant="caption"
                        color="textPrimary"
                        sx={{
                            lineHeight: "normal",
                            fontWeight: "normal",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}>
                        {formatCourse(course)}
                    </Typography>
                    : <></>}
                    <Box
                        sx={{
                            lineHeight: "normal",
                            display: "inline-flex",
                            alignItems: "center"
                        }}>
                        <Typography
                            variant="caption"
                            sx={{
                                lineHeight: 1.0,
                                fontWeight: "bold",
                                padding: 0.3,
                                backgroundColor: darken(tierColor, 0.4),
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px",
                                border: 1,
                                borderColor: tierColor
                            }}>
                            {formatTier(tier, showGame || showStyle)}
                        </Typography>
                        {showGame &&
                        <Typography
                            variant="caption"
                            sx={{
                                lineHeight: 1.0,
                                fontWeight: "bold",
                                ml: 0.5,
                                padding: 0.3,
                                overflow: "hidden",
                                backgroundColor: gameColor,
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px",
                                border: 1,
                                borderColor: gameColor
                            }}>
                            {formatGameShort(game)}
                        </Typography>}
                        {showStyle &&
                        <Typography
                            variant="caption"
                            sx={{
                                lineHeight: 1.0,
                                fontWeight: "bold",
                                ml: 0.5,
                                padding: 0.3,
                                overflow: "hidden",
                                backgroundColor: styleColor,
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px",
                                border: 1,
                                borderColor: styleColor
                            }}>
                            {formatStyleShort(style)}
                        </Typography>}
                    </Box>
                </Box>
            </Box>
        </Link>
    );
}

export default MapLink;
