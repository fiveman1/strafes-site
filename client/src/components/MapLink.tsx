import { Box, Link, Typography, useTheme } from "@mui/material";
import { Game, Style, formatCourse, formatGame, formatGameShort, formatStyle, formatStyleShort } from "shared";
import { ContextParams, getGameColor, getStyleColor } from "../util/common";
import { Link as RouterLink, useOutletContext } from "react-router";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { UNRELEASED_MAP_COLOR } from "../util/colors";

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
    
    let thumb = "";
    if (mapInfo?.smallThumb) {
        thumb = mapInfo.smallThumb;
    }

    const isUnreleased = !mapInfo ? false : new Date() < new Date(mapInfo.date);
    const useShortNames = showGame && showStyle;
    
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
            {
                thumb ? 
                <Box 
                    component="img" 
                    height={MAP_THUMB_SIZE} 
                    width={MAP_THUMB_SIZE} 
                    src={thumb} 
                    alt={name}
                    border={isUnreleased ? 1 : 0}
                    borderColor={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
                    borderRadius="4px"
                />
                : 
                <QuestionMarkIcon htmlColor="white" sx={{ fontSize: MAP_THUMB_SIZE }} />
            }
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
                    {showGame || showStyle ? 
                    <Box lineHeight="normal" display="inline-flex">
                        {showGame &&
                        <Typography
                            lineHeight="normal"
                            fontWeight="bold" 
                            variant="caption"
                            sx={{
                                padding: 0.4,
                                overflow: "hidden",
                                backgroundColor: getGameColor(game, theme),
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px"
                            }}
                        >
                            {useShortNames ? formatGameShort(game) : formatGame(game)}
                        </Typography>}
                        {showStyle &&
                        <Typography
                            lineHeight="normal"
                            fontWeight="bold" 
                            variant="caption"
                            ml={showGame ? 1 : 0}
                            sx={{
                                padding: 0.4,
                                overflow: "hidden",
                                backgroundColor: getStyleColor(style, theme),
                                textAlign: "center",
                                color: "white",
                                textShadow: "black 1px 1px 1px",
                                borderRadius: "6px"
                            }}
                        >
                            {useShortNames ? formatStyleShort(style) : formatStyle(style)}
                        </Typography>}
                    </Box>
                    : <></>}
                </Box>
            </Box>
        </Link>
    );
}

export default MapLink;