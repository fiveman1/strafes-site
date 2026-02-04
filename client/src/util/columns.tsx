import { Box, IconButton, Typography } from "@mui/material";
import { Game, Style, Time, TimeSortBy, UserRole } from "../api/interfaces";
import { formatCourse, formatGame, formatPlacement, formatStyle } from "../util/format";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { brown, grey, yellow } from "@mui/material/colors";
import UserLink from "../components/UserLink";
import DateDisplay from "../components/DateDisplay";
import TimeDisplay from "../components/TimeDisplay";
import MapLink from "../components/MapLink";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TimeDateColumn from "../components/TimeDateColumn";


export function makeMapColumn(isCompact?: boolean): GridColDef {
    return {
        type: "string",
        field: "map",
        headerName: "Map",
        flex: 330,
        minWidth: 185,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            const time = params.row;
            return (
                <MapLink id={time.mapId} name={time.map} style={time.style} game={time.game} course={time.course} includeCourse={isCompact} />
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
        minWidth: 150,
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

export function makePlacementColumn(sortable: boolean, isCompact?: boolean): GridColDef {
    return {
        type: "number",
        field: "placement",
        headerName: isCompact ? "Place" : "Placement",
        width: sortable ? 115 : (isCompact ? 78 : 100),
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

export function makeTimeAndDateColumn(sortable: boolean, sortBy: TimeSortBy): GridColDef {
    const isTimeSort = sortBy === TimeSortBy.TimeAsc || sortBy === TimeSortBy.TimeDesc;
    const isAsc = sortBy === TimeSortBy.TimeAsc || sortBy === TimeSortBy.DateAsc;
    return {
        type: "string",
        field: "time",
        headerAlign: "center",
        renderHeader: () => {
            return (
                <Box display="flex" flexDirection="row" alignItems="center">
                    <Box display="flex" flexDirection="column" alignItems="center" ml="5px">
                        <Typography variant="inherit" fontWeight={500} color={!isTimeSort ? "textSecondary" : undefined}>
                            Time
                        </Typography>
                        <Typography variant="inherit" fontWeight={500} color={isTimeSort ? "textSecondary" : undefined}>
                            Date
                        </Typography>
                    </Box>
                    <IconButton size="small" sx={{height: 28, width: 28, ml: 0.5}}>
                        {isAsc ?
                        <ArrowUpwardIcon fontSize="inherit" />
                        :
                        <ArrowDownwardIcon fontSize="inherit" />}
                    </IconButton>
                </Box>
            );
        },
        flex: 160,
        minWidth: 130,
        sortingOrder: sortable ? ["asc", "desc"] : [],
        sortable: sortable,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            const time = params.row;
            return <TimeDateColumn time={time} />;
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

export function makeGameStyleColumn(): GridColDef {
    return {
        type: "string",
        field: "game",
        renderHeader: () => {
            return (
                <Box display="flex" flexDirection="column">
                    <Typography variant="inherit" fontWeight={500}>
                        Game
                    </Typography>
                    <Typography variant="inherit" fontWeight={500} color="textSecondary">
                        Style
                    </Typography>
                </Box>
            );
        },
        flex: 150,
        minWidth: 110,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Time, string>) => {
            const time = params.row;
            return (
                <Box display="flex" flexDirection="column" height="100%" lineHeight="normal" justifyContent="center">
                    <Typography variant="inherit">
                        {formatGame(time.game)}
                    </Typography>
                    <Typography variant="inherit" color="textSecondary">
                        {formatStyle(time.style)}
                    </Typography>
                </Box>
            );
        }
    };
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