import { BufferTarget, CanvasSource, canEncodeVideo, Mp4OutputFormat, Output, Quality, StreamTarget } from "mediabunny";
import { Checkpoint, CompleteBot, Graphics, StreamableBot, StreamableMap, StreamableSession } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import { getMapAssetLoader } from "./mapAssetLoader";
import { avcConfigWithColor } from "./avcColor";
import { readAv1Range, setAv1Range } from "./av1Color";
import { createVideoFile } from "./videoFile";
import { GraphicsLevel, toGraphicsQuality } from "./graphicsSettings";
import { CheckpointDiff, DIFF_SHOWN_AFTER, VideoHud, VideoHudSettings } from "./videoHud";

export const VIDEO_RESOLUTIONS = {
    "720p": [1280, 720],
    "1080p": [1920, 1080],
} as const;
export type VideoResolution = keyof typeof VIDEO_RESOLUTIONS;
export type VideoFrameRate = 30 | 60;
export type VideoQuality = "medium" | "high" | "very-high";
export type VideoCodec = "avc" | "av1";

export interface VideoSettings {
    resolution: VideoResolution
    fps: VideoFrameRate
    quality: VideoQuality
    codec: VideoCodec
    graphics: GraphicsLevel
    motionBlur: boolean
    /** How many frames each video frame averages with motion blur, BLUR_SAMPLE_SECONDS apart */
    blurSamples: number
    hud: VideoHudSettings
}

// fast camera turns and fine textures need more than the default
export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
    resolution: "1080p",
    fps: 60,
    quality: "very-high",
    codec: "avc",
    graphics: "high",
    motionBlur: false,
    blurSamples: 8,
    hud: { speed: true, checkpoints: true, checkpointSpeed: true, finish: false }
};

export const MIN_BLUR_SAMPLES = 2;
/** At 60 fps, as many as fit between two frames */
export const MAX_BLUR_SAMPLES = 16;
/** Time between motion blur's samples, so more samples make longer streaks */
const BLUR_SAMPLE_SECONDS = 1 / 960;

/**
 * A quality level rather than a bitrate: it's encoded at a fixed quantizer, as many bits as each frame needs, so fast
 * camera turns stay sharp. Very high (H.264 QP 16) came to about 75 Mbps on a surf map at 1080p60.
 */
function videoQuality(settings: VideoSettings) {
    return new Quality(settings.quality);
}
/** Frames drawn before the first one encoded, so shadowed lights (two new ones a frame) and lightmap chunks are all on the GPU */
const WARM_UP_FRAMES = 30;
/** Seconds the last frame stays at the end, like the player waiting before it loops */
const END_HOLD = 1;

/**
 * Seconds the last frame stays at the end: like the player waiting before it loops, or until the finish's diff has
 * faded out if it's shown. `canCompare` is whether there's a run to compare with.
 */
export function endHold(settings: VideoSettings, canCompare: boolean) {
    const finishShown = canCompare && settings.hud.checkpoints && settings.hud.finish;
    return finishShown ? Math.max(END_HOLD, DIFF_SHOWN_AFTER) : END_HOLD;
}
/**
 * Recordings are TV range (16 to 235, also called limited range): the standard for video, which players, phones, TVs and
 * video sites all expect, so a recording looks right wherever it's watched or uploaded. Full range only looks right where
 * the player reads its label, and some don't.
 * Browsers' encoders turn canvas frames into full range, so each frame is squeezed into 16 + x * 219/255 first, by
 * blending gray over it at this alpha (2D canvases blend the sRGB values), and the video is labeled TV range.
 */
const TV_RANGE_ALPHA = 36 / 255;
/** 113 * 36/255 = 15.95, the 16 under black */
const TV_RANGE_GRAY = "rgb(113, 113, 113)";
/** How often the preview is updated while recording, in milliseconds */
const PREVIEW_INTERVAL_MS = 500;
/** How long recording runs before letting the page update, in milliseconds */
const YIELD_INTERVAL_MS = 100;

export type RecordingProgress =
    | { step: "loading", fraction: number }
    /** `bytes` is the size of the video so far */
    | { step: "recording", frame: number, frameCount: number, bytes: number }
    | { step: "saving" };

export interface RecordedVideo {
    video: Blob
    /** Frees the space the video takes, once it's saved */
    discard: () => Promise<void>
}

/**
 * Codec strings at a level enough for 1080p60 (H.264 High 4.2, AV1 Main 4.1), for the support and color range tests.
 * Encoders write their own level.
 */
