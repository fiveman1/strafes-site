import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Button, Grid, LinearProgress, Paper, Typography, useTheme } from "@mui/material";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import UserSearch from "./UserSearch";
import UserCard from "./UserCard";
import { Game, Style, Time, User } from "../api/interfaces";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import { getAllTimesForUser, getUserData } from "../api/api";
import UserLink from "./UserLink";
import percentRound from "percent-round";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { ContextParams } from "../util/format";
import { blue, red } from "@mui/material/colors";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

interface ICompareCardProps {
    firstUser?: User
    firstTimes?: Time[]
    secondUser?: User
    secondTimes?: Time[]
    isLoading: boolean
    game: Game
    style: Style
    userColors: string[]
}

function CompareCard(props: ICompareCardProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, game, style, userColors } = props;

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
        <Box maxWidth="600px" alignSelf="center" width="100%">
            <Box textAlign="center">
                <UserLink color={userColors[0]} userId={firstUserId} username={firstUser.username} game={game} strafesStyle={style} variant="h6" />
            </Box>
            <Box display="flex" flexWrap="wrap">
                <Box flexGrow={1} padding={1} flexBasis={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Wins
                        </Typography>
                        <Typography variant="h6" color={firstWins > secondWins ? "success" : undefined}>
                            {firstWins} ({roundedPercents[0]}%)
                        </Typography>
                    </Box>
                </Box>
                <Box flexGrow={1} padding={1} flexBasis={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Exclusive
                        </Typography>
                        <Typography variant="h6">
                            {onlyFirst} ({roundedPercents[1]}%)
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
        <Box maxWidth="600px" alignSelf="center" width="100%">
            <Box textAlign="center">
                <UserLink color={userColors[1]} userId={secondUserId} username={secondUser.username} game={game} strafesStyle={style} variant="h6" />
            </Box>
            <Box display="flex" flexWrap="wrap">
                <Box flexGrow={1} padding={1} flexBasis={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Wins
                        </Typography>
                        <Typography variant="h6" color={firstWins < secondWins ? "success" : undefined}>
                            {secondWins} ({roundedPercents[2]}%)
                        </Typography>
                    </Box>
                </Box>
                <Box flexGrow={1} padding={1} flexBasis={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Exclusive
                        </Typography>
                        <Typography variant="h6">
                            {onlySecond} ({roundedPercents[3]}%)
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
        <Typography variant="h6" textAlign="center">
            Both
        </Typography>
        <Box display="flex" flexWrap="wrap">
            <Box flexGrow={1} padding={1}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography variant="subtitle1">
                        Ties
                    </Typography>
                    <Typography variant="h6">
                        {ties} ({roundedPercents[4]}%)
                    </Typography>
                </Box>
            </Box>
        </Box>
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

    const userColors = [blue[700], red[800]];

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
            <CompareCard firstUser={firstUser} secondUser={secondUser} firstTimes={firstTimes} secondTimes={secondTimes} game={game} style={style} isLoading={isLoading} userColors={userColors} />
        </Box>
        <Grid container height={CARD_SIZE * 4} sx={{scrollbarWidth: "thin"}}>
            <AutoSizer disableHeight>
            {({ width }) => <CompareList 
                                width={width} 
                                firstUser={firstUser} 
                                secondUser={secondUser} 
                                firstTimes={firstTimes} 
                                secondTimes={secondTimes} 
                                game={game} 
                                style={style} 
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
    game: Game
    style: Style
    width: number
    userColors: string[]
}

const CARD_SIZE = 180;

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
}

function CompareList(props: ICompareListProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, game, style, width, userColors } = props;

    const { maps } = useOutletContext() as ContextParams;

    if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined || isLoading || firstUser.id === secondUser.id) {
        return <></>;
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
                date: time.date
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
            date: time.date
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

    const times = Array.from(mapToTime.values());
    const itemsPerRow = Math.floor((width - 12) / (CARD_SIZE + 16)) || 1;
    const rowCount = Math.ceil(times.length / itemsPerRow);
    
    return (
        <FixedSizeList 
            style={{scrollbarWidth: "thin"}} height={CARD_SIZE * 4} width={width} 
            itemCount={rowCount} itemSize={CARD_SIZE * 2}
            itemData={{itemsPerRow: itemsPerRow, times: times, strafesStyle: style, game: game}}
        >
            {CompareRow}
        </FixedSizeList>
    );
}

interface ICompareRowProps {
    data: {itemsPerRow: number, times: CompareTimeInfo[], strafesStyle: Style, game: Game}
    index: number
    style: CSSProperties
}

function CompareRow(props: ICompareRowProps) {
    const { data, index, style } = props;
    const { itemsPerRow, times, strafesStyle, game } = data;

    const rowTimes: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, times.length);
    
    for (let i = fromIndex; i < toIndex; ++i) {
        rowTimes.push(<CompareListCard key={i} times={times[i]} style={strafesStyle} game={game} />);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowTimes}
    </Box>
    );
}

interface ICompareListCardProps {
    times: CompareTimeInfo
    style: Style
    game: Game
}

function CompareListCard(props: ICompareListCardProps) {
    const {times, style, game} = props;
    const theme = useTheme();

    const colors: string[] = [times.times[0].userColor];
    if (times.times.length > 1) {
        colors.push(times.times[1].userColor)
    }
    else {
        colors.push(times.times[0].userColor)
    }
    return (
        <Box padding="8px">
            <Box sx={{
                width: CARD_SIZE, 
                height: (CARD_SIZE * 2) - 16, 
                display: "inline-flex", 
                flexDirection: "column", 
                overflow: "hidden", 
                backgroundImage: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`, 
                border: "solid 6px transparent",
                borderRadius: "12px",
                backgroundOrigin: "border-box",
                backgroundClip: "content-box, border-box"
            }}>
                <Box padding={0.5} display="flex" flexDirection="column" height="100%">
                    {
                        times.mapThumb ? 
                        <Box width={CARD_SIZE - 20} height={CARD_SIZE - 20} component="img" src={times.mapThumb} alt={times.map} /> :
                        <QuestionMarkIcon sx={{ fontSize: CARD_SIZE - 20 }} />
                    }
                    <Paper square elevation={2} sx={{padding: 2, flexGrow: 1}}>
                        <Typography>
                            {times.map}
                        </Typography>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

export default Compare;