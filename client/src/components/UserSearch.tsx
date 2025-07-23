import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, debounce, Paper, TextField, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router";
import { getUserIdFromName, searchByUsername } from "../api/api";
import { UserSearchData } from "../api/interfaces";

export interface UserSearchInfo {
    userText: string
    setUserText: (text: string) => void
    selectedUser: UserSearchData
    setSelectedUser: (user: UserSearchData) => void
    options: readonly UserSearchData[]
    setOptions: (options: readonly UserSearchData[]) => void
    loadingOptions: boolean
    setIsLoadingOptions: (loading: boolean) => void
}

export function useUserSearch(): [UserSearchInfo, (search: UserSearchInfo) => void] {
    const [userText, setUserText] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserSearchData>({username: ""});
    const [options, setOptions] = useState<readonly UserSearchData[]>([]);
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

function prevUsernamesContains(data: UserSearchData, search: string) {
    if (!data.previousUsernames) {
        return false;
    }
    return data.previousUsernames.map(name => name.toLowerCase()).includes(search);
}

function UserSearch(props: IUserSearchProps) {
    const { minHeight, setUserId, noNavigate, userSearch } = props;
    const { userText, setUserText, selectedUser, setSelectedUser, options, setOptions, loadingOptions, setIsLoadingOptions } = userSearch

    const location = useLocation();
    const navigate = useNavigate();
    const [hasError, setHasError] = useState(false);

    const fetchSearchOptions = useMemo(() => debounce(async (searchText: string, callback: (usernames: UserSearchData[]) => void) => {
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
            let found = false;
            const lowerUserText = userText.toLowerCase();
            for (const data of usernames) {
                if (data.username.toLowerCase() === lowerUserText) {
                    found = true;
                }
                else if (prevUsernamesContains(data, lowerUserText)) {
                    found = true;
                }

                if (found) {
                    const newUsernames = [data];
                    for (const copyData of usernames) {
                        if (copyData.username === data.username) continue;
                        newUsernames.push(copyData);
                    }
                    usernames = newUsernames;
                    break;
                }
            }
            if (!found) {
                usernames = [{username: userText}, ...usernames];
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

    const onSearch = useCallback(async (search: string | UserSearchData) => {
        if (!search) {
            setUserId(undefined);
            if (!noNavigate) navigate("/users");
            return;
        }

        let userId: string | undefined;
        if (typeof search === "string") {
            setSelectedUser({username: search});
            userId = await getUserIdFromName(search);
        }
        else {
            setSelectedUser(search);
            userId = search.id;
            if (!userId) {
                userId = await getUserIdFromName(search.username);
            }
        }

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
                    sx={{
                        // Disable the "x" shown by some (Safari and Chrome) browsers for type=search fields, since we already have an "x" button
                        "[type=\"search\"]::-webkit-search-decoration": {appearance: "none"},
                        "[type=\"search\"]::-webkit-search-cancel-button": {appearance: "none"}
                    }}
                    fullWidth
                    inputMode="search"
                    inputValue={userText}
                    value={selectedUser}
                    onInputChange={(e, v) => onInputChange(v ?? "")}
                    onChange={(e, v) => onSearch(v ?? "")}
                    isOptionEqualToValue={(opt, val) => opt.username.toLowerCase() === val.username.toLowerCase() || prevUsernamesContains(opt, val.username.toLowerCase())}
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
                            type="search"
                            slotProps={{
                                htmlInput: {
                                    ...params.inputProps, 
                                    maxLength: 50
                                }, 
                                input: {...params.InputProps}
                            }}
                        />
                    }
                    getOptionLabel={(option) => typeof option === "string" ? option : option.username}
                />
            </Box>
        </Paper>
    </>)
    
}

export default UserSearch;