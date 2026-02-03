import { Box, Link, Typography } from "@mui/material";
import { Game, Style } from "../api/interfaces";
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
}

function MapLink(props: IMapLinkProps) {
    const { id, name, style, game, course } = props;
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
            underline="hover" 
            fontWeight="bold" 
            display="inline-block"
            maxWidth="100%"
        >
            <Box display="flex" flexDirection="row" alignItems="center">
            {
                thumb ? 
                <Box 
                    component="img" 
                    height={MAP_THUMB_SIZE} 
                    width={MAP_THUMB_SIZE} 
                    src={thumb} 
                    alt={name} 
                    marginRight="10px"
                    border={isUnreleased ? 1 : 0}
                    borderColor={isUnreleased ? UNRELEASED_MAP_COLOR : undefined}
                />
                : 
                <QuestionMarkIcon htmlColor="white" sx={{ fontSize: MAP_THUMB_SIZE, marginRight: "10px" }} />
            }
                <Typography variant="inherit" color={isUnreleased ? UNRELEASED_MAP_COLOR : undefined} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {name}
                </Typography>
            </Box>
        </Link>
    );
}

export default MapLink;