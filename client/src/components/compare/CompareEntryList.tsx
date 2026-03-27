import { Box, darken, IconButton, lighten, Link, Paper, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Game, Style, User, getAllowedStyles } from "shared";
import UserAvatar from "../displays/UserAvatar";
import StyleSelector from "../forms/StyleSelector";
import { CompareEntry, ENTRY_COLORS, MAX_ENTRIES } from "./types";
import { Link as RouterLink } from "react-router";

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
}

function CompareEntryList(props: ICompareEntryListProps) {
    const { entries, setEntries, idToUser, game } = props;
    const smallScreen = useMediaQuery("@media screen and (max-width: 600px)");
    const theme = useTheme();
    const isLightMode = theme.palette.mode === "light";

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

    if (entries.length === 0) {
        return (
            <Paper elevation={2} sx={{ padding: 2 }}>
                <Typography variant="caption">
                    Users ({entries.length}/{MAX_ENTRIES})
                </Typography>
                <Box display="flex" justifyContent="center">
                    <Typography variant="body2" color="text.secondary">
                        Search for users above to start comparing
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={2} sx={{ padding: 2 }}>
            <Typography variant="caption">
                Users ({entries.length}/{MAX_ENTRIES})
            </Typography>
            <Box
                display="flex"
                flexDirection={smallScreen ? "column" : "row"}
                flexWrap="wrap"
                gap={1}
                mt={0.5}
            >
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
                                borderLeft: `4px solid ${color}`,
                                backgroundColor: isLightMode ? lighten(color, 0.95) : darken(color, 0.8),
                                minWidth: smallScreen ? undefined : "200px",
                            }}
                        >
                            {/* Avatar + username row */}
                            <Box display="flex">
                                <Link
                                    to={{pathname: user ? `/users/${user.userId}` : "/users", search: `?style=${entry.style}&game=${game}`}} 
                                    component={RouterLink}
                                    color="textPrimary"
                                    display="inline-flex"
                                    alignItems="center"
                                    gap={1}
                                >
                                    <UserAvatar
                                        sx={{ height: 32, width: 32 }}
                                        username={user?.username ?? "..."}
                                        userThumb={user?.userThumb}
                                    />
                                    <Typography
                                        variant="body2"
                                        fontWeight="bold"
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            maxWidth: smallScreen ? undefined : "150px",
                                        }}
                                    >
                                        {user?.username ?? "Loading..."}
                                    </Typography>
                                </Link>
                            </Box>
                            <Box display="flex" mt={smallScreen ? 0.5 : 0}>
                                {/* Style selector */}
                                <StyleSelector
                                    game={game}
                                    style={entry.style}
                                    setStyle={(style) => onStyleChange(index, style as Style)}
                                    label="Style"
                                />
                                {/* Action buttons */}
                                <Box display="flex" alignItems="center">
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
            </Box>
        </Paper>
    );
}

export default CompareEntryList;
