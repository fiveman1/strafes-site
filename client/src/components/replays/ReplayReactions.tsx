import { MouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, keyframes, SxProps, Theme } from "@mui/material/styles";
import AddReactionOutlinedIcon from "@mui/icons-material/AddReactionOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoginUser, MAX_REACTIONS_PER_USER, REPLAY_REACTIONS, ReplayReaction, ReplayReactionCount, ReplayReactions as ReplayReactionsData, ReplayReactionsUpdate } from "shared";
import { queries } from "../../api/queries";
import { login, setReplayReaction } from "../../api/api";
import { useReplayStream } from "../../api/replayStream";
import { applyReaction, formatReactors, getReactionInfo, mergeReactionUpdate, REACTION_IMAGES } from "../../common/reactions";

// The browser draws an animating chip (see PopIn) at its exact position, then snaps it to whole pixels when the
// animation ends, so anything on a half pixel jumps a little. These sizes keep every offset whole:
// (31px row - 27px chip) / 2 = 2px, and inside the 25px between the borders, (25 - 17px emoji) / 2 = 4px
// and (25 - 13px count) / 2 = 6px.
const CHIP_HEIGHT = 27;
const CHIP_EMOJI_SIZE = 17;

// The new count rolls in from below when it goes up, or from above when it goes down
const countUp = keyframes`
    from { transform: translateY(75%); opacity: 0; }
    to { transform: none; opacity: 1; }
`;
const countDown = keyframes`
    from { transform: translateY(-75%); opacity: 0; }
    to { transform: none; opacity: 1; }
`;

function AnimatedCount(props: { count: number }) {
    const { count } = props;
    const [previous, setPrevious] = useState(count);
    const [direction, setDirection] = useState<"up" | "down" | undefined>(undefined);
    // Set during render rather than in an effect, so the new number never shows for a frame without its animation.
    // Nothing animates on the first render, so counts don't roll in when the page loads.
    if (count !== previous) {
        setPrevious(count);
        setDirection(count > previous ? "up" : "down");
    }

    return (
        <Box
            // A new element for each count restarts the animation
            key={count}
            component="span"
            sx={{
                display: "inline-block",
                animation: direction ? `${direction === "up" ? countUp : countDown} 180ms ease-out` : "none",

                "@media (prefers-reduced-motion: reduce)": {
                    animation: "none"
                }
            }}>
            {count}
        </Box>
    );
}

const popIn = keyframes`
    from { transform: scale(0.5); opacity: 0; }
    to { transform: none; opacity: 1; }
`;

/** Scales in when it first shows, if animate was set then. Changing animate later does nothing. */
function PopIn(props: { animate: boolean, children: ReactNode }) {
    const [animate] = useState(props.animate);
    return (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                // overshoots a little before settling
                animation: animate ? `${popIn} 220ms cubic-bezier(0.34, 1.4, 0.64, 1)` : "none",

                "@media (prefers-reduced-motion: reduce)": {
                    animation: "none"
                }
            }}>
            {props.children}
        </Box>
    );
}

function getMutationKey(timeId: string) {
    return ["replays", "reactions", timeId];
}

interface ReactionChange {
    reaction: ReplayReaction
    active: boolean
}

interface ReplayReactionsProps {
    timeId: string
    loginUser: LoginUser | undefined
    sx?: SxProps<Theme>
}

function chipSx(reacted: boolean) {
    return (theme: Theme) => ({
        height: CHIP_HEIGHT,
        px: 0.75,
        gap: 0.5,
        borderRadius: "8px",
        border: "1px solid",
        borderColor: reacted ? theme.palette.secondary.main : "transparent",
        bgcolor: reacted ? alpha(theme.palette.secondary.main, 0.16) : alpha(theme.palette.text.primary, 0.07),
        transition: "border-color .15s ease, background-color .15s ease",

        ":hover": {
            borderColor: reacted ? theme.palette.secondary.main : alpha(theme.palette.text.primary, 0.3)
        }
    });
}

function ReactionImage(props: { reaction: ReplayReaction, size: number }) {
    const { reaction, size } = props;
    return (
        <img
            src={REACTION_IMAGES[reaction]}
            alt={getReactionInfo(reaction).emoji}
            width={size}
            height={size}
            draggable={false}
            style={{ display: "block", filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.8))" }}
        />
    );
}

