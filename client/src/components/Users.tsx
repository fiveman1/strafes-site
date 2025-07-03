import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Checkbox, FormControlLabel, FormGroup, FormHelperText, Typography } from "@mui/material";
import UserCard from "./UserCard";
import { useParams } from "react-router";
import ProfileCard from "./ProfileCard";
import TimesCard from "./TimesCard";
import UserSearch from "./UserSearch";
import { Game, TimeSortBy, Style, User } from "../api/interfaces";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";

function Users() {
    const { id } = useParams();
    const [userId, setUserId] = useState<string>();
    const [game, setGame] = useState(Game.bhop);
    const [style, setStyle] = useState(Style.autohop);
    const [onlyWRs, setOnlyWRs] = useState(false);
    const [user, setUserInfo] = useState<User>();
    const [userLoading, setIsUserLoading] = useState<boolean>(false);

    useEffect(() => {
        document.title = "strafes - users"
    }, []);

    if (id !== userId) {
        setUserId(id);
    }

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h2" padding={1}>
            Users
        </Typography>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch setUserId={setUserId} minHeight={185} />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard userId={userId} user={user} setUserInfo={setUserInfo} loading={userLoading} setIsLoading={setIsUserLoading} minHeight={185}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <GameSelector game={game} setGame={setGame} />
            <StyleSelector game={game} style={style} setStyle={setStyle} />
            <Box padding={1.5}>
                <FormGroup>
                    <FormControlLabel label="Only WRs" control={
                        <Checkbox checked={onlyWRs} onChange={(event, checked) => setOnlyWRs(checked)} />}  
                    />
                </FormGroup>
                <FormHelperText>{onlyWRs ? "Showing world records" : "Showing all times"}</FormHelperText>
            </Box>
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userId} user={user} userLoading={userLoading} game={game} style={style} />
        </Box>
        <Box padding={1}>
            <TimesCard defaultSort={TimeSortBy.DateDesc} userId={userId} game={game} style={style} onlyWRs={onlyWRs} hideUser />
        </Box>
    </Box>
    );
}

export default Users;