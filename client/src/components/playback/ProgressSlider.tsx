import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { clamp, normalize } from "../../common/utils";
import { PlaybackTime } from "./playbackTime";
import { DownloadStats, DownloadStatsStore } from "./downloadStats";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import { PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT } from "../../common/common";
import { CommentMarker, mergeCloseMarkers } from "../../common/comments";
import UserAvatar from "../displays/UserAvatar";
import CommentPreview from "../replays/comments/CommentPreview";

// Comments listed when hovering a marker; the rest are counted
const MARKER_PREVIEW_COUNT = 3;
const MARKER_SIZE = 16;
// How far a press on a marker has to move before it drags instead of staying on the marker's time
const MARKER_DRAG_THRESHOLD = 6;

interface ProgressSliderProps {
    min: number
    max: number
    time: PlaybackTime
    /** Downloaded parts of the replay are drawn lighter on the bar */
    downloadStats: DownloadStatsStore
    onDragPlayback: (time: number) => void
    onSetPlayback: (time: number) => void
    isDragging: boolean
    setIsDragging: (drag: boolean) => void
    canvasRef: React.Ref<HTMLCanvasElement>
    setThumbTime: (time: number) => void
    /** Whether there's a thumbnail canvas. It stays mounted, since the player draws into that exact canvas. */
    displayThumb: boolean
    /** Whether the thumbnail shows while hovering */
    thumbEnabled: boolean
    setShowingThumb: (showing: boolean) => void
    markers?: CommentMarker[]
    onMarkerClick?: (seconds: number) => void
}

/** Drawn over the 30% white track, so downloaded parts read as a lighter gray */
const BUFFERED_COLOR = "rgba(255, 255, 255, 0.35)";

