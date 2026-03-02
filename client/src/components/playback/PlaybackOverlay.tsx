import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import ProgressSlider from "./ProgressSlider";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SettingsIcon from '@mui/icons-material/Settings';
import Slider from "@mui/material/Slider";
import Popper from "@mui/material/Popper";
import Fade from "@mui/material/Fade";
import SpeedIcon from '@mui/icons-material/Speed';

interface PlaybackOverlayProps {
    duration: number
    time: number
    paused: boolean
    offset: number
    fullscreen: boolean
    speed: number
    onDragPlayback: (time: number) => void
    onSetPlayback: (time: number) => void
    onSetPause: (pause: boolean) => void
    onFullscreen: (fullscreen: boolean) => void
    onSeek: (offset: number) => void
    onReset: () => void
    onSetSpeed: (speed: number) => void
}

function PlaybackOverlay(props: PlaybackOverlayProps) {
    const { time, duration, paused, offset, fullscreen, speed, onDragPlayback, 
        onSetPlayback, onSetPause, onFullscreen, onSeek, onReset, onSetSpeed } = props;
    
    const [ isHovering, setIsHovering ] = useState(false);
    const [ isBottomHovering, setIsBottomHovering ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ wasRecentAction, setWasRecentAction ] = useState(false);
    const [ wasRecentMouseOver, setWasRecentMouseOver ] = useState(false);
    const [ settingsEl, setSettingsEl ] = useState<HTMLButtonElement | null>(null);
    
    const playerRef = useRef<HTMLDivElement>(null);
    const settingsMenuId = useId();
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
    const lastAction = useRef(0);
    const lastMouseOver = useRef(0);
    const isDraggingSpeed = useRef(false);
    const lastChangedSpeed = useRef(0);
    const verySmallScreen = useMediaQuery("(max-width: 480px)");
    const smallScreen = useMediaQuery("(max-width: 800px)");
    const bottomDivId = useId();
    const settingsOpen = Boolean(settingsEl);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            setWasRecentAction((now - lastAction.current) < 3000);
            setWasRecentMouseOver((now - lastMouseOver.current) < 3000);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const onSetPlaybackHandler = useCallback((time: number) => {
        onSetPlayback(time);
    }, [onSetPlayback]);

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

    const onClickSettings = useCallback(() => {
        if (settingsOpen) {
            setSettingsEl(null);
        }
        else {
            setSettingsEl(settingsButtonRef.current);
        }
    }, [settingsOpen]);

    const onChangeSpeed = useCallback((e: Event, speed: number) => {
        onSetSpeed(speed);
        isDraggingSpeed.current = true;
    }, [onSetSpeed]);

    const onClickNormalSpeedButton = useCallback(() => onSetSpeed(1.0), [onSetSpeed]);
    const onClickDoubleSpeedButton = useCallback(() => onSetSpeed(2.0), [onSetSpeed]);
    const onClickHalfSpeedButton = useCallback(() => onSetSpeed(0.5), [onSetSpeed]);

    const onFinishChangingSpeed = useCallback(() => {
        lastChangedSpeed.current = new Date().getTime();
        isDraggingSpeed.current = false;
    }, []);

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.repeat) {
            // If you held the key down for a bit then don't repeat the same action
            return;
        }

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

    const closeSettingsIfClickedOutside = useCallback((target: EventTarget | null, treatAsAction?: boolean) => {
        if (!settingsEl) return;

        const now = new Date().getTime();
        if (isDraggingSpeed.current || now - lastChangedSpeed.current < 10) {
            // Allow up to 10ms window to prevent settings menu from closing
            // In case you were dragging the speed and your cursor went outside the settings menu
            return;
        }

        // The settings button will close the menu if clicked
        // We can keep the menu open when switching to fullscreen
        // And we don't want to close the menu if we clicked on the menu
        if (target && target instanceof Node && 
            (settingsMenuRef.current?.contains(target) 
            || settingsButtonRef.current?.contains(target)
            || fullscreenButtonRef.current?.contains(target))) {
            
            return;
        }

        // Close the settings menu
        setSettingsEl(null);

        if (treatAsAction) {
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
        }
    }, [settingsEl]);

    const getPlayerRef = useCallback(() => playerRef.current, []);

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [onKeyDown]);

    useEffect(() => {
        const div = document.getElementById(bottomDivId);
        if (!div) return;
        
        const touchStart = (event: TouchEvent) => {
            event.preventDefault();
            setIsBottomHovering(true);
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
        };

        const touchEnd = (event: TouchEvent) => {
            event.preventDefault();
            setIsBottomHovering(false);
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();

            if (event.changedTouches.length === 1) {
                const target = event.changedTouches[0].target;
                closeSettingsIfClickedOutside(target, true);
            }
        };

        div.addEventListener("touchstart", touchStart, { passive: false });
        div.addEventListener("touchend", touchEnd, { passive: false });
        return () => {
            div.removeEventListener("touchstart", touchStart);
            div.removeEventListener("touchend", touchEnd);
        };
    }, [bottomDivId, closeSettingsIfClickedOutside]);

    useEffect(() => {
        const handler = (event: PointerEvent) => {
            closeSettingsIfClickedOutside(event.target, event.pointerType === "touch");
        };

        document.addEventListener("pointerup", handler);
        return () => {
            document.removeEventListener("pointerup", handler);
        }
    }, [closeSettingsIfClickedOutside]);

    const timeFormatted = formatTime(Math.round(Math.max(0, time * 1000)), smallScreen);
    const durationFormatted = formatTime(Math.round(duration * 1000), smallScreen);
    const timeText = verySmallScreen ? timeFormatted : `${timeFormatted} / ${durationFormatted}`;
    const timeTextWidth = (timeText.length * 8) + 16;
    const curSettingsMenuId = settingsOpen ? settingsMenuId : undefined;
    const shouldShow = wasRecentAction || (isHovering && wasRecentMouseOver) || isDragging || isBottomHovering || settingsOpen;
    
    return (
        <Box 
            ref={playerRef}
            width="100%" 
            height="100%" 
            display="flex" 
            flexDirection="column"
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onMouseLeave={onMouseLeave}
            onTouchEnd={onMouseLeave}
            sx={{
                transition: "opacity .4s ease",
                userSelect: "none",
                opacity: shouldShow ? 1 : 0,
                WebkitTapHighlightColor: "transparent",
                "button": {
                    color: "white",
                    bgcolor: "#00000080",
                    "&:hover": {
                        bgcolor: "#42424280"
                    }
                }
            }}
            style={{ cursor: shouldShow ? "default" : "none" }}
        >
            <Box flexGrow={1} onClick={onPausePlay} onDoubleClick={onSwapFullscreen} />
            <Box 
                id={bottomDivId}
                width="100%" 
                height="40px" 
                display="flex" 
                alignItems="center" 
                p={1}
                onMouseOver={onBottomMouseOver}
                onMouseLeave={onBottomMouseLeave}
            >
                <IconButton 
                    size="small" 
                    onClick={onPausePlay} 
                    onTouchEnd={onTouchPausePlay}
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
                    onSetPlayback={onSetPlaybackHandler}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                />
                <IconButton 
                    ref={settingsButtonRef}
                    aria-describedby={curSettingsMenuId}
                    size="small"
                    onClick={onClickSettings}
                    onTouchEnd={onClickSettings}
                    sx={{
                        ml: 1.5
                    }}
                >
                    <SettingsIcon />
                </IconButton>
                <Popper
                    id={curSettingsMenuId}
                    open={settingsOpen}
                    anchorEl={settingsEl}
                    container={getPlayerRef}
                    placement="top-end"
                    transition
                >
                    {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={100}>
                        <Box 
                            ref={settingsMenuRef}
                            display="flex" 
                            flexDirection="column" 
                            padding={1}
                            sx={{
                                bgcolor: "#00000080",
                                color: "white",
                                borderRadius: "8px"
                            }}
                        >
                            <Box display="flex" flexDirection="column" padding={verySmallScreen ?  0.25 : 0.5} width={verySmallScreen ? "150px" : "200px"}>
                                <Box display="flex">
                                    <Typography variant="subtitle2">
                                        Speed
                                    </Typography>
                                    <SpeedIcon fontSize="small" sx={{ ml: 0.75 }} />
                                </Box>
                                <Typography variant="subtitle1" textAlign="center">
                                    {speed.toFixed(1)}x
                                </Typography>
                                <Box display="flex" pl={1} pr={1}>
                                    <Slider 
                                        size="small"
                                        value={speed}
                                        min={0.1}
                                        max={2}
                                        step={0.1}
                                        onChange={onChangeSpeed}
                                        onChangeCommitted={onFinishChangingSpeed}
                                    />
                                </Box>
                                <Box 
                                    mt={verySmallScreen ? 0.5 : 1}
                                    display="flex"
                                    justifyContent="space-evenly"
                                    sx={{
                                        ".speedButton": {
                                            p: verySmallScreen ? 0.375 : 0.5,
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            userSelect: "none",
                                            color: "white",
                                            bgcolor: "#00000080",
                                            transition: "background .15s ease",
                                            "&:hover": {
                                                bgcolor: "#42424280"
                                            }
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        className="speedButton"
                                        onClick={onClickHalfSpeedButton}
                                    >
                                        0.5x
                                    </Typography>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        className="speedButton"
                                        onClick={onClickNormalSpeedButton}
                                    >
                                        1.0x
                                    </Typography>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        className="speedButton"
                                        onClick={onClickDoubleSpeedButton}
                                    >
                                        2.0x
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Fade>
                    )}
                </Popper>
                <IconButton 
                    ref={fullscreenButtonRef}
                    size="small" 
                    onClick={onSwapFullscreen} 
                    onTouchEnd={onTouchFullscreen}
                    sx={{
                        ml: 0.5
                    }}
                >
                    {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
            </Box>
        </Box>
    );
}

export default PlaybackOverlay;