function ReplayReactions(props: ReplayReactionsProps) {
    const { timeId, loginUser, sx } = props;
    const queryClient = useQueryClient();

    const reactionsQueryOptions = queries.replays.reactions(timeId, loginUser?.userId);
    const reactionsQuery = useQuery(reactionsQueryOptions);
    const queryKey = reactionsQueryOptions.queryKey;
    const mutationKey = getMutationKey(timeId);
    const userId = loginUser?.userId;

    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    // Set when a live update was skipped because the user had a change in flight
    const missedUpdate = useRef(false);

    // Chips there when a replay's reactions first load just appear. Ones added after that (by anyone) pop in.
    const hasData = reactionsQuery.data !== undefined;
    const [popInFor, setPopInFor] = useState<string | undefined>(undefined);
    useEffect(() => {
        if (hasData) setPopInFor(timeId);
    }, [hasData, timeId]);

    // Live updates while the tab is visible. The server starts every connection with the current totals, so nothing's
    // missed while hidden or reconnecting.
    useReplayStream(timeId, {
        reactions: (data) => {
            if (queryClient.isMutating({ mutationKey: getMutationKey(timeId) }) > 0) {
                // This could be from before or after the user's own change, so it can't safely replace what's shown.
                // Fetch once their changes finish instead.
                missedUpdate.current = true;
                return;
            }
            const update = JSON.parse(data) as ReplayReactionsUpdate;
            const key = queries.replays.reactions(timeId, userId).queryKey;
            queryClient.setQueryData<ReplayReactionsData | null>(key, (current) => mergeReactionUpdate(current, update));
        }
    });

    const mutation = useMutation({
        mutationKey: mutationKey,
        // Changes to the same replay are sent one at a time, so the server sees them in the order they were made
        scope: { id: `reactions-${timeId}` },
        mutationFn: async (change: ReactionChange) => {
            const result = await setReplayReaction(timeId, change.reaction, change.active);
            if (!result) throw new Error("Failed to update reaction");
            return result;
        },
        onMutate: async (change: ReactionChange) => {
            // Don't let a fetch that started before this change land on top of it
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<ReplayReactionsData | null>(queryKey);
            if (previous) {
                queryClient.setQueryData(queryKey, applyReaction(previous, change.reaction, change.active, loginUser));
            }
            return { previous };
        },
        onSuccess: (data) => {
            // If more changes are queued, the server's answer is already out of date, so wait for the last one
            if (queryClient.isMutating({ mutationKey }) === 1) {
                queryClient.setQueryData(queryKey, data);
            }
        },
        onError: (_error, _change, context) => {
            if (queryClient.isMutating({ mutationKey }) === 1 && context?.previous) {
                queryClient.setQueryData(queryKey, context.previous);
            }
            queryClient.invalidateQueries({ queryKey });
        },
        onSettled: () => {
            if (queryClient.isMutating({ mutationKey }) === 1 && missedUpdate.current) {
                missedUpdate.current = false;
                queryClient.invalidateQueries({ queryKey });
            }
        }
    });

    const onLogin = useCallback(async () => {
        const url = await login(window.location.pathname.slice(1) + window.location.search);
        if (url) window.location.href = url; // Force external redirect
    }, []);

    const reactions = reactionsQuery.data?.reactions ?? [];
    const reactedSet = new Set(reactions.filter((entry) => entry.reacted).map((entry) => entry.reaction));
    // The server enforces this too, this just keeps the UI from offering what it would reject
    const atLimit = reactedSet.size >= MAX_REACTIONS_PER_USER;
    const canAdd = (reaction: ReplayReaction) => reactedSet.has(reaction) || !atLimit;
    const limitText = `You can add up to ${MAX_REACTIONS_PER_USER} reactions. Remove one to add another.`;

    const toggle = (reaction: ReplayReaction) => {
        if (!canAdd(reaction)) return;
        mutation.mutate({ reaction, active: !reactedSet.has(reaction) });
    };

    const onChipClick = (event: MouseEvent<HTMLElement>, entry: ReplayReactionCount) => {
        if (!loginUser) {
            setAnchor(event.currentTarget);
            return;
        }
        toggle(entry.reaction);
    };

    const onPick = (reaction: ReplayReaction) => {
        setAnchor(null);
        toggle(reaction);
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 0.5,
                // Same height whether or not the reactions have loaded, so the player doesn't resize when they do
                minHeight: CHIP_HEIGHT,
                ...sx
            }}>
            {reactions.map((entry) => {
                const info = getReactionInfo(entry.reaction);
                // Logged out users get the login prompt instead
                const blocked = loginUser !== undefined && !canAdd(entry.reaction);
                return (
                    <PopIn key={entry.reaction} animate={popInFor === timeId}>
                        <Tooltip
                            placement="top"
                            arrow
                            disableInteractive
                            title={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.25 }}>
                                    <ReactionImage reaction={entry.reaction} size={32} />
                                    <Box>
                                        <Typography variant="body2">
                                            {formatReactors(entry.users, entry.count, entry.reacted, loginUser, info.label)}
                                        </Typography>
                                        {blocked &&
                                        <Typography variant="caption" sx={{ display: "block", opacity: 0.75 }}>
                                            {limitText}
                                        </Typography>}
                                    </Box>
                                </Box>
                            }>
                            <ButtonBase
                                aria-label={`${info.label}: ${entry.count}`}
                                aria-pressed={entry.reacted}
                                aria-disabled={blocked || undefined}
                                onClick={(event) => onChipClick(event, entry)}
                                sx={[chipSx(entry.reacted), blocked && { cursor: "default" }]}>
                                <ReactionImage reaction={entry.reaction} size={CHIP_EMOJI_SIZE} />
                                <Typography
                                    component="span"
                                    sx={{
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        // A whole pixel height, see CHIP_HEIGHT
                                        lineHeight: "13px",
                                        fontVariantNumeric: "tabular-nums",
                                        // Clips the rolling number to its own line
                                        display: "inline-flex",
                                        overflow: "hidden"
                                    }}>
                                    <AnimatedCount count={entry.count} />
                                </Typography>
                            </ButtonBase>
                        </Tooltip>
                    </PopIn>
                );
            })}
            <Tooltip placement="top" arrow disableInteractive title="Add reaction">
                <ButtonBase
                    aria-label="Add reaction"
                    aria-haspopup="dialog"
                    onClick={(event) => setAnchor(event.currentTarget)}
                    sx={[chipSx(false), { color: "text.secondary", ":hover": { color: "text.primary" } }]}>
                    <AddReactionOutlinedIcon sx={{ fontSize: 18 }} />
                </ButtonBase>
            </Tooltip>
            <Popover
                open={anchor !== null}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                slotProps={{ paper: { sx: { mt: -0.75 } } }}>
                {loginUser ?
                <Box sx={{ p: 0.75 }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 0.5
                    }}>
                    {REPLAY_REACTIONS.map((info) => {
                        const reacted = reactedSet.has(info.key);
                        const disabled = !canAdd(info.key);
                        return (
                            <Tooltip key={info.key} placement="top" disableInteractive title={info.label}>
                                <ButtonBase
                                    aria-label={info.label}
                                    aria-pressed={reacted}
                                    aria-disabled={disabled || undefined}
                                    // Not disabled outright, which would stop its tooltip from showing
                                    onClick={() => !disabled && onPick(info.key)}
                                    sx={(theme) => ({
                                        width: 40,
                                        height: 40,
                                        borderRadius: "8px",
                                        bgcolor: reacted ? alpha(theme.palette.secondary.main, 0.16) : "transparent",
                                        opacity: disabled ? 0.35 : 1,
                                        cursor: disabled ? "default" : "pointer",

                                        ":hover": {
                                            bgcolor: reacted ? alpha(theme.palette.secondary.main, 0.24) : alpha(theme.palette.text.primary, 0.08)
                                        },
                                        "img": {
                                            transition: "transform .1s ease"
                                        },
                                        ":hover img": {
                                            transform: disabled ? "none" : "scale(1.15)"
                                        }
                                    })}>
                                    <ReactionImage reaction={info.key} size={26} />
                                </ButtonBase>
                            </Tooltip>
                        );
                    })}
                </Box>
                {atLimit &&
                <Typography variant="caption" sx={{ display: "block", mt: 0.75, px: 0.25, maxWidth: 4 * 40 + 3 * 4, color: "text.secondary" }}>
                    {limitText}
                </Typography>}
                </Box>
                :
                <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">Log in to react to replays</Typography>
                    <Button variant="contained" size="small" onClick={onLogin}>Log in</Button>
                </Box>}
            </Popover>
        </Box>
    );
}

export default ReplayReactions;
