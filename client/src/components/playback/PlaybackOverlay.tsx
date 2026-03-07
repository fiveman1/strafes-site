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
import SettingsIcon from '@mui/icons-material/Settings';
import Slider from "@mui/material/Slider";
import Popper from "@mui/material/Popper";
import Fade from "@mui/material/Fade";
import SpeedIcon from '@mui/icons-material/Speed';
import MonitorIcon from '@mui/icons-material/Monitor';
import { clamp } from "@mui/x-data-grid/internals";
import { InputState } from "../../common/common";
import { alpha, lighten } from "@mui/system";
import { useTheme } from "@mui/material/styles";

function getInfoDisplayScale(playerHeight: number) {
    return clamp(playerHeight / 800, 0.3, 1);
}

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
    speedTextRef: React.Ref<HTMLSpanElement>
    playerHeight: number
    inputContainerRef: React.Ref<HTMLDivElement>
    loading: boolean
}

const SHOW_SPEED_SETTING = "player_showSpeed";
const SHOW_INPUT_SETTING = "player_showInput";

function PlaybackOverlay(props: PlaybackOverlayProps) {
    const { time, duration, paused, offset, fullscreen, speed, onDragPlayback, 
        onSetPlayback, onSetPause, onFullscreen, onSeek, onReset, onSetSpeed, speedTextRef, 
        playerHeight, inputContainerRef, loading } = props;

    const theme = useTheme();
    
    const [ isHovering, setIsHovering ] = useState(false);
    const [ isBottomHovering, setIsBottomHovering ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ wasRecentAction, setWasRecentAction ] = useState(false);
    const [ wasRecentMouseOver, setWasRecentMouseOver ] = useState(false);
    const [ showSpeed, setShowSpeed ] = useState(localStorage.getItem(SHOW_SPEED_SETTING) !== "false");
    const [ showInput, setShowInput ] = useState(localStorage.getItem(SHOW_INPUT_SETTING) !== "false");
    const [ settingsEl, setSettingsEl ] = useState<HTMLButtonElement | null>(null);
    
    const playerRef = useRef<HTMLDivElement>(null);
    const playerMainRef = useRef<HTMLDivElement>(null);
    const settingsMenuId = useId();
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
    const lastPointerDownRef = useRef<Element>(null);
    const lastAction = useRef(0);
    const lastMouseOver = useRef(0);
    const isDraggingSpeed = useRef(false);
    const lastChangedSpeed = useRef(0);
    const verySmallScreen = useMediaQuery("(max-width: 480px)");
    const smallScreen = useMediaQuery("(max-width: 800px)");
    const hideHUD = useMediaQuery("(max-width: 1000px)");
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

    const onPointerMove = useCallback((event: React.PointerEvent) => {
        if (event.pointerType === "touch") {
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
        }
        else {
            setWasRecentMouseOver(true);
            lastMouseOver.current = new Date().getTime();
        }
        setIsHovering(true);
    }, []);

    const onPointerLeave = useCallback(() => {
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

    const onClickPlayer = useCallback((event: React.PointerEvent) => {
        // Click must have originated within the player main content
        if (!lastPointerDownRef.current || !playerMainRef.current || !playerMainRef.current.contains(lastPointerDownRef.current)) {
            return;
        }
        if (event.pointerType === "touch") {
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
        }
        else {
            onPausePlay();
        }
    }, [onPausePlay]);

    const onClickSettings = useCallback(() => {
        // Click must have originated within settings button
        if (!lastPointerDownRef.current || !settingsButtonRef.current || !settingsButtonRef.current.contains(lastPointerDownRef.current)) {
            return;
        }
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
    const onClickSpeedButton = useCallback(() => {
        setShowSpeed(!showSpeed);
        localStorage.setItem(SHOW_SPEED_SETTING, !showSpeed ? "true" : "false");
    }, [showSpeed]);
    const onClickInputButton = useCallback(() => {
        setShowInput(!showInput);
        localStorage.setItem(SHOW_INPUT_SETTING, !showInput ? "true" : "false");
    }, [showInput]);

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
        
        if (event.key === " ") {
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
        else if (event.key === "f") {
            didAction = true;
            onSwapFullscreen();
        }
        else if (event.key === "r") {
            didAction = true;
            onReset();
        }
        else if (event.key === ",") {
            didAction = true;
            onSeek(-0.01);
            onSetPause(true);
        }
        else if (event.key === ".") {
            didAction = true;
            onSeek(0.01);
            onSetPause(true);
        }

        if (didAction) {
            event.preventDefault();
            setWasRecentAction(true);
            lastAction.current = new Date().getTime();
        }
    }, [onPausePlay, onReset, onSeek, onSetPause, onSwapFullscreen]);

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [onKeyDown]);

    useEffect(() => {
        const handler = (event: PointerEvent) => {
            lastPointerDownRef.current = event.target instanceof Element ? event.target : null;
        }
        document.addEventListener("pointerdown", handler);
        return () => {
            document.removeEventListener("pointerdown", handler);
        };
    }, []);

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
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            sx={{
                userSelect: "none",
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
            <Box
                ref={playerMainRef}
                flexGrow={1}
                onDoubleClick={onSwapFullscreen}
                onPointerUp={onClickPlayer}
                position="relative"
            >
                <Box
                    position="absolute"
                    bottom="15%"
                    left="50%"
                    width="100%"
                    pl={3}
                    pr={3}
                    display={hideHUD || loading ? "none" : "flex"}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ transform: "translateX(-50%)" }}
                >
                    <Box 
                        display="flex" 
                        flexDirection="column" 
                        alignItems="center"
                        style={{ transform: `scale(${getInfoDisplayScale(playerHeight).toFixed(4)})` }}
                    >
                        <Typography
                            ref={speedTextRef}
                            display={showSpeed ? undefined : "none"}
                            component="span"
                            fontFamily="monospace"
                            fontWeight="bold"
                            sx={{ 
                                textShadow: "0 0 6px rgba(0, 0, 0, 0.9)" ,
                                userSelect: "none"
                            }}
                            style={{
                                fontSize: "28px"
                            }}
                        />
                        <Box 
                            ref={inputContainerRef}
                            display={showInput ? "flex" : "none"}
                            flexDirection="column"
                            sx={{
                                ".inputDisplayButton": {
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    height: "28px",
                                    width: "28px",
                                    m: "4px",
                                    fontSize: "20px",
                                    borderRadius: "6px",
                                    textShadow: "0 0 6px rgba(0, 0, 0, 0.9)"
                                }
                            }}
                        >
                            <Box
                                display="flex"
                            >
                                <Typography
                                    id={InputState.LookLeft}
                                    className="inputDisplayButton"
                                    variant="button"
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#ff000080"
                                        }
                                    }}
                                >
                                    L
                                </Typography>
                                <Typography
                                    id={InputState.MoveForward}
                                    className="inputDisplayButton"
                                    variant="button"
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#9900ff80"
                                        }
                                    }}
                                >
                                    W
                                </Typography>
                                <Typography
                                    id={InputState.LookRight}
                                    className="inputDisplayButton"
                                    variant="button"
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#00ff0080"
                                        }
                                    }}
                                >
                                    R
                                </Typography>
                            </Box>
                            <Box
                                display="flex"
                            >
                                <Typography
                                    id={InputState.MoveLeft}
                                    className="inputDisplayButton"
                                    variant="button"
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#ff007780"
                                        }
                                    }}
                                >
                                    A
                                </Typography>
                                <Typography
                                    id={InputState.MoveBack}
                                    className="inputDisplayButton"
                                    variant="button"
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#ffee0080"
                                        }
                                    }}
                                >
                                    S
                                </Typography>
                                <Typography
                                    id={InputState.MoveRight}
                                    className="inputDisplayButton"
                                    variant="button"
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#00ff9d80"
                                        }
                                    }}
                                >
                                    D
                                </Typography>
                            </Box>
                            
                            <Box display="flex" height="4px" mt={0.25}>
                                <Box width="4px" />
                                <Box 
                                    id={InputState.Jump}
                                    display="flex" 
                                    width="100%" 
                                    sx={{
                                        "&.inputActive": {
                                            bgcolor: "#bbff00bb" 
                                        }
                                    }}
                                />
                                <Box width="4px" />
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Box
                id={bottomDivId}
                width="100%" 
                height="40px" 
                display="flex" 
                alignItems="center" 
                p={1}
                onMouseOver={onBottomMouseOver}
                onMouseLeave={onBottomMouseLeave}
                sx={{
                    transition: "opacity .4s ease",
                    opacity: shouldShow ? 1 : 0,
                }}
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
                    bgcolor="#00000080"
                    color="white"
                    fontFamily="monospace"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="4px"
                    ml={1}
                    mr={1.5}
                    style={{
                        width: `${timeTextWidth}px`,
                        minWidth: `${timeTextWidth}px`
                    }}
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
                    onPointerUp={onClickSettings}
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
                                            border: 0,
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
                                        component="button"
                                        onClick={onClickHalfSpeedButton}
                                    >
                                        0.5x
                                    </Typography>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        className="speedButton"
                                        component="button"
                                        onClick={onClickNormalSpeedButton}
                                    >
                                        1.0x
                                    </Typography>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        className="speedButton"
                                        component="button"
                                        onClick={onClickDoubleSpeedButton}
                                    >
                                        2.0x
                                    </Typography>
                                </Box>
                                <Box display={hideHUD ? "none" : "flex"} flexDirection="column" mt={1.5}>
                                    <Box display="flex">
                                        <Typography variant="subtitle2">
                                            HUD
                                        </Typography>
                                        <MonitorIcon fontSize="small" sx={{ ml: 0.75 }} />
                                    </Box>
                                    <Box 
                                        mt={1}
                                        display="flex"
                                        sx={{
                                            "button": {
                                                py: 0.5,
                                                pl: 0.75,
                                                pr: 0.75,
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                userSelect: "none",
                                                color: "white",
                                                transition: "background .15s ease",
                                                border: 0,
                                                "&.active": {
                                                    bgcolor: `${alpha(theme.palette.primary.main, 0.7)}`,
                                                    "&:hover": {
                                                        bgcolor: `${alpha(lighten(theme.palette.primary.main, 0.2), 0.7)}`
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            className={showSpeed ? "speedButton active" : "speedButton"}
                                            component="button"
                                            onClick={onClickSpeedButton}
                                        >
                                            Speed
                                        </Typography>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                            className={showInput ? "speedButton active" : "speedButton"}
                                            component="button"
                                            ml={1}
                                            onClick={onClickInputButton}
                                        >
                                            Input
                                        </Typography>
                                    </Box>
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