import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Avatar, Button, darken, Divider, Grid, lighten, LinearProgress, List, ListItem, Paper, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import UserSearch from "./UserSearch";
import UserCard from "./UserCard";
import { Game, Style, Time, User } from "../api/interfaces";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import { getAllTimesForUser, getUserData } from "../api/api";
import percentRound from "percent-round";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { ContextParams, formatDiff, formatTime } from "../util/format";
import { blue, green, grey, pink, purple, red } from "@mui/material/colors";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { PieChart } from "@mui/x-charts";

function getCardHeight(numUsers: number) {
    return CARD_SIZE + ((CARD_SIZE * 0.3) * numUsers) + (numUsers - 1);
}

const TIE_COLOR = blue["A400"];

interface ICompareCardProps {
    firstUser?: User
    firstTimes?: Time[]
    secondUser?: User
    secondTimes?: Time[]
    isLoading: boolean
    userColors: string[]
}

function CompareCard(props: ICompareCardProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, userColors } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined) {
        return (
        <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
            <Typography variant="caption">
                Compare
            </Typography>
            <Box display="flex" alignContent="center" justifyContent="center" padding={2}>
                <Typography variant="h6">
                    Waiting...
                </Typography>
            </Box>
            {isLoading ? <LinearProgress /> : <></>}
        </Paper>
        );
    }

    if (firstUser.id === secondUser.id) {
        return (
        <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
            <Typography variant="caption">
                Compare
            </Typography>
            <Box display="flex" alignContent="center" justifyContent="center" padding={2}>
                <Typography variant="h6">
                    😡
                </Typography>
            </Box>
            {isLoading ? <LinearProgress /> : <></>}
        </Paper>
        );
    }

    const firstUserId = firstUser.id;
    const secondUserId = secondUser.id;
    const mapToTime = new Map<number, Map<string, Time>>();
    for (const time of firstTimes) {
        mapToTime.set(time.mapId, new Map<string, Time>([[firstUserId, time]]));
    }

    for (const time of secondTimes) {
        const map = mapToTime.get(time.mapId);
        if (map) {
            map.set(secondUserId, time);
        }
        else {
            mapToTime.set(time.mapId, new Map<string, Time>([[secondUserId, time]]));
        }
    }

    let firstWins = 0;
    let secondWins = 0;
    let ties = 0;
    let onlyFirst = 0;
    let onlySecond = 0;
    mapToTime.forEach((userToTime) => {
        const firstTime = userToTime.get(firstUserId);
        const secondTime = userToTime.get(secondUserId);
        
        if (firstTime && !secondTime) {
            ++onlyFirst;
            return;
        }
        else if (!firstTime && secondTime) {
            ++onlySecond;
            return;
        }

        const firstMillis = firstTime!.time;
        const secondMillis = secondTime!.time;

        if (firstMillis < secondMillis) {
            ++firstWins;
        }
        else if (secondMillis < firstMillis) {
            ++secondWins;
        }
        else {
            ++ties;
        }
    });

    const numTimes = mapToTime.size;
    let roundedPercents = ["n/a", "n/a", "n/a", "n/a", "n/a"];
    if (numTimes > 0) {
        const percents = [firstWins / numTimes, onlyFirst / numTimes, secondWins / numTimes, onlySecond / numTimes, ties / numTimes];
        roundedPercents = percentRound(percents, 1).map((num) => num.toFixed(1));
    }

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
        <Typography variant="caption">
            Compare
        </Typography>
        
        <PieChart 
            height={smallScreen ? 250 : 300}
            width={smallScreen ? 250 : 300}
            slotProps={{
                legend: {
                    direction: "horizontal"
                }
            }}
            series={[
                { 
                    data: [
                        { id: 0, value: firstWins, label: `${firstUser.username} wins`, color: userColors[0] },
                        { id: 2, value: secondWins, label: `${secondUser.username} wins`, color: userColors[1] },
                        { id: 1, value: onlyFirst, label: `${firstUser.username} exclusive`, color: lighten(userColors[0], 0.5) },
                        { id: 3, value: onlySecond, label: `${secondUser.username} exclusive`, color: lighten(userColors[1], 0.5) },
                        { id: 4, value: ties, label: "Ties", color: TIE_COLOR },
                    ],
                    valueFormatter: (val) => `${val.value} (${roundedPercents[val.id ?? 0]}%)`
                }
            ]}  
        />
        {isLoading ? <LinearProgress /> : <></>}
    </Paper>
    );
}

interface UserToTimes {
    [key: string]: {
        loading: boolean
        times?: Time[]
    } | undefined
}

interface IdToUser {
    [userId: string]: {
        user?: User,
        loading: boolean
    } | undefined
}

function getUserTimesFromState(userToTimes: UserToTimes, userId: string, game: Game, style: Style) {
    return userToTimes[`${userId},${game},${style}`];
}

