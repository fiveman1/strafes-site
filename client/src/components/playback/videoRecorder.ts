import { BufferTarget, CanvasSource, canEncodeVideo, Mp4OutputFormat, Output, Quality } from "mediabunny";
import { Graphics, StreamableBot, StreamableMap, StreamableSession } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import { getMapAssetLoader } from "./mapAssetLoader";
import { avcConfigWithColor } from "./avcColor";
import { GraphicsLevel, toGraphicsQuality } from "./graphicsSettings";

export const VIDEO_RESOLUTIONS = {
    "720p": [1280, 720],
    "1080p": [1920, 1080],
} as const;
export type VideoResolution = keyof typeof VIDEO_RESOLUTIONS;
export type VideoFrameRate = 30 | 60;
export type VideoQuality = "medium" | "high" | "very-high";

export interface VideoSettings {
    resolution: VideoResolution
    fps: VideoFrameRate
    quality: VideoQuality
    graphics: GraphicsLevel
}

// fast camera turns and fine textures need more than the default
export const DEFAULT_VIDEO_SETTINGS: VideoSettings = { resolution: "1080p", fps: 60, quality: "very-high", graphics: "high" };

/**
 * A quality level rather than a bitrate: H.264 encodes it at a fixed quantizer, as many bits as each frame needs, so
 * fast camera turns stay sharp. Very high (QP 16) came to about 75 Mbps on a surf map at 1080p60.
 */
function videoQuality(settings: VideoSettings) {
    return new Quality(settings.quality);
}
/** Frames drawn before the first one encoded, so shadowed lights (two new ones a frame) and lightmap chunks are all on the GPU */
const WARM_UP_FRAMES = 30;
/** Seconds the last frame stays at the end, like the player waiting before it loops (the session holds it) */
export const END_HOLD = 1;
/**
 * Recordings are TV range (16 to 235, also called limited range): the standard for video, which players, phones, TVs and
 * video sites all expect, so a recording looks right wherever it's watched or uploaded. Full range only looks right where
 * the player reads its label, and some don't.
 * Browsers' encoders turn canvas frames into full range, so each frame is squeezed into 16 + x * 219/255 first, by
 * blending it at this alpha over gray (2D canvases blend the sRGB values), and the video is labeled TV range.
 */
const TV_RANGE_ALPHA = 219 / 255;
/** 113 * 36/255 = 15.95, the 16 under black */
const TV_RANGE_GRAY = "rgb(113, 113, 113)";
/** How often the preview is updated while recording, in milliseconds */
const PREVIEW_INTERVAL_MS = 500;

export type RecordingProgress =
    | { step: "loading", fraction: number }
    /** `bytes` is the size of the video so far */
    | { step: "recording", frame: number, frameCount: number, bytes: number }
    | { step: "saving" };

/** H.264 High profile at level 4.2, enough for 1080p60, for the color range test. Encoders write their own level. */
const TEST_CODEC = "avc1.64002a";

/**
 * The encoder settings shared by the support check, the color range test and the recording. Only the GPU's encoder:
 * browsers' software ones are much slower, and their color range and rate control differ.
 */
function encoderOptions(settings: VideoSettings) {
    const [width, height] = VIDEO_RESOLUTIONS[settings.resolution];
    return {
        width,
        height,
        frameRate: settings.fps,
        quality: videoQuality(settings),
        hardwareAcceleration: "prefer-hardware"
    } as const;
}

