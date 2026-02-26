import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import init, { CompleteBot, CompleteMap, Graphics, PlaybackHead, setup_graphics } from "../bot_player/strafesnet_roblox_bot_player_wasm_module";
import AutoSizer from "react-virtualized-auto-sizer";
import PlaybackOverlay from "./playback/PlaybackOverlay";

const ASPECT_RATIO = 16 / 9;
const MODE_MAIN = 0;

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

function Bots() {
    const [botData, setBotData] = useState<CompleteBot>();
    const [graphics, setGraphics] = useState<Graphics>();
    const [playback, setPlayback] = useState<PlaybackHead>();
    const [duration, setDuration] = useState(0);
    const playbackTime = useRef(0);
    //const [playbackTime, setPlaybackTime] = useState(0);
    const [animTimer, setAnimTimer] = useState(0);
    const [paused, setPaused] = useState(false);
    const [speed] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        document.title = "bots - strafes"
    }, []);

    useLayoutEffect(() => {
        let animationId: number;

        const animate = (timeMs: number) => {
            const time = timeMs / 1000;
            setAnimTimer(time);
            animationId = requestAnimationFrame(animate);

            if (playback && botData && graphics) {
                const botDuration = botData.run_duration(MODE_MAIN) ?? 0;
                const curRunTime = playback.get_head_time(time) - 1;
                setDuration(botDuration);
                playbackTime.current = Math.min(curRunTime, botDuration);
                //setPlaybackTime(Math.min(curRunTime, botDuration));
                // if (curRunTime > botDuration) {
                //     playback.set_paused(time, true);
                // }
                // else {
                //     playback.advance_time(botData, time);
                // }
                playback.advance_time(botData, time);
                playback.set_scale(time, speed);
                graphics.render(botData, playback, time);
            }
        }

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [botData, graphics, playback, animTimer, speed]);

    const onResize = useCallback((width: number, height: number) => {
        if (playback && graphics) {
            handleCanvasSize(width, height, playback, graphics);
        }
    }, [graphics, playback]);

    const onCommitPlaybackTime = useCallback((time: number) => {
        playbackTime.current = time;
        if (playback) {
            playback.set_head_time(animTimer, time + 1);
            if (!paused) {
                playback.set_paused(animTimer, false);
            }
        }
    }, [animTimer, paused, playback]);

    const onChangePlaybackTime = useCallback((time: number) => {
        playbackTime.current = time;
        if (playback) {
            playback.set_head_time(animTimer, time + 1);
            playback.set_paused(animTimer, true);
        }
    }, [animTimer, playback]);

    const onSetPause = useCallback((paused: boolean) => {
        setPaused(paused);
        if (playback) {
            playback.set_paused(animTimer, paused);
        }
    }, [animTimer, playback]);

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
            playback.set_head_time(0, -1);
            graphics.change_map(map);

            setPlayback(playback);
            setGraphics(graphics);
            setBotData(bot);
        };
        promise();
    }, []);

    return (
        <Box display="flex" flexDirection="column" flexGrow={1}>
            <Breadcrumbs separator={<NavigateNextIcon />} sx={{ p: 1 }}>
                <Link underline="hover" color="inherit" href="/">
                    Home
                </Link>
                <Typography color="textPrimary">
                    Bots
                </Typography>
            </Breadcrumbs>
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
                                            time={playbackTime.current} 
                                            duration={duration} 
                                            paused={paused}
                                            onDragPlayback={onChangePlaybackTime} 
                                            onSetPlayback={onCommitPlaybackTime} 
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

export default Bots;