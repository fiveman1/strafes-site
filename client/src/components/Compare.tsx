import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, Button, darken, Divider, IconButton, lighten, LinearProgress, Link, List, ListItem, Paper, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import GameSelector from "./forms/GameSelector";
import StyleSelector from "./forms/StyleSelector";
import UserSearch from "./search/UserSearch";
import UserCard from "./cards/UserCard";
import { Game, Style, Time, User, formatDiff, formatStyle, formatTime } from "shared";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import SwapCallsIcon from '@mui/icons-material/SwapCalls';
import { getAllTimesForUser, getUserData } from "../api/api";
import percentRound from "percent-round";
import AutoSizer from "react-virtualized-auto-sizer";
import { List as VirtualizedList, RowComponentProps } from "react-window";
import { ContextParams } from "../common/common";
import { blue, green, pink, purple, red } from "@mui/material/colors";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { PieChart, PieSeriesType, PieValueType } from "@mui/x-charts";
import CompareSortSelector from "./forms/CompareSortSelector";
import InfoIcon from '@mui/icons-material/Info';
import DateDisplay from "./displays/DateDisplay";
import { CompareTimesSort, useCompareSort, useGameStyle, useUserSearch } from "../common/states";
import UserAvatar from "./displays/UserAvatar";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const CARD_SIZE = 240;
const TIE_COLOR = blue["A400"];

const enum CompareSlice {
    FirstWins,
    SecondWins,
    OnlyFirst,
    OnlySecond,
    Ties
}

function getCardHeight(numUsers: number) {
    return CARD_SIZE + ((CARD_SIZE * 0.3) * numUsers) + (numUsers - 1);
}

function shouldIncludeTimes(times: CompareTime[], userIds: string[], filterMode: CompareSlice) {
    switch (filterMode) {
        case CompareSlice.FirstWins:
            return times.length > 1 && times[0].userId === userIds[0] && times[0].time !== times[1].time;
        case CompareSlice.SecondWins:
            return times.length > 1 && times[0].userId === userIds[1] && times[0].time !== times[1].time;
        case CompareSlice.OnlyFirst:
            return times.length === 1 && times[0].userId === userIds[0];
        case CompareSlice.OnlySecond:
            return times.length === 1 && times[0].userId === userIds[1];
        case CompareSlice.Ties:
            return times.length > 1 && times[0].time === times[1].time;
        default:
            return true;
    }
}

function diffSortVal(a: CompareTimeInfo, b: CompareTimeInfo, isAsc: boolean): number {
    if (a.times.length === 1 && b.times.length === 1) {
        return a.map < b.map ? -1 : 1;
    }
    else if (a.times.length === 1) {
        return 1;
    }
    else if (b.times.length === 1) {
        return -1;
    }
    const diffA = +a.times[0].time - +a.times[1].time;
    const diffB = +b.times[0].time - +b.times[1].time;
    return isAsc ? diffB - diffA : diffA - diffB;
}

interface ICompareCardProps {
    firstUser?: User
    firstTimes?: Time[]
    secondUser?: User
    secondTimes?: Time[]
    isLoading: boolean
    userColors: string[]
    selectedSlice?: CompareSlice
    setSelectedSlice: (slice?: CompareSlice) => void
}

