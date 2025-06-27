import React, { useState } from "react";
import Box from "@mui/material/Box";
import { IconButton, Paper, TextField, Typography } from "@mui/material";
import Search from "@mui/icons-material/Search";
import { getUserIdFromName } from "../api/api";
import UserCard from "./UserCard";
import { useNavigate, useParams } from "react-router";
import ProfileCard from "./ProfileCard";

function Users() {
    const { id } = useParams();
    
    const navigate = useNavigate();

    const [userText, setUserText] = useState<string>("");
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [hasError, setHasError] = useState<boolean>(false);

    if (id !== userId) {
        setUserId(id);
    }

    const onSearch = async () => {
        setHasError(false);

        if (!userText) {
            setUserId(undefined);
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
                        <TextField error={hasError} helperText={hasError ? "Invalid username." : ""} onKeyDown={onSearchKeyDown} 
                                onChange={onSearchTextChanged} fullWidth label="Username" variant="outlined" 
                                slotProps={{htmlInput: {maxLength: 50}, input: {endAdornment: <IconButton onClick={onSearch}> <Search /> </IconButton>  }}} />
                    </Box>
                </Paper>
            </Box>
            <Box minWidth={320} padding={1} flexBasis="40%" flexGrow={1}>
                <UserCard userId={userId} minHeight={200}/>
            </Box>
        </Box>
        <Box padding={1}>
            <ProfileCard userId={userId} />
        </Box>
    </Box>
    );
}

export default Users;