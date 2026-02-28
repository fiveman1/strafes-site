import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import ProgressSlider from "./ProgressSlider";
import { useCallback, useEffect, useRef, useState } from "react";
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
    const [ isDragging, setIsDragging ] = useState(false);
    const [ wasRecentAction, setWasRecentAction ] = useState(false);
    const lastAction = useRef(0);
    const verySmallScreen = useMediaQuery("(max-width: 480px)");
    const smallScreen = useMediaQuery("(max-width: 800px)");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            setWasRecentAction((now - lastAction.current) < 1000);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const onMouseOver = useCallback(() => {
        setIsHovering(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setIsHovering(false);
    }, []);

    const onClickOverlay = useCallback(() => {
        onSetPause(!paused);
    }, [onSetPause, paused]);

    const onSwapFullscreen = useCallback(() => {
        onFullscreen(!fullscreen);
    }, [fullscreen, onFullscreen]);

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        let didAction = false;
        
        if (event.code === "Space") {
            didAction = true;
            onClickOverlay();
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
    }, [onClickOverlay, onReset, onSeek, onSwapFullscreen]);

    useEffect(() => {
        document.addEventListener("keyup", onKeyUp)
        return () => {
            document.removeEventListener("keyup", onKeyUp);
        };
    }, [onKeyUp]);

    const timeFormatted = formatTime(Math.round(Math.max(0, time * 1000)), smallScreen);
    const durationFormatted = formatTime(Math.round(duration * 1000), smallScreen);
    const timeText = verySmallScreen ? timeFormatted : `${timeFormatted} / ${durationFormatted}`;
    const timeTextWidth = (timeText.length * 8) + 16;
    const shouldShow = wasRecentAction || isHovering || isDragging;
    
    return (
        <Box 
            width="100%" 
            height="100%" 
            display="flex" 
            flexDirection="column" 
            onMouseOver={onMouseOver} 
            onMouseLeave={onMouseLeave}
            onDoubleClick={onSwapFullscreen}
            sx={{
                transition: "opacity .4s ease",
                userSelect: "none",
                cursor: "pointer",
                opacity: shouldShow ? 1 : 0,
                WebkitTapHighlightColor: "transparent"
            }}
        >
            <Box flexGrow={1} onClick={onClickOverlay} />
            <Box width="100%" height="40px" display="flex" alignItems="center" p={1}>
                <IconButton 
                    size="small" 
                    onClick={onClickOverlay} 
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