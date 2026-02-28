import Box from "@mui/material/Box";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import init, { CompleteBot, CompleteMap, Graphics, PlaybackHead, setup_graphics } from "../bot_player/strafesnet_roblox_bot_player_wasm_module";
import AutoSizer from "react-virtualized-auto-sizer";
import PlaybackOverlay from "./playback/PlaybackOverlay";
import { formatGame, formatPlacement, formatStyle, formatTime, Time } from "shared";
import { Link as RouterLink, useOutletContext, useParams } from "react-router";
import { getBotFileForTime, getMapFile, getTimeById } from "../api/api";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import MapThumb from "./displays/MapThumb";
import { ContextParams, getGameColor, getStyleColor } from "../common/common";
import UserAvatar from "./displays/UserAvatar";
import { useTheme } from "@mui/material/styles";
import { dateFormat, dateTimeFormat } from "../common/datetime";
import useMediaQuery from "@mui/material/useMediaQuery";
import DiffDisplay from "./displays/DiffDisplay";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";

const ASPECT_RATIO = 16 / 9;

function getPlayerHeight(width: number, height: number) {
    if (width / height > ASPECT_RATIO) {
        return height;
    }
    else {
        return width / ASPECT_RATIO;
    }
}

function getPlayerWidth(width: number, height: number) {
    if (width / height > ASPECT_RATIO) {
        return height * ASPECT_RATIO;
    }
    else {
        return width;
    }
}

function handleCanvasSize(width: number, height: number, playback: PlaybackHead, graphics: Graphics) {
    const realWidth = getPlayerWidth(width, height);
    const realHeight = getPlayerHeight(width, height);
    const fov_y = playback.get_fov_slope_y();
    const fov_x = (fov_y * realWidth) / realHeight;
    graphics.resize(realWidth, realHeight, fov_x, fov_y);
}

const FOOTER_HEIGHT = 130;