function Compare() {
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();

    const location = useLocation();
    const navigate = useNavigate();
    
    const queryParams = new URLSearchParams(location.search);

    const [idToUser, setIdToUserState] = useState<IdToUser>({});
    const setIdToUser = (userId: string, loading: boolean, user?: User) => {
        setIdToUserState((idToUser) => {
            let info = idToUser[userId];
            if (!info) {
                info = {loading: loading};
            }
            else {
                info.loading = loading;
            }
            info.user = user;
            idToUser[userId] = info;
            return {...idToUser};
        })
    };

    const [userTimes, setUserTimesState] = useState<UserToTimes>({});
    const setUserTimes = (userId: string, game: Game, style: Style, loading: boolean, times?: Time[]) => {
        setUserTimesState((userToTimes) => {
            let key = `${userId},${game},${style}`
            let info = userToTimes[key];
            if (!info) {
                info = {loading: loading};
            }
            else {
                info.loading = loading;
            }
            info.times = times;
            userToTimes[key] = info;
            return {...userToTimes}
        });
    };
    
    const [firstUserId, setFirstUserId] = useState<string | undefined>(queryParams.get("user1") ?? undefined);
    const [secondUserId, setSecondUserId] = useState<string | undefined>(queryParams.get("user2") ?? undefined);
    const [firstUserText, setFirstUserText] = useState<string>("");
    const [secondUserText, setSecondUserText] = useState<string>("");

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (firstUserId) {
            queryParams.set("user1", firstUserId);
        }
        else {
            queryParams.delete("user1");
        }
        if (secondUserId) {
            queryParams.set("user2", secondUserId);
        }
        else {
            queryParams.delete("user2");
        }
        navigate({ search: queryParams.toString() }, { replace: true });
    }, [firstUserId, secondUserId, location.search, navigate]);

    useEffect(() => {
        const load = async () => {
            if (!firstUserId || getUserTimesFromState(userTimes, firstUserId, game, style)) {
                return;
            }

            setUserTimes(firstUserId, game, style, true);
            const timesPromise = getAllTimesForUser(firstUserId, game, style);

            if (!idToUser[firstUserId]) {
                setIdToUser(firstUserId, true);
                const user = await getUserData(firstUserId);
                setIdToUser(firstUserId, false, user);
            }
            
            const times = await timesPromise;
            setUserTimes(firstUserId, game, style, false, times);
        };
        load();
    }, [firstUserId, game, idToUser, style, userTimes]);

    useEffect(() => {
        const load = async () => {
            if (!secondUserId || getUserTimesFromState(userTimes, secondUserId, game, style)) {
                return;
            }
            
            setUserTimes(secondUserId, game, style, true);
            const timesPromise = getAllTimesForUser(secondUserId, game, style);

            if (!idToUser[secondUserId]) {
                setIdToUser(secondUserId, true);
                const user = await getUserData(secondUserId);
                setIdToUser(secondUserId, false, user);
            }
            
            const times = await timesPromise;
            setUserTimes(secondUserId, game, style, false, times);
        };
        load();
    }, [secondUserId, game, style, userTimes, idToUser]);

    
    const {firstUser, firstTimes, secondUser, secondTimes, isLoading, isFirstUserLoading, isSecondUserLoading} = useMemo(() => {
        let firstUser : User | undefined;
        let firstTimes : Time[] | undefined;
        let secondUser : User | undefined;
        let secondTimes : Time[] | undefined;
        let isLoading = false;
        let isFirstUserLoading = false;
        let isSecondUserLoading = false;
        
        if (firstUserId) {
            firstUser = idToUser[firstUserId]?.user;
            isFirstUserLoading = idToUser[firstUserId]?.loading ?? false;

            const info = getUserTimesFromState(userTimes, firstUserId, game, style);
            firstTimes = info?.times;
            if (info?.loading) {
                isLoading = true;
            }
        }
        
        if (secondUserId) {
            secondUser = idToUser[secondUserId]?.user;
            isSecondUserLoading = idToUser[secondUserId]?.loading ?? false;

            const info = getUserTimesFromState(userTimes, secondUserId, game, style);
            secondTimes = info?.times;
            if (info?.loading) {
                isLoading = true;
            }
        }

        isLoading = isLoading || isFirstUserLoading || isSecondUserLoading;

        return {firstUser, firstTimes, secondUser, secondTimes, isLoading, isFirstUserLoading, isSecondUserLoading};
    }, [firstUserId, game, idToUser, secondUserId, style, userTimes]);

    useEffect(() => {
        if (!firstUser && !secondUser) {
            document.title = "strafes - compare";
            return;
        }
        
        const firstUserName = firstUser ? `@${firstUser.username}` : "<>";
        const secondUserName = secondUser ? `@${secondUser.username}` : "<>";
        document.title = `strafes - compare - ${firstUserName} vs ${secondUserName}`;
    }, [firstUser, secondUser]);
    
    const onSwap = () => {
        if (!firstUserId || !secondUserId || isLoading) {
            return;
        }
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("user1", secondUserId);
        queryParams.set("user2", firstUserId);
        navigate({ search: queryParams.toString() }, { replace: true });
        setFirstUserId(secondUserId);
        setSecondUserId(firstUserId);
        setFirstUserText(secondUserText);
        setSecondUserText(firstUserText);
    }

    const userColors = [pink["A400"], purple["A700"]];

    return (
    <Box padding={2} display="flex" flexDirection="column" flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Compare
        </Typography>
        <Typography variant="body2" padding={1}>
            Select two users to compare their times against each other head-to-head.
        </Typography>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch setUserId={setFirstUserId} minHeight={185} userText={firstUserText} setUserText={setFirstUserText} noNavigate />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard user={firstUser} loading={isFirstUserLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={1} display="flex" justifyContent="center">
            <Button variant="outlined" size="large" sx={{width: "160px"}} disabled={!firstUserId || !secondUserId} loading={isLoading} startIcon={<SwapCallsIcon />} onClick={onSwap}>
                Swap
            </Button>
        </Box>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch setUserId={setSecondUserId} minHeight={185} userText={secondUserText} setUserText={setSecondUserText} noNavigate />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard user={secondUser} loading={isSecondUserLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1}>
            <CompareCard firstUser={firstUser} secondUser={secondUser} firstTimes={firstTimes} secondTimes={secondTimes} isLoading={isLoading} userColors={userColors} />
        </Box>
        <Grid container height={getCardHeight(2) * 2} sx={{scrollbarWidth: "thin"}}>
            <AutoSizer disableHeight>
            {({ width }) => <CompareList 
                                width={width} 
                                firstUser={firstUser} 
                                secondUser={secondUser} 
                                firstTimes={firstTimes} 
                                secondTimes={secondTimes} 
                                isLoading={isLoading}  
                                userColors={userColors}
                            />}
            </AutoSizer>
        </Grid>
    </Box>
    );
}

