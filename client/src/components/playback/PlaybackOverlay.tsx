import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import ProgressSlider from "./ProgressSlider";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

interface PlaybackOverlayProps {
    duration: number
    time: number
    paused: boolean
    offset: number
    fullscreen: boolean
    onDragPlayback: (time: number) => void
    onSetPlayback: (time: number) => void
    onSetPause: (pause: boolean) => void
    onFullscreen: (fullscreen: boolean) => void
    onSeek: (offset: number) => void
    onReset: () => void
}

function PlaybackOverlay(props: PlaybackOverlayProps) {
    const { time, duration, paused, offset, fullscreen, onDragPlayback, onSetPlayback, onSetPause, onFullscreen, onSeek, onReset } = props;
    const [ isHovering, setIsHovering ] = useState(false);
    const [ isBottomHovering, setIsBottomHovering ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ wasRecentAction, setWasRecentAction ] = useState(false);
    const [ wasRecentMouseOver, setWasRecentMouseOver ] = useState(false);
    const lastAction = useRef(0);
    const lastMouseOver = useRef(0);
    const verySmallScreen = useMediaQuery("(max-width: 480px)");
    const smallScreen = useMediaQuery("(max-width: 800px)");
    const bottomDivId = useId();

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            setWasRecentAction((now - lastAction.current) < 3000);
            setWasRecentMouseOver((now - lastMouseOver.current) < 3000);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const onMouseMove = useCallback(() => {
        setWasRecentMouseOver(true);
        lastMouseOver.current = new Date().getTime();
        setIsHovering(true);
    }, []);

    const onTouchMove = useCallback(() => {
        setWasRecentAction(true);
        lastAction.current = new Date().getTime();
        setIsHovering(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsHovering(false);
    }, []);

    const onBottomMouseOver = useCallback(() => {
        setIsBottomHovering(true);
    }, []);

    const onBottomMouseLeave = useCallback(() => {
        setIsBottomHovering(false);
    }, []);

    const onPausePlay = useCallback(() => {
        onSetPause(!paused);
    }, [onSetPause, paused]);

    const onTouchPausePlay = useCallback(() => {
        setWasRecentAction(true);
        lastAction.current = new Date().getTime();
        onSetPause(!paused);
    }, [onSetPause, paused]);

    const onSwapFullscreen = useCallback(() => {
        onFullscreen(!fullscreen);
    }, [fullscreen, onFullscreen]);

    const onTouchFullscreen = useCallback(() => {
        setWasRecentAction(true);
        lastAction.current = new Date().getTime();
        onFullscreen(!fullscreen);
    }, [fullscreen, onFullscreen]);

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        let didAction = false;
        
        if (event.code === "Space") {
            didAction = true;
            onPausePlay();
        }
        else if (event.key === "ArrowLeft") {
            didAction = true;
            onSeek(-3);
        }
        else if (event.key === "ArrowRight") {
            didAction = true;
            onSeek(3);
        }
        else if (event.code === "KeyF") {
            didAction = true;
            onSwapFullscreen();
        }
        else if (event.code === "KeyR") {
            didAction = true;
            onReset();
        }

        if (didAction) {
            event.preventDefault();
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
        }
    }, [onPausePlay, onReset, onSeek, onSwapFullscreen]);

    useEffect(() => {
        document.addEventListener("keyup", onKeyUp)
        return () => {
            document.removeEventListener("keyup", onKeyUp);
        };
    }, [onKeyUp]);

    useEffect(() => {
        const div = document.getElementById(bottomDivId);
        if (!div) return;
        
        const touchStart = (event: TouchEvent) => {
            setIsBottomHovering(true);
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
            event.preventDefault();
        }

        const touchEnd = (event: TouchEvent) => {
            setIsBottomHovering(false);
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
            event.preventDefault();
        }

        div.addEventListener("touchstart", touchStart, { passive: false });
        div.addEventListener("touchend", touchEnd, { passive: false });
        return () => {
            div.removeEventListener("touchstart", touchStart);
            div.addEventListener("touchend", touchEnd);
        }
    }, [bottomDivId])

    const timeFormatted = formatTime(Math.round(Math.max(0, time * 1000)), smallScreen);
    const durationFormatted = formatTime(Math.round(duration * 1000), smallScreen);
    const timeText = verySmallScreen ? timeFormatted : `${timeFormatted} / ${durationFormatted}`;
    const timeTextWidth = (timeText.length * 8) + 16;
    const shouldShow = wasRecentAction || (isHovering && wasRecentMouseOver) || isDragging || isBottomHovering;
    
    return (
        <Box 
            width="100%" 
            height="100%" 
            display="flex" 
            flexDirection="column" 
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onMouseLeave={onMouseLeave}
            onTouchEnd={onMouseLeave}
            onDoubleClick={onSwapFullscreen}
            sx={{
                transition: "opacity .4s ease",
                userSelect: "none",
                opacity: shouldShow ? 1 : 0,
                WebkitTapHighlightColor: "transparent"
            }}
            style={{ cursor: shouldShow ? "default" : "none" }}
        >
            <Box flexGrow={1} onClick={onPausePlay} />
            <Box 
                width="100%" 
                height="40px" 
                display="flex" 
                alignItems="center" 
                p={1}
                id={bottomDivId}
                onMouseOver={onBottomMouseOver}
                onMouseLeave={onBottomMouseLeave}
            >
                <IconButton 
                    size="small" 
                    onClick={onPausePlay} 
                    onTouchEnd={onTouchPausePlay}
                    sx={{
                        color: "white",
                        bgcolor: "#00000080",
                        "&:hover": {
                            bgcolor: "#42424280"
                        }
                    }}
                >
                    {paused ? <PlayArrowIcon /> : <PauseIcon />}
                </IconButton>
                <Typography 
                    variant="subtitle2" 
                    minWidth={`${timeTextWidth}px`}
                    width={`${timeTextWidth}px`}
                    bgcolor="#00000080" 
                    color="white" 
                    fontFamily="monospace"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="4px"
                    ml={1}
                    mr={1.5}
                >
                    {timeText}
                </Typography>
                <ProgressSlider 
                    min={-offset}
                    max={duration}
                    value={time}
                    onDragPlayback={onDragPlayback}
                    onSetPlayback={onSetPlayback}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                />
                <IconButton 
                    size="small" 
                    onClick={onSwapFullscreen} 
                    onTouchEnd={onTouchFullscreen}
                    sx={{
                        color: "white",
                        bgcolor: "#00000080",
                        "&:hover": {
                            bgcolor: "#42424280"
                        },
                        ml: 1.5
                    }}
                >
                    {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
            </Box>
        </Box>
    );
}

export default PlaybackOverlay;