function ProgressSlider(props: ProgressSliderProps) {
    const { min, max, time, downloadStats, onDragPlayback, onSetPlayback, isDragging, setIsDragging, canvasRef, setThumbTime, displayThumb, thumbEnabled, setShowingThumb, markers, onMarkerClick } = props;
    // By time, since the marker shown there can change
    const [hoveredSeconds, setHoveredSeconds] = useState<number | undefined>(undefined);
    const theme = useTheme();
    const [isHovering, setIsHovering] = useState(false);
    const [showThumb, setShowThumb] = useState(false);
    const [thumbTime, setThumbTimeFormatted] = useState("");
    // Relative to the bar, so the thumbnail moves with it however the page scrolls or shifts
    const [thumbX, setThumbX] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const fillRef = useRef<HTMLSpanElement>(null);
    const bufferedRef = useRef<HTMLSpanElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);
    // A press on a marker seeks to its exact time, and becomes a normal drag once the pointer moves away
    const pressedMarkerRef = useRef<{ seconds: number, startX: number } | null>(null);
    const stillOnMarker = useCallback((clientX: number) => {
        const pressed = pressedMarkerRef.current;
        if (!pressed) return false;
        if (Math.abs(clientX - pressed.startX) < MARKER_DRAG_THRESHOLD) return true;
        pressedMarkerRef.current = null;
        return false;
    }, []);
    // Ends a drag that never left the marker it started on
    const releaseOnMarker = useCallback(() => {
        const pressed = pressedMarkerRef.current;
        if (!pressed) return false;
        pressedMarkerRef.current = null;
        onSetPlayback(pressed.seconds);
        setIsDragging(false);
        return true;
    }, [onSetPlayback, setIsDragging]);

    // Markers that would overlap become one, which depends on how wide the bar is
    const [barWidth, setBarWidth] = useState(0);
    useEffect(() => {
        const bar = ref.current;
        if (!bar) return;
        const observer = new ResizeObserver((entries) => setBarWidth(entries[0].contentRect.width));
        observer.observe(bar);
        return () => observer.disconnect();
    }, []);
    const shownMarkers = useMemo(() => markers && mergeCloseMarkers(markers, min, max, barWidth, MARKER_SIZE), [markers, min, max, barWidth]);
    // A hovered marker can merge into another or go away (a new or removed comment, a resize) without a pointerleave
    const shownHover = hoveredSeconds === undefined ? undefined : shownMarkers?.find((marker) => marker.seconds === hoveredSeconds);
    const markerLeft = (seconds: number) => `${clamp((seconds - min) / (max - min) * 100, 0, 100)}%`;

    // Progress is written directly instead of rendered, see playbackTime.ts
    useLayoutEffect(() => {
        const update = (value: number) => {
            const offset = `${(value - min) / (max - min) * 100}%`;
            if (fillRef.current) fillRef.current.style.width = offset;
            if (handleRef.current) handleRef.current.style.left = offset;
        };
        update(time.get());
        return time.subscribe(update);
    }, [time, min, max]);

    // The downloaded ranges as one gradient, so any number of them is a single style write
    useLayoutEffect(() => {
        let lastBackground = "";
        const update = (stats: DownloadStats | undefined) => {
            const buffered = bufferedRef.current;
            if (!buffered) return;
            const ranges = stats?.ranges ?? [];
            const stops: string[] = [];
            for (let i = 0; i + 1 < ranges.length; i += 2) {
                const start = clamp((ranges[i] - min) / (max - min) * 100, 0, 100);
                const end = clamp((ranges[i + 1] - min) / (max - min) * 100, 0, 100);
                if (end <= start) continue;
                stops.push(`transparent ${start}%`, `${BUFFERED_COLOR} ${start}%`, `${BUFFERED_COLOR} ${end}%`, `transparent ${end}%`);
            }
            const background = stops.length > 0 ? `linear-gradient(to right, ${stops.join(", ")})` : "none";
            if (background !== lastBackground) {
                buffered.style.background = background;
                lastBackground = background;
            }
        };
        update(downloadStats.get());
        return downloadStats.subscribe(update);
    }, [downloadStats, min, max]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current || !isDragging || stillOnMarker(event.clientX)) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("mousemove", handler);
        return () => {
            document.removeEventListener("mousemove", handler);
        }
    }, [isDragging, max, min, onDragPlayback, stillOnMarker]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current || !isDragging || releaseOnMarker()) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onSetPlayback(newPlayback);
            setIsDragging(false);
        };
        document.addEventListener("mouseup", handler);
        return () => {
            document.removeEventListener("mouseup", handler);
        }
    }, [isDragging, max, min, onSetPlayback, setIsDragging, releaseOnMarker]);

    useEffect(() => {
        const handler = (event: TouchEvent) => {
            if (!ref.current || !isDragging || event.touches.length !== 1 || event.targetTouches.length !== 1) return;
            event.preventDefault();
            if (stillOnMarker(event.targetTouches[0].clientX)) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.targetTouches[0].clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("touchmove", handler, { passive: false });
        return () => {
            document.removeEventListener("touchmove", handler);
        }
    }, [isDragging, max, min, onDragPlayback, stillOnMarker]);

    useEffect(() => {
        const handler = (event: TouchEvent) => {
            if (!ref.current || !isDragging || event.changedTouches.length !== 1) return;
            event.preventDefault();
            if (releaseOnMarker()) return;
            setIsDragging(false);
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.changedTouches[0].clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onSetPlayback(newPlayback);
        };
        document.addEventListener("touchend", handler, { passive: false });
        return () => {
            document.removeEventListener("touchend", handler);
        }
    }, [isDragging, max, min, onSetPlayback, setIsDragging, releaseOnMarker]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        pressedMarkerRef.current = null;
        setIsDragging(true);
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = clamp(e.clientX, rect.left, rect.right);
        const newPlayback = normalize(x, rect.left, rect.right, min, max);
        onDragPlayback(newPlayback);
    }, [max, min, onDragPlayback, setIsDragging]);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setThumbX(e.clientX - rect.left);
        const x = clamp(e.clientX, rect.left, rect.right);
        const time = normalize(x, rect.left, rect.right, min,max);
        setThumbTime(time);
        setThumbTimeFormatted(formatTime(Math.round(Math.max(0, time * 1000)), true));
    }, [max, min, setThumbTime]);

    const onPointerLeave = useCallback((e: React.PointerEvent) => {
        setIsHovering(false);
        if (e.pointerType === "mouse") {
            setShowThumb(false);
            setShowingThumb(false);
        }
    }, [setShowingThumb]);

    const onPointerEnter = useCallback((e: React.PointerEvent) => {
        setIsHovering(true);
        if (e.pointerType === "mouse") {
            setShowThumb(true);
            setShowingThumb(true);
            onMouseMove(e);
        }
    }, [onMouseMove, setShowingThumb]);

    const thumbHeight = PLAYER_THUMB_HEIGHT;
    const thumbWidth = PLAYER_THUMB_HEIGHT * PLAYER_ASPECT_RATIO;
    return (
        <>
            <Box
                component="span"
                ref={ref}
                onPointerDown={onPointerDown}
                onPointerEnter={onPointerEnter}
                onPointerLeave={onPointerLeave}
                onMouseMove={onMouseMove}
                sx={{
                    position: "relative",
                    width: "100%",
                    height: "40px",
                    cursor: "pointer"
                }}>
                {displayThumb && <Box
                    sx={{
                        position: "absolute",
                        width: `${thumbWidth}px`,
                        height: `${thumbHeight}px`,
                        // A marker's comments show in its place
                        display: showThumb && thumbEnabled && !shownHover ? "block" : "none",
                        // If it were ever under the cursor, the bar would lose the hover and it would flicker
                        pointerEvents: "none",
                        borderRadius: "4px",
                        border: "1px solid #ffffff49",
                        background: "rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(6px)"
                    }}
                    style={{
                        left: `${thumbX - (thumbWidth / 2)}px`,
                        top: `${-thumbHeight - 28}px`,
                    }}
                >
                    <canvas 
                        ref={canvasRef}
                        style={{
                            borderRadius: "4px",
                            width: "100%",
                            height: "100%"
                        }}
                    />
                </Box>}
                <Box
                    sx={{
                        position: "absolute",
                        width: `${thumbWidth}px`,
                        display: showThumb && !shownHover ? "flex" : "none",
                        justifyContent: "center",
                        pointerEvents: "none"
                    }}
                    style={{
                        left: `${thumbX - (thumbWidth / 2)}px`,
                        top: "-24px",
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            display: "inline-flex",
                            bgcolor: "#00000080",
                            color: "white",
                            fontFamily: '"Geist Mono", monospace',
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            px: 0.75
                        }}
                    >
                        {thumbTime}
                    </Typography>
                </Box>
                <Box
                    component="span"
                    sx={{
                        position: "absolute",
                        width: "100%",
                        height: "6px",
                        top: "50%",
                        borderRadius: "2px",
                        bgcolor: "white",
                        transform: "translateY(-50%)",
                        opacity: 0.3
                    }} />
                <Box
                    component="span"
                    ref={bufferedRef}
                    sx={{
                        position: "absolute",
                        width: "100%",
                        height: "6px",
                        top: "50%",
                        borderRadius: "2px",
                        transform: "translateY(-50%)"
                    }} />
                <Box
                    component="span"
                    ref={fillRef}
                    sx={{
                        position: "absolute",
                        width: "100%",
                        height: "8px",
                        top: "50%",
                        left: "0%",
                        borderRadius: "2px",
                        bgcolor: theme.palette.primary.main,
                        transform: "translateY(-50%)",
                        transition: "opacity .15s ease",
                        opacity: isDragging || isHovering ? 1 : 0.7
                    }} />
                <Box
                    component="span"
                    ref={handleRef}
                    sx={{
                        position: "absolute",
                        width: "12px",
                        height: "12px",
                        top: "50%",
                        borderRadius: "50%",
                        bgcolor: theme.palette.primary.main,
                        transform: isDragging || isHovering ? "translate(-50%, -50%) scale(1.25)" : "translate(-50%, -50%)",
                        transition: "transform .15s ease"
                    }} />
                {max > min && shownMarkers?.map((marker) => {
                    const first = marker.comments[0].comment;
                    const count = marker.comments.length;
                    const label = `${count === 1 ? `Comment by @${first.username}` : `${count} comments`} at ${formatTime(marker.seconds * 1000, true)}`;
                    // Only if it's this one, since clicking another marker blurs this one
                    const unhover = () => setHoveredSeconds((old) => old === marker.seconds ? undefined : old);
                    return (
                        <Box
                            key={marker.seconds}
                            component="button"
                            aria-label={label}
                            onPointerDown={(event: React.PointerEvent) => {
                                // Not to the bar underneath, which would drag to the pointer instead of the marker
                                event.stopPropagation();
                                if (event.button !== 0) return;
                                pressedMarkerRef.current = { seconds: marker.seconds, startX: event.clientX };
                                setIsDragging(true);
                                onDragPlayback(marker.seconds);
                            }}
                            onClick={(event: React.MouseEvent) => {
                                event.stopPropagation();
                                // Pointers already seeked on pointer down; this is Enter or Space
                                if (event.detail === 0) onMarkerClick?.(marker.seconds);
                            }}
                            onPointerEnter={(event: React.PointerEvent<HTMLElement>) => {
                                if (event.pointerType !== "mouse") return;
                                setHoveredSeconds(marker.seconds);
                            }}
                            onPointerLeave={unhover}
                            onFocus={(event: React.FocusEvent<HTMLElement>) => {
                                // Keyboard focus only; hovering covers the mouse
                                if (!event.currentTarget.matches(":focus-visible")) return;
                                setHoveredSeconds(marker.seconds);
                            }}
                            onBlur={unhover}
                            style={{ left: markerLeft(marker.seconds) }}
                            sx={{
                                // doubled class so this beats the player's round button style
                                "&&": {
                                    position: "absolute",
                                    top: 0,
                                    width: MARKER_SIZE,
                                    height: MARKER_SIZE,
                                    p: 0,
                                    border: "1.5px solid white",
                                    borderRadius: "50%",
                                    bgcolor: "#00000080",
                                    cursor: "pointer",
                                    transform: "translateX(-50%)",
                                    transition: "transform .1s ease",
                                    boxShadow: "0 0 3px rgba(0, 0, 0, 0.6)"
                                },
                                "&&:hover, &&:focus-visible": {
                                    transform: "translateX(-50%) scale(1.3)",
                                    zIndex: 1
                                }
                            }}>
                            <UserAvatar username={first.username} userThumb={first.userThumb} sx={{ width: "100%", height: "100%", pointerEvents: "none" }} />
                        </Box>
                    );
                })}
                {shownHover &&
                <Box
                    sx={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        transform: "translate(-50%, -100%)",
                        pointerEvents: "none",
                        zIndex: 1
                    }}
                    style={{
                        left: markerLeft(shownHover.seconds),
                        top: -8
                    }}>
                    {shownHover.comments.slice(0, MARKER_PREVIEW_COUNT).map((item) => (
                        <CommentPreview key={item.comment.id} {...item} showTimestamp sx={{ width: 260, maxWidth: "80vw" }} />
                    ))}
                    {shownHover.comments.length > MARKER_PREVIEW_COUNT &&
                    <Typography variant="caption" sx={{ alignSelf: "center", px: 0.75, borderRadius: "4px", bgcolor: "#000000b0", color: "white" }}>
                        +{shownHover.comments.length - MARKER_PREVIEW_COUNT} more
                    </Typography>}
                </Box>}
            </Box>
        </>);
}

export default ProgressSlider;