interface ICompareListProps {
    firstUser?: User
    firstTimes?: Time[]
    secondUser?: User
    secondTimes?: Time[]
    isLoading: boolean
    width: number
    userColors: string[]
}

const CARD_SIZE = 240;

interface CompareTimeInfo {
    map: string
    mapId: number
    mapThumb?: string
    times: CompareTime[]
}

interface CompareTime {
    username: string
    userThumb: string
    userColor: string
    time: string
    date: string
    id: string
}

function CompareList(props: ICompareListProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, width, userColors } = props;

    const { maps } = useOutletContext() as ContextParams;

    const times = useMemo(() => {
        if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined || isLoading || firstUser.id === secondUser.id) {
            return [];
        }
        
        const mapToTime = new Map<number, CompareTimeInfo>();
        for (const time of firstTimes) {
            mapToTime.set(time.mapId, {
                map: time.map,
                mapId: time.mapId,
                mapThumb: maps[time.mapId]?.largeThumb,
                times: [{
                    username: firstUser.username,
                    userThumb: firstUser.thumbUrl,
                    userColor: userColors[0],
                    time: time.time,
                    date: time.date,
                    id: time.id
                }]}
            );
        }

        for (const time of secondTimes) {
            const timeList = mapToTime.get(time.mapId);
            const compareTime: CompareTime = {
                username: secondUser.username,
                userThumb: secondUser.thumbUrl,
                userColor: userColors[1],
                time: time.time,
                date: time.date,
                id: time.id
            };

            if (timeList) {
                timeList.times.push(compareTime);
                timeList.times.sort((time1, time2) => +(time1.time) - +(time2.time))
            }
            else {
                mapToTime.set(time.mapId, {
                    map: time.map,
                    mapId: time.mapId,
                    mapThumb: maps[time.mapId]?.largeThumb,
                    times: [compareTime]
                });
            }
        }
        return Array.from(mapToTime.values()).sort((a, b) => a.map < b.map ? -1 : 1);
    }, [firstTimes, firstUser, isLoading, maps, secondTimes, secondUser, userColors]);

    if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined || isLoading || firstUser.id === secondUser.id) {
        return <></>;
    }
    
    const card_height = CARD_SIZE + ((CARD_SIZE * 0.3) * 2) + 1;
    const itemsPerRow = Math.floor((width - 12) / (CARD_SIZE + 16)) || 1;
    const rowCount = Math.ceil(times.length / itemsPerRow);
    
    return (
        <FixedSizeList 
            style={{scrollbarWidth: "thin"}} height={card_height * 2} width={width} 
            itemCount={rowCount} itemSize={card_height}
            itemData={{itemsPerRow: itemsPerRow, times: times}}
        >
            {CompareRow}
        </FixedSizeList>
    );
}

