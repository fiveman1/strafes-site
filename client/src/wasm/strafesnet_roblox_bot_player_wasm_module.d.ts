/* tslint:disable */
/* eslint-disable */

/**
 * A completed download request.
 */
export class BotBlockData {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
}

/**
 * A range of data. StreamableBot considers this block to be
 * "currently downloading" so it must be either downloaded or cancelled.
 */
export class BotBlockRange {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    range(): Range;
}

export class BotDownloader {
    free(): void;
    [Symbol.dispose](): void;
    download_bot_block_range(arg0: BotBlockRange): Promise<BotBlockData>;
    get_complete_bot(): Promise<CompleteBot>;
    constructor(url: string);
}

export class Bvh {
    free(): void;
    [Symbol.dispose](): void;
    closest_time_to_point(bot: CompleteBot, point: Vector3): number | undefined;
    constructor(bot: CompleteBot);
}

/**
 * When a run first reached a stage by touching a Teleport part, or finished.
 */
export class Checkpoint {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The run timer, in seconds
     */
    run_time: number;
    /**
     * Horizontal speed when it touched the Teleport or finished
     */
    speed: number;
    /**
     * Undefined for the finish
     */
    get stage(): number | undefined;
    /**
     * Undefined for the finish
     */
    set stage(value: number | null | undefined);
    /**
     * Seconds since the replay's start
     */
    time: number;
}

export class CompleteBot {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The run's checkpoints at the map's Teleports. Needs the map's regions with Teleports.
     */
    checkpoints(map: StreamableMap): Checkpoint[];
    duration(): number;
    /**
     * When the run finished: its Finish event, or the replay's end without one.
     */
    finish(): Checkpoint | undefined;
    constructor(data: Uint8Array | number[]);
    run_duration(mode_id: number): number;
}

/**
 * A handle that tracks internal state for a bot replay.
 * Use StreamableSession for an object with looping and play/pause controls.
 * All timestamps are "BotTime", which starts at 0 at the beginning of the
 * replay.  Changing any setting also implicitly advances
 * the session machinery, which is why `bot:&CompleteBot` and `time:f64`
 * is required.
 */
export class CompleteHead {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     */
    get_angles_yaw_delta(): number;
    get_fov_slope_y(): number;
    get_game_controls(): number;
    get_position(bot: CompleteBot): Vector3;
    get_run_time(bot: CompleteBot, mode_id: number): number | undefined;
    get_speed(bot: CompleteBot): number;
    is_run_finished(mode_id: number): boolean | undefined;
    is_run_in_progress(mode_id: number): boolean | undefined;
    constructor(bot: CompleteBot, bot_time: number);
    /**
     * Set the playback head position to bot_time.
     */
    set_time(bot: CompleteBot, bot_time: number): void;
}

/**
 * The slow parts of a downloaded group, which StreamableMap.ingest_deferred leaves for the caller.
 */
export class DeferredJobs {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The group's mesh and region blocks in one buffer, empty without any. Pass them to ModelPreparer.prepare, in the
     * order the groups were ingested. Moves the data out, so it can only be taken once.
     */
    take_geometry(): Uint8Array;
    /**
     * Moves the jobs out, so they can only be taken once.
     */
    take_lightmap_chunks(): LightmapChunkJob[];
    /**
     * Moves the jobs out, so they can only be taken once.
     */
    take_textures(): TextureJob[];
}

export class DownloadBotBlockRangeError {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    error(): any;
    request(): BotBlockRange | undefined;
}

export class DownloadMapBlockRangeError {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    error(): any;
    request(): MapBlockRange | undefined;
}

/**
 * Frames averaged into one for motion blur, see Graphics.add_video_sample.
 */
export class FrameBlend {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
}

