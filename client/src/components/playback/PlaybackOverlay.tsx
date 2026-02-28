import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatTime } from "shared";
import ProgressSlider from "./ProgressSlider";
import { useCallback, useState } from "react";
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
}

function PlaybackOverlay(props: PlaybackOverlayProps) {
    const { time, duration, paused, offset, fullscreen, onDragPlayback, onSetPlayback, onSetPause, onFullscreen } = props;
    const [ isHovering, setIsHovering ] = useState(false);
    const [ isDragging, setIsDragging ] = useState(false);
    const verySmallScreen = useMediaQuery("(max-width: 480px)");
    const smallScreen = useMediaQuery("(max-width: 800px)");

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

    const timeFormatted = formatTime(Math.round(Math.max(0, time * 1000)), smallScreen);
    const durationFormatted = formatTime(Math.round(duration * 1000), smallScreen);
    const timeText = verySmallScreen ? timeFormatted : `${timeFormatted} / ${durationFormatted}`;
    const timeTextWidth = (timeText.length * 8) + 16;
    
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
                opacity: isHovering || isDragging ? 1 : 0
            }}
        >
            <Box flexGrow={1} onClick={onClickOverlay} />
            <Box width="100%" height="40px" display="flex" alignItems="center" p={1} pr={1}>
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