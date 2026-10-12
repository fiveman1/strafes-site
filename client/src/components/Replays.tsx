import Box from "@mui/material/Box";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import init, { Bvh, CompleteBot, StreamableMap, Graphics, CompleteHead, StreamableHead, StreamableSession, new_streamable_bot, new_streamable_map, setup_graphics, Surface, StreamableBot, BotDownloader, MapDownloader, BotBlockRange, DownloadMapBlockRangeError, DownloadBotBlockRangeError, MapBlockRange } from "../wasm/strafesnet_roblox_bot_player_wasm_module";
import AutoSizer from "react-virtualized-auto-sizer";
import PlaybackOverlay from "./playback/PlaybackOverlay";
import { createPlaybackTime } from "./playback/playbackTime";
import { formatCourse, formatDiff, formatGame, formatPlacement, formatStyle, formatTier, formatTime, GameControls, MAIN_COURSE, Replay } from "shared";
import { Link as RouterLink, useOutletContext, useParams } from "react-router";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import MapThumb from "./displays/MapThumb";
import { ContextParams, getGameColor, getStyleColor, InputState, PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT } from "../common/common";
import UserAvatar from "./displays/UserAvatar";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DiffDisplay from "./displays/DiffDisplay";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import DateDisplay from "./displays/DateDisplay";
import { getMapTierColor } from "../common/colors";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { clamp } from "../common/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queries } from "../api/queries";
import CountryFlag from "./displays/CountryFlag";
import ColorChip from "./displays/ColorChip";
import { replayAssetQueries } from "../api/replayAssets";

function getPlayerHeight(width: number, height: number) {
    if (width / height > PLAYER_ASPECT_RATIO) {
        return height;
    }
    else {
        return width / PLAYER_ASPECT_RATIO;
    }
}

function getPlayerWidth(width: number, height: number) {
    if (width / height > PLAYER_ASPECT_RATIO) {
        return height * PLAYER_ASPECT_RATIO;
    }
    else {
        return width;
    }
}

function handleCanvasSize(width: number, height: number, graphics: Graphics, surfaces: Surface[]) {
    const screenWidth = getPlayerWidth(width, height) * window.devicePixelRatio;
    const screenHeight = getPlayerHeight(width, height) * window.devicePixelRatio;
    for (const surface of surfaces) {
        surface.resize(graphics, screenWidth, screenHeight);
    }
}

function getSafeTime(time: number, bot: CompleteBot) {
    return clamp(time, 0, bot.duration() - 0.0001);
}

function getMapTitle(replay: Replay) {
    if (replay.course === MAIN_COURSE) {
        return replay.map;
    }
    return `${replay.map} (${formatCourse(replay.course, true)})`;
}

const controlToState = new Map([
    [GameControls.MoveLeft, InputState.MoveLeft],
    [GameControls.MoveRight, InputState.MoveRight],
    [GameControls.MoveForward, InputState.MoveForward],
    [GameControls.MoveBack, InputState.MoveBack],
    [GameControls.Jump, InputState.Jump]
]);

function updateInputDisplay(input: HTMLDivElement, playback: StreamableSession) {
    const controls = playback.get_game_controls();
    controlToState.forEach((state, control) => {
        const isActive = (controls & control) > 0;
        const element = input.querySelector(`#${state}`);
        if (element) {
            if (isActive) {
                element.classList.add("inputActive");
            }
            else {
                element.classList.remove("inputActive");
            }
        }
    });

    const yawDelta = playback.get_angles_yaw_delta();
    const lookLeftElem = input.querySelector(`#${InputState.LookLeft}`);
    const lookRightElem = input.querySelector(`#${InputState.LookRight}`);
    if (lookLeftElem) {
        if (yawDelta > 0) {
            lookLeftElem.classList.add("inputActive");
        }
        else {
            lookLeftElem.classList.remove("inputActive");
        }
    }
    if (lookRightElem) {
        if (yawDelta < 0) {
            lookRightElem.classList.add("inputActive");
        }
        else {
            lookRightElem.classList.remove("inputActive");
        }
    }
}

const FOOTER_HEIGHT = 156;