function CompareCard(props: ICompareCardProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, userColors, selectedSlice, setSelectedSlice } = props;

    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");
    const theme = useTheme();

    const series: PieSeriesType<PieValueType>[] = useMemo(() => {
        if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined || firstUser.userId === secondUser.userId) {
            return [];
        }

        const firstUserId = firstUser.userId;
        const secondUserId = secondUser.userId;
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
            const percents = [0, 0, 0, 0, 0];
            percents[CompareSlice.FirstWins] = firstWins / numTimes;
            percents[CompareSlice.SecondWins] = secondWins / numTimes;
            percents[CompareSlice.OnlyFirst] = onlyFirst / numTimes;
            percents[CompareSlice.OnlySecond] = onlySecond / numTimes;
            percents[CompareSlice.Ties] = ties / numTimes;
            roundedPercents = percentRound(percents, 1).map((num) => num.toFixed(1));
        }

        const sliceColors = [userColors[0], userColors[1], lighten(userColors[0], 0.5), lighten(userColors[1], 0.5), TIE_COLOR];
        if (selectedSlice !== undefined) {
            for (let i = 0; i < sliceColors.length; ++i) {
                if (i !== selectedSlice) {
                    sliceColors[i] = "gray"
                }
            }
        }

        return [{
            type: "pie",
            highlightScope: { fade: "global", highlight: "item" },
            faded: { innerRadius: 30, additionalRadius: -30 },
            id: "data",
            data: [
                { id: CompareSlice.FirstWins, value: firstWins, label: `${firstUser.username} wins`, color: sliceColors[0] },
                { id: CompareSlice.SecondWins, value: secondWins, label: `${secondUser.username} wins`, color: sliceColors[1] },
                { id: CompareSlice.OnlyFirst, value: onlyFirst, label: `${firstUser.username} exclusive`, color: sliceColors[2] },
                { id: CompareSlice.OnlySecond, value: onlySecond, label: `${secondUser.username} exclusive`, color: sliceColors[3] },
                { id: CompareSlice.Ties, value: ties, label: "Ties", color: sliceColors[4] },
            ],
            valueFormatter: (val) => `${val.value} (${roundedPercents[val.id ?? 0]}%)`
        }]
    }, [firstTimes, firstUser, secondTimes, secondUser, selectedSlice, userColors]);

    if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined || firstUser.userId === secondUser.userId) {
        const mainText = firstUser && secondUser && firstUser.userId === secondUser.userId ? "😡" : "Waiting...";
        return (
        <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
            <Typography variant="caption">
                Compare
            </Typography>
            <Box display="flex" alignContent="center" justifyContent="center" padding={2}>
                <Typography variant="h6">
                    {mainText}
                </Typography>
            </Box>
            {isLoading ? <LinearProgress /> : <></>}
        </Paper>
        );
    }

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
        <Box display="flex" flexDirection="row">
            <Typography variant="caption">
                Compare
            </Typography>
            <Typography flexGrow={1} variant="caption" fontStyle="italic" color={theme.palette.text.secondary} textAlign="right">
                Click on a slice to filter
            </Typography>
        </Box>
        <PieChart 
            height={smallScreen ? 250 : 350}
            width={smallScreen ? 250 : 350}
            
            onItemClick={(_event, item) => {
                if (item.dataIndex === selectedSlice) {
                    setSelectedSlice(undefined)
                } 
                else {
                    setSelectedSlice(item.dataIndex)
                }
            }}
            slotProps={{
                legend: {
                    direction: "horizontal"
                },
                
            }}
            series={series}
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
    const {game, setGame, style, setStyle} = useGameStyle();
    const [selectedSlice, setSelectedSlice] = useState<CompareSlice>();

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
            const key = `${userId},${game},${style}`
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
    
    const [firstUserId, setFirstUserId] = useState(queryParams.get("user1") ?? undefined);
    const [secondUserId, setSecondUserId] = useState(queryParams.get("user2") ?? undefined);
    const [firstUserSearch, setFirstUserSearch] = useUserSearch();
    const [secondUserSearch, setSecondUserSearch] = useUserSearch();

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

        // Reset filtered/selected slice when changing data
        setSelectedSlice(undefined);

        return {firstUser, firstTimes, secondUser, secondTimes, isLoading, isFirstUserLoading, isSecondUserLoading};
    }, [firstUserId, game, idToUser, secondUserId, style, userTimes]);

    useEffect(() => {
        if (!firstUser && !secondUser) {
            document.title = "compare - strafes";
            return;
        }
        
        const firstUserName = firstUser ? `@${firstUser.username}` : "<>";
        const secondUserName = secondUser ? `@${secondUser.username}` : "<>";
        document.title = `${firstUserName} vs ${secondUserName} - compare - strafes`;
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
        setFirstUserSearch(secondUserSearch);
        setSecondUserSearch(firstUserSearch);
    }

    const userColors = [pink["A400"], purple["A700"]];

    return (
    <Box display="flex" flexDirection="column" flexGrow={1}>
        <Breadcrumbs separator={<NavigateNextIcon />} sx={{p: 1}}>
            <Link underline="hover" color="inherit" href="/">
                Home
            </Link>
            <Typography color="textPrimary">
                Compare
            </Typography>
        </Breadcrumbs>
        <Box padding={1}>
            <UserSearch 
                setUserId={setFirstUserId} 
                userSearch={firstUserSearch}
                disableNavigate 
            />
        </Box>
        <Box padding={1}>
            <UserCard user={firstUser} loading={isFirstUserLoading} minHeight={160} center />
        </Box>
        <Box padding={1} display="flex" justifyContent="center">
            <Button variant="outlined" size="large" sx={{width: "160px"}} disabled={!firstUserId || !secondUserId} loading={isLoading} startIcon={<SwapCallsIcon />} onClick={onSwap}>
                Swap
            </Button>
        </Box>
        <Box padding={1}>
            <UserSearch 
                setUserId={setSecondUserId}
                userSearch={secondUserSearch}
                disableNavigate 
            />
        </Box>
        <Box padding={1}>
            <UserCard user={secondUser} loading={isSecondUserLoading} minHeight={160} center />
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
        </Box>
        <Box padding={1}>
            <CompareCard 
                firstUser={firstUser} 
                secondUser={secondUser} 
                firstTimes={firstTimes} 
                secondTimes={secondTimes} 
                isLoading={isLoading} 
                userColors={userColors} 
                selectedSlice={selectedSlice}
                setSelectedSlice={setSelectedSlice}
            />
        </Box>
        <Box padding={1}>
            <CompareTimesCard 
                firstUser={firstUser} 
                secondUser={secondUser} 
                firstTimes={firstTimes} 
                secondTimes={secondTimes} 
                isLoading={isLoading}  
                userColors={userColors}
                selectedSlice={selectedSlice}
            />
        </Box>
    </Box>
    );
}

