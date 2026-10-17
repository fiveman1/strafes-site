import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import ProgressSlider from "./ProgressSlider";
import { PlaybackTime } from "./playbackTime";
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SettingsIcon from '@mui/icons-material/Settings';
import Slider from "@mui/material/Slider";
import Popper from "@mui/material/Popper";
import type { Instance as PopperInstance } from "@popperjs/core";
import SpeedIcon from '@mui/icons-material/Speed';
import MonitorIcon from '@mui/icons-material/Monitor';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { clamp } from "@mui/x-data-grid/internals";
import { InputState } from "../../common/common";
import { isTyping } from "../../common/utils";
import { usePersistedToggle } from "../../common/states";
import { alpha, lighten } from "@mui/system";
import { useTheme } from "@mui/material/styles";
import GraphicsMenu from "./GraphicsMenu";
import { GraphicsLevel, GraphicsSettings } from "./graphicsSettings";

// HUD elements are drawn at full size on players at least this tall, and shrink with the player below it,
// so they always cover the same part of the player
const DEFAULT_HUD_FULL_SIZE_HEIGHT = 1000;
const DEBUG_HUD_FULL_SIZE_HEIGHT = 650;

function getHudScale(playerHeight: number, fullSizeHeight: number) {
    // kept above 0 so elements can divide their size by it
    return clamp(playerHeight / fullSizeHeight, 0.01, 1);
}

interface PlaybackOverlayProps {
    duration: number
    time: PlaybackTime
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
    jhudRef: React.Ref<HTMLDivElement>
    playerHeight: number
    inputContainerRef: React.Ref<HTMLDivElement>
    loading: boolean
    errorReplay: boolean
    diffTimeTextRef: React.Ref<HTMLElement>
    diffSpeedTextRef: React.Ref<HTMLElement>
    allowDiff: boolean
    thumbCanvasRef: React.Ref<HTMLCanvasElement>
    setThumbTime: (time: number) => void
    /** Whether the seek bar has a thumbnail canvas, which stays on the page once made */
    showThumb: boolean
    /** Whether the thumbnail is shown while hovering the seek bar */
    thumbEnabled: boolean
    debugInfo: string
    fpsTextRef: React.Ref<HTMLSpanElement>
    frameStatsTextRef: React.Ref<HTMLSpanElement>
    setShowingThumb: (showing: boolean) => void
    graphicsSettings: GraphicsSettings
    /** The graphics preset in use */
    graphicsLevel: GraphicsLevel
}

/** Gap between the settings menu and the top of the player, in pixels. */
const SETTINGS_MENU_MARGIN = 8;

const SHOW_SPEED_SETTING = "player_showSpeed";
const SHOW_INPUT_SETTING = "player_showInput";
const SHOW_JHUD_SETTING = "player_showJhud";
const SHOW_DIFF_SETTING = "player_showDiff";
const SHOW_FPS_SETTING = "player_showFps";
const SHOW_DEBUG_SETTING = "player_showDebug";

interface HudToggleProps {
    label: string
    active: boolean
    onClick: () => void
}

function HudToggle(props: HudToggleProps) {
    const { label, active, onClick } = props;
    const iconSx = { mr: 0.5 };

    return (
        <Typography
            variant="subtitle2"
            className={active ? "active" : undefined}
            component="button"
            onClick={onClick}
            sx={{
                display: "flex",
                fontWeight: "bold"
            }}>
            {active ? <VisibilityIcon fontSize="small" sx={iconSx} /> : <VisibilityOffIcon fontSize="small" sx={iconSx} />}
            {label}
        </Typography>
    );
}

