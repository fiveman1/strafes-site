import React, { useState } from "react";
import { Box, IconButton, Paper, TextField, Typography } from "@mui/material";
import Search from "@mui/icons-material/Search";
import { useNavigate } from "react-router";
import { getUserIdFromName } from "../api/api";

function UserSearch(props: { minHeight: number, setUserId: (value?: string) => void; }) {
    const navigate = useNavigate();

    const [userText, setUserText] = useState<string>("");
    const [hasError, setHasError] = useState<boolean>(false);

    const { minHeight, setUserId } = props;

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

    return (<>
        <Paper elevation={2} sx={{padding: 3, minHeight: minHeight, display:"flex", alignItems: "center"}}>
            <Box width="100%">
                <Typography variant="subtitle1" marginBottom={3.5}>Search by username</Typography>
                <TextField error={hasError} helperText={hasError ? "Invalid username." : ""} onKeyDown={onSearchKeyDown} 
                        onChange={onSearchTextChanged} fullWidth label="Username" variant="outlined" 
                        slotProps={{htmlInput: {maxLength: 50}, input: {endAdornment: <IconButton onClick={onSearch}> <Search /> </IconButton>  }}} />
            </Box>
        </Paper>
    </>)
    
}

export default UserSearch;