interface ICompareTimesCardProps {
    firstUser?: User
    firstTimes?: Time[]
    secondUser?: User
    secondTimes?: Time[]
    isLoading: boolean
    userColors: string[]
    selectedSlice?: CompareSlice
}

interface ICompareListProps {
    width: number
    sort: CompareTimesSort
    firstUser: User
    firstTimes: Time[]
    secondUser: User
    secondTimes: Time[]
    isLoading: boolean
    userColors: string[]
    selectedSlice?: CompareSlice
}

interface CompareTimeInfo {
    map: string
    mapId: number
    mapThumb?: string
    times: CompareTime[]
}

interface CompareTime {
    username: string
    userId: string
    userThumb?: string
    userColor: string
    time: number
    date: string
    id: string
    style: Style
}

function CompareTimesCard(props: ICompareTimesCardProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, userColors, selectedSlice } = props;

    const [sort, setSort] = useCompareSort();

    if (!firstUser || !secondUser || firstTimes === undefined || secondTimes === undefined || isLoading || firstUser.userId === secondUser.userId) {
        return <></>;
    }

    return (
    <Paper elevation={2} sx={{padding: 2, display: "flex", flexDirection: "column"}}>
        <Typography variant="caption">
            Times
        </Typography>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <CompareSortSelector setSort={setSort} />
        </Box>
        <Box>
            <Paper elevation={1} sx={{height: getCardHeight(2) * 2}}>
                <AutoSizer disableHeight>
                {({ width }) => <CompareList 
                                    width={width} 
                                    sort={sort}
                                    firstUser={firstUser} 
                                    secondUser={secondUser} 
                                    firstTimes={firstTimes} 
                                    secondTimes={secondTimes} 
                                    isLoading={isLoading}  
                                    userColors={userColors}
                                    selectedSlice={selectedSlice}
                                />}
                </AutoSizer>
            </Paper>
        </Box>
    </Paper>
    );
}

function getDate(info: CompareTimeInfo) {
    let date: number | undefined;
    for (const time of info.times) {
        const timeDate = new Date(time.date);
        if (!date || timeDate.getTime() < date) {
            date = timeDate.getTime();
        }
    }
    return date ?? 0;
}

