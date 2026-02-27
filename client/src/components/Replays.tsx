import Box from "@mui/material/Box";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import init, { CompleteBot, CompleteMap, Graphics, PlaybackHead, setup_graphics } from "../bot_player/strafesnet_roblox_bot_player_wasm_module";
import AutoSizer from "react-virtualized-auto-sizer";
import PlaybackOverlay from "./playback/PlaybackOverlay";
import { MAIN_COURSE } from "shared";

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

function Replays() {
    const [ bot, setBot ] = useState<CompleteBot>();
    const [ graphics, setGraphics ] = useState<Graphics>();
    const [ playback, setPlayback ] = useState<PlaybackHead>();
    const [ duration, setDuration ] = useState(0);
    const [ botOffset, setBotOffset ] = useState(0);
    const [ playbackTime, setPlaybackTime ] = useState(-1);
    const [ paused, setPaused ] = useState(false);

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
        if (playback) {
            playback.set_head_time(sessionTimer.current, time + botOffset);
            if (!paused) {
                playback.set_paused(sessionTimer.current, false);
            }
        }
    }, [botOffset, paused, playback]);

    const onSetPlayback = useCallback((time: number) => {
        setPlaybackTime(time);
        if (playback) {
            playback.set_head_time(sessionTimer.current, time + botOffset);
            playback.set_paused(sessionTimer.current, true);
        }
    }, [botOffset, playback]);

    const onSetPause = useCallback((paused: boolean) => {
        setPaused(paused);
        if (playback) {
            playback.set_paused(sessionTimer.current, paused);
        }
    }, [playback]);

    useEffect(() => {
        const promise = async () => {
            await init();
            const canvas = canvasRef.current;
            if (!canvas) return;

            const playback = new PlaybackHead(0);
            const graphics = await setup_graphics(canvas);

            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            handleCanvasSize(width, height, playback, graphics);

            const mapPromise = fetch("/maps/5692093612.snfm");
            const botPromise = fetch("/bhop_marble_7cf33a64-7120-4514-b9fa-4fe29d9523d.qbot");
            const mapRes = await mapPromise;
            const botRes = await botPromise;

            const map = new CompleteMap(new Uint8Array(await mapRes.arrayBuffer()));
            const bot = new CompleteBot(new Uint8Array(await botRes.arrayBuffer()));

            playback.advance_time(bot, 0);
            playback.set_head_time(0, 0);
            graphics.change_map(map);

            setPlayback(playback);
            setGraphics(graphics);
            setBot(bot);

            const botDuration = bot.duration();
            const runDuration = bot.run_duration(MAIN_COURSE) ?? (botDuration - 1);
            setDuration(runDuration);
            setBotOffset(botDuration - runDuration);
        };
        promise();
    }, []);

    return (
        <Box display="flex" flexDirection="column" flexGrow={1}>
            <Box padding={1} flexGrow={1} display="flex" flexDirection="column" alignItems="center">
                <Box sx={{ width: "100%", height: "85%", minHeight: "400px" }}>
                    <AutoSizer
                        onResize={({ width, height }) => onResize(width, height)}
                    >
                        {({ width, height }) =>
                            <Box
                                display="flex"
                                justifyContent="center"
                                style={{
                                    width: width,
                                    height: height
                                }}
                            >
                                <Box
                                    position="relative"
                                    style={{
                                        width: getPlayerWidth(width, height),
                                        height: getPlayerHeight(width, height)
                                    }}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: getPlayerWidth(width, height),
                                            height: getPlayerHeight(width, height)
                                        }}
                                    />
                                    <Box
                                        position="absolute"
                                        top={0}
                                        style={{
                                            width: getPlayerWidth(width, height),
                                            height: getPlayerHeight(width, height)
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
                                </Box>
                            </Box>}
                    </AutoSizer>
                </Box>
            </Box>
        </Box>
    );
}

export default Replays;