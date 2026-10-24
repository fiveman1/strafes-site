import { useCallback, useState } from "react";
import { alpha, Box, Button, IconButton, Link, Paper, Tooltip, Typography, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Game, Style, User, getAllowedStyles } from "shared";
import UserAvatar from "../displays/UserAvatar";
import StyleSelector from "../forms/StyleSelector";
import { CompareEntry, ENTRY_COLORS, MAX_ENTRIES } from "./types";
import { Link as RouterLink } from "react-router";
import { useUserSearch } from "../../common/states";
import UserSearch from "../search/UserSearch";

interface IdToUser {
    [userId: string]: {
        user?: User,
        loading: boolean
    } | undefined
}

interface ICompareEntryListProps {
    entries: CompareEntry[]
    setEntries: (entries: CompareEntry[]) => void
    idToUser: IdToUser
    game: Game
    onAddUser: (userId: string | undefined) => void
}

function CompareEntryList(props: ICompareEntryListProps) {
    const { entries, setEntries, idToUser, game, onAddUser } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    const userSearch = useUserSearch();

    // The search is hidden behind a button, except when there aren't enough users to compare yet
    const [ editing, setEditing ] = useState(false);
    const canAdd = entries.length < MAX_ENTRIES;
    const showSearch = canAdd && (editing || entries.length < 2);

    // Clear the search once done so the next add starts fresh
    const { setUserText, setSelectedUser } = userSearch;
    const onSearchDone = useCallback(() => {
        setEditing(false);
        setUserText("");
        setSelectedUser({ username: "" });
    }, [setSelectedUser, setUserText]);

    const onRemove = (index: number) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const onDuplicate = (index: number) => {
        if (entries.length >= MAX_ENTRIES) return;
        const entry = entries[index];
        const usedStyles = entries
            .filter(e => e.userId === entry.userId)
            .map(e => e.style);
        const newStyle = getAllowedStyles(game).find(s => !usedStyles.includes(s));
        if (newStyle === undefined) return;
        const newEntries = [...entries];
        newEntries.splice(index + 1, 0, { userId: entry.userId, style: newStyle });
        setEntries(newEntries);
    };

    const onStyleChange = (index: number, style: Style) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], style };
        setEntries(newEntries);
    };

    const addSlot = showSearch ?
        <Box sx={{ width: "100%", maxWidth: smallScreen ? undefined : 280, alignSelf: "center" }}>
            <UserSearch
                setUserId={onAddUser}
                userSearch={userSearch}
                compact
                autoFocus={editing}
                onDone={onSearchDone}
            />
        </Box>
        : canAdd ?
        // Styled like an empty entry so it lines up with the entries next to it
        <Button
            onClick={() => setEditing(true)}
            startIcon={<PersonAddIcon />}
            sx={{
                minWidth: smallScreen ? undefined : "200px",
                padding: smallScreen ? 1 : 0.5,
                borderRadius: 1,
                border: "1px dashed",
                borderColor: "divider",
                color: "text.secondary",
                textTransform: "none",
                "&:hover": {
                    borderColor: "text.secondary"
                }
            }}
        >
            Add user
        </Button>
        : null;

    return (
        <Paper sx={{ padding: 2 }}>
            <Typography component="h2" variant="subtitle2">
                Users ({entries.length}/{MAX_ENTRIES})
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: smallScreen ? "column" : "row",
                    flexWrap: "wrap",
                    gap: 1,
                    mt: 1
                }}>
                {entries.map((entry, index) => {
                    const userInfo = idToUser[entry.userId];
                    const user = userInfo?.user;
                    const color = ENTRY_COLORS[index % ENTRY_COLORS.length];

                    return (
                        <Box
                            key={`${entry.userId}-${entry.style}-${index}`}
                            sx={{
                                display: "flex",
                                flexDirection: smallScreen ? "column" : "row",
                                alignItems: smallScreen ? "flex-start" : "center",
                                gap: smallScreen ? 0.5 : 1,
                                padding: smallScreen ? 1 : 0.5,
                                paddingLeft: 1,
                                borderRadius: 1,
                                border: `1px solid ${alpha(color, 0.4)}`,
                                backgroundColor: alpha(color, 0.1),
                                minWidth: smallScreen ? undefined : "200px",
                            }}
                        >
                            {/* Avatar + username row */}
                            <Box sx={{
                                display: "flex"
                            }}>
                                <Link
                                    to={{pathname: user ? `/users/${user.userId}` : "/users", search: `?style=${entry.style}&game=${game}`}}
                                    component={RouterLink}
                                    color="textPrimary"
                                    underline="hover"
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 1
                                    }}>
                                    <UserAvatar
                                        sx={{ height: 32, width: 32 }}
                                        username={user?.username ?? "..."}
                                        userThumb={user?.userThumb}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: smallScreen ? undefined : "150px"
                                        }}>
                                        {user?.username ?? "Loading..."}
                                    </Typography>
                                </Link>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    mt: smallScreen ? 0.5 : 0
                                }}>
                                {/* Style selector */}
                                <StyleSelector
                                    game={game}
                                    style={entry.style}
                                    setStyle={(style) => onStyleChange(index, style as Style)}
                                    label="Style"
                                />
                                {/* Action buttons */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}>
                                    <Tooltip title="Duplicate" disableInteractive>
                                        <Box component="span">
                                            <IconButton
                                                size="small"
                                                onClick={() => onDuplicate(index)}
                                                disabled={
                                                    entries.length >= MAX_ENTRIES ||
                                                    getAllowedStyles(game).every(s =>
                                                        entries.some(e => e.userId === entry.userId && e.style === s)
                                                    )
                                                }
                                            >
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Tooltip>
                                    <IconButton size="small" onClick={() => onRemove(index)}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>
                    );
                })}
                {addSlot}
            </Box>
        </Paper>
    );
}

export default CompareEntryList;