function CompareList(props: ICompareListProps) {
    const { firstUser, secondUser, firstTimes, secondTimes, isLoading, width, userColors, sort, selectedSlice } = props;

    const { maps } = useOutletContext() as ContextParams;

    const times = useMemo(() => {
        if (isLoading || firstUser.userId === secondUser.userId) {
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
                    userId: firstUser.userId,
                    userThumb: firstUser.userThumb,
                    userColor: userColors[0],
                    time: time.time,
                    date: time.date,
                    id: time.id,
                    style: time.style
                }]}
            );
        }

        for (const time of secondTimes) {
            const timeList = mapToTime.get(time.mapId);
            const compareTime: CompareTime = {
                username: secondUser.username,
                userId: secondUser.userId,
                userThumb: secondUser.userThumb,
                userColor: userColors[1],
                time: time.time,
                date: time.date,
                id: time.id,
                style: time.style
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
        let times = Array.from(mapToTime.values());

        if (selectedSlice !== undefined) {
            times = times.filter((info) => shouldIncludeTimes(info.times, [firstUser.userId, secondUser.userId], selectedSlice))
        }

        if (sort === "dateAsc") {
            return times.sort((a, b) => getDate(a) - getDate(b));
        }
        else if (sort === "dateDesc") {
            return times.sort((a, b) => getDate(b) - getDate(a));
        }
        else if (sort === "timeAsc") {
            return times.sort((a, b) => +a.times[0].time - +b.times[0].time);
        }
        else if (sort === "timeDesc") {
            return times.sort((a, b) => +b.times[0].time - +a.times[0].time);
        }
        else if (sort === "mapAsc") {
            return times.sort((a, b) => a.map < b.map ? -1 : 1);
        }
        else if (sort === "mapDesc") {
            return times.sort((a, b) => a.map > b.map ? -1 : 1);
        }
        else if (sort === "diffAsc") {
            return times.sort((a, b) => diffSortVal(a, b, true))
        }
        else if (sort === "diffDesc") {
            return times.sort((a, b) => diffSortVal(a, b, false))
        }
        return times;
    }, [firstTimes, firstUser, isLoading, maps, secondTimes, secondUser, sort, userColors, selectedSlice]);

    if (isLoading || firstUser.userId === secondUser.userId) {
        return <></>;
    }
    
    const card_height = (CARD_SIZE + ((CARD_SIZE * 0.3) * 2) + 1) + 4;
    const itemsPerRow = Math.floor((width - 12) / (CARD_SIZE)) || 1;
    const rowCount = Math.ceil(times.length / itemsPerRow);
    
    return (
        <VirtualizedList
            rowComponent={CompareRow}
            rowHeight={card_height}
            rowCount={rowCount}
            rowProps={{itemsPerRow: itemsPerRow, times: times}}
            style={{scrollbarWidth: "thin", width: width, height: card_height * 2}}
        />
    );
}

interface ICompareRowProps {
    itemsPerRow: number
    times: CompareTimeInfo[]
}

function CompareRow(props: RowComponentProps<ICompareRowProps>) {
    const { itemsPerRow, times, index, style } = props;

    const rowTimes: React.ReactElement[] = [];
    const fromIndex = index * itemsPerRow;
    const toIndex = Math.min(fromIndex + itemsPerRow, times.length);
    
    for (let i = fromIndex; i < toIndex; ++i) {
        rowTimes.push(<CompareListCard key={times[i].mapId} info={times[i]} />);
    }

    return (
    <Box style={style} display="flex" justifyContent="center">
        {rowTimes}
    </Box>
    );
}

interface ICompareListCardProps {
    info: CompareTimeInfo
}

