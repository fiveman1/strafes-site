import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Button, LinearProgress, Paper, Typography } from "@mui/material";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import UserSearch from "./UserSearch";
import UserCard from "./UserCard";
import { Game, Style, Time, User } from "../api/interfaces";
import { useLocation, useNavigate } from "react-router";
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import { getAllTimesForUser, getUserData } from "../api/api";
import UserLink from "./UserLink";
import percentRound from "percent-round";

interface ICompareCardProps {
    firstUser?: User
    firstTimes?: Time[]
    secondUser?: User
    secondTimes?: Time[]
    isLoading: boolean
    game: Game
    style: Style
}

function CompareCard(props: ICompareCardProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, game, style } = props;

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
                <UserLink color="textPrimary" userId={firstUserId} username={firstUser.username} game={game} strafesStyle={style} variant="h6" />
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
                <UserLink color="textPrimary" userId={secondUserId} username={secondUser.username} game={game} strafesStyle={style} variant="h6" />
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
            <CompareCard firstUser={firstUser} secondUser={secondUser} firstTimes={firstTimes} secondTimes={secondTimes} game={game} style={style} isLoading={isLoading} />
        </Box>
    </Box>
    );
}

export default Compare;