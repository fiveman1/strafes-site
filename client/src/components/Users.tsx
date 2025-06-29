import React, { useState } from "react";
import Box from "@mui/material/Box";
import { Checkbox, FormControlLabel, FormGroup, FormHelperText, Typography } from "@mui/material";
import UserCard from "./UserCard";
import { useParams } from "react-router";
import ProfileCard from "./ProfileCard";
import TimesCard from "./TimesCard";
import UserSearch from "./UserSearch";
import { Game, Style } from "../api/interfaces";
import GameSelector from "./GameSelector";
import StyleSelector from "./StyleSelector";

function Users() {
    const { id } = useParams();
    const [userId, setUserId] = useState<string>();
    const [game, setGame] = useState<Game>(Game.bhop);
    const [style, setStyle] = useState<Style>(Style.autohop);
    const [onlyWRs, setOnlyWRs] = useState<boolean>(false);

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
                <UserSearch setUserId={setUserId} minHeight={200} />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard userId={userId} minHeight={200}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap" alignItems="center">
            <Box padding={1.5}>
                <GameSelector game={game} setGame={setGame} />
            </Box>
            <Box padding={1.5}>
                <StyleSelector game={game} style={style} setStyle={setStyle} />
            </Box>
            <Box padding={1.5}>
                <FormGroup>
                    <FormControlLabel label="Only WRs (first 100)" control={
                        <Checkbox checked={onlyWRs} onChange={(event, checked) => setOnlyWRs(checked)} />}  
                    />
                </FormGroup>
                <FormHelperText>{onlyWRs ? "Showing world records" : "Showing all times"}</FormHelperText>
            </Box>
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userId} game={game} style={style} />
        </Box>
        <Box padding={1}>
            <TimesCard userId={userId} game={game} style={style} onlyWRs={onlyWRs} hideUser />
        </Box>
    </Box>
    );
}

export default Users;