export class Graphics {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Like render_video_frame, but adds the frame into the blend at this weight instead of showing it, for motion
     * blur: a video frame is several of these a moment apart, then show_blended_frame. `first` starts a new one.
     */
    add_video_sample(surface: Surface, blend: FrameBlend, map: StreamableMap, bot: StreamableBot, session: StreamableSession, weight: number, first: boolean): void;
    /**
     * The last render_session's camera as a render-snfm view, as one line, or undefined before one.
     */
    camera_stats(): string | undefined;
    /**
     * The adapter, enabled features and chosen formats, for bug reports from devices you can't test on.
     */
    debug_info(): string;
    /**
     * What the last rendered frame drew after skipping what was out of view, its lights and its shadows, as three lines,
     * and a fourth for the baked occlusion lists on maps with them.
     */
    frame_stats(): string;
    /**
     * The average GPU time of the frames rendered since the last call, as one line,
     * or undefined on devices without timestamp queries or before any frame was timed.
     */
    gpu_stats(): string | undefined;
    /**
     * How far from the camera pixels add up local lights one by one, with highlights.
     * Farther pixels read the lights' light baked into the lightmap, which costs the same however many lights overlap.
     * 0 lights everything from the lightmap, Infinity never uses it.
     */
    light_distance(): number;
    /**
     * A FrameBlend the size of this surface, for add_video_sample.
     */
    new_frame_blend(surface: Surface): FrameBlend;
    new_surface(canvas: HTMLCanvasElement): Surface;
    render_head(surface: Surface, map: StreamableMap, bot: StreamableBot, head: StreamableHead): void;
    render_session(surface: Surface, map: StreamableMap, bot: StreamableBot, session: StreamableSession): void;
    /**
     * Like render_session, for recording a video once the whole map is loaded (StreamableMap.is_loaded), see
     * with_video_settings. The debug stats keep the last render_session's camera.
     */
    render_video_frame(surface: Surface, map: StreamableMap, bot: StreamableBot, session: StreamableSession): void;
    /**
     * Whether see-through textures like leaves are drawn as anti-aliased coverage instead of blended, on presets
     * with anti-aliasing. On by default.
     */
    set_alpha_to_coverage(alpha_to_coverage: boolean): void;
    /**
     * How much of the map's baked bounce light surfaces get, 1 as baked, 0 for none.
     * set_graphics_quality resets it to 1.
     */
    set_bounce_light(bounce_light: number): void;
    /**
     * Use a preset's settings, replacing any set one by one like the light distance. The default is Medium.
     * Only High uses 4x anti-aliasing, darkens corners with ambient occlusion and has water mirror what's on screen.
     * Low also skips sky reflections, Glass's bumps, lighting pixels by local lights one by one and see-through
     * shadows, softens shadow edges and slanted textures less, and blurs the glow more coarsely.
     * Render scale is up to the page: size the canvas smaller and let the browser stretch it.
     */
    set_graphics_quality(quality: GraphicsQuality): void;
    set_light_distance(light_distance: number): void;
    /**
     * How much the sky a surface sees picks between the map's indoor and outdoor ambient, 1 as baked, 0 lights
     * every surface as though open to the sky.
     */
    set_sky_occlusion(sky_occlusion: number): void;
    /**
     * Shows the frames added to the blend on the surface's canvas.
     */
    show_blended_frame(surface: Surface, blend: FrameBlend): void;
    /**
     * GPU errors since the last call, oldest first.
     * WebGPU reports validation errors (like a shader the browser can't compile) and device loss
     * without throwing, and the frame just stays black, so poll this to show them.
     */
    take_errors(): string[];
    /**
     * The average GPU time per frame of the frames rendered since the last call, in milliseconds,
     * or undefined on devices without timestamp queries or before any frame was timed.
     * Counted separately from gpu_stats, so both can be read.
     */
    take_gpu_frame_ms(): number | undefined;
    /**
     * Which compressed texture formats this device supports, for transcode_texture in a web worker.
     */
    texture_support(): number;
}

/**
 * Contains graphics and surface.  Call graphics() and surface() to get the
 * inner objects.  This is a silly api to make sure the bindgen code has
 * proper type inference.
 */
export class GraphicsAndSurface {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    graphics(): Graphics | undefined;
    surface(): Surface | undefined;
}

/**
 * Graphics presets, for devices from phones to fast desktops.
 */
export enum GraphicsQuality {
    Low = 0,
    Medium = 1,
    High = 2,
}

/**
 * Jump HUD stats for the most recent jump.  Percentages are fractions, 1.0 is optimal.
 */
export class JumpStats {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Mean speed gain relative to optimal, undefined for the first jump.
     */
    get efficiency(): number | undefined;
    /**
     * Mean speed gain relative to optimal, undefined for the first jump.
     */
    set efficiency(value: number | null | undefined);
    /**
     * Speed gained since the previous jump, undefined for the first jump.
     */
    get gain(): number | undefined;
    /**
     * Speed gained since the previous jump, undefined for the first jump.
     */
    set gain(value: number | null | undefined);
    /**
     * Jump number in the current chain, undefined while earlier parts of the replay are still downloading.
     */
    get number(): number | undefined;
    /**
     * Jump number in the current chain, undefined while earlier parts of the replay are still downloading.
     */
    set number(value: number | null | undefined);
    /**
     * Horizontal speed on the jump tick.
     */
    speed: number;
    /**
     * Mean strafe rate relative to optimal, undefined for the first jump.
     */
    get strafe_rate(): number | undefined;
    /**
     * Mean strafe rate relative to optimal, undefined for the first jump.
     */
    set strafe_rate(value: number | null | undefined);
    /**
     * Strafes since the previous jump, undefined while still downloading.
     */
    get strafes(): number | undefined;
    /**
     * Strafes since the previous jump, undefined while still downloading.
     */
    set strafes(value: number | null | undefined);
}

