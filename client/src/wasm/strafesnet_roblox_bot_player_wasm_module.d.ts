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
    new_surface(canvas: HTMLCanvasElement): Surface;
    render_head(surface: Surface, map: StreamableMap, bot: StreamableBot, head: StreamableHead): void;
    render_session(surface: Surface, map: StreamableMap, bot: StreamableBot, session: StreamableSession): void;
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
     * Returns the next block to download in a reasonable order based on the
     * current camera view.  Do not lose track of this object, since it will
     * never be requested for download again unless cancelled.
     */
    next_block_session(bot: StreamableBot, session: StreamableSession): MapBlockRange | undefined;
    /**
     * Call this before rendering to promote streaming assets which are ready
     * to render onto the render queue.
     */
    promote_ready_assets(graphics: Graphics): void;
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
    advance_time(bot: StreamableBot, session_time: number): void;
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     */
    get_angles_yaw_delta(): number;
    get_bot_time(): number;
    get_fov_slope_y(): number;
    get_game_controls(): number;
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
    set_bot_time(bot: StreamableBot, session_time: number, bot_time: number): void;
    set_paused(bot: StreamableBot, session_time: number, paused: boolean): void;
    set_scale(bot: StreamableBot, session_time: number, scale: number): void;
}

export class Surface {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    resize(graphics: Graphics, width: number, height: number): void;
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
export function new_streamable_bot(downloader: BotDownloader, run_duration: number): Promise<StreamableBot>;

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
    readonly __wbg_get_range_end: (a: number) => number;
    readonly __wbg_get_range_start: (a: number) => number;
    readonly __wbg_get_vector3_x: (a: number) => number;
    readonly __wbg_get_vector3_y: (a: number) => number;
    readonly __wbg_get_vector3_z: (a: number) => number;
    readonly __wbg_graphics_free: (a: number, b: number) => void;
    readonly __wbg_graphicsandsurface_free: (a: number, b: number) => void;
    readonly __wbg_range_free: (a: number, b: number) => void;
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
    readonly graphics_new_surface: (a: number, b: number, c: number) => void;
    readonly graphics_render_head: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphics_render_session: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly graphicsandsurface_graphics: (a: number) => number;
    readonly graphicsandsurface_surface: (a: number) => number;
    readonly mapdownloader_download_map_block_range: (a: number, b: number) => number;
    readonly new_streamable_bot: (a: number, b: number) => number;
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
    readonly streamablemap_ingest: (a: number, b: number, c: number, d: number) => void;
    readonly streamablemap_next_block_session: (a: number, b: number, c: number) => number;
    readonly streamablemap_promote_ready_assets: (a: number, b: number) => void;
    readonly streamablesession_advance_time: (a: number, b: number, c: number) => void;
    readonly streamablesession_get_angles_yaw_delta: (a: number) => number;
    readonly streamablesession_get_bot_time: (a: number) => number;
    readonly streamablesession_get_fov_slope_y: (a: number) => number;
    readonly streamablesession_get_game_controls: (a: number) => number;
    readonly streamablesession_get_position: (a: number, b: number) => number;
    readonly streamablesession_get_run_time: (a: number, b: number, c: number, d: number) => void;
    readonly streamablesession_get_scale: (a: number) => number;
    readonly streamablesession_get_speed: (a: number, b: number) => number;
    readonly streamablesession_is_buffering: (a: number) => number;
    readonly streamablesession_is_run_finished: (a: number, b: number) => number;
    readonly streamablesession_is_run_in_progress: (a: number, b: number) => number;
    readonly streamablesession_new: (a: number, b: number) => number;
    readonly streamablesession_set_bot_time: (a: number, b: number, c: number, d: number) => void;
    readonly streamablesession_set_paused: (a: number, b: number, c: number, d: number) => void;
    readonly streamablesession_set_scale: (a: number, b: number, c: number, d: number) => void;
    readonly surface_resize: (a: number, b: number, c: number, d: number) => void;
    readonly downloadmapblockrangeerror_error: (a: number) => number;
    readonly downloadmapblockrangeerror_request: (a: number) => number;
    readonly __wbg_downloadmapblockrangeerror_free: (a: number, b: number) => void;
    readonly mapdownloader_new: (a: number, b: number) => number;
    readonly mapblockrange_range: (a: number) => number;
    readonly __wbg_mapblockrange_free: (a: number, b: number) => void;
    readonly __wbg_vector3_free: (a: number, b: number) => void;
    readonly __wbg_mapdownloader_free: (a: number, b: number) => void;
    readonly __wbg_mapblockdata_free: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_2354: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1149: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1149_2: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1149_3: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_2369: (a: number, b: number, c: number, d: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
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
