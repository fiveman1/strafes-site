import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, debounce, Paper, TextField, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { getUserIdFromName, searchByUsername } from "../api/api";

export interface UserSearchInfo {
    userText: string
    setUserText: (text: string) => void
    selectedUser: string
    setSelectedUser: (user: string) => void
    options: readonly string[]
    setOptions: (options: readonly string[]) => void
    loadingOptions: boolean
    setIsLoadingOptions: (loading: boolean) => void
}

export function useUserSearch(): [UserSearchInfo, (search: UserSearchInfo) => void] {
    const [userText, setUserText] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [options, setOptions] = useState<readonly string[]>([]);
    const [loadingOptions, setIsLoadingOptions] = useState(false);

    const search = {
        userText: userText,
        setUserText: setUserText,
        selectedUser: selectedUser,
        setSelectedUser: setSelectedUser,
        options: options,
        setOptions: setOptions,
        loadingOptions: loadingOptions,
        setIsLoadingOptions: setIsLoadingOptions
    };

    const setUserSearch = (search: UserSearchInfo) => {
        setUserText(search.userText);
        setSelectedUser(search.selectedUser);
        setOptions(search.options);
        setIsLoadingOptions(search.loadingOptions);
    }

    return [search, setUserSearch];
}

export interface IUserSearchProps {
    minHeight: number
    setUserId: (value?: string) => void
    noNavigate?: boolean
    userSearch: UserSearchInfo
}

function UserSearch(props: IUserSearchProps) {
    const { minHeight, setUserId, noNavigate, userSearch } = props;
    const { userText, setUserText, selectedUser, setSelectedUser, options, setOptions, loadingOptions, setIsLoadingOptions } = userSearch

    const location = useLocation();
    const navigate = useNavigate();
    const [hasError, setHasError] = useState(false);

    const fetchSearchOptions = useMemo(() => debounce(async (searchText: string, callback: (usernames: string[]) => void) => {
        const usernames = await searchByUsername(searchText);
        callback(usernames);
    }, 300), []);

    useEffect(() => {
        setHasError(false);

        if (!userText) {
            setIsLoadingOptions(false);
            setOptions([]);
            return;
        }

        let active = true;

        setIsLoadingOptions(true);
        setOptions([]);
        fetchSearchOptions(userText, (usernames) => {
            if (!active) return;

            // Always put search text at top of the list
            if (!usernames.map((name) => name.toLowerCase()).includes(userText.toLowerCase())) {
                usernames = [userText, ...usernames];
            }
            setOptions(usernames);
        });

        return () => {
            setIsLoadingOptions(false);
            active = false;
        }
    }, [fetchSearchOptions, setIsLoadingOptions, setOptions, userText]);

    const onInputChange = useCallback((val: string) => {
        setUserText(val);
    }, [setUserText]);

    const onSearch = useCallback(async (search: string) => {
        setSelectedUser(search);

        if (!search) {
            setUserId(undefined);
            if (!noNavigate) navigate("/users");
            return;
        }

        const userId = await getUserIdFromName(search);
        if (userId !== undefined) {
            if (!noNavigate) {
                navigate({pathname: `/users/${userId}`, search: new URLSearchParams(location.search).toString()});
            }
            else {
                setUserId(userId);
            }
        }
        else {
            setHasError(true);
        }
    }, [location.search, navigate, noNavigate, setSelectedUser, setUserId]);

    return (<>
        <Paper elevation={2} sx={{padding: 3, minHeight: minHeight, display:"flex", alignItems: "center"}}>
            <Box width="100%">
                <Typography variant="subtitle1" marginBottom={3.5}>Search by username</Typography>
                <Autocomplete 
                    fullWidth
                    inputMode="search"
                    inputValue={userText}
                    value={selectedUser}
                    onInputChange={(e, v) => onInputChange(v ?? "")}
                    onChange={(e, v) => onSearch(v ?? "")}
                    isOptionEqualToValue={(opt, val) => opt.toLowerCase() === val.toLowerCase()}
                    filterOptions={(x) => x}
                    options={options}
                    loading={loadingOptions}
                    autoComplete
                    autoHighlight
                    blurOnSelect
                    freeSolo
                    includeInputInList
                    renderInput={(params) => 
                        <TextField {...params} 
                            error={hasError} 
                            helperText={hasError ? "Invalid username." : ""}
                            fullWidth 
                            label="Username" 
                            variant="outlined"
                            slotProps={{
                                htmlInput: {
                                    ...params.inputProps, 
                                    maxLength: 50
                                }, 
                                input: {...params.InputProps}
                            }}
                        />
                    }
                />
            </Box>
        </Paper>
    </>)
    
}

export default UserSearch;