/**
 * A lightmap chunk from StreamableMap.ingest_deferred. Make it ready for the GPU with prepare_lightmap_chunk, usually in
 * a web worker, and pass both to StreamableMap.insert_lightmap_chunk.
 */
export class LightmapChunkJob {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The chunk as maps store it. Moves the data out, so it can only be taken once.
     */
    take_compressed(): Uint8Array;
    readonly region_id: number;
}

/**
 * A completed download request.
 */
export class MapBlockData {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
}

/**
 * A range of data. StreamableMap considers this block to be
 * "currently downloading" so it must be either downloaded or cancelled.
 */
export class MapBlockRange {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    range(): Range;
}

export class MapDownloader {
    free(): void;
    [Symbol.dispose](): void;
    download_map_block_range(arg0: MapBlockRange): Promise<MapBlockData>;
    constructor(url: string);
}

/**
 * Makes a streamed map's regions ready to draw from the geometry in DeferredJobs, which is most of the time spent
 * adding them. It needs no Graphics, so it can run in a web worker.
 */
export class ModelPreparer {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * With StreamableMap.preparer_context.
     */
    constructor(context: Uint8Array | number[]);
    /**
     * Add a group's geometry from DeferredJobs.take_geometry, and prepare the regions which have all their meshes now,
     * for StreamableMap.insert_prepared_regions.
     */
    prepare(geometry: Uint8Array | number[]): Uint8Array;
}

export class Range {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    end: number;
    start: number;
}

export class StreamableBot {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(arg0: BotBlockRange): void;
    /**
     * The run's checkpoints at the map's Teleports. Needs the whole replay, and the map's regions with Teleports.
     */
    checkpoints(map: StreamableMap): Checkpoint[];
    /**
     * Clear all blocks marked as "currently downloading".
     * This may cause blocks to be downloaded multiple times.
     */
    clear_downloading(): void;
    duration(): number;
    /**
     * When the run finished: its Finish event, or the replay's end without one. Needs the whole replay.
     */
    finish(): Checkpoint | undefined;
    ingest(arg0: BotBlockData): void;
    /**
     * Returns the next block that will be needed to construct a StreamableHead
     *  at bot_time.  Do not lose track of this object, since it will never be
     * requested for download again unless cancelled.
     */
    next_block_at_time(bot_time: number): BotBlockRange | undefined;
    /**
     * Returns a reasonable block to download next, assuming no blocks are needed
     * within lookahead_seconds.  Only call this if next_block_throttled returned
     * None. Do not lose track of this object, since it will never be requested
     * for download again unless cancelled.
     */
    next_block_eager(playback_session: StreamableSession, lookahead_seconds: number): BotBlockRange | undefined;
    /**
     * Returns the next block that will be needed within lookahead_seconds.  Do
     * not lose track of this object, since it will never be requested for
     * download again unless cancelled.
     */
    next_block_throttled(playback_session: StreamableSession, lookahead_seconds: number): BotBlockRange | undefined;
    /**
     * Contiguous ranges of downloaded replay in bot time (the same clock as StreamableSession.get_bot_time).
     * Provided as an array of f64 pairs [start0, end0, start1, end1, ...].
     */
    ranges(): Float64Array;
    /**
     * This function may return different values depending on streaming state.
     */
    run_duration(mode_id: number): number;
    /**
     * Calculate active streaming details
     */
    stats(): StreamableBotStats;
}

export class StreamableBotStats {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    blocks_downloaded: number;
    blocks_total: number;
    bytes_downloaded: number;
    bytes_total: number;
    requests_in_flight: number;
}

/**
 * A handle that tracks internal state for a bot replay.
 * Use StreamableSession for an object with looping and play/pause controls.
 * All timestamps are "BotTime", which starts at 0 at the beginning of the
 * replay.  Changing any setting also implicitly advances
 * the session machinery, which is why `bot:&StreamableBot` and `time:f64`
 * is required.
 */
export class StreamableHead {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     */
    get_angles_yaw_delta(): number;
    get_fov_slope_y(): number;
    get_game_controls(): number;
    get_position(bot: StreamableBot): Vector3;
    get_run_time(bot: StreamableBot, mode_id: number): number | undefined;
    get_speed(bot: StreamableBot): number;
    is_run_finished(mode_id: number): boolean | undefined;
    is_run_in_progress(mode_id: number): boolean | undefined;
    constructor(bot: StreamableBot, bot_time: number);
    /**
     * Set the playback head position to bot_time.
     */
    set_time(bot: StreamableBot, bot_time: number): void;
}

