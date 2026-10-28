import Box from "@mui/material/Box";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import init, { Bvh, CompleteBot, StreamableMap, Graphics, CompleteHead, StreamableHead, StreamableSession, new_streamable_bot, new_streamable_map, setup_graphics, Surface, StreamableBot, BotDownloader, MapDownloader, BotBlockRange, DownloadMapBlockRangeError, DownloadBotBlockRangeError, MapBlockRange, JumpStats } from "../wasm/strafesnet_roblox_bot_player_wasm_module";
import PlaybackOverlay from "./playback/PlaybackOverlay";
import { createPlaybackTime } from "./playback/playbackTime";
import { createDownloadStats, readDownloadStats } from "./playback/downloadStats";
import { formatCourse, formatDiff, formatGame, formatPlacement, formatStyle, formatTier, formatTime, GameControls, MAIN_COURSE, Replay } from "shared";
import { Link as RouterLink, useOutletContext, useParams } from "react-router";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import MapThumb from "./displays/MapThumb";
import { ContextParams, getGameColor, getStyleColor, InputState, PLAYER_ASPECT_RATIO, PLAYER_MAX_ASPECT_RATIO, PLAYER_MAX_FULLSCREEN_ASPECT_RATIO, PLAYER_MIN_ASPECT_RATIO, PLAYER_THUMB_HEIGHT } from "../common/common";
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
import { getTextureTranscoder } from "./playback/textureTranscoder";
import { compiledWasm } from "./playback/wasmModule";
import { mapIngestStats, PlaybackStats } from "./playback/playbackStats";
import { AutoGraphicsTuner, canvasPixelRatio, GraphicsLevel, guessGraphicsLevel, toGraphicsQuality, useGraphicsSettings } from "./playback/graphicsSettings";

/** The largest player that fits in width x height, with its aspect ratio kept within the allowed range */
function getPlayerSize(width: number, height: number, fullscreen: boolean) {
    // 0 x 0 happens for a frame mid-resize or entering fullscreen, and its aspect ratio would be NaN
    if (width <= 0 || height <= 0) {
        return { playerWidth: 0, playerHeight: 0 };
    }
    const maxAspect = fullscreen ? PLAYER_MAX_FULLSCREEN_ASPECT_RATIO : PLAYER_MAX_ASPECT_RATIO;
    const aspect = clamp(width / height, PLAYER_MIN_ASPECT_RATIO, maxAspect);
    if (width / height > aspect) {
        return { playerWidth: height * aspect, playerHeight: height };
    }
    else {
        return { playerWidth: width, playerHeight: width / aspect };
    }
}