function updateDiffDisplay(diffTimeElement: HTMLElement, diffSpeedElement: HTMLElement, timeDiff: number, speedDiff: number) {
    const diffMs = Math.round(timeDiff * 1000);
    const timePos = diffMs >= 0;
    let timeText = timePos ? "+" : "-";
    timeText += formatDiff(Math.abs(diffMs));
    diffTimeElement.innerText = timeText;
    if (timePos) {
        diffTimeElement.classList.add("better");
        diffTimeElement.classList.remove("worse");

    }
    else {
        diffTimeElement.classList.remove("better");
        diffTimeElement.classList.add("worse");
    }

    const speedPos = speedDiff >= 0;
    let speedText = speedPos ? "+" : "";
    speedText += speedDiff.toFixed(2) + " u/s";
    diffSpeedElement.innerText = speedText;
    if (speedPos) {
        diffSpeedElement.classList.remove("better");
        diffSpeedElement.classList.add("worse");
    }
    else {
        diffSpeedElement.classList.add("better");
        diffSpeedElement.classList.remove("worse");
    }
}

interface Freeable {
    free(): void
}

function releaseRefs(refs: React.RefObject<Freeable | null>[]) {
    for (const ref of refs) {
        ref.current = null;
    }
}

async function ingestBotBlock(block: BotBlockRange, downloader: BotDownloader, bot: StreamableBot): Promise<boolean> {
    try {
        const data = await downloader.download_bot_block_range(block);
        bot.ingest(data);
        return true;
    }
    catch (err) {
        if (err instanceof DownloadBotBlockRangeError) {
            console.error(err.error());
            const request = err.request();
            if (request) {
                bot.cancel(request);
            }
            else {
                bot.clear_downloading();
            }
        }
        else {
            console.error(err);
            bot.clear_downloading();
        }
        return false;
    }
}

async function ingestMapBlock(block: MapBlockRange, downloader: MapDownloader, map: StreamableMap, graphics: Graphics): Promise<boolean> {
    try {
        const data = await downloader.download_map_block_range(block);
        map.ingest(graphics, data);
        return true;
    }
    catch (err) {
        if (err instanceof DownloadMapBlockRangeError) {
            console.error(err.error());
            const request = err.request();
            if (request) {
                map.cancel(request);
            }
            else {
                map.clear_downloading();
            }
        }
        else {
            console.error(err);
            map.clear_downloading();
        }
        return false;
    }
}

function noop() {}

// One WebGPU device for the whole tab, shared by every replay viewed.
// This is primarily to avoid what seems to be a Chrome issue with WebGPU where garbage collecting
// a graphics object while another one was being used could cause the page to go unresponsive.
let sharedGraphics: Promise<Graphics> | null = null;

async function getGraphicsAndSurface(canvas: HTMLCanvasElement): Promise<{ graphics: Graphics, surface: Surface }> {
    if (sharedGraphics) {
        const graphics = await sharedGraphics;
        // WebGL can only draw to the canvas it was set up with, so it falls through to a new setup.
        if (graphics.supports_multiple_surfaces()) {
            return { graphics, surface: graphics.new_surface(canvas) };
        }
    }
    const promise = setup_graphics(canvas);
    const graphicsPromise = promise.then(gs => gs.graphics()!);
    sharedGraphics = graphicsPromise;
    try {
        const gs = await promise;
        return { graphics: await graphicsPromise, surface: gs.surface()! };
    }
    catch (err) {
        // Don't cache a failed setup, so the next replay tries again.
        if (sharedGraphics === graphicsPromise) sharedGraphics = null;
        throw err;
    }
}

function discardSharedGraphics(graphics: Graphics) {
    sharedGraphics?.then(shared => {
        if (shared === graphics) sharedGraphics = null;
    });
}

// Browsers typically support 6 concurrent connections over HTTP/1.1
const MAX_CONCURRENT_DOWNLOADS = 6;

