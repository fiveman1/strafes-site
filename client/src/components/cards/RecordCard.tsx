import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { formatCourse, formatPlacement, formatStyle, formatTime, Game, MAIN_COURSE, Style, TimeSortBy } from "shared";
import DiffDisplay from "../displays/DiffDisplay";
import DateDisplay from "../displays/DateDisplay";
import { IconButton, Skeleton, Stack, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { useOutletContext } from "react-router";
import { ContextParams } from "../../common/common";
import { useCallback, useState } from "react";
import { useUserSearch } from "../../common/states";
import UserSearch from "../search/UserSearch";
import UserLink from "../displays/UserLink";
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AccountBoxIcon from '@mui/icons-material/AccountBox';

interface RecordCardProps {
    mapId: number,
    course: number,
    game: Game,
    style: Style
}

function RecordCard(props: RecordCardProps) {
    const { mapId, course, game, style } = props;
    const { maps, loginUser } = useOutletContext() as ContextParams;
    const theme = useTheme();
    const smallScreen = useMediaQuery("(max-width: 480px)");
    const userSearch = useUserSearch();

    // Show the searched user if there is one, otherwise fall back to the logged in user
    const [ searchedUserId, setSearchedUserId ] = useState<string>();
    const userId = searchedUserId ?? loginUser?.userId.toString();
    const isCurrentUser = loginUser !== undefined && userId === loginUser.userId.toString();

    // The search replaces the user row while editing, and is always shown when there's no user to show
    const [ editing, setEditing ] = useState(false);
    const showSearch = editing || userId === undefined;
    const onSearchDone = useCallback(() => setEditing(false), []);

    const { setUserText, setSelectedUser } = userSearch;
    const onResetToSelf = useCallback(() => {
        setSearchedUserId(undefined);
        setUserText("");
        setSelectedUser({ username: "" });
    }, [setSelectedUser, setUserText]);

    const userQuery = useQuery({...queries.users.fromId(userId), enabled: userId !== undefined});
    const user = userQuery.data ?? undefined;

    const { data, isLoading } = useQuery({
        ...queries.times.times(0, 99, TimeSortBy.DateDesc, -1, Game.all, Style.all, userId, mapId.toString(), false),
        enabled: userId !== undefined
    });

    const record = data ? data.times.find((time) => time.course === course && time.game === game && time.style === style) : undefined;
    const selectedMap = maps[mapId];
    const mapText = `${selectedMap?.name ?? "n/a"}${course !== MAIN_COURSE ? ` (${formatCourse(course)})` : ""} in ${formatStyle(style)}`;

    return (
        <Paper sx={{padding: 2, display: "flex", flexDirection: "column", gap: 1}}>
            {showSearch ?
            <Box sx={{ width: "100%", maxWidth: smallScreen ? undefined : 280 }}>
                <UserSearch
                    setUserId={setSearchedUserId}
                    userSearch={userSearch}
                    compact
                    autoFocus={editing}
                    onDone={onSearchDone}
                />
            </Box>
            :
            <Box sx={{ display: "flex", alignItems: "center", minHeight: "24px" }}>
                {user ?
                <UserLink
                    userId={user.userId}
                    username={user.username}
                    userRoles={user.userRoles}
                    userCountry={user.userCountry}
                    userThumb={user.userThumb}
                    game={game}
                    strafesStyle={style}
                    underline="hover"
                    variant="body2"
                    sx={{ minWidth: 0 }}
                />
                : userQuery.isLoading ?
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                    <Skeleton variant="text" width={100} sx={{ fontSize: "0.875rem" }} />
                </Box>
                : null}
                <Tooltip title="Search for another user">
                    <IconButton size="small" onClick={() => setEditing(true)} aria-label="Search for another user" sx={{ ml: 0.5 }}>
                        <PersonSearchIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                {loginUser && !isCurrentUser &&
                <Tooltip title="Show your time">
                    <IconButton size="small" onClick={onResetToSelf} aria-label="Show your time">
                        <AccountBoxIcon fontSize="small" />
                    </IconButton>
                </Tooltip>}
            </Box>}
            {userId !== undefined &&
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    minHeight: "20px"
                }}>
                {record ? 
                <>
                <Stack direction="row" useFlexGap divider={<Typography variant="body2" sx={{
                    mx: 1
                }}>-</Typography>}>
                    <Typography
                        variant="body2"
                        color="textPrimary"
                        sx={{
                            display: "inline-block",
                            fontFamily: '"Geist Mono", monospace'
                        }}>
                        {formatPlacement(record.placement)}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0.75
                        }}>
                        <Typography 
                            variant="body2"
                            color="textPrimary"
                            sx={{
                                display: "inline-block",
                                fontFamily: '"Geist Mono", monospace'
                            }}
                        >
                            {formatTime(record.time)}
                        </Typography>
                        <Typography variant="body2">
                            <DiffDisplay ms={record.time} diff={record.wrDiff} />
                        </Typography>
                    </Box>
                    {!smallScreen && <DateDisplay date={record.date} useDateTime color={theme.palette.text.secondary} variant="body2" />}
                </Stack>
                {smallScreen && <DateDisplay date={record.date} useDateTime color={theme.palette.text.secondary} variant="body2" />}
                </>
                :
                isLoading ?
                <Skeleton variant="text" width={smallScreen ? 160 : 280} sx={{ fontSize: "0.875rem" }} />
                :
                <Typography variant="body2" color="textSecondary">
                    {`${isCurrentUser ? "You haven't" : `${user?.username ?? "This user"} hasn't`} completed ${mapText}.`}
                </Typography>}
            </Box>}
        </Paper>
    );
}

export default RecordCard;