import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Breadcrumbs, Button, Checkbox, FormControlLabel, FormGroup, FormHelperText, Link, Switch, Typography, useMediaQuery } from "@mui/material";
import UserCard from "./UserCard";
import { useLocation, useNavigate, useParams } from "react-router";
import ProfileCard from "./ProfileCard";
import TimesCard from "./TimesCard";
import UserSearch from "./UserSearch";
import { Time, TimeSortBy, User, ALL_COURSES, MAIN_COURSE } from "shared";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";
import { getUserData } from "../api/api";
import ViewedTimes from "./ViewedTimes";
import { useGridApiRef } from "@mui/x-data-grid";
import CachedIcon from '@mui/icons-material/Cached';
import IncludeBonusCheckbox from "./IncludeBonusCheckbox";
import { useGameStyle, useIncludeBonuses, useUserSearch } from "../util/states";
import UserAvatar from "./UserAvatar";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

function Users() {
    const { id } = useParams();
    const [userId, setUserId] = useState<string>();
    const {game, setGame, style, setStyle} = useGameStyle(undefined, true);
    
    const [user, setUserInfo] = useState<User>();
    const [userLoading, setIsUserLoading] = useState(false);
    const [advanced, setAdvanced] = useState(false);
    const [userSearch] = useUserSearch();
    const [viewedTimes, setViewedTimes] = useState<Time[]>([]);
    const apiRef = useGridApiRef();

    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    const smallScreenProfile = useMediaQuery("@media screen and (max-width: 800px)");

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
        document.title = user ? `@${user.username} - users - strafes` : "users - strafes";
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

    const breadcrumbs: React.ReactElement[] = [];
    if (user) {
        breadcrumbs.push(
            <Link underline="hover" color="inherit" component="button" onClick={() => navigate("/users")}>
                Users
            </Link>,
            <Box display="flex" flexDirection="row" alignItems="center">
                <UserAvatar username={user.username} userThumb={user.userThumb} sx={{width: 32, height: 32, mr: 1.25}}/>
                <Typography color="textPrimary" mr={1.25}>
                    @{user.username}
                </Typography>
            </Box>
        );
    }
    else {
        breadcrumbs.push(
            <Typography color="textPrimary">
                Users
            </Typography>
        );
    }

    return (
    <Box flexGrow={1}>
        <Box display="flex" flexDirection={smallScreen ? "column" : "row"} height={smallScreen ? undefined : "48px"} mb={0.5}>
            <Breadcrumbs separator={<NavigateNextIcon />} sx={{p: 1, flexGrow: 1, flexBasis: "60%", alignItems: "center", display: "flex"}}>
                <Link underline="hover" color="inherit" href="/">
                    Home
                </Link>
                {breadcrumbs}
            </Breadcrumbs>
            <Box padding={smallScreen ? 1 : 0.25} flexBasis="40%" minWidth="270px" maxWidth={smallScreen ? undefined : "500px"} display="flex" alignItems="center">
                <UserSearch 
                    setUserId={setUserId} 
                    userSearch={userSearch}
                />
            </Box>
        </Box>
        <Box display="flex" flexDirection={smallScreenProfile ? "column" : "row"} alignItems="center" >
            <Box padding={1} flexBasis="40%" minWidth={smallScreenProfile ? undefined : 360} maxWidth={smallScreenProfile ? undefined : 500} width={smallScreenProfile ? "100%" : undefined} >
                <UserCard user={user} loading={userLoading} minHeight={160} center={smallScreenProfile} />
            </Box>
            <Box padding={1} flexBasis="60%" flexGrow={1} display="flex" flexWrap="wrap" alignItems="center" >
                <ProfileCard userId={userId} user={user} userLoading={userLoading} game={game} style={style} minHeight={160} />
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} allowSelectAll />
            <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
            <Box padding={1} pt={0.25} pb={0.25}>
                <FormGroup>
                    <FormControlLabel label="Only WRs" control={
                        <Checkbox checked={onlyWRs} onChange={(event, checked) => handleChangeOnlyWRs(checked)} />}  
                    />
                </FormGroup>
                <FormHelperText sx={{mt: -0.5}}>{onlyWRs ? "Showing world records" : "Showing all times"}</FormHelperText>
            </Box>
            <IncludeBonusCheckbox includeBonuses={includeBonuses} setIncludeBonuses={setIncludeBonuses} />
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
                pageSize={12}
            />
        </Box>
        <Box padding={1} ml={1}>
            <FormControlLabel 
                label="Advanced"
                control={
                <Switch 
                    checked={advanced} 
                    onChange={(e) => setAdvanced(e.target.checked)} 
                />}
            />
            {advanced ? 
            <Button variant="outlined" startIcon={<CachedIcon />} onClick={onResetViewed}>
                Clear Viewed
            </Button>
            : <></>}
        </Box>
        {advanced ? 
        <Box padding={1}>
            <ViewedTimes times={uniqueTimes} />
        </Box>
        : <></>}
    </Box>
    );
}

export default Users;