/** width and height are the canvas size in CSS pixels. pixelRatio is canvas pixels per CSS pixel, see canvasPixelRatio. */
function handleCanvasSize(width: number, height: number, graphics: Graphics, surfaces: Surface[], pixelRatio: number) {
    const screenWidth = Math.max(1, Math.round(width * pixelRatio));
    const screenHeight = Math.max(1, Math.round(height * pixelRatio));
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

type Rgb = [number, number, number];

// Diamond like the game's top medal, then a green to red scale.
const EFFICIENCY_COLORS: [number, string][] = [
    [0.95, "rgb(64, 224, 224)"], // diamond
    [0.90, "#5df25d"],
    [0.80, "#c6f24a"],
    [0.70, "#ffd84a"],
    [0.50, "#ff9a3c"],
    [0, "#ff5a4a"],
];

function efficiencyColor(efficiency: number) {
    return EFFICIENCY_COLORS.find(([min]) => efficiency >= min)?.[1] ?? "#ff5a4a";
}

const STRAFE_SLOW: Rgb = [70, 150, 255];
const STRAFE_OPTIMAL: Rgb = [255, 255, 255];
const STRAFE_FAST: Rgb = [255, 70, 70];
// Within this of 100% stays white, and this far past it is fully blue or red.
const STRAFE_DEAD_ZONE = 0.01;
const STRAFE_FULL_COLOR = 0.15;

function mixRgb(a: Rgb, b: Rgb, t: number) {
    const [r, g, bl] = a.map((x, i) => Math.round(x + (b[i] - x) * t));
    return `rgb(${r}, ${g}, ${bl})`;
}

// Cold for understrafing (turning too slowly), hot for overstrafing.
function strafeRateColor(rate: number) {
    const error = rate - 1;
    const t = clamp((Math.abs(error) - STRAFE_DEAD_ZONE) / (STRAFE_FULL_COLOR - STRAFE_DEAD_ZONE), 0, 1);
    return mixRgb(STRAFE_OPTIMAL, error < 0 ? STRAFE_SLOW : STRAFE_FAST, t);
}

function setJhudColor(container: HTMLElement, selector: string, color: string) {
    container.querySelectorAll<HTMLElement>(selector).forEach(element => {
        element.style.color = color;
    });
}

function setJhudText(container: HTMLElement, selector: string, text: string) {
    const element = container.querySelector<HTMLElement>(selector);
    if (element) element.textContent = text;
}

function formatPercent(value: number | undefined) {
    return value === undefined ? "n/a" : (value * 100).toFixed(1) + "%";
}

function updateJhudDisplay(container: HTMLElement, stats: JumpStats | undefined) {
    // Unknown counts are still downloading after a seek.
    const jump = stats?.number ?? "?";
    const strafes = stats?.strafes ?? "?";
    const gain = stats?.gain;
    const rate = stats?.strafe_rate;
    const efficiency = stats?.efficiency;

    // Skip the DOM work unless something visible changed.
    const key = stats ? [jump, stats.speed.toFixed(2), gain?.toFixed(2), strafes, rate?.toFixed(3), efficiency?.toFixed(3)].join() : "";
    if (container.dataset.key === key) return;
    container.dataset.key = key;

    container.style.visibility = stats ? "visible" : "hidden";
    if (!stats) return;

    setJhudText(container, ".jhudJump", `#${jump}`);
    setJhudText(container, ".jhudSpeed", stats.speed.toFixed(2));
    setJhudText(container, ".jhudGain", gain === undefined ? "" : (gain >= 0 ? "+" : "") + gain.toFixed(2));
    setJhudColor(container, ".jhudGain", gain === undefined ? "" : gain >= 0 ? "#5df25d" : "#ff5a4a");

    setJhudText(container, ".jhudStrafes", `${strafes} ${strafes === 1 ? "strafe" : "strafes"}`);
    setJhudText(container, ".jhudRate", formatPercent(rate));
    setJhudColor(container, ".jhudRateColor", rate === undefined ? "" : strafeRateColor(rate));
    const marker = container.querySelector<HTMLElement>(".jhudRateMarker");
    if (marker) {
        // The bar spans 50% to 150% with 100% in the middle.
        marker.style.display = rate === undefined ? "none" : "block";
        marker.style.left = `${clamp(rate ?? 1, 0.5, 1.5) * 100 - 50}%`;
    }

    setJhudText(container, ".jhudEff", formatPercent(efficiency));
    // Colour by the displayed value so 95.0% never shows the colour for below 95% for example.
    const shownEfficiency = efficiency === undefined ? undefined : Number((efficiency * 100).toFixed(1)) / 100;
    setJhudColor(container, ".jhudEffColor", shownEfficiency === undefined ? "" : efficiencyColor(shownEfficiency));
    const fill = container.querySelector<HTMLElement>(".jhudEffFill");
    if (fill) {
        fill.style.width = `${clamp(efficiency ?? 0, 0, 1) * 100}%`;
    }
}

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

const FOOTER_HEIGHT = 148;
/**
 * Below this the page scrolls instead of shrinking the player further, e.g. on phones in landscape.
 * Narrow players only keep as much as 16:9 needs at their width, so portrait phones fit without scrolling.
 */
const MIN_PLAYER_HEIGHT = 320;

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

// Main thread time spent in map.ingest_deferred since the last stats update. Ingest runs when downloads resolve, outside the frame loop.
async function ingestMapBlock(block: MapBlockRange, downloader: MapDownloader, map: StreamableMap, graphics: Graphics): Promise<boolean> {
    try {
        const data = await downloader.download_map_block_range(block);
        const ingestStart = performance.now();
        // Textures are transcoded in a worker and uploaded from the frame loop
        const textureJobs = map.ingest_deferred(data);
        getTextureTranscoder().submit(map, graphics, textureJobs);
        const ingestMs = performance.now() - ingestStart;
        mapIngestStats.totalMs += ingestMs;
        mapIngestStats.maxMs = Math.max(mapIngestStats.maxMs, ingestMs);
        ++mapIngestStats.count;
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
        return { graphics, surface: graphics.new_surface(canvas) };
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

/** Shows GPU errors, which WebGPU reports without throwing. */
function reportGraphicsErrors(graphics: Graphics, setError: (error: string) => void) {
    const errors = graphics.take_errors();
    if (errors.length === 0) {
        return;
    }
    // A lost device can't render anything again, so the next replay gets a new one.
    if (errors.some(e => e.startsWith("GPU device lost"))) {
        discardSharedGraphics(graphics);
    }
    setError(errors.join("\n"));
}

interface DiffView {
    bot: CompleteBot
    bvh: Bvh
    playback: CompleteHead
    timeElement: HTMLElement
    speedElement: HTMLElement
}

/** Compares the replay against the diff bot at the closest point of the diff bot's path. */
function updateDiff(diff: DiffView, playback: StreamableSession, bot: StreamableBot, course: number, speed: number) {
    const pos = playback.get_position(bot);
    const diffPlaybackTime = diff.bvh.closest_time_to_point(diff.bot, pos);
    if (diffPlaybackTime === undefined) {
        return;
    }
    diff.playback.set_time(diff.bot, getSafeTime(diffPlaybackTime, diff.bot));
    const botTime = playback.get_run_time(bot, course) ?? 0;
    const diffBotTime = diff.playback.get_run_time(diff.bot, course) ?? 0;
    const speedDiff = speed - diff.playback.get_speed(diff.bot);
    updateDiffDisplay(diff.timeElement, diff.speedElement, botTime - diffBotTime, speedDiff);
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
    const [ downloadStats ] = useState(() => createDownloadStats());
    const [ paused, setPaused ] = useState(false);
    const [ fullscreen, setFullscreen ] = useState(false);
    const [ loading, setLoading ] = useState(true);
    const [ error, setErrorState ] = useState("");
    const [ diffReady, setDiffReady ] = useState(false);
    // known once graphics are set up
    const [ graphicsReady, setGraphicsReady ] = useState(false);
    const [ debugInfo, setDebugInfo ] = useState("");

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const thumbCanvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const speedTextRef = useRef<HTMLSpanElement>(null);
    const jhudRef = useRef<HTMLDivElement>(null);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const diffTimeTextRef = useRef<HTMLElement>(null);
    const diffSpeedTextRef = useRef<HTMLElement>(null);
    const fpsTextRef = useRef<HTMLSpanElement>(null);
    const frameStatsTextRef = useRef<HTMLSpanElement>(null);

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
    const isShowingThumb = useRef(false);

    // graphics presets: one picked by the player, or auto, which measures this device once and remembers the result
    const graphicsSettings = useGraphicsSettings();
    const { mode: graphicsMode, autoLevel, setAutoLevel, renderScale } = graphicsSettings;
    // the preset auto is measuring right now
    const [ tuningLevel, setTuningLevel ] = useState<GraphicsLevel | undefined>(undefined);
    const tunerRef = useRef<AutoGraphicsTuner | null>(null);
    const graphicsLevel: GraphicsLevel = graphicsMode !== "auto"
        ? graphicsMode
        : autoLevel ?? tuningLevel ?? (graphicsReady ? guessGraphicsLevel() : "medium");
    const pixelRatio = canvasPixelRatio(graphicsLevel, renderScale);
    // the seek bar thumbnail draws the scene a second time while hovering, too costly on Low
    const thumbEnabled = graphicsReady && graphicsLevel !== "low";
    // for the setup and the render loop, which outlive renders
    const graphicsLevelRef = useRef(graphicsLevel);
    const pixelRatioRef = useRef(pixelRatio);
    const thumbEnabledRef = useRef(thumbEnabled);
    useLayoutEffect(() => {
        graphicsLevelRef.current = graphicsLevel;
        pixelRatioRef.current = pixelRatio;
        thumbEnabledRef.current = thumbEnabled;
    }, [graphicsLevel, pixelRatio, thumbEnabled]);

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
        downloadStats.set(undefined);

        // started before any downloads, so its script isn't queued behind them on a server with few connections
        getTextureTranscoder();

        const promise = async () => {
            // compiled once and shared with the texture worker
            await init({ module_or_path: await compiledWasm() });

            if (isCanceled) return;

            const canvas = canvasRef.current;
            if (!canvas) {
                setError("Couldn't setup bot playback.");
                return;
            }

            try {
                const { graphics, surface } = await getGraphicsAndSurface(canvas);
                graphics.set_graphics_quality(toGraphicsQuality(graphicsLevelRef.current));

                setGraphicsReady(true);

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
                handleCanvasSize(width, height, graphics, [surface], pixelRatioRef.current);

                playback.advance_time(bot, map, 0);
                playback.set_bot_time(bot, map, 0, 0);

                let thumbPlayback: StreamableHead | null = null;
                let thumbSurface: Surface | null = null;
                const thumbCanvas = thumbCanvasRef.current;
                if (thumbCanvas) {
                    thumbPlayback = new StreamableHead(bot, 0);
                    thumbSurface = graphics.new_surface(thumbCanvas);
                    handleCanvasSize(PLAYER_THUMB_HEIGHT * PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT, graphics, [thumbSurface], window.devicePixelRatio);
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
                // The stats only change when a download starts or finishes
                const updateDownloadStats = () => {
                    if (!isCanceled) downloadStats.set(readDownloadStats(bot, map, offset));
                };
                updateDownloadStats();

                let activeDownloads = 0;
                const pump = () => {
                    try {
                        let started = false;
                        while (!isCanceled && activeDownloads < MAX_CONCURRENT_DOWNLOADS) {
                            const download = pickNextBlock();
                            if (!download) break;
                            ++activeDownloads;
                            started = true;
                            download().then((success) => {
                                --activeDownloads;
                                updateDownloadStats();
                                if (success) pump();
                                // Back off a little so a failing server doesn't get hammered
                                else setTimeout(pump, 1000);
                            });
                        }
                        if (started) updateDownloadStats();
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
    }, [id, playbackTime, downloadStats, queryClient, replay, replayQuery.isError, replayQuery.isSuccess, setError]);

    // Resizing a canvas clears it, and ResizeObserver runs after this frame's render, so resizing there would show
    // a black frame. Instead the render loop resizes right before it draws.
    const canvasSizeDirty = useRef(false);
    const onResize = useCallback((width: number, height: number) => {
        const graphics = graphicsRef.current;
        const surface = surfaceRef.current;
        const thumbSurface = thumbSurfaceRef.current;
        if (!graphics) return;
        if (surface) {
            handleCanvasSize(width, height, graphics, [surface], pixelRatioRef.current);
        }
        if (thumbSurface) {
            handleCanvasSize(PLAYER_THUMB_HEIGHT * PLAYER_ASPECT_RATIO, PLAYER_THUMB_HEIGHT, graphics, [thumbSurface], window.devicePixelRatio);
        }
    }, []);

    useLayoutEffect(() => {
        let animationId: number;
        const stats = new PlaybackStats();

        if (replay?.course === undefined) {
            return;
        }
        const course = replay.course;

        // auto graphics: measure while the replay plays in a visible tab
        const stepAutoGraphics = (timeMs: number, graphics: Graphics, playback: StreamableSession) => {
            const tuner = tunerRef.current;
            if (!tuner) {
                return;
            }
            const counting = !playback.is_buffering() && document.visibilityState === "visible";
            const decision = tuner.update(timeMs, counting, () => graphics.take_gpu_frame_ms());
            if (!decision) {
                return;
            }
            setTuningLevel(decision.level);
            if (decision.done) {
                tunerRef.current = null;
                setAutoLevel(decision.level);
            }
        };

        // the speed, input, JHUD and seek bar
        const updateHud = (playback: StreamableSession, bot: StreamableBot, speed: number, speedText: HTMLElement, input: HTMLDivElement) => {
            playbackTime.set(Math.min(playback.get_bot_time() - botOffset, bot.duration()));
            const newText = speed.toFixed(2).toString();
            if (speedText.innerText !== newText) {
                speedText.innerText = newText;
            }
            updateInputDisplay(input, playback);
            const jhud = jhudRef.current;
            if (jhud) {
                const jumpStats = playback.get_jump_stats(bot);
                updateJhudDisplay(jhud, jumpStats);
                jumpStats?.free();
            }
        };

        const getDiffView = (): DiffView | undefined => {
            const bot = diffBotRef.current;
            const bvh = diffBvhRef.current;
            const playback = diffPlaybackRef.current;
            const timeElement = diffTimeTextRef.current;
            const speedElement = diffSpeedTextRef.current;
            if (bot && bvh && playback && timeElement && speedElement) {
                return { bot, bvh, playback, timeElement, speedElement };
            }
            return undefined;
        };

        const animate = (timeMs: number) => {
            const time = timeMs / 1000;
            animationId = requestAnimationFrame(animate);
            stats.frame(timeMs, fpsTextRef.current);

            const playback = playbackRef.current;
            const bot = botRef.current;
            const map = mapRef.current;
            const graphics = graphicsRef.current;
            const surface = surfaceRef.current;
            const speedText = speedTextRef.current;
            const input = inputContainerRef.current;

            if (playback && bot && map && graphics && surface && speedText && input) {
                const newSessionTime = sessionTimer.current + time - animTimer.current;
                try {
                    const canvas = canvasRef.current;
                    if (canvasSizeDirty.current && canvas) {
                        canvasSizeDirty.current = false;
                        onResize(canvas.clientWidth, canvas.clientHeight);
                    }
                    getTextureTranscoder().uploadReady(map, graphics);
                    playback.advance_time(bot, map, newSessionTime);
                    const promoteStart = performance.now();
                    map.promote_ready_assets(graphics);
                    const renderStart = performance.now();
                    graphics.render_session(surface, map, bot, playback);
                    stats.addRender(renderStart - promoteStart, performance.now() - renderStart);
                    stats.report(frameStatsTextRef.current, graphics);
                    stepAutoGraphics(timeMs, graphics, playback);

                    setLoading(playback.is_buffering());
                    reportGraphicsErrors(graphics, setError);

                    const speed = playback.get_speed(bot);
                    updateHud(playback, bot, speed, speedText, input);

                    const thumbPlayback = thumbPlaybackRef.current;
                    const thumbSurface = thumbSurfaceRef.current;
                    if (thumbPlayback && thumbSurface && isShowingThumb.current && thumbEnabledRef.current) {
                        graphics.render_head(thumbSurface, map, bot, thumbPlayback);
                    }

                    const diff = getDiffView();
                    if (diff) {
                        updateDiff(diff, playback, bot, course, speed);
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
    }, [setError, replay?.course, botOffset, playbackTime, setAutoLevel, onResize]);

    // The player and the info below it fill the window between the app bar and the site footer, so the page doesn't scroll.
    // One observer measures everything that affects that space. The info renders once there's a size, hence the callback ref.
    const [ footerElement, setFooterElement ] = useState<HTMLDivElement | null>(null);
    const [ measuredFooterHeight, setMeasuredFooterHeight ] = useState(FOOTER_HEIGHT);
    const [ playerArea, setPlayerArea ] = useState<{ width: number, height: number } | undefined>(undefined);
    const footerAreaKey = useRef("");
    useLayoutEffect(() => {
        const area = playerRef.current;
        const root = document.getElementById("root");
        const main = area?.closest("main");
        if (!area || !root || !main) return;
        const header = document.querySelector("header");
        const siteFooter = root.querySelector("footer");
        const update = () => {
            if (document.fullscreenElement) {
                // the browser sizes the fullscreen player to the screen
                setPlayerArea(old => old && old.width === area.clientWidth && old.height === area.clientHeight ? old : { width: area.clientWidth, height: area.clientHeight });
                return;
            }
            const top = area.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
            const bottomPadding = parseFloat(getComputedStyle(main).paddingBottom) + parseFloat(getComputedStyle(area.parentElement!).paddingBottom);
            const siteFooterHeight = siteFooter?.getBoundingClientRect().height ?? 0;
            const width = area.clientWidth;
            const height = Math.floor(root.clientHeight - top - bottomPadding - siteFooterHeight);
            setPlayerArea(old => old && old.width === width && old.height === height ? old : { width, height });
            const areaKey = `${width}x${height}`;
            const sameArea = areaKey === footerAreaKey.current;
            footerAreaKey.current = areaKey;
            if (footerElement) {
                // hidden while fullscreen, which leaves the last height for when it comes back
                const footerHeight = Math.ceil(footerElement.getBoundingClientRect().height);
                // The info's width follows the player's, which depends on the info's height, so a different height can
                // rewrap it back and forth forever. Within one area size it only grows, which always settles.
                if (footerHeight > 0) setMeasuredFooterHeight(old => sameArea && footerHeight < old ? old : footerHeight);
            }
        };
        update();
        const observer = new ResizeObserver(update);
        // the window, and the player's width within it
        observer.observe(root);
        observer.observe(area);
        // the app bar and site footer wrap onto more lines on narrow screens, and the info's text rewraps
        if (header) observer.observe(header);
        if (siteFooter) observer.observe(siteFooter);
        if (footerElement) observer.observe(footerElement);
        window.addEventListener("resize", update);
        document.addEventListener("fullscreenchange", update);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", update);
            document.removeEventListener("fullscreenchange", update);
        };
    }, [error, footerElement]);

    // The canvas is sized to match what it's shown at whenever that changes. Watching the canvas itself catches every cause:
    // the window, the info rewrapping, fullscreen. It renders once there's a size, hence the callback ref.
    const [ canvasElement, setCanvasElementState ] = useState<HTMLCanvasElement | null>(null);
    const setCanvasElement = useCallback((canvas: HTMLCanvasElement | null) => {
        canvasRef.current = canvas;
        setCanvasElementState(canvas);
    }, []);


    // start measuring when auto has nothing saved for this device, once graphics are set up
    useEffect(() => {
        if (graphicsMode !== "auto" || autoLevel !== undefined || !graphicsReady) {
            tunerRef.current = null;
            setTuningLevel(undefined);
            return;
        }
        if (!tunerRef.current) {
            const start = guessGraphicsLevel();
            tunerRef.current = new AutoGraphicsTuner(start);
            setTuningLevel(start);
        }
    }, [graphicsMode, autoLevel, graphicsReady]);

    // apply the preset and the canvas size whenever they change
    useEffect(() => {
        const graphics = graphicsRef.current;
        if (!graphics) return;
        graphics.set_graphics_quality(toGraphicsQuality(graphicsLevel));
        canvasSizeDirty.current = true;
    }, [graphicsLevel, pixelRatio, graphicsReady]);
    useLayoutEffect(() => {
        if (!canvasElement) return;
        const observer = new ResizeObserver(() => {
            canvasSizeDirty.current = true;
        });
        observer.observe(canvasElement);
        return () => observer.disconnect();
    }, [canvasElement]);

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

    const setShowingThumb = useCallback((showing: boolean) => {
        isShowingThumb.current = showing;
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

    let gameColor = "";
    let styleColor = "";
    if (replay) {
        gameColor = getGameColor(replay.game, theme);
        styleColor = getStyleColor(replay.style, theme);
    }

    const footerHeight = fullscreen ? 0 : measuredFooterHeight;
    // The space measured for the player and the info, grown to fit the smallest player allowed. Fullscreen is the screen.
    const areaHeight = !playerArea ? 0
        : fullscreen ? playerArea.height
        : Math.max(playerArea.height, Math.min(MIN_PLAYER_HEIGHT, playerArea.width / PLAYER_ASPECT_RATIO) + footerHeight);
    const { playerWidth, playerHeight } = playerArea ? getPlayerSize(playerArea.width, areaHeight - footerHeight, fullscreen) : { playerWidth: 0, playerHeight: 0 };

    const thumbSize = FOOTER_HEIGHT - 12;
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
                style={{ height: fullscreen || !playerArea ? "100%" : areaHeight }}
                sx={{
                    width: "100%"
                }}
            >
                {playerArea &&
                <Box
                    style={{
                        width: playerArea.width,
                        height: areaHeight
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
                            // sized exactly, like the info below
                            flexShrink: 0,
                            bgcolor: "black"
                        }}>
                        <canvas
                            ref={setCanvasElement}
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
                                downloadStats={downloadStats}
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
                                jhudRef={jhudRef}
                                playerWidth={playerWidth}
                                playerHeight={playerHeight}
                                inputContainerRef={inputContainerRef}
                                loading={loading}
                                errorReplay={!!error}
                                diffSpeedTextRef={diffSpeedTextRef}
                                diffTimeTextRef={diffTimeTextRef}
                                allowDiff={allowDiff}
                                thumbCanvasRef={thumbCanvasRef}
                                setThumbTime={setThumbTime}
                                showThumb={graphicsReady}
                                thumbEnabled={thumbEnabled}
                                debugInfo={debugInfo}
                                fpsTextRef={fpsTextRef}
                                frameStatsTextRef={frameStatsTextRef}
                                setShowingThumb={setShowingThumb}
                                graphicsSettings={graphicsSettings}
                                graphicsLevel={graphicsLevel}
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
                        ref={setFooterElement}
                        style={{ width: playerWidth }}
                        sx={{
                            display: fullscreen ? "none" : "flex",
                            flexDirection: "row",
                            // Never squeezed to fit, which would leave a long map name spilling out of a box that measures
                            // too short. The player is sized from this height instead.
                            flexShrink: 0,
                            pt: 1,
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
                                <Typography
                                    variant="h5"
                                    sx={{
                                        minWidth: 0,
                                        lineHeight: 1.4,
                                        overflowWrap: "break-word"
                                    }}>
                                    <Link
                                        underline="hover"
                                        component={RouterLink}
                                        color="textPrimary"
                                        to={mapLink}>
                                        {getMapTitle(replay)}
                                    </Link>
                                    <ColorChip color={tierColor} label={formatTier(mapInfo?.tier, true)} sx={{ ml: 0.75, verticalAlign: "middle", position: "relative", top: "-2px" }} />
                                </Typography>
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
                </Box>}
            </Box>
        </Box>
    );
}

export default Replays;