const TEST_CODECS: Record<VideoCodec, string> = {
    avc: "avc1.64002a",
    av1: "av01.0.09M.08"
};

export const CODEC_NAMES: Record<VideoCodec, string> = { avc: "H.264", av1: "AV1" };

/**
 * The encoder settings shared by the support check, the color range test and the recording. Only the GPU's encoder:
 * browsers' software ones are much slower, and their color range and rate control differ.
 */
function encoderOptions(settings: VideoSettings) {
    const [width, height] = VIDEO_RESOLUTIONS[settings.resolution];
    return {
        codec: settings.codec,
        width,
        height,
        frameRate: settings.fps,
        quality: videoQuality(settings),
        hardwareAcceleration: "prefer-hardware"
    } as const;
}

/** The WebCodecs config of the tests, with a fixed quantizer like the recording. */
function testEncoderConfig(options: ReturnType<typeof encoderOptions>): VideoEncoderConfig {
    return {
        codec: TEST_CODECS[options.codec],
        width: options.width,
        height: options.height,
        framerate: options.frameRate,
        hardwareAcceleration: options.hardwareAcceleration,
        bitrateMode: "quantizer",
        ...(options.codec === "avc" ? { avc: { format: "avc" } } : {})
    };
}

/**
 * Whether this browser can encode videos of these settings, at a fixed quantizer: without one, the encoder would get a
 * bitrate guessed from the size.
 */
export async function canEncodeSettings(settings: VideoSettings) {
    const options = encoderOptions(settings);
    const { codec, ...mediabunnyOptions } = options;
    if (!await canEncodeVideo(codec, mediabunnyOptions)) return false;
    const support = await VideoEncoder.isConfigSupported(testEncoderConfig(options));
    return support.supported === true;
}

/** Whether this browser can record videos at all, before checking the codec. */
export function canRecordVideo() {
    return typeof VideoEncoder !== "undefined";
}

/** Gives the browser a turn without the 4 ms a nested setTimeout waits. */
function yieldToBrowser() {
    return new Promise<void>(resolve => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(undefined);
    });
}

function waitFrame() {
    return new Promise<void>(resolve => setTimeout(resolve, 16));
}

/**
 * Whether the browser's encoder turns this canvas into full range video (WebCodecs has no setting for it), from what
 * the stream says for AV1, or else the color space the encoder reports, after encoding one frame. Undefined if
 * neither says or the test fails.
 */
async function encodesFullRange(canvas: HTMLCanvasElement, options: ReturnType<typeof encoderOptions>): Promise<boolean | undefined> {
    let fullRange: boolean | undefined = undefined;
    const codec = options.codec;
    const encoder = new VideoEncoder({
        output: (chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata | undefined) => {
            if (fullRange === undefined && codec === "av1") {
                const data = new Uint8Array(chunk.byteLength);
                chunk.copyTo(data);
                fullRange = readAv1Range(data);
            }
            fullRange ??= meta?.decoderConfig?.colorSpace?.fullRange ?? undefined;
        },
        error: (err: DOMException) => console.error("Couldn't test the video encoder", err)
    });
    try {
        encoder.configure(testEncoderConfig(options));
        const frame = new VideoFrame(canvas, { timestamp: 0 });
        encoder.encode(frame, { keyFrame: true });
        frame.close();
        await encoder.flush();
    }
    catch (err) {
        console.error("Couldn't test the video encoder", err);
    }
    finally {
        if (encoder.state !== "closed") encoder.close();
    }
    return fullRange;
}

/** Squeezes the finished frame into TV range, see TV_RANGE_ALPHA. */
function squeezeToTvRange(context: CanvasRenderingContext2D) {
    context.globalAlpha = TV_RANGE_ALPHA;
    context.fillStyle = TV_RANGE_GRAY;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.globalAlpha = 1;
}

function throwGraphicsErrors(graphics: Graphics) {
    const errors = graphics.take_errors();
    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }
}

/** How much of the replay and map has downloaded, from 0 to 1. */
function loadedFraction(bot: StreamableBot, map: StreamableMap) {
    const botStats = bot.stats();
    const mapStats = map.stats();
    const downloaded = botStats.bytes_downloaded + mapStats.bytes_downloaded;
    const total = botStats.bytes_total + mapStats.bytes_total;
    botStats.free();
    mapStats.free();
    return total > 0 ? downloaded / total : 1;
}

