import { Box, Link, Typography } from "@mui/material";
import { Game, Style, formatCourse } from "shared";
import { ContextParams } from "../util/format";
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
    includeCourse?: boolean
}

function MapLink(props: IMapLinkProps) {
    const { id, name, style, game, course, includeCourse } = props;
    const { maps } = useOutletContext() as ContextParams;
    const mapInfo = maps[id];
    
    let thumb = "";
    if (mapInfo?.smallThumb) {
        thumb = mapInfo.smallThumb;
    }

    const isUnreleased = !mapInfo ? false : new Date() < new Date(mapInfo.date);
    
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
            <Box display="inline-flex" flexDirection="row" alignItems="center" maxHeight={MAP_THUMB_SIZE} height="100%" maxWidth="100%">
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
                />
                : 
                <QuestionMarkIcon htmlColor="white" sx={{ fontSize: MAP_THUMB_SIZE }} />
            }
                <Box display="inline-flex" marginLeft="10px" flexDirection="column" maxWidth="100%" minWidth={0} >
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
                    {includeCourse ? 
                    <Typography
                        marginTop={0.25}
                        lineHeight="normal"
                        variant="caption"
                        fontWeight="normal"
                        color={"white"} 
                        overflow="hidden" 
                        textOverflow="ellipsis" 
                        whiteSpace="nowrap"
                    >
                        {formatCourse(course)}
                    </Typography>
                : <></>}
                </Box>
            </Box>
        </Link>
    );
}

export default MapLink;