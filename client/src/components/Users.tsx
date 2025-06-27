import React, { useState } from "react";
import Box from "@mui/material/Box";
import { IconButton, Paper, TextField, Typography } from "@mui/material";
import Search from "@mui/icons-material/Search";
import { getUserData, getUserIdFromName } from "../api/api";
import { User } from "../api/interfaces";
import UserCard from "./UserCard";
import { useNavigate, useParams } from "react-router";
import ProfileCard from "./ProfileCard";

function Users() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userText, setUserText] = useState<string>("");
    const [userInfo, setUserInfo] = useState<User | undefined>(undefined);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    const onSearch = async () => {
        if (isLoading || (userInfo && userText === userInfo.username)) {
            return;
        }

        setHasError(false);

        if (!userText) {
            setUserInfo(undefined);
            navigate("/users");
            return;
        }

        const userId = await getUserIdFromName(userText);
        if (userId !== undefined) {
            navigate("/users/" + userId, {replace: true});
        }
        else {
            setHasError(true);
        }
    }

    const onSearchTextChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUserText(event.target.value);
        setHasError(false);
    }

    const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            onSearch();
        }
    }

    if (id !== userId) {
        setUserId(id);
        if (id !== undefined) {
            setIsLoading(true);
        }
        else {
            setUserInfo(undefined);
        }
    }

    if (isLoading && id) {
        getUserData(id).then((user) => {
            if (!user) {
                navigate("/users");
                navigate(0);
                return;
            }
            setIsLoading(false);
            setUserInfo(user);
        });
    }

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
                <Paper elevation={2} sx={{padding: 3, minHeight: 200, display:"flex", alignItems: "center"}}>
                    <Box width="100%">
                        <Typography variant="subtitle1" marginBottom={3.5}>Search by username</Typography>
                        <TextField error={hasError} helperText={hasError ? "Invalid username." : ""} onKeyDown={onSearchKeyDown} onChange={onSearchTextChanged} fullWidth label="Username" variant="outlined" slotProps={{input: {endAdornment: 
                            <IconButton onClick={onSearch}> <Search /> </IconButton> 
                        }}} />
                    </Box>
                </Paper>
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard user={userInfo} loading={isLoading} minHeight={200}/>
            </Box>
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userInfo?.id} />
        </Box>
    </Box>
    );
}

export default Users;