/** Whether this browser can encode videos of these settings. */
export function canEncodeSettings(settings: VideoSettings) {
    return canEncodeVideo("avc", encoderOptions(settings));
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
 * Whether the browser's encoder turns this canvas into full range video (WebCodecs has no setting for it), from the
 * color space it reports after encoding one frame. Undefined if it doesn't say or the test fails.
 */
async function encodesFullRange(canvas: HTMLCanvasElement, options: ReturnType<typeof encoderOptions>): Promise<boolean | undefined> {
    let fullRange: boolean | undefined = undefined;
    const encoder = new VideoEncoder({
        output: (_chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata | undefined) => {
            fullRange ??= meta?.decoderConfig?.colorSpace?.fullRange ?? undefined;
        },
        error: (err: DOMException) => console.error("Couldn't test the video encoder", err)
    });
    try {
        encoder.configure({
            codec: TEST_CODEC,
            width: options.width,
            height: options.height,
            framerate: options.frameRate,
            hardwareAcceleration: options.hardwareAcceleration,
            avc: { format: "avc" }
        });
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

/** Copies the rendered frame into the canvas that is encoded, squeezed into TV range if `tvRange`, see TV_RANGE_ALPHA. */
function copyFrame(context: CanvasRenderingContext2D, frame: HTMLCanvasElement, tvRange: boolean) {
    if (tvRange) {
        context.globalAlpha = 1;
        context.fillStyle = TV_RANGE_GRAY;
        context.fillRect(0, 0, frame.width, frame.height);
        context.globalAlpha = TV_RANGE_ALPHA;
    }
    context.drawImage(frame, 0, 0);
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

export interface RecordVideoOptions {
    graphics: Graphics
    map: StreamableMap
    bot: StreamableBot
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
export async function recordVideo(options: RecordVideoOptions): Promise<Blob | undefined> {
    const { graphics, map, bot, settings, pump, signal, onProgress, onPreview } = options;
    const encoder = encoderOptions(settings);
    const fps = settings.fps;

    if (!await canEncodeSettings(settings)) {
        throw new Error("This browser can't encode H.264 video at this size.");
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
    const surface = graphics.new_surface(gpuCanvas);
    const session = new StreamableSession(bot, 0);
    const output = new Output({
        format: new Mp4OutputFormat({ fastStart: "in-memory" }),
        target: new BufferTarget()
    });
    let finished = false;
    let bytes = 0;
    try {
        graphics.set_graphics_quality(toGraphicsQuality(settings.graphics));
        session.advance_time(bot, map, 0);
        session.set_bot_time(bot, map, 0, 0);

        const source = new CanvasSource(videoCanvas, {
            codec: "avc",
            quality: encoder.quality,
            hardwareAcceleration: encoder.hardwareAcceleration,
            // Called with the same metadata right before it's muxed, so the color space and SPS can be changed here.
            // The encoder only puts the color space in the MP4's colr box, which some players ignore.
            onEncodedPacket: (packet, meta) => {
                bytes += packet.byteLength;
                const config = meta?.decoderConfig;
                if (config?.description && config.colorSpace) {
                    if (tvRange) {
                        config.colorSpace = { ...config.colorSpace, fullRange: false };
                    }
                    config.description = avcConfigWithColor(config.description, config.colorSpace) ?? config.description;
                }
            }
        });
        output.addVideoTrack(source, { frameRate: fps });
        await output.start();

        for (let i = 0; i < WARM_UP_FRAMES; ++i) {
            graphics.render_video_frame(surface, map, bot, session);
            await yieldToBrowser();
        }

        const frameCount = Math.floor((bot.duration() + END_HOLD) * fps);
        let lastPreview = -Infinity;
        for (let frame = 0; frame < frameCount; ++frame) {
            if (signal.aborted) return undefined;
            const time = frame / fps;
            session.advance_time(bot, map, time);
            graphics.render_video_frame(surface, map, bot, session);
            // in the same task as the render, while the GPU canvas still holds it
            copyFrame(context, gpuCanvas, tvRange);
            const now = performance.now();
            if (now - lastPreview >= PREVIEW_INTERVAL_MS) {
                lastPreview = now;
                // the GPU canvas, since the encoded one is squeezed into TV range
                onPreview(gpuCanvas);
            }
            await source.add(time, 1 / fps);
            throwGraphicsErrors(graphics);
            if (frame % 30 === 0) {
                onProgress({ step: "recording", frame, frameCount, bytes });
                await yieldToBrowser();
            }
        }

        onProgress({ step: "saving" });
        await output.finalize();
        finished = true;
        const buffer = output.target.buffer;
        return buffer ? new Blob([buffer], { type: "video/mp4" }) : undefined;
    }
    finally {
        if (!finished && output.state === "started") {
            await output.cancel().catch(err => console.error("Couldn't cancel the video", err));
        }
        session.free();
        surface.free();
    }
}
