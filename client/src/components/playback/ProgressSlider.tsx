import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { clamp, normalize } from "../../common/utils";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import { PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT } from "../../common/common";

interface ProgressSliderProps {
    min: number
    max: number
    value: number
    onDragPlayback: (time: number) => void
    onSetPlayback: (time: number) => void
    isDragging: boolean
    setIsDragging: (drag: boolean) => void
    canvasRef: React.Ref<HTMLCanvasElement>
    setThumbTime: (time: number) => void
}

function ProgressSlider(props: ProgressSliderProps) {
    const { min, max, value, onDragPlayback, onSetPlayback, isDragging, setIsDragging, canvasRef, setThumbTime } = props;
    const theme = useTheme();
    const [isHovering, setIsHovering] = useState(false);
    const [showThumb, setShowThumb] = useState(false);
    const [thumbTime, setThumbTimeFormatted] = useState("");
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLSpanElement>(null);

    const diff = max - min;
    const lerp = (value - min) / diff;
    const offset = `${lerp * 100}%`;

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
        }
    }, []);

    const onPointerLeave = useCallback((e: React.PointerEvent) => {
        setIsHovering(false);
        if (e.pointerType === "mouse") {
            setShowThumb(false);
        }
    }, []);

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
            <Box
                sx={{
                    position: "fixed",
                    width: `${thumbWidth}px`,
                    height: `${thumbHeight}px`,
                    display: showThumb ? "block" : "none",
                    borderRadius: "4px",
                    border: "1px solid #ffffff49"
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
            </Box>
            <Box
                sx={{
                    position: "fixed",
                    width: `${thumbWidth}px`,
                    display: showThumb ? "flex" : "none",
                    justifyContent: "center"
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
                        fontFamily: "monospace",
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
                    style={{
                        width: offset
                    }}
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
                    style={{
                        left: offset
                    }}
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
            </Box>
        </>);
}

export default ProgressSlider;