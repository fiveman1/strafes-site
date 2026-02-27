import Box from "@mui/material/Box";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import init, { CompleteBot, CompleteMap, Graphics, PlaybackHead, setup_graphics } from "../bot_player/strafesnet_roblox_bot_player_wasm_module";
import AutoSizer from "react-virtualized-auto-sizer";
import PlaybackOverlay from "./playback/PlaybackOverlay";
import { formatGame, formatPlacement, formatStyle, formatTime, MAIN_COURSE, Time } from "shared";
import { useOutletContext, useParams } from "react-router";
import { getBotFileForTime, getMapFile, getTimeById } from "../api/api";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import MapThumb from "./displays/MapThumb";
import { ContextParams, getGameColor, getStyleColor } from "../common/common";
import UserAvatar from "./displays/UserAvatar";
import { useTheme } from "@mui/material/styles";
import { dateFormat, dateTimeFormat } from "../common/datetime";
import useMediaQuery from "@mui/material/useMediaQuery";

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
    const [ loading, setLoading ] = useState(true);
    const theme = useTheme();
    const smallScreen = useMediaQuery("(max-width: 520px)");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animTimer = useRef(0);
    const sessionTimer = useRef(0);

    useEffect(() => {
        document.title = "replays - strafes"
    }, []);

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

    const onDragPlayback = useCallback((time: number) => {
        setPlaybackTime(time);
        if (playback && bot) {
            playback.set_head_time(bot, sessionTimer.current, time + botOffset);
            if (!paused) {
                playback.set_paused(sessionTimer.current, false);
            }
        }
    }, [bot, botOffset, paused, playback]);

    const onSetPlayback = useCallback((time: number) => {
        setPlaybackTime(time);
        if (playback && bot) {
            playback.set_head_time(bot, sessionTimer.current, time + botOffset);
            playback.set_paused(sessionTimer.current, true);
        }
    }, [bot, botOffset, playback]);

    const onSetPause = useCallback((paused: boolean) => {
        setPaused(paused);
        if (playback) {
            playback.set_paused(sessionTimer.current, paused);
        }
    }, [playback]);

    useEffect(() => {
        const promise = async () => {
            await init();

            const time = await getTimeById(id);
            if (!time || !time.hasBot) return;
            setTime(time);

            const canvas = canvasRef.current;
            if (!canvas) return;

            const playback = new PlaybackHead(0);
            const graphics = await setup_graphics(canvas);

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            handleCanvasSize(width, height, playback, graphics);

            const mapPromise = getMapFile(time.mapId);
            const botPromise = getBotFileForTime(time);
            const mapFile = await mapPromise;
            const botFile = await botPromise;

            if (!mapFile || !botFile) return;
            document.title = `${time.map} in ${formatTime(time.time)} by ${time.username} - replays - strafes`

            const map = new CompleteMap(mapFile);
            const bot = new CompleteBot(botFile);

            playback.advance_time(bot, 0);
            playback.set_head_time(bot, 0, 0);
            graphics.change_map(map);

            setPlayback(playback);
            setGraphics(graphics);
            setBot(bot);

            const botDuration = bot.duration();
            const runDuration = bot.run_duration(MAIN_COURSE) ?? (botDuration - 1);
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

    return (
        <Box display="flex" flexDirection="column" flexGrow={1}>
            <Box padding={1} flexGrow={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <Box sx={{ width: "100%", height: "100%", minHeight: "600px" }}>
                    <AutoSizer
                        onResize={({ width, height }) => onResize(width, height - FOOTER_HEIGHT)}
                    >
                        {({ width, height }) => {
                            const playerWidth = getPlayerWidth(width, height - FOOTER_HEIGHT);
                            const playerHeight = getPlayerHeight(width, height - FOOTER_HEIGHT);
                            return (
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
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
                                                onDragPlayback={onSetPlayback} 
                                                onSetPlayback={onDragPlayback} 
                                                onSetPause={onSetPause}
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
                                        display="flex" 
                                        flexDirection="row"
                                        p={1} 
                                        style={{ width: playerWidth }}
                                    >
                                        {time && 
                                        <>
                                        {!smallScreen &&
                                        <Box display="flex" mr={1.5}>
                                            <MapThumb size={108} map={maps[time.mapId]} useLargeThumb />
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
                                                <Box display="flex" mr={1.5}>
                                                    <MapThumb size={48} map={maps[time.mapId]} />
                                                </Box>}
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
                                                display="inline-flex" 
                                                alignItems="center" 
                                                mt={0.75}
                                            >
                                                <UserAvatar username={time.username} userThumb={time.userThumb} sx={{width: "24px", height: "24px"}} />
                                                <Typography 
                                                    variant="body1" 
                                                    ml={0.75} 
                                                    display="inline-block"
                                                >
                                                    @{time.username}
                                                </Typography>
                                            </Box>
                                            <Box 
                                                display="inline-flex" 
                                                flexDirection="row"
                                                alignItems="center"
                                                justifyContent="space-between"
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
                                                    >
                                                        {formatTime(time.time)}
                                                    </Typography>
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
        </Box>
    );
}

export default Replays;