function isBotLoaded(bot: StreamableBot) {
    const stats = bot.stats();
    const loaded = stats.blocks_downloaded === stats.blocks_total && stats.requests_in_flight === 0;
    stats.free();
    return loaded;
}

/** Copies a checkpoint out of wasm memory. */
function readCheckpoint(checkpoint: Checkpoint) {
    const { time, stage, run_time, speed } = checkpoint;
    checkpoint.free();
    return { time, stage, runTime: run_time, speed };
}

type CheckpointCopy = ReturnType<typeof readCheckpoint>;

function compare(checkpoint: CheckpointCopy, other: CheckpointCopy): CheckpointDiff {
    return { time: checkpoint.time, timeDiff: checkpoint.runTime - other.runTime, speedDiff: checkpoint.speed - other.speed };
}

/**
 * The run's checkpoints compared with the same stages in the comparison run, then the finish if `finish`, in time
 * order. Needs the whole map and replay.
 */
function checkpointDiffs(bot: StreamableBot, compareBot: CompleteBot, map: StreamableMap, finish: boolean): CheckpointDiff[] {
    const compared = new Map(compareBot.checkpoints(map).map(readCheckpoint).map(checkpoint => [checkpoint.stage, checkpoint]));
    const diffs = bot.checkpoints(map).map(readCheckpoint).flatMap(checkpoint => {
        const other = compared.get(checkpoint.stage);
        return other ? [compare(checkpoint, other)] : [];
    });
    if (finish) {
        const ours = bot.finish();
        const theirs = compareBot.finish();
        if (ours && theirs) {
            diffs.push(compare(readCheckpoint(ours), readCheckpoint(theirs)));
        }
        else {
            ours?.free();
            theirs?.free();
        }
    }
    return diffs;
}

export interface RecordVideoOptions {
    graphics: Graphics
    map: StreamableMap
    bot: StreamableBot
    /** The run the checkpoint diffs compare with, if there is one */
    compareBot?: CompleteBot
    settings: VideoSettings
    /** Starts the downloads the replay and map still need, see the player's pump */
    pump: () => void
    signal: AbortSignal
    onProgress: (progress: RecordingProgress) => void
    /** Called with the latest frame now and then, to show it right away (it's only valid in the same task) */
    onPreview: (frame: HTMLCanvasElement) => void
}

/**
 * Records the whole replay to an MP4 once the whole map is loaded, so nothing pops in. Frame times come from the frame
 * number, not the clock, so it runs as fast as the GPU draws. Leaves the graphics on the settings' preset.
 * The page's own render loop must not draw while this runs: both share the graphics' shadow maps.
 * Returns undefined if aborted.
 */