function Replays() {
    const { id } = useParams() as { id: string };
    const { maps } = useOutletContext() as ContextParams;
    const [ time, setTime ] = useState<Time>();
    const [ bot, setBot ] = useState<CompleteBot>();
    const [ graphics, setGraphics ] = useState<Graphics>();
    const [ playback, setPlayback ] = useState<PlaybackHead>();
    const [ duration, setDuration ] = useState(0);
    const [ botOffset, setBotOffset ] = useState(0);
    const [ playbackTime, setPlaybackTime ] = useState(-1);
    const [ paused, setPaused ] = useState(false);
    const [ fullscreen, setFullscreen ] = useState(false);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState("");
    const theme = useTheme();
    const smallScreen = useMediaQuery("(max-width: 600px)");
    const verySmallScreen = useMediaQuery("(max-width: 400px)");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const animTimer = useRef(0);
    const sessionTimer = useRef(0);

    // Update current run timer on a 17ms interval
    // Separated from animation loop for *important* performance reasons
    useEffect(() => {
        const interval = setInterval(() => {
            if (playback) {
                const curPlayerTime = Math.min(playback.get_head_time(sessionTimer.current) - botOffset, duration);
                if (curPlayerTime !== playbackTime) {
                    setPlaybackTime(curPlayerTime);
                }
            }
        }, 17);

        return () => clearInterval(interval);
    }, [botOffset, duration, playback, playbackTime]);

    useLayoutEffect(() => {
        let animationId: number;

        const animate = (timeMs: number) => {
            const time = timeMs / 1000;
            animationId = requestAnimationFrame(animate);

            if (playback && bot && graphics) {
                const elapsed = time - animTimer.current;
                const newSessionTime = sessionTimer.current + elapsed;
                playback.advance_time(bot, newSessionTime);
                graphics.render(bot, playback, newSessionTime);
                sessionTimer.current = newSessionTime;
            }

            animTimer.current = time;
        }

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [bot, graphics, playback, duration]);

    const onResize = useCallback((width: number, height: number) => {
        if (playback && graphics) {
            handleCanvasSize(width, height, playback, graphics);
        }
    }, [graphics, playback]);

    const onSetPlayback = useCallback((time: number) => {
        setPlaybackTime(time);
        if (playback && bot) {
            playback.set_head_time(bot, sessionTimer.current, Math.max(0.0001, Math.min(time + botOffset, bot.duration() - 0.0001)));
            if (!paused) {
                playback.set_paused(sessionTimer.current, false);
            }
        }
    }, [bot, botOffset, paused, playback]);

    const onDragPlayback = useCallback((time: number) => {
        setPlaybackTime(time);
        if (playback && bot) {
            playback.set_head_time(bot, sessionTimer.current, Math.max(0.0001, Math.min(time + botOffset, bot.duration() - 0.0001)));
            playback.set_paused(sessionTimer.current, true);
        }
    }, [bot, botOffset, playback]);

    const onSeek = useCallback((offset: number) => {
        if (playback && bot) {
            const curTime = playback.get_head_time(sessionTimer.current);
            const newTime = curTime + offset;
            playback.set_head_time(bot, sessionTimer.current, Math.max(0.0001, Math.min(newTime, bot.duration() - 0.0001)));
        }
    }, [bot, playback]);

    const onReset = useCallback(() => {
        if (playback && bot) {
            playback.set_head_time(bot, sessionTimer.current, 0.0001);
        }
    }, [bot, playback]);

    const onSetPause = useCallback((paused: boolean) => {
        setPaused(paused);
        if (playback) {
            playback.set_paused(sessionTimer.current, paused);
        }
    }, [playback]);

    const onFullscreen = useCallback((fullscreen: boolean) => {
        setFullscreen(fullscreen);
        if (fullscreen) {
            playerRef.current?.requestFullscreen();
        }
        else if (document.fullscreenElement !== null) {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement) {
                onFullscreen(false);
            }
        }
        document.addEventListener("fullscreenchange", handler)

        return () => {
            document.removeEventListener("fullscreenchange", handler);
        };
    }, [onFullscreen]);

    useEffect(() => {
        document.title = `replays - strafes`;
        
        const promise = async () => {
            if (!("gpu" in navigator) || await navigator.gpu.requestAdapter() === null) {
                setError("Playback is not supported on this device. Make sure you have hardware acceleration enabled.");
                return;
            }
            
            await init();

            const time = await getTimeById(id);
            if (!time) {
                setError(`Invalid time (ID: ${id}).`);
                return;
            }

            setTime(time);

            if (!time.hasBot) {
                setError("Time does not have a bot.");
                return;
            }

            const mapPromise = getMapFile(time.mapId);
            const botPromise = getBotFileForTime(time);
            const mapFile = await mapPromise;
            const botFile = await botPromise;

            if (!mapFile) {
                setError("Couldn't load map file.");
                return;
            }

            if (!botFile) {
                setError("Couldn't load bot file.");
                return;
            }

            const canvas = canvasRef.current;
            if (!canvas) {
                setError("Couldn't setup bot playback.");
                return;
            }

            document.title = `${time.map} in ${formatTime(time.time)} by ${time.username} - replays - strafes`;

            const map = new CompleteMap(mapFile);
            const bot = new CompleteBot(botFile);
            const playback = new PlaybackHead(bot, 0);
            const graphics = await setup_graphics(canvas);

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            handleCanvasSize(width, height, playback, graphics);

            playback.advance_time(bot, 0);
            playback.set_head_time(bot, 0, 0);
            graphics.change_map(map);

            setPlayback(playback);
            setGraphics(graphics);
            setBot(bot);

            const botDuration = bot.duration();
            const runDuration = bot.run_duration(time.course) ?? (botDuration - 1);
            setDuration(runDuration);
            setBotOffset(botDuration - runDuration);
            setPlaybackTime(botDuration - runDuration);
        };
        promise().then(() => setLoading(false));
    }, [id]);

    let gameColor = "";
    let styleColor = "";
    if (time) {
        gameColor = getGameColor(time.game, theme);
        styleColor = getStyleColor(time.style, theme);
    }

    const footerHeight = fullscreen ? 0 : FOOTER_HEIGHT;

    return (
        <Box padding={smallScreen ? 0 : 0.5} flexGrow={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
            {error !== "" &&
            <Alert severity="error" sx={{ mb: 1 }}>
                {error}
            </Alert>}
            <Box 
                ref={playerRef}
                sx={{ 
                    width: fullscreen ? "100vw" : "100%", 
                    height: fullscreen ? "100vh" : "100%", 
                    position: fullscreen ? "fixed" : undefined, 
                    zIndex: fullscreen ? 9999 : undefined, 
                    minHeight: fullscreen ? undefined : "600px" 
                }}
            >
                <AutoSizer
                    onResize={({ width, height }) => onResize(width, height - footerHeight)}
                >
                {({ width, height }) => {
                    const playerWidth = getPlayerWidth(width, height - footerHeight);
                    const playerHeight = getPlayerHeight(width, height - footerHeight);
                    return (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        style={{
                            width: width,
                            height: height
                        }}
                    >
                        <Box
                            position="relative"
                            bgcolor="black"
                            style={{
                                width: playerWidth,
                                height: playerHeight
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: playerWidth,
                                    height: playerHeight
                                }}
                            />
                            <Box
                                position="absolute"
                                top={0}
                                style={{
                                    width: playerWidth,
                                    height: playerHeight
                                }}
                            >
                                <PlaybackOverlay 
                                    time={playbackTime} 
                                    duration={duration} 
                                    paused={paused}
                                    offset={botOffset}
                                    fullscreen={fullscreen}
                                    onDragPlayback={onDragPlayback} 
                                    onSetPlayback={onSetPlayback} 
                                    onSetPause={onSetPause}
                                    onFullscreen={onFullscreen}
                                    onSeek={onSeek}
                                    onReset={onReset}
                                />
                            </Box>
                            {loading && 
                            <Box
                                position="absolute"
                                top="50%"
                                left="50%"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                sx={{ transform: "translate(-50%, -50%)" }}
                            >
                                <CircularProgress size={Math.max(40, Math.round(playerHeight / 10))} />
                            </Box>}
                        </Box>
                        <Box 
                            display={fullscreen ? "none" : "flex"}
                            flexDirection="row"
                            p={1} 
                            style={{ width: playerWidth }}
                        >
                            {time && 
                            <>
                            {!smallScreen &&
                            <Box 
                                display="flex" 
                                mr={1.5}
                            >
                                <Link
                                    underline="none"
                                    component={RouterLink}
                                    to={`/maps/${time.mapId}?game=${time.game}&style=${time.style}&course=${time.course}`}
                                >
                                    <Box 
                                        width={108} 
                                        height={108}
                                        overflow="hidden"
                                        sx={{
                                            borderRadius: "4px",
                                            ":hover": {
                                                "img": {
                                                    transform: "scale(1.08)"
                                                }
                                            }
                                        }}
                                    >
                                        <MapThumb size={108} map={maps[time.mapId]} useLargeThumb sx={{ borderRadius: "4px", transition: "transform .2s ease" }} />
                                    </Box>
                                </Link>
                            </Box>}
                            <Box 
                                display="flex" 
                                flexDirection="column" 
                                flexGrow={1}
                                overflow="hidden"
                                sx={{
                                    "p": {
                                        overflowWrap: "break-word", 
                                        wordBreak: "break-word", 
                                        whiteSpace: "normal", 
                                        textWrap: "balance"
                                    }
                                }}
                            >
                                <Box 
                                    display="inline-flex" 
                                    alignItems="center" 
                                >
                                    {smallScreen &&
                                    <Link
                                        underline="none"
                                        component={RouterLink}
                                        to={`/maps/${time.mapId}?game=${time.game}&style=${time.style}&course=${time.course}`}
                                        mr={1.5}
                                    >
                                        <Box 
                                            width={48} 
                                            height={48}
                                            overflow="hidden"
                                            sx={{
                                                borderRadius: "4px",
                                                ":hover": {
                                                    "img": {
                                                        transform: "scale(1.08)"
                                                    }
                                                }
                                            }}
                                        >
                                            <MapThumb size={48} map={maps[time.mapId]} useLargeThumb sx={{ borderRadius: "4px", transition: "transform .2s ease" }} />
                                        </Box>
                                    </Link>}
                                    <Typography 
                                        variant="h5"
                                        display="inline-block" 
                                        lineHeight={1.4}
                                    >
                                        {time.map}
                                    </Typography>
                                </Box>
                                <Box
                                    display="inline-flex" 
                                    alignItems="center" 
                                    mt={smallScreen ? 1 : 0.25}
                                >
                                    <Typography
                                        lineHeight={1.0}
                                        fontWeight="bold" 
                                        variant="caption"
                                        sx={{
                                            padding: 0.3,
                                            backgroundColor: gameColor,
                                            textAlign: "center",
                                            color: "white",
                                            textShadow: "black 1px 1px 1px",
                                            borderRadius: "6px",
                                            border: 1,
                                            borderColor: gameColor
                                        }}
                                    >
                                        {formatGame(time.game)}
                                    </Typography>
                                    <Typography
                                        lineHeight={1.0}
                                        fontWeight="bold" 
                                        variant="caption"
                                        ml={0.5}
                                        sx={{
                                            padding: 0.3,
                                            backgroundColor: styleColor,
                                            textAlign: "center",
                                            color: "white",
                                            textShadow: "black 1px 1px 1px",
                                            borderRadius: "6px",
                                            border: 1,
                                            borderColor: styleColor
                                        }}
                                    >
                                        {formatStyle(time.style)}
                                    </Typography>
                                </Box>
                                <Box 
                                    mt={0.75}
                                    display="inline-flex" 
                                >
                                    <Link 
                                        display="inline-flex" 
                                        alignItems="center"
                                        underline="none"
                                        component={RouterLink}
                                        color="textPrimary"
                                        to={`/users/${time.userId}?game=${time.game}&style=${time.style}`}
                                        sx={{
                                            textDecoration: "none",
                                            ":hover": {
                                                "p": {
                                                    textDecoration: "underline"
                                                }
                                            }
                                        }}
                                    >
                                        <UserAvatar username={time.username} userThumb={time.userThumb} sx={{width: "24px", height: "24px"}} />
                                        <Typography 
                                            variant="body1" 
                                            ml={0.75} 
                                            display="inline-block"
                                        >
                                            @{time.username}
                                        </Typography>
                                    </Link>
                                </Box>
                                <Box 
                                    display="inline-flex" 
                                    flexDirection={verySmallScreen ? "column" : "row"}
                                    alignItems={verySmallScreen ? undefined : "center"}
                                    justifyContent={verySmallScreen ? undefined : "space-between"}
                                    mt={0.5}
                                >
                                    <Box display="flex" alignItems="center">
                                        <Typography 
                                            variant="body1"
                                            display="inline-block" 
                                            fontFamily="monospace"
                                        >
                                            {formatPlacement(time.placement)}
                                        </Typography>
                                        <Typography 
                                            variant="body1"
                                            display="inline-block"
                                            ml={0.75}
                                            mr={0.75}
                                        >
                                            -
                                        </Typography>
                                        <Typography 
                                            variant="body1"
                                            display="inline-block"
                                            mr={1}
                                        >
                                            {formatTime(time.time)}
                                        </Typography>
                                        <DiffDisplay ms={time.time} diff={time.wrDiff} />
                                    </Box>
                                    <Typography 
                                        variant="body2" 
                                        color="textSecondary"
                                        display="inline-block" 
                                    >
                                        {smallScreen ? dateFormat.format(new Date(time.date)) : dateTimeFormat.format(new Date(time.date))}
                                    </Typography>
                                </Box>
                            </Box>
                            </>}
                        </Box>
                    </Box>
                    );
                }}
                </AutoSizer>
            </Box>
        </Box>
    );
}

export default Replays;