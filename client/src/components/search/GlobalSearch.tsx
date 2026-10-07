import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, Box, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Game, Map as StrafesMap, Style, UserSearchData, formatGame } from "shared";
import { useUserSearch } from "../../common/states";
import { filterMapsBySearch } from "../../common/sort";
import { isTyping } from "../../common/utils";
import { queries } from "../../api/queries";
import MapThumb from "../displays/MapThumb";
import UserAvatar from "../displays/UserAvatar";
import ColorChip from "../displays/ColorChip";
import { getGameColor } from "../../common/common";

type SearchOption = { kind: "map", map: StrafesMap } | { kind: "user", user: UserSearchData };

const MAX_OPTIONS_PER_GROUP = 6;

interface IGlobalSearchProps {
    maps: StrafesMap[]
}

function GlobalSearch(props: IGlobalSearchProps) {
    const { maps } = props;
    const navigate = useNavigate();
    const theme = useTheme();
    const queryClient = useQueryClient();
    const inputRef = useRef<HTMLInputElement>(null);
    const { userText, setUserText, options: users } = useUserSearch();
    const [ notFound, setNotFound ] = useState(false);
    const [ open, setOpen ] = useState(false);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(event.target)) {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const options = useMemo(() => {
        if (!userText) {
            return [];
        }
        const mapOptions: SearchOption[] = filterMapsBySearch(maps, userText).slice(0, MAX_OPTIONS_PER_GROUP).map((map) => ({ kind: "map", map }));
        const userOptions: SearchOption[] = users.slice(0, MAX_OPTIONS_PER_GROUP).map((user) => ({ kind: "user", user }));
        if (!users.some((user) => user.username.toLowerCase() === userText.toLowerCase())) {
            userOptions.push({ kind: "user", user: { username: userText } });
        }
        return [...mapOptions, ...userOptions];
    }, [maps, userText, users]);

    const onSelect = useCallback(async (value: SearchOption | null) => {
        if (!value) {
            return;
        }

        let path: string;
        if (value.kind === "map") {
            path = `/maps/${value.map.id}`;
        }
        else {
            const userId = await queryClient.fetchQuery(queries.users.fromSearch(value.user));
            if (userId === null) {
                setNotFound(true);
                return;
            }
            path = `/users/${userId}`;
        }

        const current = new URLSearchParams(window.location.search);
        const search = new URLSearchParams();
        for (const [key, all] of [["game", Game.all], ["style", Style.all]] as const) {
            const param = current.get(key);
            if (param !== null && !(value.kind === "map" && +param === all)) {
                search.set(key, param);
            }
        }

        setUserText("");
        inputRef.current?.blur();
        navigate({ pathname: path, search: search.toString() });
    }, [navigate, queryClient, setUserText]);

    return (
        <Autocomplete
            sx={{
                "[type=\"search\"]::-webkit-search-decoration": { appearance: "none" },
                "[type=\"search\"]::-webkit-search-cancel-button": { appearance: "none" }
            }}
            fullWidth
            autoHighlight
            forcePopupIcon={false}
            open={open && userText !== ""}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            value={null}
            inputValue={userText}
            options={options}
            filterOptions={(x) => x}
            groupBy={(option) => option.kind === "map" ? "Maps" : "Users"}
            getOptionLabel={(option) => option.kind === "map" ? option.map.name : option.user.username}
            getOptionKey={(option) => option.kind === "map" ? `map-${option.map.id}` : `user-${option.user.userId ?? ""}-${option.user.username}`}
            onInputChange={(e, value, reason) => {
                if (reason === "input") {
                    setUserText(value);
                    setNotFound(false);
                }
            }}
            onChange={(e, value) => onSelect(value)}
            renderInput={(params) =>
                <TextField {...params}
                    inputRef={inputRef}
                    error={notFound}
                    placeholder="Search maps and users"
                    type="search"
                    slotProps={{
                        ...params.slotProps,
                        htmlInput: {
                            ...params.slotProps.htmlInput,
                            maxLength: 50,
                            "aria-label": "Search maps and users"
                        },
                        input: {
                            ...params.slotProps.input,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 18 }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <Box
                                    component="kbd"
                                    sx={{
                                        display: { xs: "none", md: "inline-flex" },
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 20,
                                        height: 20,
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: "5px",
                                        color: "text.secondary",
                                        fontFamily: "inherit",
                                        fontSize: "0.75rem",
                                        ".Mui-focused &": { display: "none" }
                                    }}>
                                    /
                                </Box>
                            )
                        }
                    }}
                />
            }
            renderOption={({ key, ...optionProps }, option) => (
                <Box component="li" key={key} {...optionProps} sx={{ gap: 1.25, minHeight: 40 }}>
                    {option.kind === "map" ?
                    <>
                        <MapThumb size={28} map={option.map} />
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25, flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ flexShrink: 0, maxWidth: "70%", fontWeight: 500 }}>
                                {option.map.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                                {option.map.creator}
                            </Typography>
                        </Box>
                        <ColorChip color={getGameColor(option.map.game, theme)} label={formatGame(option.map.game)} />
                    </>
                    :
                    <>
                        <UserAvatar username={option.user.username} userThumb={option.user.userThumb} sx={{ width: 28, height: 28 }} />
                        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                            {option.user.username}
                        </Typography>
                        {option.user.userId === undefined &&
                        <Typography variant="caption" color="textSecondary" noWrap>
                            Look up by username
                        </Typography>}
                    </>}
                </Box>
            )}
        />
    );
}

export default GlobalSearch;