export class StreamableMap {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Stop waiting for regions from ModelPreparer.prepare, for when the worker preparing them failed, so playback
     * doesn't buffer forever. The regions it hadn't prepared are never drawn.
     */
    abandon_prepared_regions(): void;
    cancel(arg0: MapBlockRange): void;
    /**
     * Clear all blocks marked as "currently downloading".
     * This may cause blocks to be downloaded multiple times.
     */
    clear_downloading(): void;
    ingest(graphics: Graphics, arg1: MapBlockData): void;
    /**
     * Like ingest, but returns the group's texture files, lightmap chunks and geometry instead of loading them, which
     * takes most of the time. Transcode each texture with transcode_texture (in a web worker) and pass the result to
     * upload_texture; playback buffers at a spot until its textures are uploaded. Prepare each lightmap chunk with
     * prepare_lightmap_chunk (in a web worker) and pass it to insert_lightmap_chunk. Prepare the geometry with a
     * ModelPreparer (in a web worker) and pass the result to insert_prepared_regions; playback buffers at a spot until
     * then. Call take_runoff_jobs first and use only this, not ingest.
     */
    ingest_deferred(arg0: MapBlockData): DeferredJobs;
    /**
     * Add a lightmap chunk from a LightmapChunkJob with what prepare_lightmap_chunk made of it. Without that (the worker
     * failed), or if it doesn't hold a chunk (a mismatched worker build), the chunk is decompressed here instead, a little
     * each frame.
     */
    insert_lightmap_chunk(region_id: number, compressed: Uint8Array | number[], prepared?: Uint8Array | number[] | null): void;
    /**
     * Add regions from ModelPreparer.prepare. Do this before promote_ready_assets. False if any were from a mismatched
     * worker build, and those regions are never drawn.
     */
    insert_prepared_regions(prepared: Uint8Array | number[]): boolean;
    /**
     * Whether the whole map is downloaded and in the scene: nothing left to download or in flight, no texture
     * transcoding and nothing waiting to be added by promote_ready_assets. Work handed to web workers through
     * ingest_deferred isn't known here until it comes back, so check that the caller's workers are done too.
     * Lightmap chunks still go on the GPU over the next frames rendered.
     */
    is_loaded(): boolean;
    next_block_head_throttled(bot: StreamableBot, head: StreamableHead, surface: Surface): MapBlockRange | undefined;
    /**
     * Returns the next block to download in a reasonable order based on the
     * current camera view.  Do not lose track of this object, since it will
     * never be requested for download again unless cancelled.
     */
    next_block_session(bot: StreamableBot, session: StreamableSession, surface: Surface): MapBlockRange | undefined;
    /**
     * What a ModelPreparer for this map is made with.
     */
    preparer_context(): Uint8Array;
    /**
     * Call this before rendering to promote streaming assets which are ready
     * to render onto the render queue.
     */
    promote_ready_assets(graphics: Graphics): void;
    /**
     * Calculate active streaming details
     */
    stats(): StreamableMapStats;
    /**
     * What ingest_deferred returns for the blocks downloaded with the map's header. Call it once, before anything else.
     */
    take_runoff_jobs(): DeferredJobs;
    /**
     * Upload a texture from transcode_texture. Do this before promote_ready_assets.
     */
    upload_texture(graphics: Graphics, texture: TranscodedTexture): void;
}

export class StreamableMapStats {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    baked_chunks_downloaded: number;
    baked_chunks_total: number;
    bytes_downloaded: number;
    bytes_total: number;
    lightmap_chunks_downloaded: number;
    lightmap_chunks_total: number;
    meshes_downloaded: number;
    meshes_total: number;
    regions_downloaded: number;
    regions_total: number;
    requests_in_flight: number;
    textures_downloaded: number;
    textures_total: number;
}

/**
 * A bot replay object with automatic looping, play/pause controls, and
 * timescale.  All timestamps are "SessionTime", which is expected to be a
 * monotonic external clock.  Changing any setting also implicitly advances
 * the session machinery, which is why `bot:&StreamableBot` and `time:f64`
 * is required.
 */
export class StreamableSession {
    free(): void;
    [Symbol.dispose](): void;
    advance_time(bot: StreamableBot, map: StreamableMap, session_time: number): void;
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     */
    get_angles_yaw_delta(): number;
    get_bot_time(): number;
    get_fov_slope_y(): number;
    get_game_controls(): number;
    /**
     * Jump HUD stats for the most recent jump in the current jump chain.
     * Undefined before the first jump, after standing on the ground, and for fly trials styles.
     */
    get_jump_stats(bot: StreamableBot): JumpStats | undefined;
    get_position(bot: StreamableBot): Vector3;
    get_run_time(bot: StreamableBot, mode_id: number): number | undefined;
    get_scale(): number;
    get_speed(bot: StreamableBot): number;
    is_buffering(): boolean;
    is_run_finished(mode_id: number): boolean | undefined;
    is_run_in_progress(mode_id: number): boolean | undefined;
    constructor(bot: StreamableBot, session_time: number);
    /**
     * Set the playback position to new_time.
     */
    set_bot_time(bot: StreamableBot, map: StreamableMap, session_time: number, bot_time: number): void;
    set_paused(bot: StreamableBot, map: StreamableMap, session_time: number, paused: boolean): void;
    set_scale(bot: StreamableBot, map: StreamableMap, session_time: number, scale: number): void;
}

