import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Checkbox, FormControlLabel, FormGroup, FormHelperText, Typography } from "@mui/material";
import UserCard from "./UserCard";
import { useLocation, useNavigate, useParams } from "react-router";
import ProfileCard from "./ProfileCard";
import TimesCard from "./TimesCard";
import UserSearch from "./UserSearch";
import { TimeSortBy, User } from "../api/interfaces";
import GameSelector, { useGame } from "./GameSelector";
import StyleSelector, { useStyle } from "./StyleSelector";
import { getUserData } from "../api/api";

function Users() {
    const { id } = useParams();
    const [userId, setUserId] = useState<string>();
    const [game, setGame] = useGame();
    const [style, setStyle] = useStyle();
    
    const [user, setUserInfo] = useState<User>();
    const [userLoading, setIsUserLoading] = useState<boolean>(false);
    const [userText, setUserText] = useState<string>("");

    const location = useLocation();
    const navigate = useNavigate();
    
    const queryParams = new URLSearchParams(location.search);
    let paramWRs = false;
    if (queryParams.get("wrs") === "true") {
        paramWRs = true;
    }
    const [onlyWRs, setOnlyWRs] = useState(paramWRs);

    useEffect(() => {
        document.title = user ? `strafes - users - @${user.username}` : "strafes - users";
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

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Users
        </Typography>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch setUserId={setUserId} minHeight={185} userText={userText} setUserText={setUserText}/>
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard user={user} loading={userLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} style={style} setGame={setGame} setStyle={setStyle} allowSelectAll />
            <StyleSelector game={game} style={style} setStyle={setStyle} allowSelectAll />
            <Box padding={1.5}>
                <FormGroup>
                    <FormControlLabel label="Only WRs" control={
                        <Checkbox checked={onlyWRs} onChange={(event, checked) => handleChangeOnlyWRs(checked)} />}  
                    />
                </FormGroup>
                <FormHelperText>{onlyWRs ? "Showing world records" : "Showing all times"}</FormHelperText>
            </Box>
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userId} user={user} userLoading={userLoading} game={game} style={style} />
        </Box>
        <Box padding={1}>
            <TimesCard defaultSort={TimeSortBy.DateDesc} userId={userId} game={game} style={style} onlyWRs={onlyWRs} hideUser showPlacement showPlacementOrdinals />
        </Box>
    </Box>
    );
}

export default Users;