import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, Switch, Typography, useMediaQuery } from "@mui/material";
import UserCard from "./UserCard";
import { useLocation, useNavigate, useParams } from "react-router";
import ProfileCard from "./ProfileCard";
import TimesCard from "./TimesCard";
import UserSearch, { useUserSearch } from "./UserSearch";
import { Time, TimeSortBy, User } from "../api/interfaces";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import { getUserData } from "../api/api";
import ViewedTimes from "./ViewedTimes";
import { useGridApiRef } from "@mui/x-data-grid";
import CachedIcon from '@mui/icons-material/Cached';
import { ALL_COURSES, MAIN_COURSE } from "../util/format";
import IncludeBonusCheckbox, { useIncludeBonuses } from "./IncludeBonusCheckbox";

function Users() {
    const { id } = useParams();
    const [userId, setUserId] = useState<string>();
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();
    
    const [user, setUserInfo] = useState<User>();
    const [userLoading, setIsUserLoading] = useState(false);
    const [advanced, setAdvanced] = useState(false);
    const [userSearch] = useUserSearch();
    const [viewedTimes, setViewedTimes] = useState<Time[]>([]);
    const apiRef = useGridApiRef();
    const smallScreen = useMediaQuery("@media screen and (max-width: 480px)");

    const addTimes = useCallback((times: Time[]) => {
        setViewedTimes((viewed) => {
            for (const time of times) {
                viewed.push(time);
            }
            return [...viewed];
        });
    }, []);

    const uniqueTimes = useMemo(() => {
        if (!advanced) {
            return [];
        }
        const timeIds = new Set<string>();
        const unique: Time[] = [];
        for (const time of viewedTimes) {
            if (!timeIds.has(time.id)) {
                timeIds.add(time.id);
                unique.push(time);
            }
        }
        return unique;
    }, [advanced, viewedTimes]);

    const location = useLocation();
    const navigate = useNavigate();
    
    const queryParams = new URLSearchParams(location.search);
    let paramWRs = false;
    if (queryParams.get("wrs") === "true") {
        paramWRs = true;
    }
    const [onlyWRs, setOnlyWRs] = useState(paramWRs);

    const [includeBonuses, setIncludeBonuses] = useIncludeBonuses();

    useEffect(() => {
        document.title = user ? `users - @${user.username} - strafes` : "users - strafes";
    }, [user]);

    if (id !== userId) {
        setUserId(id);
    }
    useEffect(() => {
        if (!userId) {
            setUserInfo(undefined);
            setIsUserLoading(false);
            return;
        }
        setIsUserLoading(true);
        getUserData(userId).then((userData) => {
            setIsUserLoading(false);
            setUserInfo(userData);
        });
    }, [userId, setIsUserLoading, setUserInfo]);

    const handleChangeOnlyWRs = (checked: boolean) => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set("wrs", checked ? "true" : "false");
        navigate({ search: queryParams.toString() }, { replace: true });
        setOnlyWRs(checked);
    };

    const onResetViewed = () => {
        setViewedTimes([]);
        apiRef.current?.dataSource.cache.clear();
    };

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Users
        </Typography>
        <Box marginLeft={2} marginBottom={0.5}>
            <FormControlLabel 
                label="Advanced"
                control={
                <Switch 
                    checked={advanced} 
                    onChange={(e) => setAdvanced(e.target.checked)} 
                />}
            />
        </Box>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch 
                    setUserId={setUserId} 
                    minHeight={185} 
                    userSearch={userSearch}
                />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard user={user} loading={userLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} allowSelectAll />
            <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
            <Box padding={smallScreen ? 1 : 1.5}>
                <FormGroup>
                    <FormControlLabel label="Only WRs" control={
                        <Checkbox checked={onlyWRs} onChange={(event, checked) => handleChangeOnlyWRs(checked)} />}  
                    />
                </FormGroup>
                <FormHelperText>{onlyWRs ? "Showing world records" : "Showing all times"}</FormHelperText>
            </Box>
            <IncludeBonusCheckbox includeBonuses={includeBonuses} setIncludeBonuses={setIncludeBonuses} />
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userId} user={user} userLoading={userLoading} game={game} style={style} />
        </Box>
        <Box padding={1}>
            <TimesCard 
                defaultSort={TimeSortBy.DateDesc} 
                userId={userId} 
                game={game} 
                style={style} 
                course={includeBonuses ? ALL_COURSES : MAIN_COURSE}
                onlyWRs={onlyWRs} 
                onLoadTimes={addTimes} 
                gridApiRef={apiRef} 
                hideUser 
                showPlacement 
                showPlacementOrdinals 
            />
        </Box>
        {advanced ? 
        <Box padding={1}>
            <Box marginBottom={2}>
                <Button variant="outlined" startIcon={<CachedIcon />} onClick={onResetViewed}>
                    Clear Viewed
                </Button>
            </Box>
            <ViewedTimes times={uniqueTimes} />
        </Box>
        : <></>}
    </Box>
    );
}

export default Users;