interface ICompareRowProps {
    data: {itemsPerRow: number, times: CompareTimeInfo[]}
    index: number
    style: CSSProperties
}

function CompareRow(props: ICompareRowProps) {
    const { data, index, style } = props;
    const { itemsPerRow, times } = data;

    const rowTimes: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, times.length);
    
    for (let i = fromIndex; i < toIndex; ++i) {
        rowTimes.push(<CompareListCard key={i} times={times[i]} />);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowTimes}
    </Box>
    );
}

interface ICompareListCardProps {
    times: CompareTimeInfo
}

function CompareListCard(props: ICompareListCardProps) {
    const { times } = props;

    let colors: string[] = []
    if (times.times.length === 2 && times.times[0].time === times.times[1].time) {
        colors = [lighten(TIE_COLOR, 0.6), TIE_COLOR]
    }
    else {
        colors = [lighten(times.times[0].userColor, 0.6), times.times.length === 1 ? lighten(times.times[0].userColor, 0.5) : times.times[0].userColor];
    }

    const otherTimes: React.ReactElement[] = [];
    for (let i = 1; i < times.times.length; ++i) {
        otherTimes.push(
        <Box key={times.times[i].id}>
            <Divider component="li" />
            <ListItem>
                <CompareCardTimeCell time={times.times[i]} diff={+times.times[i].time - +times.times[0].time}/>
            </ListItem>
        </Box>
        );
    }

    return (
        <Box >
            <Box sx={{
                width: CARD_SIZE, 
                height: getCardHeight(2), 
                display: "inline-flex", 
                flexDirection: "column", 
                overflow: "hidden", 
                backgroundImage: `radial-gradient(${colors[0]}, ${colors[1]})`, 
                border: "solid 6px transparent",
                borderRadius: "12px",
                backgroundOrigin: "border-box",
                backgroundClip: "content-box, border-box"
            }}>
                <Box padding={0.5} display="flex" flexDirection="column" height="100%">
                    <Box width={CARD_SIZE - 20} height={CARD_SIZE - 20} >
                    {
                        times.mapThumb ? 
                        <Box width={CARD_SIZE - 20} height={CARD_SIZE - 20} component="img" position="absolute" src={times.mapThumb} alt={times.map} borderRadius="4px 4px 0 0" /> :
                        <QuestionMarkIcon sx={{ fontSize: CARD_SIZE - 20, position: "absolute" }} />
                    }
                        <Box height={CARD_SIZE - 20} width={CARD_SIZE - 20} display="flex" flexDirection="column" >
                            <Box flexGrow={1} />
                            <Typography variant="h5" fontWeight="bold" sx={{ 
                                padding: 1,
                                overflow:"hidden", 
                                textOverflow:"ellipsis", 
                                backdropFilter: "blur(16px)", 
                                textAlign: "center", 
                                color: "white",
                                textShadow: "black 3px 3px 3px" 
                            }}>
                                {times.map}
                            </Typography>
                        </Box>
                    </Box>
                    <Paper square elevation={2} sx={{flexGrow: 1, borderRadius: "0 0 4px 4px"}}>
                        <List>
                            <ListItem key={times.times[0].id}>
                                <CompareCardTimeCell time={times.times[0]} diff={0} />
                            </ListItem>
                            {otherTimes}
                        </List>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

interface ICompareCardTimeCellProps {
    time: CompareTime
    diff: number
}

function CompareCardTimeCell(props: ICompareCardTimeCellProps) {
    const { time, diff } = props;
    const theme = useTheme();

    return (
    <Box height="48px" display="flex" flexDirection="row" width="100%">
        <Tooltip placement="top" title={time.username} arrow>
            <Avatar sx={{bgcolor: grey[100], height: "40px", width: "40px", alignSelf: "center"}} alt={time.username} src={time.userThumb} />
        </Tooltip>
        <Box display="flex" flexDirection="column" alignItems="flex-end" width="100%">
            <Typography variant="body1" fontWeight="bold">
                {formatTime(time.time)}
            </Typography>
            <Box display="flex" flexDirection="row">
                {diff > 0 ? 
                <>
                <Typography fontFamily="monospace" variant="body1" fontWeight="bold" color={red["A400"]} marginRight="4px">
                    +
                </Typography>
                <Typography fontFamily="monospace" variant="body1">
                    {formatDiff(diff)}
                </Typography>
                </> :
                <Typography fontFamily="monospace" variant="body1" fontWeight="bold" color={theme.palette.mode === "dark" ? green["A400"] : darken(green["A400"], 0.15)}>
                    best
                </Typography>
                }
            </Box>
        </Box>
    </Box>
    )
}

export default Compare;