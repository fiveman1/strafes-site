import { useCallback, useMemo, useState } from "react";
import { Autocomplete, Box, InputAdornment, TextField } from "@mui/material";
import { UserSearchData } from "shared";
import SearchIcon from '@mui/icons-material/Search';
import { UserSearchInfo } from "../../common/states";
import { getUserIdFromName } from "../../api/api";
import UserAvatar from "../displays/UserAvatar";

interface IUserSearchProps {
    setUserId: (id: string | undefined) => void
    userSearch: UserSearchInfo
    disabled?: boolean
}

function prevUsernamesContains(data: UserSearchData, search: string) {
    if (!data.previousUsernames) {
        return false;
    }
    return data.previousUsernames.map(name => name.toLowerCase()).includes(search);
}

function UserSearch(props: IUserSearchProps) {
    const { setUserId, userSearch, disabled } = props;
    const { userText, setUserText, selectedUser, setSelectedUser, options, loadingOptions } = userSearch

    const [ hasError, setHasError ] = useState(false);

    const onInputChange = useCallback((val: string) => {
        setUserText(val);
        setHasError(false);
    }, [setUserText]);

    const onSearch = useCallback(async (search: string | UserSearchData) => {
        if (!search) {
            setSelectedUser({username: ""});
            return;
        }

        let userId: number | undefined;
        if (typeof search === "string") {
            setSelectedUser({username: search});
            userId = await getUserIdFromName(search);
        }
        else {
            setSelectedUser(search);
            userId = search.userId;
            if (!userId) {
                userId = await getUserIdFromName(search.username);
            }
        }

        if (userId !== undefined) {
            setUserId(userId.toString());
        }
        else {
            setHasError(true);
        }
    }, [setSelectedUser, setUserId]);

    const sortedOptions = useMemo(() => {
        if (userText === "" || loadingOptions) {
            return [];
        }
        
        let found = false;
        const lowerUserText = userText.toLowerCase();
        let sorted: UserSearchData[] = [];
        for (const data of options) {
            if (data.username.toLowerCase() === lowerUserText || prevUsernamesContains(data, lowerUserText)) {
                found = true;
                const newUsernames = [data];
                for (const copyData of options) {
                    if (copyData.username === data.username) continue;
                    newUsernames.push(copyData);
                }
                sorted = newUsernames;
                break;
            }
        }
        if (!found) {
            sorted = [{username: userText}, ...options];
        }
        
        return sorted;
    }, [loadingOptions, options, userText]);

    return (
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
            options={sortedOptions}
            loading={loadingOptions}
            autoComplete
            autoHighlight
            blurOnSelect
            freeSolo
            includeInputInList
            disableClearable
            selectOnFocus
            size="small"
            disabled={disabled}
            renderInput={(params) => 
                <TextField {...params} 
                    error={hasError} 
                    helperText={hasError ? "Invalid username." : ""}
                    fullWidth 
                    label="" 
                    placeholder="Search by username"
                    variant="outlined"
                    type="search"
                    slotProps={{
                        htmlInput: {
                            ...params.inputProps, 
                            maxLength: 50
                        }, 
                        input: {
                            ...params.InputProps,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }
                    }}
                />
            }
            renderOption={({key, ...props}, option) => (
                <Box
                    component="li"
                    key={key}
                    {...props}
                >
                    <UserAvatar sx={{ mr: 1, flexShrink: 0 }} username={option.username} userThumb={option.userThumb} />
                    {option.username}
                </Box>
            )}
            getOptionLabel={(option) => typeof option === "string" ? option : option.username}
        />
    );
}

export default UserSearch;