function Replays() {
    const { id } = useParams() as { id: string };
    const { maps, loginUser } = useOutletContext() as ContextParams;

    const theme = useTheme();
    const smallScreen = useMediaQuery("(max-width: 600px)");
    const queryClient = useQueryClient();

    const replayQuery = useQuery(queries.replays.replay(id));
    const replay = replayQuery.data;

    const [ duration, setDuration ] = useState(0);
    const [ botOffset, setBotOffset ] = useState(0);
    const [ playbackSpeed, setPlaybackSpeed ] = useState(1.0);
    const [ playbackTime ] = useState(() => createPlaybackTime(-1));
    const [ paused, setPaused ] = useState(false);
    const [ fullscreen, setFullscreen ] = useState(false);
    const [ loading, setLoading ] = useState(true);
    const [ error, setErrorState ] = useState("");
    const [ diffReady, setDiffReady ] = useState(false);
    const [ showThumb, setShowThumb ] = useState(false);
    const [ debugInfo, setDebugInfo ] = useState("");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const thumbCanvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const speedTextRef = useRef<HTMLSpanElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const diffTimeTextRef = useRef<HTMLElement>(null);
    const diffSpeedTextRef = useRef<HTMLElement>(null);
    const fpsTextRef = useRef<HTMLSpanElement>(null);

    const graphicsRef = useRef<Graphics>(null);
    const surfaceRef = useRef<Surface>(null);
    const thumbSurfaceRef = useRef<Surface>(null);
    const botRef = useRef<StreamableBot>(null);
    const mapRef = useRef<StreamableMap>(null);
    const botDownloaderRef = useRef<BotDownloader>(null);
    const mapDownloaderRef = useRef<MapDownloader>(null);
    const diffBotRef = useRef<CompleteBot>(null);
    const diffBvhRef = useRef<Bvh>(null);
    const playbackRef = useRef<StreamableSession>(null);
    const thumbPlaybackRef = useRef<StreamableHead>(null);
    const diffPlaybackRef = useRef<CompleteHead>(null);

    const animTimer = useRef(0);
    const sessionTimer = useRef(0);
    // Requests more blocks to be downloaded; call after anything that changes which blocks are needed
    const pumpRef = useRef<() => void>(noop);

    const setError = useCallback((error: string) => {
        setErrorState(error);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (replay) {
            const placementText = replay.placement === 1 ? "WR" : `${formatPlacement(replay.placement)} place`;
            document.title = `${getMapTitle(replay)} in ${formatTime(replay.time)} by ${replay.username} (${placementText}) - replays - strafes`;
        }
        else {
            document.title = `replays - strafes`;
        }
    }, [replay]);

    useEffect(() => {
        if (replayQuery.isSuccess || replayQuery.isError) {
            if (!replay) {
                setError("Something went wrong trying to load the replay.");
                return;
            }
            if (!replay.hasBot) {
                setError("No replay exists for this time.");
                return;
            }
        }
        else if (!replay) {
            return;
        }

        if (replay.compareTimeId) {
            queryClient.prefetchQuery(replayAssetQueries.bot(replay.compareTimeId));
        }

        let isCanceled = false;
        let pumpInterval: ReturnType<typeof setInterval> | undefined = undefined;
        setDiffReady(false);
        setLoading(true);

        const promise = async () => {
            await init();

            if (isCanceled) return;

            const canvas = canvasRef.current;
            if (!canvas) {
                setError("Couldn't setup bot playback.");
                return;
            }

            try {
                const { graphics, surface } = await getGraphicsAndSurface(canvas);

                const supportsMultiSurface = graphics.supports_multiple_surfaces();
                setShowThumb(supportsMultiSurface);

                setDebugInfo(graphics.debug_info());

                const mapPromise = async () => {
                    const url = await queryClient.fetchQuery(queries.replays.mapURL(replay.mapId));
                    if (!url) {
                        setError("Couldn't load map file.");
                        return null;
                    }
                    const mapDownloader = new MapDownloader(url);
                    try {
                        const map = await new_streamable_map(mapDownloader, graphics, 512000);
                        mapDownloaderRef.current = mapDownloader;
                        return map;
                    }
                    catch (err) {
                        console.error(err);
                        setError("Couldn't load map file.");
                        return null;
                    }
                };

                const botPromise = async () => {
                    const url = await queryClient.fetchQuery(queries.replays.botURL(replay.id));
                    if (!url) {
                        setError("Couldn't load bot file.");
                        return null;
                    }
                    const botDownloader = new BotDownloader(url);
                    try {
                        const bot = await new_streamable_bot(botDownloader, replay.time / 1000, 512000);
                        botDownloaderRef.current = botDownloader;
                        return bot;
                    }
                    catch (err) {
                        console.error(err);
                        setError("Couldn't load bot file.");
                        return null;
                    }
                };

                const [map, bot] = await Promise.all([mapPromise(), botPromise()]);

                const mapDownloader = mapDownloaderRef.current;
                const botDownloader = botDownloaderRef.current;
                if (isCanceled || !map || !bot || !mapDownloader || !botDownloader) return;
                
                const playback = new StreamableSession(bot, 0);
                
                playbackRef.current = playback;
                graphicsRef.current = graphics;
                surfaceRef.current = surface;
                
                botRef.current = bot;
                mapRef.current = map;

                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                handleCanvasSize(width, height, graphics, [surface]);

                playback.advance_time(bot, map, 0);
                playback.set_bot_time(bot, map, 0, 0);

                let thumbPlayback: StreamableHead | null = null;
                let thumbSurface: Surface | null = null;
                const thumbCanvas = thumbCanvasRef.current;
                if (supportsMultiSurface && thumbCanvas) {
                    thumbPlayback = new StreamableHead(bot, 0);
                    thumbSurface = graphics.new_surface(thumbCanvas);
                    handleCanvasSize(PLAYER_THUMB_HEIGHT * PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT, graphics, [thumbSurface]);
                    thumbPlayback.set_time(bot, 0);
                    thumbPlaybackRef.current = thumbPlayback;
                    thumbSurfaceRef.current = thumbSurface;
                }

                const botDuration = bot.duration();
                const runDuration = bot.run_duration(replay.course);
                setDuration(runDuration);
                const offset = botDuration - runDuration;
                setBotOffset(offset);
                playbackTime.set(-offset);
                setLoading(false);

                const diffBotPromise = async () => {
                    if (replay.compareTimeId) {
                        try {
                            const diffBotFile = await queryClient.fetchQuery(replayAssetQueries.bot(replay.compareTimeId!));
                            if (!diffBotFile || isCanceled) return;
                            
                            const diffBot = new CompleteBot(diffBotFile);
                            diffBotRef.current = diffBot;
                            diffBvhRef.current = new Bvh(diffBot);
                            diffPlaybackRef.current = new CompleteHead(diffBot, 0);
                            setDiffReady(true);
                        }
                        catch (error) {
                            console.error("Couldn't initialize comparison replay", error);
                        }
                    }
                };

                diffBotPromise();

                // Picks the highest priority block that isn't already downloaded or in flight, or undefined if nothing is needed right now
                const pickNextBlock = (): (() => Promise<boolean>) | undefined => {
                    const thumbTime = thumbPlayback?.get_run_time(bot, replay.course);
                    const downloadBot = (block: BotBlockRange) => () => ingestBotBlock(block, botDownloader, bot);
                    const downloadMap = (block: MapBlockRange) => () => ingestMapBlock(block, mapDownloader, map, graphics);

                    if (thumbTime !== undefined) {
                        const botBlock = bot.next_block_at_time(thumbTime);
                        if (botBlock) return downloadBot(botBlock);
                    }

                    if (thumbPlayback && thumbSurface && thumbTime !== undefined) {
                        const mapBlock = map.next_block_head_throttled(bot, thumbPlayback, thumbSurface);
                        if (mapBlock) return downloadMap(mapBlock);
                    }

                    const botBlock = bot.next_block_throttled(playback, 2);
                    if (botBlock) return downloadBot(botBlock);

                    const mapBlock = map.next_block_session(bot, playback, surface);
                    if (mapBlock) return downloadMap(mapBlock);

                    const eagerBotBlock = bot.next_block_eager(playback, 2);
                    if (eagerBotBlock) return downloadBot(eagerBotBlock);

                    return undefined;
                };

                // Fills free download slots. Safe to call at any time and as often as needed, so that blocks which become
                // needed later (failed downloads, seeking, the tab becoming visible again) always get picked up.
                let activeDownloads = 0;
                const pump = () => {
                    try {
                        while (!isCanceled && activeDownloads < MAX_CONCURRENT_DOWNLOADS) {
                            const download = pickNextBlock();
                            if (!download) break;
                            ++activeDownloads;
                            download().then((success) => {
                                --activeDownloads;
                                if (success) pump();
                                // Back off a little so a failing server doesn't get hammered
                                else setTimeout(pump, 1000);
                            });
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                };

                pumpRef.current = pump;
                // Background tabs throttle timers, but this still keeps downloads moving while hidden
                pumpInterval = setInterval(pump, 250);
                document.addEventListener("visibilitychange", pump);
                pump();
            }
            catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Something went wrong trying to initialize the playback engine.");
            }
        };

        promise().catch((err) => {
            if (!isCanceled) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Something went wrong trying to load the replay.");
            }
        });

        return () => {
            isCanceled = true;
            clearInterval(pumpInterval);
            document.removeEventListener("visibilitychange", pumpRef.current);
            pumpRef.current = noop;
            releaseRefs([playbackRef, thumbPlaybackRef, graphicsRef, surfaceRef, thumbSurfaceRef, botRef, mapRef, botDownloaderRef, mapDownloaderRef, diffPlaybackRef, diffBvhRef, diffBotRef]);
        };
    }, [id, playbackTime, queryClient, replay, replayQuery.isError, replayQuery.isSuccess, setError]);

    useLayoutEffect(() => {
        let animationId: number;
        let fpsFrames = 0;
        let fpsWindowStart = performance.now();

        if (replay?.course === undefined) {
            return;
        }

        const animate = (timeMs: number) => {
            const time = timeMs / 1000;
            animationId = requestAnimationFrame(animate);

            // Average over half a second windows so the number is readable
            ++fpsFrames;
            const fpsElapsed = timeMs - fpsWindowStart;
            if (fpsElapsed >= 500) {
                const fpsText = fpsTextRef.current;
                if (fpsText) {
                    fpsText.innerText = `${Math.round(fpsFrames * 1000 / fpsElapsed)} FPS`;
                }
                fpsFrames = 0;
                fpsWindowStart = timeMs;
            }

            const playback = playbackRef.current;
            const bot = botRef.current;
            const map = mapRef.current;
            const graphics = graphicsRef.current;
            const surface = surfaceRef.current;
            const speedText = speedTextRef.current;
            const input = inputContainerRef.current;

            if (playback && bot && map && graphics && surface && speedText && input) {
                const elapsed = time - animTimer.current;
                const newSessionTime = sessionTimer.current + elapsed;
                try {
                    playback.advance_time(bot, map, newSessionTime);
                    map.promote_ready_assets(graphics);
                    graphics.render_session(surface, map, bot, playback);
                    
                    setLoading(playback.is_buffering());

                    const errors = graphics.take_errors();
                    if (errors.length > 0) {
                        // A lost device can't render anything again, so the next replay gets a new one.
                        if (errors.some(e => e.startsWith("GPU device lost"))) {
                            discardSharedGraphics(graphics);
                        }
                        setError(errors.join("\n"));
                    }

                    const curPlayerTime = Math.min(playback.get_bot_time() - botOffset, bot.duration());
                    playbackTime.set(curPlayerTime);
                    
                    const speed = playback.get_speed(bot);
                    const newText = speed.toFixed(2).toString();
                    if (speedText.innerText !== newText) {
                        speedText.innerText = newText;
                    }
                    updateInputDisplay(input, playback);

                    const thumbPlayback = thumbPlaybackRef.current;
                    const thumbSurface = thumbSurfaceRef.current;

                    if (thumbPlayback && thumbSurface) {
                        graphics.render_head(thumbSurface, map, bot, thumbPlayback);
                    }

                    const diffBot = diffBotRef.current;
                    const bvh = diffBvhRef.current;
                    const diffPlayback = diffPlaybackRef.current;
                    const diffTimeElement = diffTimeTextRef.current;
                    const diffSpeedElement = diffSpeedTextRef.current;

                    if (diffBot && bvh && diffPlayback && diffTimeElement && diffSpeedElement) {
                        const pos = playback.get_position(bot);
                        const diffPlaybackTime = bvh.closest_time_to_point(diffBot, pos);
                        if (diffPlaybackTime !== undefined) {
                            diffPlayback.set_time(diffBot, getSafeTime(diffPlaybackTime, diffBot));
                            const botTime = playback.get_run_time(bot, replay.course) ?? 0;
                            const diffBotTime = diffPlayback.get_run_time(diffBot, replay.course) ?? 0;
                            const timeDiff = botTime - diffBotTime;
                            const diffBotSpeed = diffPlayback.get_speed(diffBot);
                            const speedDiff = speed - diffBotSpeed;

                            updateDiffDisplay(diffTimeElement, diffSpeedElement, timeDiff, speedDiff);
                        }
                    }
                }
                catch (err) {
                    console.error(err);
                    setError("Something went wrong while trying to render the replay.");
                }

                sessionTimer.current = newSessionTime;
            }

            animTimer.current = time;
        }

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [setError, replay?.course, botOffset, playbackTime]);

    const onResize = useCallback((width: number, height: number) => {
        const graphics = graphicsRef.current;
        const surface = surfaceRef.current;
        const thumbSurface = thumbSurfaceRef.current;
        if (!graphics) return;
        if (surface) {
            handleCanvasSize(width, height, graphics, [surface]);
        }
        if (thumbSurface) {
            handleCanvasSize(PLAYER_THUMB_HEIGHT * PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT, graphics, [thumbSurface]);
        }
    }, []);

    const onSetPlayback = useCallback((time: number) => {
        playbackTime.set(time);
        const playback = playbackRef.current;
        const bot = botRef.current;
        const map = mapRef.current;
        if (playback && bot && map) {
            playback.set_bot_time(bot, map, sessionTimer.current, getSafeTime(time + botOffset, bot));
            if (!paused) {
                playback.set_paused(bot, map, sessionTimer.current, false);
            }
            pumpRef.current();
        }
    }, [botOffset, paused, playbackTime]);

    const onDragPlayback = useCallback((time: number) => {
        playbackTime.set(time);
        const playback = playbackRef.current;
        const bot = botRef.current;
        const map = mapRef.current;
        if (playback && bot && map) {
            playback.set_bot_time(bot, map, sessionTimer.current, getSafeTime(time + botOffset, bot));
            playback.set_paused(bot, map, sessionTimer.current, true);
            pumpRef.current();
        }
    }, [botOffset, playbackTime]);

    const onSeek = useCallback((offset: number) => {
        const playback = playbackRef.current;
        const bot = botRef.current;
        const map = mapRef.current;
        if (playback && bot && map) {
            const curTime = playback.get_bot_time();
            const newTime = curTime + offset;
            playback.set_bot_time(bot, map, sessionTimer.current, getSafeTime(newTime, bot));
            pumpRef.current();
        }
    }, []);

    const onReset = useCallback(() => {
        const playback = playbackRef.current;
        const bot = botRef.current;
        const map = mapRef.current;
        if (playback && bot && map) {
            playback.set_bot_time(bot, map, sessionTimer.current, 0.0001);
            pumpRef.current();
        }
    }, []);

    const onSetPause = useCallback((paused: boolean) => {
        setPaused(paused);
        const playback = playbackRef.current;
        const bot = botRef.current;
        const map = mapRef.current;
        if (playback && bot && map) {
            playback.set_paused(bot, map, sessionTimer.current, paused);
        }
    }, []);

    const onFullscreen = useCallback((fullscreen: boolean) => {
        setFullscreen(fullscreen);
        if (fullscreen) {
            playerRef.current?.requestFullscreen();
        }
        else if (document.fullscreenElement !== null) {
            document.exitFullscreen();
        }
    }, []);

    const onChangePlaybackSpeed = useCallback((speed: number) => {
        setPlaybackSpeed(speed);
        const playback = playbackRef.current;
        const bot = botRef.current;
        const map = mapRef.current;
        if (playback && bot && map) {
            playback.set_scale(bot, map, sessionTimer.current, speed);
        }
    }, []);

    const setThumbTime = useCallback((reqTime: number) => {
        const time = reqTime + botOffset;
        const bot = botRef.current;
        const playback = thumbPlaybackRef.current;
        if (playback && bot) {
            try {
                playback.set_time(bot, time);
                pumpRef.current();
            }
            catch {}
        }
    }, [botOffset]);

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

    let gameColor = "";
    let styleColor = "";
    if (replay) {
        gameColor = getGameColor(replay.game, theme);
        styleColor = getStyleColor(replay.style, theme);
    }

    let footerHeight = FOOTER_HEIGHT;
    if (fullscreen) {
        footerHeight = 0;
    }

    const thumbSize = FOOTER_HEIGHT - 20;
    const mapLink = replay ? `/maps/${replay.mapId}?game=${replay.game}&style=${replay.style}&course=${replay.course}` : "";
    const mapInfo = replay ? maps[replay.mapId] : undefined;
    const tierColor = getMapTierColor(mapInfo?.tier);
    const isCurrentUser = loginUser && replay?.userId === loginUser.userId;
    const allowDiff = Boolean(replay?.compareTimeId && diffReady);

    return (
        <Box
            sx={{
                padding: smallScreen ? 0 : 0.5,
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
            }}>
            {error !== "" &&
            <Alert severity="error" sx={{ mb: 1 }}>
                {error}
            </Alert>}
            <Box
                ref={playerRef}
                sx={{
                    width: "100%",
                    height: "100%",
                    minHeight: "600px"
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
                            style={{
                                width: width,
                                height: height
                            }}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                            <Box
                                style={{
                                    width: playerWidth,
                                    height: playerHeight
                                }}
                                sx={{
                                    position: "relative",
                                    bgcolor: "black"
                                }}>
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
                                    style={{
                                        width: playerWidth,
                                        height: playerHeight
                                    }}
                                    sx={{
                                        position: "absolute",
                                        top: 0
                                    }}>
                                    <PlaybackOverlay
                                        time={playbackTime}
                                        duration={duration}
                                        paused={paused}
                                        offset={botOffset}
                                        fullscreen={fullscreen}
                                        speed={playbackSpeed}
                                        onDragPlayback={onDragPlayback}
                                        onSetPlayback={onSetPlayback}
                                        onSetPause={onSetPause}
                                        onFullscreen={onFullscreen}
                                        onSeek={onSeek}
                                        onReset={onReset}
                                        onSetSpeed={onChangePlaybackSpeed}
                                        speedTextRef={speedTextRef}
                                        playerHeight={playerHeight}
                                        inputContainerRef={inputContainerRef}
                                        loading={loading}
                                        errorReplay={!!error}
                                        diffSpeedTextRef={diffSpeedTextRef}
                                        diffTimeTextRef={diffTimeTextRef}
                                        allowDiff={allowDiff}
                                        thumbCanvasRef={thumbCanvasRef}
                                        setThumbTime={setThumbTime}
                                        showThumb={showThumb}
                                        debugInfo={debugInfo}
                                        fpsTextRef={fpsTextRef}
                                    />
                                </Box>
                                {(loading && !error) &&
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: "translate(-50%, -50%)",
                                        userSelect: "none"
                                    }}>
                                    <CircularProgress size={Math.max(40, Math.round(playerHeight / 10))} />
                                    <Box
                                        sx={{
                                            mt: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            height: "32px"
                                        }}>
                                    </Box>
                                </Box>}
                            </Box>
                            <Box
                                style={{ width: playerWidth }}
                                sx={{
                                    display: fullscreen ? "none" : "flex",
                                    flexDirection: "row",
                                    pt: 1,
                                    pb: 1,
                                    minHeight: FOOTER_HEIGHT
                                }}>
                                {replay &&
                                <>
                                {!smallScreen &&
                                <Box
                                    sx={{
                                        display: "flex",
                                        mr: 1.5
                                    }}>
                                    <Link
                                        underline="none"
                                        component={RouterLink}
                                        to={mapLink}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center"
                                        }}>
                                        <Box
                                            sx={{
                                                width: thumbSize,
                                                height: thumbSize,
                                                overflow: "hidden",
                                                borderRadius: "4px",

                                                ":hover": {
                                                    ".mapThumb": {
                                                        transform: "scale(1.08)"
                                                    }
                                                }
                                            }}>
                                            <MapThumb size={thumbSize} map={mapInfo} className="mapThumb" useLargeThumb sx={{ borderRadius: "4px", transition: "transform .2s ease" }} />
                                        </Box>
                                    </Link>
                                </Box>}
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        flexGrow: 1,
                                        overflow: "hidden",

                                        "p": {
                                            overflowWrap: "break-word",
                                            wordBreak: "break-word",
                                            whiteSpace: "normal",
                                            textWrap: "wrap"
                                        }
                                    }}>
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center"
                                        }}>
                                        {smallScreen &&
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            to={mapLink}
                                            sx={{
                                                mr: 1.5
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    overflow: "hidden",
                                                    borderRadius: "4px",

                                                    ":hover": {
                                                        "img": {
                                                            transform: "scale(1.08)"
                                                        }
                                                    }
                                                }}>
                                                <MapThumb size={48} map={mapInfo} useLargeThumb sx={{ borderRadius: "4px", transition: "transform .2s ease" }} />
                                            </Box>
                                        </Link>}
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            color="textPrimary"
                                            to={mapLink}
                                            sx={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                textDecoration: "none",

                                                ":hover": {
                                                    "& .map-name": {
                                                        textDecoration: "underline"
                                                    }
                                                }
                                            }}>
                                            <Typography
                                                variant="h5"
                                                className="map-name"
                                                sx={{
                                                    display: "inline-block",
                                                    lineHeight: 1.4
                                                }}>
                                                {getMapTitle(replay)}
                                            </Typography>
                                        </Link>
                                        <ColorChip color={tierColor} label={formatTier(mapInfo?.tier, true)} sx={{ ml: 0.75 }} />
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            mt: smallScreen ? 1 : 0.25
                                        }}>
                                        <ColorChip color={gameColor} label={formatGame(replay.game)} />
                                        <ColorChip color={styleColor} label={formatStyle(replay.style)} sx={{ ml: 0.5 }} />
                                    </Box>
                                    <Box
                                        sx={{
                                            mt: 1,
                                            display: "inline-flex",
                                            alignItems: "center"
                                        }}>
                                        <Link
                                            underline="none"
                                            component={RouterLink}
                                            color="textPrimary"
                                            to={`/users/${replay.userId}?game=${replay.game}&style=${replay.style}`}
                                            sx={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                textDecoration: "none",

                                                ":hover": {
                                                    "p": {
                                                        textDecoration: "underline"
                                                    }
                                                }
                                            }}>
                                            <UserAvatar username={replay.username} userThumb={replay.userThumb} sx={{width: "24px", height: "24px"}} />
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    ml: 0.75,
                                                    display: "inline-block"
                                                }}>
                                                @{replay.username}
                                            </Typography>

                                        </Link>
                                        {replay.userCountry &&
                                        <CountryFlag countryCode={replay.userCountry} marginLeft={6} />}
                                        {isCurrentUser &&
                                        <Box title="You" sx={{
                                            display: "flex"
                                        }}>
                                            <AccountBoxIcon sx={{marginLeft: 0.75, fontSize: 20}} htmlColor={theme.palette.secondary.main} />
                                        </Box>}
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            mt: 0.5
                                        }}>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                display: "inline-block",
                                                fontFamily: '"Geist Mono", monospace'
                                            }}>
                                            {formatPlacement(replay.placement)}
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                display: "inline-block",
                                                ml: 0.75,
                                                mr: 0.75
                                            }}>
                                            -
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                display: "inline-block",
                                                mr: 0.75
                                            }}>
                                            {formatTime(replay.time)}
                                        </Typography>
                                        <DiffDisplay ms={replay.time} diff={replay.wrDiff} />
                                    </Box>
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            mt: 0.25
                                        }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: "bold",
                                                display: "inline-block"
                                            }}>
                                            {replay.views === 1 ? "1 view" : `${replay.views} views`}
                                        </Typography>
                                        <Box sx={{
                                            display: "inline-block"
                                        }}>
                                            <DateDisplay date={replay.date} useDateTime={!smallScreen} color={theme.palette.text.secondary} variant="body2" />
                                        </Box>
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