function PlaybackOverlay(props: PlaybackOverlayProps) {
    const { time, duration, paused, offset, fullscreen, speed, onDragPlayback, 
        onSetPlayback, onSetPause, onFullscreen, onSeek, onReset, onSetSpeed, speedTextRef, jhudRef,
        playerHeight, inputContainerRef, loading, errorReplay, diffTimeTextRef, diffSpeedTextRef, allowDiff,
        thumbCanvasRef, setThumbTime, showThumb, thumbEnabled, debugInfo, fpsTextRef, frameStatsTextRef, setShowingThumb,
        graphicsSettings, graphicsLevel } = props;

    const theme = useTheme();
    
    const [ isHovering, setIsHovering ] = useState(false);
    const [ isBottomHovering, setIsBottomHovering ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const [ wasRecentAction, setWasRecentAction ] = useState(false);
    const [ wasRecentMouseOver, setWasRecentMouseOver ] = useState(false);
    const [ showSpeed, onClickSpeedButton ] = usePersistedToggle(SHOW_SPEED_SETTING, true);
    const [ showInput, onClickInputButton ] = usePersistedToggle(SHOW_INPUT_SETTING, true);
    const [ showJhud, onClickJhudButton ] = usePersistedToggle(SHOW_JHUD_SETTING, true);
    const [ showDiffSetting, onClickDiffButton ] = usePersistedToggle(SHOW_DIFF_SETTING, true);
    const [ showFps, onClickFpsButton ] = usePersistedToggle(SHOW_FPS_SETTING, false);
    const [ showDebug, onClickDebugButton ] = usePersistedToggle(SHOW_DEBUG_SETTING, false);
    // The FPS and frame stats are written straight into the DOM every half second, so copy what's shown
    const statsBoxRef = useRef<HTMLDivElement>(null);
    const [ statsCopied, setStatsCopied ] = useState(false);
    const onClickCopyStats = useCallback(async () => {
        const stats = statsBoxRef.current?.innerText.trim() ?? "";
        const text = debugInfo ? `${debugInfo}\n\n${stats}` : stats;
        try {
            await navigator.clipboard.writeText(text);
            setStatsCopied(true);
        } catch (error) {
            console.error("Couldn't copy the debug stats", error);
        }
    }, [debugInfo]);
    const stopPropagation = useCallback((event: React.SyntheticEvent) => event.stopPropagation(), []);
    useEffect(() => {
        if (!statsCopied) {
            return;
        }
        const timeout = setTimeout(() => setStatsCopied(false), 1500);
        return () => clearTimeout(timeout);
    }, [statsCopied]);
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
    const smallScreen = useMediaQuery("(max-width: 660px)");
    const bottomDivId = useId();
    const settingsOpen = Boolean(settingsEl);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
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
            lastAction.current = Date.now();
        }
        else {
            setWasRecentMouseOver(true);
            lastMouseOver.current = Date.now();
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
        lastAction.current = Date.now();
        onSetPause(!paused);
    }, [onSetPause, paused]);

    const onSwapFullscreen = useCallback(() => {
        onFullscreen(!fullscreen);
    }, [fullscreen, onFullscreen]);

    const onTouchFullscreen = useCallback(() => {
        setWasRecentAction(true);
        lastAction.current = Date.now();
        onFullscreen(!fullscreen);
    }, [fullscreen, onFullscreen]);

    const onClickPlayer = useCallback((event: React.PointerEvent) => {
        // Click must have originated within the player main content
        if (!lastPointerDownRef.current || !playerMainRef.current || !playerMainRef.current.contains(lastPointerDownRef.current)) {
            return;
        }
        if (event.pointerType === "touch") {
            setWasRecentAction(true);
            lastAction.current = Date.now();
        }
        else {
            onPausePlay();
        }
    }, [onPausePlay]);

    // The menu opens upward inside the player, so on short players (phones held upright) it scrolls
    // instead of running off the top. It's measured when opening, so the first layout already fits.
    const [ settingsMaxHeight, setSettingsMaxHeight ] = useState<number | undefined>(undefined);
    const settingsPopperRef = useRef<PopperInstance>(null);
    const measureSettingsSpace = useCallback(() => {
        const player = playerRef.current;
        const button = settingsButtonRef.current;
        if (!player || !button) return undefined;
        return Math.max(button.getBoundingClientRect().top - player.getBoundingClientRect().top - SETTINGS_MENU_MARGIN, 0);
    }, []);

    const onClickSettings = useCallback(() => {
        // Click must have originated within settings button
        if (!lastPointerDownRef.current || !settingsButtonRef.current || !settingsButtonRef.current.contains(lastPointerDownRef.current)) {
            return;
        }
        if (settingsOpen) {
            setSettingsEl(null);
        }
        else {
            setSettingsMaxHeight(measureSettingsSpace());
            setSettingsEl(settingsButtonRef.current);
        }
    }, [settingsOpen, measureSettingsSpace]);

    const onChangeSpeed = useCallback((e: Event, speed: number) => {
        onSetSpeed(speed);
        isDraggingSpeed.current = true;
    }, [onSetSpeed]);

    const onClickNormalSpeedButton = useCallback(() => onSetSpeed(1.0), [onSetSpeed]);
    const onClickDoubleSpeedButton = useCallback(() => onSetSpeed(2.0), [onSetSpeed]);
    const onClickHalfSpeedButton = useCallback(() => onSetSpeed(0.5), [onSetSpeed]);
    
    const onFinishChangingSpeed = useCallback(() => {
        lastChangedSpeed.current = Date.now();
        isDraggingSpeed.current = false;
    }, []);

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.repeat) {
            // If you held the key down for a bit then don't repeat the same action
            return;
        }

        if (isTyping(event.target)) {
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
            lastAction.current = Date.now();
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

        const now = Date.now();
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
            lastAction.current = Date.now();
        }
    }, [settingsEl]);

    const getPlayerRef = useCallback(() => playerRef.current, []);

    // re-place the open menu after its height cap changes
    useLayoutEffect(() => {
        if (!settingsOpen) return;
        setSettingsMaxHeight(measureSettingsSpace());
        settingsPopperRef.current?.update();
    }, [settingsOpen, playerHeight, fullscreen, measureSettingsSpace]);

    useEffect(() => {
        const div = document.getElementById(bottomDivId);
        if (!div) return;
        
        const touchStart = (event: TouchEvent) => {
            event.preventDefault();
            setIsBottomHovering(true);
            setWasRecentAction(true);
            lastAction.current = Date.now();
        };

        const touchEnd = (event: TouchEvent) => {
            event.preventDefault();
            setIsBottomHovering(false);
            setWasRecentAction(true);
            lastAction.current = Date.now();

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

    // The time text is written directly instead of rendered, see playbackTime.ts
    const timeTextRef = useRef<HTMLSpanElement>(null);
    useLayoutEffect(() => {
        const durationFormatted = formatTime(Math.round(duration * 1000), smallScreen);
        const update = (time: number) => {
            const timeText = timeTextRef.current;
            if (!timeText) return;
            const timeFormatted = formatTime(Math.round(Math.max(0, time * 1000)), smallScreen);
            timeText.textContent = verySmallScreen ? timeFormatted : `${timeFormatted} / ${durationFormatted}`;
        };
        update(time.get());
        return time.subscribe(update);
    }, [time, duration, smallScreen, verySmallScreen]);

    const curSettingsMenuId = settingsOpen ? settingsMenuId : undefined;
    const hudScale = getHudScale(playerHeight, DEFAULT_HUD_FULL_SIZE_HEIGHT).toFixed(4);
    const debugHudScale = getHudScale(playerHeight, DEBUG_HUD_FULL_SIZE_HEIGHT).toFixed(4);
    const shouldShow = wasRecentAction || (isHovering && wasRecentMouseOver) || isDragging || isBottomHovering || settingsOpen;
    const showFullscreenButton = document.fullscreenEnabled;

    return (
        <Box
            ref={playerRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={{ cursor: shouldShow ? "default" : "none" }}
            sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",

                "button": {
                    color: "white",
                    borderRadius: "50%",
                    bgcolor: "#00000080",
                    "&:hover": {
                        bgcolor: "#42424280"
                    }
                }
            }}>
            <Box
                ref={playerMainRef}
                onDoubleClick={onSwapFullscreen}
                onPointerUp={onClickPlayer}
                sx={{
                    position: "relative",
                    flexGrow: 1
                }}>
                <Box
                    ref={jhudRef}
                    style={{ transform: `translate(-50%) scale(${hudScale})` }}
                    sx={{
                        display: showJhud && !smallScreen && !loading && !errorReplay ? "grid" : "none",
                        visibility: "hidden",
                        position: "absolute",
                        top: "63%",
                        left: "50%",
                        transformOrigin: "50% 0",
                        // Fixed widths in a monospace font, so changing numbers never move anything.
                        // Widest texts: "999 strafes", "-99.99" and "100.0%".
                        gridTemplateColumns: "11ch 84px 6ch",
                        alignItems: "center",
                        columnGap: "10px",
                        rowGap: "2px",
                        fontFamily: '"Geist Mono", monospace',
                        fontWeight: "bold",
                        fontSize: "16px",
                        lineHeight: 1.3,
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                        textShadow: "0 0 6px rgba(0, 0, 0, 0.9)",
                        userSelect: "none",
                        pointerEvents: "none",
                        color: "white",

                        ".jhudLabel": {
                            textAlign: "right",
                            color: "#ffffffbb"
                        },
                        ".jhudValue": {
                            textAlign: "right"
                        },
                        ".jhudSpeed": {
                            fontSize: "22px",
                            textAlign: "center",
                            // The bigger speed may be wider than its column; let it overflow evenly.
                            justifySelf: "center"
                        },
                        ".jhudBar": {
                            position: "relative",
                            height: "6px",
                            borderRadius: "3px",
                            bgcolor: "#00000080",
                            boxShadow: "0 0 4px rgba(0, 0, 0, 0.6)"
                        },
                        ".jhudBarFill": {
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            borderRadius: "3px",
                            bgcolor: "currentColor"
                        },
                        ".jhudBarCenter": {
                            position: "absolute",
                            left: "50%",
                            top: "-3px",
                            bottom: "-3px",
                            width: "2px",
                            ml: "-1px",
                            bgcolor: "#ffffff80"
                        },
                        ".jhudBarMarker": {
                            position: "absolute",
                            top: "-3px",
                            bottom: "-3px",
                            width: "6px",
                            ml: "-3px",
                            borderRadius: "3px",
                            bgcolor: "currentColor"
                        },
                    }}>
                    <span className="jhudLabel jhudJump" />
                    <span className="jhudSpeed" />
                    <span className="jhudValue jhudGain" />
                    <span className="jhudLabel jhudStrafes" />
                    <span className="jhudBar jhudRateColor">
                        <span className="jhudBarCenter" />
                        <span className="jhudBarMarker jhudRateMarker" />
                    </span>
                    <span className="jhudValue jhudRate jhudRateColor" />
                    <span className="jhudLabel">efficiency</span>
                    <span className="jhudBar jhudEffColor">
                        <span className="jhudBarFill jhudEffFill" />
                    </span>
                    <span className="jhudValue jhudEff jhudEffColor" />
                </Box>
                <Box
                    style={{ transform: `translate(-50%) scale(${hudScale})` }}
                    sx={{
                        display: smallScreen || loading || errorReplay ? "none" : "flex",
                        position: "absolute",
                        alignItems: "center",
                        height: "150px",
                        bottom: "10%",
                        left: "50%",
                        flexDirection: "column",
                        transformOrigin: "50% 100%"
                    }}>
                    <Typography
                        ref={speedTextRef}
                        component="span"
                        sx={{
                            display: showSpeed ? "flex" : "none",
                            fontFamily: '"Geist Mono", monospace',
                            fontWeight: "bold",
                            fontSize: "28px",
                            lineHeight: 1.2,
                            textShadow: "0 0 6px rgba(0, 0, 0, 0.9)",
                            userSelect: "none",
                            color: "white"
                        }} />
                    <Box
                        sx={{
                            display: showDiffSetting && allowDiff ? "flex" : "none",
                            flexDirection: "column",
                            alignItems: "center",

                            ".diffText": {
                                fontSize: "18px",
                                fontFamily: '"Geist Mono", monospace',
                                fontWeight: "bold",
                                borderRadius: "6px",
                                textShadow: "0 0 4px black",
                                userSelect: "none",
                                color: "white",
                                py: 0.25,
                                px: 0.75
                            },

                            ".better": {
                                bgcolor: "#df0000a0"
                            },

                            ".worse": {
                                bgcolor: "#00c500a0"
                            }
                        }}>
                        <Typography
                            ref={diffSpeedTextRef}
                            component="span"
                            className="diffText"
                        />
                        <Typography
                            ref={diffTimeTextRef}
                            component="span"
                            className="diffText"
                            sx={{
                                mt: 0.25
                            }}
                        />
                    </Box>
                    <Box
                        ref={inputContainerRef}
                        sx={{
                            display: showInput ? "flex" : "none",
                            flexDirection: "column",
                            mt: 0.5,

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
                                textShadow: "0 0 6px rgba(0, 0, 0, 0.9)",
                                color: "#d8d8d8"
                            },

                            ".inputActive": {
                                color: "white"
                            }
                        }}>
                        <Box sx={{
                            display: "flex"
                        }}>
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
                        <Box sx={{
                            display: "flex"
                        }}>
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
                        <Box
                            sx={{
                                display: "flex",
                                height: "4px",
                                mt: 0.25
                            }}>
                            <Box sx={{
                                width: "4px"
                            }} />
                            <Box
                                id={InputState.Jump}
                                sx={{
                                    display: "flex",
                                    width: "100%",

                                    "&.inputActive": {
                                        bgcolor: "#bbff00bb" 
                                    }
                                }} />
                            <Box sx={{
                                width: "4px"
                            }} />
                        </Box>
                    </Box>
                </Box>
                <Box
                    // Laid out at full size across the player, then scaled down into its corner like the other HUD elements
                    style={{
                        width: `calc((100% - 16px) / ${debugHudScale})`,
                        transform: `scale(${debugHudScale})`
                    }}
                    sx={{
                        display: smallScreen ? "none" : "flex",
                        position: "absolute",
                        top: 8,
                        left: 8,
                        transformOrigin: "0 0",
                        alignItems: "flex-start",
                        gap: 1,
                        pointerEvents: "none",

                        ".debugText": {
                            fontFamily: '"Geist Mono", monospace',
                            fontSize: "12px",
                            lineHeight: 1.4,
                            color: "white",
                            bgcolor: "#00000080",
                            borderRadius: "4px",
                            px: 0.75,
                            py: 0.25
                        }
                    }}>
                    {showDebug && debugInfo &&
                    <Typography
                        component="span"
                        className="debugText"
                        sx={{
                            maxWidth: "600px",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere"
                        }}>
                        {debugInfo}
                    </Typography>}
                    <Box
                        ref={statsBoxRef}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 0.5,
                            // Pushed to the right edge even when the debug info is hidden
                            ml: "auto"
                        }}>
                        <Typography
                            ref={fpsTextRef}
                            component="span"
                            className="debugText"
                            sx={{
                                display: showFps ? "block" : "none",
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                            }} />
                        <Typography
                            ref={frameStatsTextRef}
                            component="span"
                            className="debugText"
                            sx={{
                                display: showDebug ? "block" : "none",
                                whiteSpace: "nowrap"
                            }} />
                        {showDebug &&
                        <IconButton
                            size="small"
                            onClick={onClickCopyStats}
                            // the player pauses or plays on pointer up and goes fullscreen on double click anywhere in it
                            onPointerUp={stopPropagation}
                            onDoubleClick={stopPropagation}
                            title="Copy debug stats"
                            aria-label="Copy debug stats"
                            sx={{
                                // the overlay lets clicks through to the player, except here
                                pointerEvents: "auto",
                                color: "white",
                                bgcolor: "#00000080",
                                borderRadius: "4px",
                                "&:hover": {
                                    bgcolor: "#000000b0"
                                }
                            }}>
                            {statsCopied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                        </IconButton>}
                    </Box>
                </Box>
            </Box>
            <Box
                id={bottomDivId}
                onMouseOver={onBottomMouseOver}
                onMouseLeave={onBottomMouseLeave}
                sx={{
                    width: "100%",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    transition: "opacity .4s ease",
                    opacity: shouldShow ? 1 : 0
                }}>
                <IconButton 
                    size="small" 
                    onClick={onPausePlay} 
                    onTouchEnd={onTouchPausePlay}
                >
                    {paused ? <PlayArrowIcon /> : <PauseIcon />}
                </IconButton>
                <Typography
                    variant="subtitle2"
                    sx={{
                        bgcolor: "#00000080",
                        color: "white",
                        fontFamily: '"Geist Mono", monospace',
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        ml: 1,
                        mr: 1.5,
                        px: 1.25,
                        whiteSpace: "nowrap"
                    }}>
                    <span ref={timeTextRef} />
                </Typography>
                <ProgressSlider
                    min={-offset}
                    max={duration}
                    time={time}
                    onDragPlayback={onDragPlayback}
                    onSetPlayback={onSetPlaybackHandler}
                    isDragging={isDragging}
                    setIsDragging={setIsDragging}
                    canvasRef={thumbCanvasRef}
                    setThumbTime={setThumbTime}
                    displayThumb={showThumb}
                    thumbEnabled={thumbEnabled}
                    setShowingThumb={setShowingThumb}
                />
                <Box ref={settingsButtonRef}>
                    <IconButton
                        aria-describedby={curSettingsMenuId}
                        size="small"
                        onPointerUp={onClickSettings}
                        sx={{
                            ml: 1.5
                        }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>
                <Popper
                    id={curSettingsMenuId}
                    open={settingsOpen}
                    anchorEl={settingsEl}
                    container={getPlayerRef}
                    placement="top-end"
                    popperRef={settingsPopperRef}
                    // the menu always opens upward, scrolling when there's little room
                    modifiers={[{ name: "flip", enabled: false }]}
                >
                    <Box
                        ref={settingsMenuRef}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            padding: 1,
                            bgcolor: "#00000080",
                            color: "white",
                            borderRadius: "8px",
                            maxHeight: settingsMaxHeight,
                            overflowY: "auto",
                            // scrolling one way makes the other auto too, and slider thumbs poke out a little
                            overflowX: "hidden",
                            // scrolling to the end doesn't scroll the page
                            overscrollBehavior: "contain",
                            scrollbarWidth: "thin",
                            scrollbarColor: "#ffffff60 transparent"
                        }}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                padding: verySmallScreen ?  0.25 : 0.5,
                                // wide enough for the four graphics presets on one line and the HUD toggles on two
                                width: verySmallScreen ? "220px" : "260px"
                            }}>
                            <Box sx={{
                                display: "flex"
                            }}>
                                <Typography variant="subtitle2">
                                    Playback speed
                                </Typography>
                                <SpeedIcon fontSize="small" sx={{ ml: 0.75 }} />
                            </Box>
                            <Typography variant="subtitle1" sx={{
                                textAlign: "center"
                            }}>
                                {speed.toFixed(1)}x
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    pl: 1,
                                    pr: 1
                                }}>
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
                                sx={{
                                    mt: verySmallScreen ? 0.5 : 1,
                                    display: "flex",
                                    justifyContent: "space-evenly",

                                    ".speedButton": {
                                        p: 0.5,
                                        py: 0.25,
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
                                }}>
                                <Typography
                                    variant="subtitle2"
                                    className="speedButton"
                                    component="button"
                                    onClick={onClickHalfSpeedButton}
                                    sx={{
                                        fontWeight: "bold"
                                    }}
                                >
                                    0.5x
                                </Typography>
                                <Typography
                                    variant="subtitle2"
                                    className="speedButton"
                                    component="button"
                                    onClick={onClickNormalSpeedButton}
                                    sx={{
                                        fontWeight: "bold"
                                    }}
                                >
                                    1.0x
                                </Typography>
                                <Typography
                                    variant="subtitle2"
                                    className="speedButton"
                                    component="button"
                                    onClick={onClickDoubleSpeedButton}
                                    sx={{
                                        fontWeight: "bold"
                                    }}
                                >
                                    2.0x
                                </Typography>
                            </Box>
                            <GraphicsMenu settings={graphicsSettings} level={graphicsLevel} />
                            <Box
                                sx={{
                                    display: smallScreen ? "none" : "flex",
                                    flexDirection: "column",
                                    mt: 1.5
                                }}>
                                <Box sx={{
                                    display: "flex"
                                }}>
                                    <Typography variant="subtitle2">
                                        HUD
                                    </Typography>
                                    <MonitorIcon fontSize="small" sx={{ ml: 0.75 }} />
                                </Box>
                                <Box
                                    sx={{
                                        mt: 1,
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.75,

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
                                    }}>
                                    <HudToggle label="Speed" active={showSpeed} onClick={onClickSpeedButton} />
                                    <HudToggle label="Input" active={showInput} onClick={onClickInputButton} />
                                    <HudToggle label="JHUD" active={showJhud} onClick={onClickJhudButton} />
                                    {allowDiff && <HudToggle label="Diff" active={showDiffSetting} onClick={onClickDiffButton} />}
                                    <HudToggle label="FPS" active={showFps} onClick={onClickFpsButton} />
                                    <HudToggle label="Debug" active={showDebug} onClick={onClickDebugButton} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Popper>
                {showFullscreenButton &&
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
                </IconButton>}
            </Box>
        </Box>
    );
}

export default PlaybackOverlay;