export class Surface {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    resize(graphics: Graphics, width: number, height: number): void;
}

/**
 * A texture file from StreamableMap.ingest_deferred. Transcode it with transcode_texture,
 * usually in a web worker, and pass the result to StreamableMap.upload_texture.
 */
export class TextureJob {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The KTX2 or DDS file. Moves the data out, so it can only be taken once.
     */
    take_data(): Uint8Array;
    readonly texture_id: number;
}

/**
 * A texture ready to upload, as plain data so it can be sent between a web worker and the page.
 */
export class TranscodedTexture {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Rebuild from the fields of a TranscodedTexture sent from a web worker.
     */
    constructor(texture_id: number, width: number, height: number, mip_level_count: number, format: number, coverage_alpha: boolean, data: Uint8Array | number[]);
    /**
     * Every mip level, largest first. Moves the data out, so it can only be taken once.
     */
    take_data(): Uint8Array;
    /**
     * Whether its alpha is mostly fully clear or fully solid, see Texture::coverage_alpha.
     */
    readonly coverage_alpha: boolean;
    readonly format: number;
    readonly height: number;
    readonly mip_level_count: number;
    readonly texture_id: number;
    readonly width: number;
}

export class Vector3 {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    x: number;
    y: number;
    z: number;
}

/**
 * Initialize a StreamableBot by estimating the header length based on the leaderboard run duration.
 * This may make 2 requests if the file is a malformed outlier, or even 3 for a maliciously crafted file.
 */
export function new_streamable_bot(downloader: BotDownloader, run_duration: number, group_split_size: number): Promise<StreamableBot>;

/**
 * Initialize a StreamableMap by estimating the header length based on the leaderboard run duration.
 * This may make 2 requests if the file is a malformed outlier, or even 3 for a maliciously crafted file.
 * `group_split_size` (bytes) defines the preferred size for download requests.  0 makes the requests as small as possible.
 */
export function new_streamable_map(downloader: MapDownloader, graphics: Graphics, group_split_size: number): Promise<StreamableMap>;

/**
 * Decompress a lightmap chunk from a LightmapChunkJob and lay it out as it goes on the GPU, as bytes for
 * StreamableMap.insert_lightmap_chunk. This is the slow part of a lightmap chunk, and it needs no Graphics, so it can
 * run in a web worker.
 */
export function prepare_lightmap_chunk(compressed: Uint8Array | number[]): Uint8Array;

/**
 * Set up the graphics.  Returns an object that contains both graphics and surface.
 * Call graphics.new_surface to set up new surfaces as needed.
 */
export function setup_graphics(canvas: HTMLCanvasElement): Promise<GraphicsAndSurface>;

/**
 * Transcode a texture file from a TextureJob into a format the device supports
 * (`texture_support` from Graphics.texture_support). This is the slow part of loading a map,
 * and it needs no Graphics, so it can run in a web worker.
 * A file which fails to load becomes the missing texture checkerboard.
 */
