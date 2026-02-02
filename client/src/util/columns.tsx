import { Box, Typography } from "@mui/material";
import { Game, Style, Time, UserRole } from "../api/interfaces";
import { formatCourse, formatGame, formatPlacement, formatStyle } from "../util/format";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { brown, grey, yellow } from "@mui/material/colors";
import UserLink from "../components/UserLink";
import DateDisplay from "../components/DateDisplay";
import TimeDisplay from "../components/TimeDisplay";
import MapLink from "../components/MapLink";


export function makeMapColumn(): GridColDef {
    return {
        type: "string",
        field: "map",
        headerName: "Map",
        flex: 350,
        minWidth: 215,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            const time = params.row;
            return (
                <MapLink id={time.mapId} name={time.map} style={time.style} game={time.game} course={time.course} />
            );
        }
    }
}

interface UserRowInfo {
    userId: string | number
    username: string
    userRole?: UserRole
    userCountry?: string
    game?: Game
    style?: Style
}
export function makeUserColumn<T extends UserRowInfo>(flex: number, noLink?: boolean, game: Game = Game.all, style: Style = Style.all): GridColDef {
    return {
        type: "string",
        field: "username",
        headerName: "User",
        flex: flex,
        minWidth: 160,
        sortable: false,
        renderCell: noLink ? undefined : (params: GridRenderCellParams<T, string>) => {
            const time = params.row;
            const linkGame = time.game !== undefined ? time.game : game;
            const linkStyle = time.style !== undefined ? time.style : style;
            return (
                <UserLink 
                    userId={time.userId} 
                    username={time.username} 
                    userRole={time.userRole} 
                    userCountry={time.userCountry} 
                    game={linkGame} 
                    strafesStyle={linkStyle} 
                    fontWeight="bold" 
                    underline="hover" 
                />
            );
        }
    }
}

export function makeDateColumn(sortable: boolean): GridColDef {
    return {
        type: "string",
        field: "date",
        headerName: "Date",
        flex: 180,
        minWidth: 125,
        sortingOrder: sortable ? ["desc", "asc"] : [],
        sortable: sortable,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            return <DateDisplay date={params.row.date} />
        }
    }
}

export function makePlacementColumn(sortable: boolean): GridColDef {
    return {
        type: "number",
        field: "placement",
        headerName: "Placement",
        width: sortable ? 115 : 100,
        sortable: sortable,
        sortingOrder: sortable ? ["asc", "desc"] : [],
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            const time = params.row;
            const placement = time.placement;
            let iconColor = "";
            switch (placement) {
                case 1:
                    iconColor = yellow[800];
                    break;
                case 2:
                    iconColor = grey[500];
                    break;
                case 3:
                    iconColor = brown[400];
                    break;
            }
            return (
                <Box display="flex" flexDirection="row" alignItems="center">
                    <Box flexGrow={1} display="flex" flexDirection="row" alignItems="center" justifyContent="left">
                    {iconColor ? <EmojiEventsIcon htmlColor={iconColor} sx={{fontSize: "24px", marginLeft: "4px"}} /> : <></>}
                    </Box>
                    <Typography variant="inherit" fontFamily="monospace">
                        {formatPlacement(placement)}
                    </Typography>
                </Box>
            );
        }
    }
}

export function makeTimeColumn(sortable: boolean): GridColDef {
    return {
        type: "string",
        field: "time",
        headerName: "Time",
        flex: 200,
        minWidth: 165,
        sortingOrder: sortable ? ["asc", "desc"] : [],
        sortable: sortable,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            const time = params.row;
            return <TimeDisplay ms={time.time} diff={time.wrDiff} />
        }
    };
}

export function makeGameColumn(): GridColDef {
    return {
        type: "string",
        field: "game",
        headerName: "Game",
        flex: 110,
        minWidth: 75,
        valueFormatter: formatGame,
        sortable: false
    };
}

export function makeStyleColumn(): GridColDef {
    return {
        type: "string",
        field: "style",
        headerName: "Style",
        flex: 150,
        minWidth: 110,
        valueFormatter: formatStyle,
        sortable: false
    }
}

export function makeCourseColumn(): GridColDef {
    return {
        type: "string",
        field: "course",
        headerName: "Course",
        flex: 60,
        minWidth: 90,
        valueFormatter: (val) => formatCourse(val),
        sortable: false
    }
}