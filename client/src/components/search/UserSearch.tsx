import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Autocomplete, AutocompleteInputChangeReason, Box, InputAdornment, TextField } from "@mui/material";
import { UserSearchData } from "shared";
import SearchIcon from '@mui/icons-material/Search';
import { UserSearchInfo } from "../../common/states";
import UserAvatar from "../displays/UserAvatar";
import UserLink from "../displays/UserLink";
import { useQueryClient } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { ErrorWithReason } from "../displays/LoadError";

interface IUserSearchProps {
    setUserId: (id: string | undefined) => void
    userSearch: UserSearchInfo
    disabled?: boolean
    compact?: boolean
    autoFocus?: boolean
    // Called when the user is done with the search: a user was found, or the input lost focus
    onDone?: () => void
}

function prevUsernamesContains(data: UserSearchData, search: string) {
    if (!data.previousUsernames) {
        return false;
    }
    return data.previousUsernames.map(name => name.toLowerCase()).includes(search);
}

function UserSearch(props: IUserSearchProps) {
    const { setUserId, userSearch, disabled, compact, autoFocus, onDone } = props;
    const queryClient = useQueryClient();
    const { userText, setUserText, selectedUser, setSelectedUser, options, loadingOptions } = userSearch

    // Why the last search didn't find anyone
    const [ searchError, setSearchError ] = useState<ReactNode>("");
    const inputRef = useRef<HTMLInputElement>(null);
    // The input blurs on select before the user lookup finishes, so don't count that blur as being done
    const searchPending = useRef(false);

    const onInputChange = useCallback((val: string, reason: AutocompleteInputChangeReason) => {
        setUserText(val);
        // Only once they change what they typed. The value changing also resets the text, which isn't them.
        if (reason === "input" || reason === "clear") {
            setSearchError("");
        }
    }, [setUserText]);

    const onSearch = useCallback(async (search: string | UserSearchData) => {
        if (!search) {
            setSelectedUser({username: ""});
            setUserId(undefined);
            onDone?.();
            return;
        }

        const newSelectedUser = typeof search === "string" ? {username: search} : search;
        searchPending.current = true;
        let userId: number | null;
        try {
            userId = await queryClient.query(queries.users.fromSearch(newSelectedUser));
        }
        catch (err) {
            searchPending.current = false;
            setSearchError(<ErrorWithReason issue="Couldn't search." error={err} />);
            inputRef.current?.focus();
            return;
        }
        searchPending.current = false;

        if (userId !== null) {
            setUserId(userId.toString());
            setSelectedUser(newSelectedUser);
            onDone?.();
        }
        else {
            setSearchError("Invalid username.");
            // Keeps what they typed in the input (the input resets to the value's name), so they can fix it
            setSelectedUser(newSelectedUser);
            // Refocus so the user can fix the name (and so clicking away still counts as done)
            inputRef.current?.focus();
        }
    }, [onDone, queryClient, setSelectedUser, setUserId]);

    const onBlur = useCallback(() => {
        if (!searchPending.current) {
            onDone?.();
        }
    }, [onDone]);

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
                "[type=\"search\"]::-webkit-search-cancel-button": {appearance: "none"},
                ...(compact ? {
                    ".MuiAutocomplete-inputRoot": { paddingTop: "2px", paddingBottom: "2px" },
                    ".MuiAutocomplete-input": { fontSize: "0.875rem" }
                } : {})
            }}
            fullWidth
            inputMode="search"
            inputValue={userText}
            value={selectedUser}
            onInputChange={(e, v, reason) => onInputChange(v, reason)}
            onChange={(e, v) => onSearch(v)}
            onBlur={onBlur}
            isOptionEqualToValue={(opt, val) => {
                const username = typeof val === "string" ? val : val.username.toLowerCase();
                return opt.username.toLowerCase() === username || prevUsernamesContains(opt, username)
            }}
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
                    error={searchError !== ""} 
                    helperText={searchError}
                    fullWidth 
                    label="" 
                    placeholder="Search by username"
                    variant="outlined"
                    type="search"
                    inputRef={inputRef}
                    autoFocus={autoFocus}
                    onKeyDown={(e) => {
                        if (e.key === "Escape" && onDone) {
                            inputRef.current?.blur();
                        }
                    }}
                    slotProps={{
                        ...params.slotProps,

                        htmlInput: {
                            ...params.slotProps.htmlInput, 
                            maxLength: 50
                        },

                        input: {
                            ...params.slotProps.input,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize={compact ? "small" : "medium"} />
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
                    {option.userId !== undefined ?
                    <UserLink
                        userId={option.userId}
                        username={option.username}
                        userRoles={option.userRoles}
                        userCountry={option.userCountry}
                        userThumb={option.userThumb}
                        avatarSize={40}
                        disableLink
                        sx={{ minWidth: 0 }}
                    />
                    :
                    <>
                        <UserAvatar sx={{ mr: 1, flexShrink: 0 }} username={option.username} userThumb={option.userThumb} />
                        {option.username}
                    </>}
                </Box>
            )}
            getOptionLabel={(option) => typeof option === "string" ? option : option.username}
        />
    );
}

export default UserSearch;