function CompareListCard(props: ICompareListCardProps) {
    const { info } = props;
    const [ showInfo, setShowInfo ] = useState(false);
    const [ defaultShowInfo, setDefaultShowInfo ] = useState(false);
    const theme = useTheme();

    const times = info.times;
    let colors: string[] = [];
    if (times.length === 2 && times[0].time === times[1].time) {
        colors = [lighten(TIE_COLOR, 0.6), TIE_COLOR];
    }
    else if (times.length === 1) {
        colors = [lighten(times[0].userColor, 0.9), lighten(times[0].userColor, 0.5)];
    }
    else {
        colors = [lighten(times[0].userColor, 0.6), times[0].userColor];
    }

    const otherTimes: React.ReactElement[] = [];
    for (let i = 1; i < times.length; ++i) {
        otherTimes.push(
        <Box key={times[i].id}>
            <Divider component="li" />
            <ListItem>
                <CompareCardTimeCell time={times[i]} diff={+times[i].time - +times[0].time} showInfo={showInfo}/>
            </ListItem>
        </Box>
        );
    }

    return (
    <Box padding="6px">
        <Box sx={{
            width: CARD_SIZE - 12, 
            height: getCardHeight(2) - 12, 
            display: "inline-flex", 
            flexDirection: "column", 
            overflow: "hidden", 
            backgroundColor: colors[1],
            borderRadius: "8px",
            backgroundOrigin: "border-box",
            backgroundClip: "content-box, border-box",
            transition: ".4s ease",
            "& .mapImg": { transition: "transform .4s ease" },
            ":hover": { 
                boxShadow: `0 0 16px ${colors[1]}`,
                backgroundColor: colors[0],
                "& .mapImg": { transform: "scale(1.05)" } 
            }
        }}>
            <Box padding={0.5} display="flex" flexDirection="column" height="100%">
                <Box width={CARD_SIZE - 20} height={CARD_SIZE - 20} >
                {
                    info.mapThumb ? 
                    <Box
                        width={CARD_SIZE - 20} 
                        height={CARD_SIZE - 20} 
                        position="absolute" 
                        borderRadius="4px 4px 0 0" 
                        overflow="hidden"
                    >
                        <Box 
                            className="mapImg"
                            width="100%"
                            height="100%"
                            component="img" 
                            src={info.mapThumb} 
                            alt={info.map} 
                        />
                    </Box>
                        :
                    <QuestionMarkIcon className="mapImg" sx={{ fontSize: CARD_SIZE - 20, position: "absolute" }} />
                }
                    <Box height={CARD_SIZE - 20} width={CARD_SIZE - 20} display="flex" flexDirection="column" >
                        <Typography variant="h5" fontWeight="bold" sx={{ 
                            padding: 1,
                            overflow:"hidden", 
                            textOverflow:"ellipsis", 
                            backdropFilter: "blur(16px)", 
                            textAlign: "center", 
                            color: "white",
                            textShadow: "black 3px 3px 3px",
                            borderRadius: "4px 4px 0 0"
                        }}>
                            {info.map}
                        </Typography>
                        <Box display="flex" justifyContent="flex-end" alignItems="flex-end" flexGrow={1} padding={0.5}>
                            <IconButton 
                                onMouseEnter={() => setShowInfo(!defaultShowInfo)} 
                                onMouseLeave={() => setShowInfo(defaultShowInfo)} 
                                onClick={() => setDefaultShowInfo(!defaultShowInfo)}
                                sx={{filter: "drop-shadow(3px 5px 2px rgb(0 0 0 / 0.6))", color: showInfo ? theme.palette.secondary.main : "white"}}
                            >
                                <InfoIcon fontSize="large" />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
                <Paper square elevation={2} sx={{flexGrow: 1, borderRadius: "0 0 4px 4px", width: CARD_SIZE - 20, height: CARD_SIZE - 20}}>
                    <List>
                        <ListItem key={times[0].id}>
                            <CompareCardTimeCell time={times[0]} diff={0} showInfo={showInfo} />
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
    showInfo: boolean
}

function CompareCardTimeCell(props: ICompareCardTimeCellProps) {
    const { time, diff, showInfo } = props;
    const theme = useTheme();

    const mainText = showInfo ?
    <>
    <DateDisplay date={time.date} fontWeight="bold" tooltipPlacement="top" />
    <Typography fontFamily="monospace" variant="body1">
        {formatStyle(time.style)}
    </Typography>
    </>
    :
    <>
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
    </>

    return (
    <Box height="48px" display="flex" flexDirection="row" width="100%">
        <Tooltip placement="top" title={time.username} arrow>
            <UserAvatar sx={{height: "40px", width: "40px", alignSelf: "center"}} username={time.username} userThumb={time.userThumb} />
        </Tooltip>
        <Box display="flex" flexDirection="column" alignItems="flex-end" width="100%">
            {mainText}
        </Box>
    </Box>
    )
}

export default Compare;