export function transcode_texture(texture_id: number, data: Uint8Array | number[], texture_support: number): TranscodedTexture;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_botblockdata_free: (a: number, b: number) => void;
    readonly __wbg_botblockrange_free: (a: number, b: number) => void;
    readonly __wbg_botdownloader_free: (a: number, b: number) => void;
    readonly __wbg_bvh_free: (a: number, b: number) => void;
    readonly __wbg_checkpoint_free: (a: number, b: number) => void;
    readonly __wbg_completebot_free: (a: number, b: number) => void;
    readonly __wbg_completehead_free: (a: number, b: number) => void;
    readonly __wbg_deferredjobs_free: (a: number, b: number) => void;
    readonly __wbg_downloadbotblockrangeerror_free: (a: number, b: number) => void;
    readonly __wbg_downloadmapblockrangeerror_free: (a: number, b: number) => void;
    readonly __wbg_frameblend_free: (a: number, b: number) => void;
    readonly __wbg_get_checkpoint_run_time: (a: number) => number;
    readonly __wbg_get_checkpoint_speed: (a: number) => number;
    readonly __wbg_get_checkpoint_stage: (a: number) => number;
    readonly __wbg_get_checkpoint_time: (a: number) => number;
    readonly __wbg_get_jumpstats_efficiency: (a: number) => number;
    readonly __wbg_get_jumpstats_gain: (a: number) => number;
    readonly __wbg_get_jumpstats_number: (a: number) => number;
    readonly __wbg_get_jumpstats_speed: (a: number) => number;
    readonly __wbg_get_jumpstats_strafe_rate: (a: number) => number;
    readonly __wbg_get_jumpstats_strafes: (a: number) => number;
    readonly __wbg_get_range_end: (a: number) => number;
    readonly __wbg_get_range_start: (a: number) => number;
    readonly __wbg_get_streamablebotstats_blocks_downloaded: (a: number) => number;
    readonly __wbg_get_streamablebotstats_blocks_total: (a: number) => number;
    readonly __wbg_get_streamablebotstats_bytes_downloaded: (a: number) => number;
    readonly __wbg_get_streamablebotstats_bytes_total: (a: number) => number;
    readonly __wbg_get_streamablebotstats_requests_in_flight: (a: number) => number;
    readonly __wbg_get_streamablemapstats_baked_chunks_downloaded: (a: number) => number;
    readonly __wbg_get_streamablemapstats_baked_chunks_total: (a: number) => number;
    readonly __wbg_get_streamablemapstats_bytes_downloaded: (a: number) => number;
    readonly __wbg_get_streamablemapstats_bytes_total: (a: number) => number;
    readonly __wbg_get_streamablemapstats_lightmap_chunks_downloaded: (a: number) => number;
    readonly __wbg_get_streamablemapstats_lightmap_chunks_total: (a: number) => number;
    readonly __wbg_get_streamablemapstats_meshes_downloaded: (a: number) => number;
    readonly __wbg_get_streamablemapstats_meshes_total: (a: number) => number;
    readonly __wbg_get_streamablemapstats_regions_downloaded: (a: number) => number;
    readonly __wbg_get_streamablemapstats_regions_total: (a: number) => number;
    readonly __wbg_get_streamablemapstats_requests_in_flight: (a: number) => number;
    readonly __wbg_get_streamablemapstats_textures_downloaded: (a: number) => number;
    readonly __wbg_get_streamablemapstats_textures_total: (a: number) => number;
    readonly __wbg_get_vector3_x: (a: number) => number;
    readonly __wbg_get_vector3_y: (a: number) => number;
    readonly __wbg_get_vector3_z: (a: number) => number;
    readonly __wbg_graphics_free: (a: number, b: number) => void;
    readonly __wbg_graphicsandsurface_free: (a: number, b: number) => void;
    readonly __wbg_jumpstats_free: (a: number, b: number) => void;
    readonly __wbg_lightmapchunkjob_free: (a: number, b: number) => void;
    readonly __wbg_mapblockdata_free: (a: number, b: number) => void;
    readonly __wbg_mapblockrange_free: (a: number, b: number) => void;
    readonly __wbg_mapdownloader_free: (a: number, b: number) => void;
    readonly __wbg_modelpreparer_free: (a: number, b: number) => void;
    readonly __wbg_range_free: (a: number, b: number) => void;
    readonly __wbg_set_checkpoint_run_time: (a: number, b: number) => void;
    readonly __wbg_set_checkpoint_speed: (a: number, b: number) => void;
    readonly __wbg_set_checkpoint_stage: (a: number, b: number) => void;
    readonly __wbg_set_checkpoint_time: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_efficiency: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_gain: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_number: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_speed: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_strafe_rate: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_strafes: (a: number, b: number) => void;
    readonly __wbg_set_range_end: (a: number, b: number) => void;
    readonly __wbg_set_range_start: (a: number, b: number) => void;
    readonly __wbg_set_streamablebotstats_blocks_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablebotstats_blocks_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablebotstats_bytes_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablebotstats_bytes_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablebotstats_requests_in_flight: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_baked_chunks_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_baked_chunks_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_bytes_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_bytes_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_lightmap_chunks_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_lightmap_chunks_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_meshes_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_meshes_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_regions_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_regions_total: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_requests_in_flight: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_textures_downloaded: (a: number, b: number) => void;
    readonly __wbg_set_streamablemapstats_textures_total: (a: number, b: number) => void;
    readonly __wbg_set_vector3_x: (a: number, b: number) => void;
    readonly __wbg_set_vector3_y: (a: number, b: number) => void;
    readonly __wbg_set_vector3_z: (a: number, b: number) => void;
    readonly __wbg_streamablebot_free: (a: number, b: number) => void;
    readonly __wbg_streamablebotstats_free: (a: number, b: number) => void;
    readonly __wbg_streamablehead_free: (a: number, b: number) => void;
    readonly __wbg_streamablemap_free: (a: number, b: number) => void;
    readonly __wbg_streamablemapstats_free: (a: number, b: number) => void;
    readonly __wbg_streamablesession_free: (a: number, b: number) => void;
    readonly __wbg_surface_free: (a: number, b: number) => void;
    readonly __wbg_texturejob_free: (a: number, b: number) => void;
    readonly __wbg_transcodedtexture_free: (a: number, b: number) => void;
    readonly __wbg_vector3_free: (a: number, b: number) => void;
    readonly botblockrange_range: (a: number) => number;
    readonly botdownloader_download_bot_block_range: (a: number, b: number) => any;
    readonly botdownloader_get_complete_bot: (a: number) => any;
    readonly botdownloader_new: (a: number, b: number) => number;
    readonly bvh_closest_time_to_point: (a: number, b: number, c: number, d: number) => void;
    readonly bvh_new: (a: number) => number;
    readonly completebot_checkpoints: (a: number, b: number, c: number) => void;
    readonly completebot_duration: (a: number) => number;
    readonly completebot_finish: (a: number) => number;
    readonly completebot_new: (a: number, b: number, c: number) => void;
    readonly completebot_run_duration: (a: number, b: number, c: number) => void;
    readonly completehead_get_angles_yaw_delta: (a: number) => number;
    readonly completehead_get_fov_slope_y: (a: number) => number;
    readonly completehead_get_game_controls: (a: number) => number;
    readonly completehead_get_position: (a: number, b: number) => number;
    readonly completehead_get_run_time: (a: number, b: number, c: number, d: number) => void;
    readonly completehead_get_speed: (a: number, b: number) => number;
    readonly completehead_is_run_finished: (a: number, b: number) => number;
    readonly completehead_is_run_in_progress: (a: number, b: number) => number;
    readonly completehead_new: (a: number, b: number) => number;
    readonly completehead_set_time: (a: number, b: number, c: number) => void;
    readonly deferredjobs_take_geometry: (a: number, b: number) => void;
    readonly deferredjobs_take_lightmap_chunks: (a: number, b: number) => void;
    readonly deferredjobs_take_textures: (a: number, b: number) => void;
    readonly downloadbotblockrangeerror_error: (a: number) => any;
    readonly downloadbotblockrangeerror_request: (a: number) => number;
    readonly downloadmapblockrangeerror_error: (a: number) => any;
    readonly downloadmapblockrangeerror_request: (a: number) => number;
    readonly graphics_add_video_sample: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly graphics_camera_stats: (a: number, b: number) => void;
    readonly graphics_debug_info: (a: number, b: number) => void;
    readonly graphics_frame_stats: (a: number, b: number) => void;
    readonly graphics_gpu_stats: (a: number, b: number) => void;
    readonly graphics_light_distance: (a: number) => number;
    readonly graphics_new_frame_blend: (a: number, b: number) => number;
    readonly graphics_new_surface: (a: number, b: number, c: any) => void;
    readonly graphics_render_head: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphics_render_session: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphics_render_video_frame: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphics_set_alpha_to_coverage: (a: number, b: number) => void;
    readonly graphics_set_bounce_light: (a: number, b: number) => void;
    readonly graphics_set_graphics_quality: (a: number, b: number) => void;
    readonly graphics_set_light_distance: (a: number, b: number) => void;
    readonly graphics_set_sky_occlusion: (a: number, b: number) => void;
    readonly graphics_show_blended_frame: (a: number, b: number, c: number) => void;
    readonly graphics_take_errors: (a: number, b: number) => void;
    readonly graphics_take_gpu_frame_ms: (a: number, b: number) => void;
    readonly graphics_texture_support: (a: number) => number;
    readonly graphicsandsurface_graphics: (a: number) => number;
    readonly graphicsandsurface_surface: (a: number) => number;
    readonly lightmapchunkjob_region_id: (a: number) => number;
    readonly lightmapchunkjob_take_compressed: (a: number, b: number) => void;
    readonly mapblockrange_range: (a: number) => number;
    readonly mapdownloader_download_map_block_range: (a: number, b: number) => any;
    readonly mapdownloader_new: (a: number, b: number) => number;
    readonly modelpreparer_new: (a: number, b: number, c: number) => void;
    readonly modelpreparer_prepare: (a: number, b: number, c: number, d: number) => void;
    readonly new_streamable_bot: (a: number, b: number, c: number) => any;
    readonly new_streamable_map: (a: number, b: number, c: number) => any;
    readonly prepare_lightmap_chunk: (a: number, b: number, c: number) => void;
    readonly setup_graphics: (a: any) => any;
    readonly streamablebot_cancel: (a: number, b: number) => void;
    readonly streamablebot_checkpoints: (a: number, b: number, c: number) => void;
    readonly streamablebot_clear_downloading: (a: number) => void;
    readonly streamablebot_duration: (a: number) => number;
    readonly streamablebot_finish: (a: number, b: number) => void;
    readonly streamablebot_ingest: (a: number, b: number, c: number) => void;
    readonly streamablebot_next_block_at_time: (a: number, b: number) => number;
    readonly streamablebot_next_block_eager: (a: number, b: number, c: number) => number;
    readonly streamablebot_next_block_throttled: (a: number, b: number, c: number) => number;
    readonly streamablebot_ranges: (a: number, b: number) => void;
    readonly streamablebot_run_duration: (a: number, b: number, c: number) => void;
    readonly streamablebot_stats: (a: number) => number;
    readonly streamablehead_get_angles_yaw_delta: (a: number) => number;
    readonly streamablehead_get_fov_slope_y: (a: number) => number;
    readonly streamablehead_get_game_controls: (a: number) => number;
    readonly streamablehead_get_position: (a: number, b: number) => number;
    readonly streamablehead_get_run_time: (a: number, b: number, c: number, d: number) => void;
    readonly streamablehead_get_speed: (a: number, b: number) => number;
    readonly streamablehead_is_run_finished: (a: number, b: number) => number;
    readonly streamablehead_is_run_in_progress: (a: number, b: number) => number;
    readonly streamablehead_new: (a: number, b: number, c: number) => void;
    readonly streamablehead_set_time: (a: number, b: number, c: number, d: number) => void;
    readonly streamablemap_abandon_prepared_regions: (a: number) => void;
    readonly streamablemap_cancel: (a: number, b: number) => void;
    readonly streamablemap_clear_downloading: (a: number) => void;
    readonly streamablemap_ingest: (a: number, b: number, c: number) => void;
    readonly streamablemap_ingest_deferred: (a: number, b: number) => number;
    readonly streamablemap_insert_lightmap_chunk: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly streamablemap_insert_prepared_regions: (a: number, b: number, c: number) => number;
    readonly streamablemap_is_loaded: (a: number) => number;
    readonly streamablemap_next_block_head_throttled: (a: number, b: number, c: number, d: number) => number;
    readonly streamablemap_next_block_session: (a: number, b: number, c: number, d: number) => number;
    readonly streamablemap_preparer_context: (a: number, b: number) => void;
    readonly streamablemap_promote_ready_assets: (a: number, b: number) => void;
    readonly streamablemap_stats: (a: number) => number;
    readonly streamablemap_take_runoff_jobs: (a: number) => number;
    readonly streamablemap_upload_texture: (a: number, b: number, c: number) => void;
    readonly streamablesession_advance_time: (a: number, b: number, c: number, d: number) => void;
    readonly streamablesession_get_angles_yaw_delta: (a: number) => number;
    readonly streamablesession_get_bot_time: (a: number) => number;
    readonly streamablesession_get_fov_slope_y: (a: number) => number;
    readonly streamablesession_get_game_controls: (a: number) => number;
    readonly streamablesession_get_jump_stats: (a: number, b: number) => number;
    readonly streamablesession_get_position: (a: number, b: number) => number;
    readonly streamablesession_get_run_time: (a: number, b: number, c: number, d: number) => void;
    readonly streamablesession_get_scale: (a: number) => number;
    readonly streamablesession_get_speed: (a: number, b: number) => number;
    readonly streamablesession_is_buffering: (a: number) => number;
    readonly streamablesession_is_run_finished: (a: number, b: number) => number;
    readonly streamablesession_is_run_in_progress: (a: number, b: number) => number;
    readonly streamablesession_new: (a: number, b: number) => number;
    readonly streamablesession_set_bot_time: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly streamablesession_set_paused: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly streamablesession_set_scale: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly surface_resize: (a: number, b: number, c: number, d: number) => void;
    readonly texturejob_take_data: (a: number, b: number) => void;
    readonly texturejob_texture_id: (a: number) => number;
    readonly transcode_texture: (a: number, b: number, c: number, d: number) => number;
    readonly transcodedtexture_coverage_alpha: (a: number) => number;
    readonly transcodedtexture_format: (a: number) => number;
    readonly transcodedtexture_height: (a: number) => number;
    readonly transcodedtexture_mip_level_count: (a: number) => number;
    readonly transcodedtexture_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
    readonly transcodedtexture_take_data: (a: number, b: number) => void;
    readonly transcodedtexture_texture_id: (a: number) => number;
    readonly transcodedtexture_width: (a: number) => number;
    readonly __wasm_bindgen_func_elem_2052: (a: number, b: number, c: number, d: any) => void;
    readonly __wasm_bindgen_func_elem_2052_197: (a: number, b: number, c: number, d: any) => void;
    readonly __wasm_bindgen_func_elem_2052_199: (a: number, b: number, c: number, d: any) => void;
    readonly __wasm_bindgen_func_elem_2052_200: (a: number, b: number, c: number, d: any) => void;
    readonly __wasm_bindgen_func_elem_3408: (a: number, b: number, c: number, d: any) => void;
    readonly __wasm_bindgen_func_elem_3425: (a: number, b: number, c: any, d: any) => void;
    readonly __wasm_bindgen_func_elem_2057: (a: number, b: number, c: any) => void;
    readonly __wasm_bindgen_func_elem_2057_198: (a: number, b: number, c: any) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export4: (a: number) => void;
    readonly __wbindgen_export5: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_export6: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export7: (a: number, b: number) => void;
    readonly __wbindgen_export8: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