export async function recordVideo(options: RecordVideoOptions): Promise<RecordedVideo | undefined> {
    const { graphics, map, bot, compareBot, settings, pump, signal, onProgress, onPreview } = options;
    const encoder = encoderOptions(settings);
    const fps = settings.fps;

    if (!await canEncodeSettings(settings)) {
        throw new Error(`This browser can't encode ${CODEC_NAMES[settings.codec]} video at this size.`);
    }
    const { width, height } = encoder;

    // The player downloads everything eventually; this waits for it and adds it to the scene, since the page's render
    // loop is paused.
    const loader = getMapAssetLoader();
    while (!(isBotLoaded(bot) && map.is_loaded() && loader.queued === 0)) {
        if (signal.aborted) return undefined;
        onProgress({ step: "loading", fraction: loadedFraction(bot, map) });
        pump();
        loader.uploadReady(map, graphics);
        map.promote_ready_assets(graphics);
        throwGraphicsErrors(graphics);
        await waitFrame();
    }

    // drawn by the GPU, then copied into the 2D canvas that is encoded
    const gpuCanvas = document.createElement("canvas");
    gpuCanvas.width = width;
    gpuCanvas.height = height;
    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = width;
    videoCanvas.height = height;
    const context = videoCanvas.getContext("2d", { alpha: false });
    if (!context) {
        throw new Error("This browser couldn't make a canvas to record from.");
    }
    // without an answer, keep full range and label it so
    const tvRange = await encodesFullRange(videoCanvas, encoder) === true;
    const checkpoints = settings.hud.checkpoints && compareBot ? checkpointDiffs(bot, compareBot, map, settings.hud.finish) : [];
    const hud = await VideoHud.create(context, settings.hud, checkpoints, width, height);
    const surface = graphics.new_surface(gpuCanvas);
    const session = new StreamableSession(bot, 0);
    const samples = settings.motionBlur ? settings.blurSamples : 1;
    const blend = samples > 1 ? graphics.new_frame_blend(surface) : undefined;
    // the session would loop a second after the end, so the time stops there and the last frame stays
    const duration = bot.duration();
    const frameCount = Math.floor((duration + endHold(settings, compareBot !== undefined)) * fps);
    const file = await createVideoFile();
    const output = new Output({
        // the frame count is known, so the index can go at the start without keeping the video in memory until the end
        format: new Mp4OutputFormat({ fastStart: "reserve" }),
        target: file ? new StreamTarget(file.writable, { chunked: true }) : new BufferTarget()
    });
    let finished = false;
    let bytes = 0;
    try {
        graphics.set_graphics_quality(toGraphicsQuality(settings.graphics));
        session.advance_time(bot, map, 0);
        session.set_bot_time(bot, map, 0, 0);

        const codec = encoder.codec;
        const source = new CanvasSource(videoCanvas, {
            codec,
            quality: encoder.quality,
            hardwareAcceleration: encoder.hardwareAcceleration,
            // Called with the same packet and metadata right before they're muxed, so the color space, the SPS and the
            // packet itself can be changed here.
            onEncodedPacket: (packet, meta) => {
                bytes += packet.byteLength;
                const config = meta?.decoderConfig;
                if (codec === "avc") {
                    // the encoder only puts the color space in the MP4's colr box, which some players ignore
                    if (config?.description && config.colorSpace) {
                        if (tvRange) {
                            config.colorSpace = { ...config.colorSpace, fullRange: false };
                        }
                        config.description = avcConfigWithColor(config.description, config.colorSpace) ?? config.description;
                    }
                }
                else if (tvRange) {
                    setAv1Range(packet.data, false);
                    if (config?.colorSpace) {
                        config.colorSpace = { ...config.colorSpace, fullRange: false };
                    }
                }
            }
        });
        output.addVideoTrack(source, { frameRate: fps, maximumPacketCount: frameCount });
        await output.start();

        for (let i = 0; i < WARM_UP_FRAMES; ++i) {
            graphics.render_video_frame(surface, map, bot, session);
            await yieldToBrowser();
        }

        // each frame's blur covers the time after it, like a camera's shutter opening at the frame
        let lastPreview = -Infinity;
        let lastYield = performance.now();
        for (let frame = 0; frame < frameCount; ++frame) {
            if (signal.aborted) return undefined;
            const time = frame / fps;
            if (blend) {
                for (let sample = 0; sample < samples; ++sample) {
                    session.advance_time(bot, map, Math.min(time + (sample + 0.5) * BLUR_SAMPLE_SECONDS, duration));
                    graphics.add_video_sample(surface, blend, map, bot, session, 1 / samples, sample === 0);
                }
                graphics.show_blended_frame(surface, blend);
            }
            else {
                session.advance_time(bot, map, Math.min(time, duration));
                graphics.render_video_frame(surface, map, bot, session);
            }
            // in the same task as the render, while the GPU canvas still holds it
            context.drawImage(gpuCanvas, 0, 0);
            hud.draw(context, { time, speed: session.get_speed(bot) });
            let now = performance.now();
            if (now - lastPreview >= PREVIEW_INTERVAL_MS) {
                lastPreview = now;
                // before it's squeezed into TV range
                onPreview(videoCanvas);
            }
            if (tvRange) {
                squeezeToTvRange(context);
            }
            await source.add(time, 1 / fps);
            throwGraphicsErrors(graphics);
            now = performance.now();
            if (frame === 0 || now - lastYield >= YIELD_INTERVAL_MS) {
                onProgress({ step: "recording", frame, frameCount, bytes });
                await yieldToBrowser();
                lastYield = performance.now();
            }
        }

        onProgress({ step: "saving" });
        await output.finalize();
        finished = true;
        if (file) {
            return { video: await file.read(), discard: file.discard };
        }
        const buffer = output.target instanceof BufferTarget ? output.target.buffer : null;
        return buffer ? { video: new Blob([buffer], { type: "video/mp4" }), discard: async () => {} } : undefined;
    }
    finally {
        if (!finished) {
            if (output.state === "started") {
                await output.cancel().catch(err => console.error("Couldn't cancel the video", err));
            }
            await file?.discard();
        }
        blend?.free();
        session.free();
        surface.free();
    }
}
