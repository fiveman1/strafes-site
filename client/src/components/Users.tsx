import React, { useState } from "react";
import Box from "@mui/material/Box";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from "@mui/material";
import UserCard from "./UserCard";
import { useParams } from "react-router";
import ProfileCard from "./ProfileCard";
import TimesCard from "./TimesCard";
import UserSearch from "./UserSearch";
import { Game, Style } from "../api/interfaces";
import { formatGame, formatStyle } from "../util/format";



function Users() {
    const { id } = useParams();
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [game, setGame] = useState<Game>(Game.bhop);
    const [style, setStyle] = useState<Style>(Style.autohop);

    if (id !== userId) {
        setUserId(id);
    }

    const handleChangeGame = (event: SelectChangeEvent<Game>) => {
        const value = event.target.value;
        if (value === Game.surf && style === Style.scroll) {
            setStyle(Style.autohop);
        }
        setGame(value);
    };

    const handleChangeStyle = (event: SelectChangeEvent<Style>) => {
        setStyle(event.target.value);
    };

    const games = Object.values(Game).filter(value => typeof value === "number") as Game[];
    const styles = Object.values(Style).filter(value => typeof value === "number" && (game === Game.bhop || value !== Style.scroll)) as Style[];
    styles.sort((a, b) => (formatStyle(a) > formatStyle(b) ? 1 : -1))

    return (
    <Box padding={2} flexGrow={1}>
        <Typography variant="h4" padding={1}>
            Users
        </Typography>
        <Typography variant="body1" padding={1}>
            Select a user to load information about them.
        </Typography>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
            <Box minWidth={320} padding={1} flexBasis="60%" flexGrow={1}>
                <UserSearch setUserId={setUserId} minHeight={200} />
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard userId={userId} minHeight={200}/>
            </Box>
        </Box>
        <Box padding={0.5} display="flex" flexWrap="wrap">
            <Box padding={1.5}>
                <FormControl sx={{ width: "150px" }}>
                    <InputLabel>Game</InputLabel>
                    <Select
                        value={game}
                        label="Game"
                        onChange={handleChangeGame}
                    >
                        {games.map((game) => <MenuItem value={game}>{formatGame(game)}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>
            <Box padding={1.5}>
                <FormControl sx={{ width: "150px" }}>
                    <InputLabel>Style</InputLabel>
                    <Select
                        value={style}
                        label="Style"
                        onChange={handleChangeStyle}
                    >
                        {styles.map((style) => <MenuItem value={style}>{formatStyle(style)}</MenuItem>)}
                    </Select>
                </FormControl>
            </Box>
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userId} game={game} style={style} />
        </Box>
        <Box padding={1}>
            <TimesCard userId={userId} game={game} style={style} />
        </Box>
    </Box>
    );
}

export default Users;