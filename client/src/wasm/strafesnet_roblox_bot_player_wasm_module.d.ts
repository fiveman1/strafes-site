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

export class CompleteBot {
    free(): void;
    [Symbol.dispose](): void;
    duration(): number;
    constructor(data: Uint8Array);
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

export class Graphics {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The last render_session's camera as a render-snfm view, as one line, or undefined before one.
     */
    camera_stats(): string | undefined;
    /**
     * The adapter, enabled features and chosen formats, for bug reports from devices you can't test on.
     */
    debug_info(): string;
    /**
     * What the last rendered frame drew after skipping what was out of view, its lights and its shadows, as three lines.
     */
    frame_stats(): string;
    /**
     * The average GPU time of the frames rendered since the last call, as one line,
     * or undefined on devices without timestamp queries (WebGL) or before any frame was timed.
     */
    gpu_stats(): string | undefined;
    /**
     * How far from the camera pixels add up local lights one by one, with highlights.
     * Farther pixels read the light volume, which costs the same however many lights overlap.
     * 0 lights everything from the volume, Infinity never uses it.
     */
    light_distance(): number;
    new_surface(canvas: HTMLCanvasElement): Surface;
    render_head(surface: Surface, map: StreamableMap, bot: StreamableBot, head: StreamableHead): void;
    render_session(surface: Surface, map: StreamableMap, bot: StreamableBot, session: StreamableSession): void;
    /**
     * Use a preset's settings, replacing any set one by one like the light distance. The default is Medium.
     * Medium and High use 4x anti-aliasing; Low skips it, material normal maps and sky reflections, and blurs the glow more coarsely.
     * Render scale is up to the page: size the canvas smaller and let the browser stretch it.
     */
    set_graphics_quality(quality: GraphicsQuality): void;
    set_light_distance(light_distance: number): void;
    /**
     * False with WebGL, which can only draw to the canvas passed to setup_graphics.
     * Drawing extra surfaces is technically possible but performs much slower on WebGL.
     */
    supports_multiple_surfaces(): boolean;
    /**
     * GPU errors since the last call, oldest first.
     * WebGPU reports validation errors (like a shader the browser can't compile) and device loss
     * without throwing, and the frame just stays black, so poll this to show them.
     */
    take_errors(): string[];
    /**
     * The average GPU time per frame of the frames rendered since the last call, in milliseconds,
     * or undefined on devices without timestamp queries (WebGL) or before any frame was timed.
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
     * Clear all blocks marked as "currently downloading".
     * This may cause blocks to be downloaded multiple times.
     */
    clear_downloading(): void;
    count_downloading(): number;
    duration(): number;
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
     * This function may return different values depending on streaming state.
     */
    run_duration(mode_id: number): number;
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
    cancel(arg0: MapBlockRange): void;
    /**
     * Clear all blocks marked as "currently downloading".
     * This may cause blocks to be downloaded multiple times.
     */
    clear_downloading(): void;
    count_downloading(): number;
    ingest(graphics: Graphics, arg1: MapBlockData): void;
    /**
     * Like ingest, but returns the group's texture files instead of transcoding them, which takes most of the time.
     * Transcode each with transcode_texture (in a web worker) and pass the result to upload_texture.
     * Playback buffers at a spot until its textures are uploaded.
     */
    ingest_deferred(arg0: MapBlockData): TextureJob[];
    next_block_head_throttled(bot: StreamableBot, head: StreamableHead, surface: Surface): MapBlockRange | undefined;
    /**
     * Returns the next block to download in a reasonable order based on the
     * current camera view.  Do not lose track of this object, since it will
     * never be requested for download again unless cancelled.
     */
    next_block_session(bot: StreamableBot, session: StreamableSession, surface: Surface): MapBlockRange | undefined;
    /**
     * Call this before rendering to promote streaming assets which are ready
     * to render onto the render queue.
     */
    promote_ready_assets(graphics: Graphics): void;
    /**
     * Upload a texture from transcode_texture. Do this before promote_ready_assets.
     */
    upload_texture(graphics: Graphics, texture: TranscodedTexture): void;
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
    constructor(texture_id: number, width: number, height: number, mip_level_count: number, format: number, data: Uint8Array);
    /**
     * Every mip level, largest first. Moves the data out, so it can only be taken once.
     */
    take_data(): Uint8Array;
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
export function transcode_texture(texture_id: number, data: Uint8Array, texture_support: number): TranscodedTexture;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_botblockdata_free: (a: number, b: number) => void;
    readonly __wbg_botblockrange_free: (a: number, b: number) => void;
    readonly __wbg_botdownloader_free: (a: number, b: number) => void;
    readonly __wbg_bvh_free: (a: number, b: number) => void;
    readonly __wbg_completebot_free: (a: number, b: number) => void;
    readonly __wbg_completehead_free: (a: number, b: number) => void;
    readonly __wbg_downloadbotblockrangeerror_free: (a: number, b: number) => void;
    readonly __wbg_downloadmapblockrangeerror_free: (a: number, b: number) => void;
    readonly __wbg_get_jumpstats_efficiency: (a: number) => number;
    readonly __wbg_get_jumpstats_gain: (a: number) => number;
    readonly __wbg_get_jumpstats_number: (a: number) => number;
    readonly __wbg_get_jumpstats_speed: (a: number) => number;
    readonly __wbg_get_jumpstats_strafe_rate: (a: number) => number;
    readonly __wbg_get_jumpstats_strafes: (a: number) => number;
    readonly __wbg_get_range_end: (a: number) => number;
    readonly __wbg_get_range_start: (a: number) => number;
    readonly __wbg_get_vector3_x: (a: number) => number;
    readonly __wbg_get_vector3_y: (a: number) => number;
    readonly __wbg_get_vector3_z: (a: number) => number;
    readonly __wbg_graphics_free: (a: number, b: number) => void;
    readonly __wbg_graphicsandsurface_free: (a: number, b: number) => void;
    readonly __wbg_jumpstats_free: (a: number, b: number) => void;
    readonly __wbg_mapblockdata_free: (a: number, b: number) => void;
    readonly __wbg_mapblockrange_free: (a: number, b: number) => void;
    readonly __wbg_mapdownloader_free: (a: number, b: number) => void;
    readonly __wbg_range_free: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_efficiency: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_gain: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_number: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_speed: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_strafe_rate: (a: number, b: number) => void;
    readonly __wbg_set_jumpstats_strafes: (a: number, b: number) => void;
    readonly __wbg_set_range_end: (a: number, b: number) => void;
    readonly __wbg_set_range_start: (a: number, b: number) => void;
    readonly __wbg_set_vector3_x: (a: number, b: number) => void;
    readonly __wbg_set_vector3_y: (a: number, b: number) => void;
    readonly __wbg_set_vector3_z: (a: number, b: number) => void;
    readonly __wbg_streamablebot_free: (a: number, b: number) => void;
    readonly __wbg_streamablehead_free: (a: number, b: number) => void;
    readonly __wbg_streamablemap_free: (a: number, b: number) => void;
    readonly __wbg_streamablesession_free: (a: number, b: number) => void;
    readonly __wbg_surface_free: (a: number, b: number) => void;
    readonly __wbg_texturejob_free: (a: number, b: number) => void;
    readonly __wbg_transcodedtexture_free: (a: number, b: number) => void;
    readonly __wbg_vector3_free: (a: number, b: number) => void;
    readonly botblockrange_range: (a: number) => number;
    readonly botdownloader_download_bot_block_range: (a: number, b: number) => number;
    readonly botdownloader_get_complete_bot: (a: number) => number;
    readonly botdownloader_new: (a: number, b: number) => number;
    readonly bvh_closest_time_to_point: (a: number, b: number, c: number, d: number) => void;
    readonly bvh_new: (a: number) => number;
    readonly completebot_duration: (a: number) => number;
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
    readonly downloadbotblockrangeerror_error: (a: number) => number;
    readonly downloadbotblockrangeerror_request: (a: number) => number;
    readonly downloadmapblockrangeerror_error: (a: number) => number;
    readonly downloadmapblockrangeerror_request: (a: number) => number;
    readonly graphics_camera_stats: (a: number, b: number) => void;
    readonly graphics_debug_info: (a: number, b: number) => void;
    readonly graphics_frame_stats: (a: number, b: number) => void;
    readonly graphics_gpu_stats: (a: number, b: number) => void;
    readonly graphics_light_distance: (a: number) => number;
    readonly graphics_new_surface: (a: number, b: number, c: number) => void;
    readonly graphics_render_head: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphics_render_session: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphics_set_graphics_quality: (a: number, b: number) => void;
    readonly graphics_set_light_distance: (a: number, b: number) => void;
    readonly graphics_supports_multiple_surfaces: (a: number) => number;
    readonly graphics_take_errors: (a: number, b: number) => void;
    readonly graphics_take_gpu_frame_ms: (a: number, b: number) => void;
    readonly graphics_texture_support: (a: number) => number;
    readonly graphicsandsurface_graphics: (a: number) => number;
    readonly graphicsandsurface_surface: (a: number) => number;
    readonly mapblockrange_range: (a: number) => number;
    readonly mapdownloader_download_map_block_range: (a: number, b: number) => number;
    readonly mapdownloader_new: (a: number, b: number) => number;
    readonly new_streamable_bot: (a: number, b: number, c: number) => number;
    readonly new_streamable_map: (a: number, b: number, c: number) => number;
    readonly setup_graphics: (a: number) => number;
    readonly streamablebot_cancel: (a: number, b: number) => void;
    readonly streamablebot_clear_downloading: (a: number) => void;
    readonly streamablebot_count_downloading: (a: number) => number;
    readonly streamablebot_duration: (a: number) => number;
    readonly streamablebot_ingest: (a: number, b: number, c: number) => void;
    readonly streamablebot_next_block_at_time: (a: number, b: number) => number;
    readonly streamablebot_next_block_eager: (a: number, b: number, c: number) => number;
    readonly streamablebot_next_block_throttled: (a: number, b: number, c: number) => number;
    readonly streamablebot_run_duration: (a: number, b: number, c: number) => void;
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
    readonly streamablemap_cancel: (a: number, b: number) => void;
    readonly streamablemap_clear_downloading: (a: number) => void;
    readonly streamablemap_count_downloading: (a: number) => number;
    readonly streamablemap_ingest: (a: number, b: number, c: number) => void;
    readonly streamablemap_ingest_deferred: (a: number, b: number, c: number) => void;
    readonly streamablemap_next_block_head_throttled: (a: number, b: number, c: number, d: number) => number;
    readonly streamablemap_next_block_session: (a: number, b: number, c: number, d: number) => number;
    readonly streamablemap_promote_ready_assets: (a: number, b: number) => void;
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
    readonly transcodedtexture_format: (a: number) => number;
    readonly transcodedtexture_height: (a: number) => number;
    readonly transcodedtexture_mip_level_count: (a: number) => number;
    readonly transcodedtexture_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
    readonly transcodedtexture_take_data: (a: number, b: number) => void;
    readonly transcodedtexture_texture_id: (a: number) => number;
    readonly transcodedtexture_width: (a: number) => number;
    readonly __wasm_bindgen_func_elem_1990: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1990_128: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1990_129: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_8047: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_8068: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1994: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_1994_127: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export5: (a: number, b: number, c: number) => void;
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
