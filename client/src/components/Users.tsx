import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import { Button, Checkbox, FormControlLabel, FormGroup, Paper, Switch, Typography, useMediaQuery } from "@mui/material";
import UserCard from "./cards/UserCard";
import { useNavigate, useParams } from "react-router";
import ProfileCard from "./cards/ProfileCard";
import TimesCard from "./cards/grids/TimesCard";
import UserSearch from "./search/UserSearch";
import { Game, Style, Time, TimeSortBy, ALL_COURSES, MAIN_COURSE } from "shared";
import GameSelector from "./forms/GameSelector";
import StyleSelector from "./forms/StyleSelector";
import ViewedTimes from "./cards/grids/ViewedTimes";
import { useGridApiRef } from "@mui/x-data-grid";
import CachedIcon from '@mui/icons-material/Cached';
import IncludeBonusCheckbox from "./forms/IncludeBonusCheckbox";
import { useGameStyle, useIncludeBonuses, useUserSearch } from "../common/states";
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { parseAsBoolean, useQueryState } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";

function Users() {
    const { id } = useParams();
    const userId = id;

    const apiRef = useGridApiRef();
    const navigate = useNavigate();

    const userQuery = useQuery(queries.users.fromId(userId));
    const user = userQuery.data ?? undefined;
    const userLoading = userQuery.isLoading;
    
    const { game, setGame, style, setStyle } = useGameStyle(true);
    const [ advanced, setAdvanced ] = useState(false);
    const userSearch = useUserSearch();
    const [ viewedTimes, setViewedTimes ] = useState<Time[]>([]);

    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    const compareDisabled = !userId || game === Game.all || style === Style.all;

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

    const [onlyWRs, setOnlyWRs] = useQueryState("wrs", 
        parseAsBoolean
        .withDefault(false)
        .withOptions({ history: "replace" })
    );

    const [includeBonuses, setIncludeBonuses] = useIncludeBonuses();

    useEffect(() => {
        document.title = user ? `@${user.username} - users - strafes` : "users - strafes";
    }, [user]);

    const onResetViewed = useCallback(() => {
        setViewedTimes([]);
        apiRef.current?.dataSource.cache.clear();
    }, [apiRef]);

    const onSetUserId = useCallback((userId: string | undefined) => {
        if (userId) {
            navigate({pathname: `/users/${userId}`, search: location.search});
        }
    }, [navigate]);

    return (
        <Box sx={{
            flexGrow: 1
        }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: smallScreen ? "column" : "row",
                    alignItems: smallScreen ? "stretch" : "center",
                    justifyContent: "space-between",
                    gap: 1,
                    padding: 1
                }}>
                <Typography component={user ? "p" : "h1"} variant="h5">
                    Users
                </Typography>
                <Box sx={{ width: "100%", maxWidth: smallScreen ? undefined : 360 }}>
                    <UserSearch 
                        setUserId={onSetUserId} 
                        userSearch={userSearch}
                    />
                </Box>
            </Box>
            <Box sx={{ padding: 1 }}>
                <Paper sx={{ display: "flex", flexDirection: "column" }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: smallScreen ? "column" : "row",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 2,
                            padding: smallScreen ? 2 : 2.5
                        }}>
                        <UserCard user={user} loading={userLoading} />
                        <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<CompareArrowsIcon />}
                            disabled={compareDisabled}
                            href={compareDisabled ? "/compare" : `/compare?game=${game}&users=${userId}:${style}`}
                            sx={{ flexShrink: 0 }}
                        >
                            Compare
                        </Button>
                    </Box>
                    <Box
                        sx={{
                            padding: smallScreen ? 2 : 2.5,
                            borderTop: 1,
                            borderColor: "divider"
                        }}>
                        <ProfileCard userId={userId} user={user} userLoading={userLoading} game={game} style={style} />
                    </Box>
                </Paper>
            </Box>
            <Box
                sx={{
                    padding: 0.5,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center"
                }}>
                <GameSelector game={game} setGame={setGame} allowSelectAll />
                <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
                <Box
                    sx={{
                        padding: 1,
                        pt: 0.25,
                        pb: 0.25
                    }}>
                    <FormGroup>
                        <FormControlLabel label="Only WRs" control={
                            <Checkbox checked={onlyWRs} onChange={(event, checked) => setOnlyWRs(checked)} />}  
                        />
                    </FormGroup>
                </Box>
                <IncludeBonusCheckbox includeBonuses={includeBonuses} setIncludeBonuses={setIncludeBonuses} />
            </Box>
            <Box sx={{
                padding: 1
            }}>
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
            <Box
                sx={{
                    padding: 1,
                    ml: 1
                }}>
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
            <Box sx={{
                padding: 1
            }}>
                <ViewedTimes times={uniqueTimes} />
            </Box>
            : <></>}
        </Box>
    );
}

export default Users;