import { Box, Link, Typography } from "@mui/material";
import { Game, Style } from "../api/interfaces";
import { ContextParams } from "../util/format";
import { Link as RouterLink, useOutletContext } from "react-router";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

export const MAP_THUMB_SIZE = 50;

interface IMapLinkProps {
    id: number
    name: string
    style: Style
    game: Game
}

function MapLink(props: IMapLinkProps) {
    const { id, name, style, game } = props;
    const { maps } = useOutletContext() as ContextParams;
    const mapInfo = maps[id];
    
    let thumb = "";
    if (mapInfo?.smallThumb) {
        thumb = mapInfo.smallThumb;
    }
    
    return (
        <Link to={{pathname: `/maps/${id}`, search: `?style=${style}&game=${game}`}} 
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
                />
                : 
                <QuestionMarkIcon htmlColor="white" sx={{ fontSize: MAP_THUMB_SIZE, marginRight: "10px" }} />
            }
                <Typography variant="inherit" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                    {name}
                </Typography>
            </Box>
        </Link>
    );
}

export default MapLink;