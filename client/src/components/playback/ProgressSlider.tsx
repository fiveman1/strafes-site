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

interface HoveredMarker {
    marker: CommentMarker
    // Where the marker is on the screen
    x: number
    y: number
}

/** Drawn over the 30% white track, so downloaded parts read as a lighter gray */
const BUFFERED_COLOR = "rgba(255, 255, 255, 0.35)";

function ProgressSlider(props: ProgressSliderProps) {
    const { min, max, time, downloadStats, onDragPlayback, onSetPlayback, isDragging, setIsDragging, canvasRef, setThumbTime, displayThumb, thumbEnabled, setShowingThumb, markers, onMarkerClick } = props;
    const [hoveredMarker, setHoveredMarker] = useState<HoveredMarker | undefined>(undefined);
    const theme = useTheme();
    const [isHovering, setIsHovering] = useState(false);
    const [showThumb, setShowThumb] = useState(false);
    const [thumbTime, setThumbTimeFormatted] = useState("");
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLSpanElement>(null);
    const fillRef = useRef<HTMLSpanElement>(null);
    const bufferedRef = useRef<HTMLSpanElement>(null);
    const handleRef = useRef<HTMLSpanElement>(null);

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
    const hoveredNow = hoveredMarker && shownMarkers?.find((marker) => marker.seconds === hoveredMarker.marker.seconds);
    const shownHover = hoveredMarker && hoveredNow ? { ...hoveredMarker, marker: hoveredNow } : undefined;

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
            if (!ref.current || !isDragging) return;
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("mousemove", handler);
        return () => {
            document.removeEventListener("mousemove", handler);
        }
    }, [isDragging, max, min, onDragPlayback]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!ref.current || !isDragging) return;
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
    }, [isDragging, max, min, onSetPlayback, setIsDragging]);

    useEffect(() => {
        const handler = (event: TouchEvent) => {
            if (!ref.current || !isDragging || event.touches.length !== 1 || event.targetTouches.length !== 1) return;
            event.preventDefault();
            const rect = ref.current.getBoundingClientRect();
            const x = clamp(event.targetTouches[0].clientX, rect.left, rect.right);
            const newPlayback = normalize(x, rect.left, rect.right, min, max);
            onDragPlayback(newPlayback);
        };
        document.addEventListener("touchmove", handler, { passive: false });
        return () => {
            document.removeEventListener("touchmove", handler);
        }
    }, [isDragging, max, min, onDragPlayback]);

    useEffect(() => {
        const handler = (event: TouchEvent) => {
            if (!ref.current || !isDragging || event.changedTouches.length !== 1) return;
            event.preventDefault();
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
    }, [isDragging, max, min, onSetPlayback, setIsDragging]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = clamp(e.clientX, rect.left, rect.right);
        const newPlayback = normalize(x, rect.left, rect.right, min, max);
        onDragPlayback(newPlayback);
    }, [max, min, onDragPlayback, setIsDragging]);

    const onPointerEnter = useCallback((e: React.PointerEvent) => {
        setIsHovering(true);
        if (e.pointerType === "mouse") {
            setShowThumb(true);
            setShowingThumb(true);
        }
    }, [setShowingThumb]);

    const onPointerLeave = useCallback((e: React.PointerEvent) => {
        setIsHovering(false);
        if (e.pointerType === "mouse") {
            setShowThumb(false);
            setShowingThumb(false);
        }
    }, [setShowingThumb]);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setCoords({
            x: e.clientX,
            y: rect.y
        });
        const x = clamp(e.clientX, rect.left, rect.right);
        const time = normalize(x, rect.left, rect.right, min,max);
        setThumbTime(time);
        setThumbTimeFormatted(formatTime(Math.round(Math.max(0, time * 1000)), true))
    }, [max, min, setThumbTime]);

    const thumbHeight = PLAYER_THUMB_HEIGHT;
    const thumbWidth = PLAYER_THUMB_HEIGHT * PLAYER_ASPECT_RATIO;
    return (
        <>
            {displayThumb && <Box
                sx={{
                    position: "fixed",
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
                    left: `${coords.x - (thumbWidth / 2)}px`,
                    top: `${coords.y - thumbHeight - 28}px`,
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
                    position: "fixed",
                    width: `${thumbWidth}px`,
                    display: showThumb && !shownHover ? "flex" : "none",
                    justifyContent: "center",
                    pointerEvents: "none"
                }}
                style={{
                    left: `${coords.x - (thumbWidth / 2)}px`,
                    top: `${coords.y - 24}px`,
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
            {shownHover &&
            <Box
                sx={{
                    position: "fixed",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    transform: "translate(-50%, -100%)",
                    pointerEvents: "none",
                    zIndex: 1
                }}
                style={{
                    left: shownHover.x,
                    top: shownHover.y - 8
                }}>
                {shownHover.marker.comments.slice(0, MARKER_PREVIEW_COUNT).map((item) => (
                    <CommentPreview key={item.comment.id} {...item} showTimestamp sx={{ width: 260, maxWidth: "80vw" }} />
                ))}
                {shownHover.marker.comments.length > MARKER_PREVIEW_COUNT &&
                <Typography variant="caption" sx={{ alignSelf: "center", px: 0.75, borderRadius: "4px", bgcolor: "#000000b0", color: "white" }}>
                    +{shownHover.marker.comments.length - MARKER_PREVIEW_COUNT} more
                </Typography>}
            </Box>}
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
                    const unhover = () => setHoveredMarker((old) => old?.marker.seconds === marker.seconds ? undefined : old);
                    return (
                        <Box
                            key={marker.seconds}
                            component="button"
                            aria-label={label}
                            onPointerDown={(event: React.PointerEvent) => {
                                // Not to the bar underneath, which would start a drag
                                event.stopPropagation();
                                if (event.button !== 0) return;
                                onMarkerClick?.(marker.seconds);
                            }}
                            onClick={(event: React.MouseEvent) => {
                                event.stopPropagation();
                                // Pointers already seeked on pointer down; this is Enter or Space
                                if (event.detail === 0) onMarkerClick?.(marker.seconds);
                            }}
                            onPointerEnter={(event: React.PointerEvent<HTMLElement>) => {
                                if (event.pointerType !== "mouse") return;
                                const rect = event.currentTarget.getBoundingClientRect();
                                setHoveredMarker({ marker: marker, x: rect.left + rect.width / 2, y: rect.top });
                            }}
                            onPointerLeave={unhover}
                            onFocus={(event: React.FocusEvent<HTMLElement>) => {
                                // Keyboard focus only; hovering covers the mouse
                                if (!event.currentTarget.matches(":focus-visible")) return;
                                const rect = event.currentTarget.getBoundingClientRect();
                                setHoveredMarker({ marker: marker, x: rect.left + rect.width / 2, y: rect.top });
                            }}
                            onBlur={unhover}
                            style={{ left: `${clamp((marker.seconds - min) / (max - min) * 100, 0, 100)}%` }}
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
            </Box>
        </>);
}

export default ProgressSlider;