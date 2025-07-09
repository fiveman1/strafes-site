import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Button, LinearProgress, Paper, Typography } from "@mui/material";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import UserSearch from "./UserSearch";
import UserCard from "./UserCard";
import { Game, Style, Time, User } from "../api/interfaces";
import { useLocation, useNavigate } from "react-router";
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import { getAllTimesForUser } from "../api/api";
import UserLink from "./UserLink";

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
                <Box flexGrow={1} padding={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Wins
                        </Typography>
                        <Typography variant="h6">
                            {firstWins}
                        </Typography>
                    </Box>
                </Box>
                <Box flexGrow={1} padding={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Exclusive
                        </Typography>
                        <Typography variant="h6">
                            {onlyFirst}
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
                <Box flexGrow={1} padding={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Wins
                        </Typography>
                        <Typography variant="h6">
                            {secondWins}
                        </Typography>
                    </Box>
                </Box>
                <Box flexGrow={1} padding={1}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="subtitle1">
                            Exclusive
                        </Typography>
                        <Typography variant="h6">
                            {onlySecond}
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
                        {ties}
                    </Typography>
                </Box>
            </Box>
        </Box>
        {isLoading ? <LinearProgress /> : <></>}
    </Paper>
    );
}

function Compare() {
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();

    const location = useLocation();
    const navigate = useNavigate();
    
    const queryParams = new URLSearchParams(location.search);
    
    const [firstUserId, setFirstUserId] = useState<string | undefined>(queryParams.get("user1") ?? undefined);
    const [firstUser, setFirstUserInfo] = useState<User>();
    const [firstUserLoading, setIsFirstUserLoading] = useState<boolean>(false);

    const [secondUserId, setSecondUserId] = useState<string | undefined>(queryParams.get("user2") ?? undefined);
    const [secondUser, setSecondUserInfo] = useState<User>();
    const [secondUserLoading, setIsSecondUserLoading] = useState<boolean>(false);

    const [firstTimes, setFirstTimes] = useState<Time[]>();
    const [firstTimesLoading, setIsFirstTimesLoading] = useState<boolean>(false);

    const [secondTimes, setSecondTimes] = useState<Time[]>();
    const [secondTimesLoading, setIsSecondTimesLoading] = useState<boolean>(false);

    const [firstUserText, setFirstUserText] = useState<string>("");
    const [secondUserText, setSecondUserText] = useState<string>("");

    useEffect(() => {
        if (!firstUser && !secondUser) {
            document.title = "strafes - compare";
            return;
        }
        
        const firstUserName = firstUser ? `@${firstUser.username}` : "<>";
        const secondUserName = secondUser ? `@${secondUser.username}` : "<>";
        document.title = `strafes - compare - ${firstUserName} vs ${secondUserName}`;
    }, [firstUser, secondUser]);

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
        if (!firstUser) {
            setIsFirstTimesLoading(false);
            setFirstTimes(undefined);
            return;
        }
        setIsFirstTimesLoading(true);
        getAllTimesForUser(firstUser.id, game, style).then((times) => {
            setIsFirstTimesLoading(false);
            if (times === undefined) {
                setFirstTimes(undefined);
                return;
            }
            setFirstTimes(times);
        })
        
    }, [firstUser, game, style]);

    useEffect(() => {
        if (!secondUser) {
            setIsSecondTimesLoading(false);
            setSecondTimes(undefined);
            return;
        }
        setIsSecondTimesLoading(true);
        getAllTimesForUser(secondUser.id, game, style).then((times) => {
            setIsSecondTimesLoading(false);
            if (times === undefined) {
                setSecondTimes(undefined);
                return;
            }
            setSecondTimes(times);
        })
        
    }, [secondUser, game, style]);
    
    const onSwap = () => {
        if (!firstUserId || !secondUserId || firstTimesLoading || secondTimesLoading) {
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
                <UserCard userId={firstUserId} user={firstUser} setUserInfo={setFirstUserInfo} loading={firstUserLoading} setIsLoading={setIsFirstUserLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={1} display="flex" justifyContent="center">
            <Button variant="outlined" size="large" sx={{width: "160px"}} disabled={!firstUserId || !secondUserId} loading={firstTimesLoading || secondTimesLoading} startIcon={<SwapCallsIcon />} onClick={onSwap}>
                Swap
            </Button>
        </Box>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch setUserId={setSecondUserId} minHeight={185} userText={secondUserText} setUserText={setSecondUserText} noNavigate />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard userId={secondUserId} user={secondUser} setUserInfo={setSecondUserInfo} loading={secondUserLoading} setIsLoading={setIsSecondUserLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1}>
            <CompareCard firstUser={firstUser} secondUser={secondUser} firstTimes={firstTimes} secondTimes={secondTimes} game={game} style={style} isLoading={firstTimesLoading || secondTimesLoading} />
        </Box>
    </Box>
    );
}

export default Compare;