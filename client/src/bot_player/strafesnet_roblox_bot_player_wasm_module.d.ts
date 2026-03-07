/* tslint:disable */
/* eslint-disable */

export class CompleteBot {
    free(): void;
    [Symbol.dispose](): void;
    duration(): number;
    constructor(data: Uint8Array);
    run_duration(mode_id: number): number | undefined;
}

export class CompleteMap {
    free(): void;
    [Symbol.dispose](): void;
    constructor(data: Uint8Array);
}

/**
 * A timeline event that has not been processed yet.
 */
export class Event {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    time(): number;
    type_id(): number;
}

export class Graphics {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    change_map(map: CompleteMap): void;
    render(bot: CompleteBot, head: PlaybackHead, time: number): void;
    resize(width: number, height: number, fov_slope_x: number, fov_slope_y: number): void;
}

export class PlaybackHead {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Simple api: call advance_time and then graphics.render()
     */
    advance_time(bot: CompleteBot, time: number): void;
    /**
     * Returns an array of [pitch, yaw, roll] in radians.  Yaw is not restricted to any particular range.
     */
    get_angles(bot: CompleteBot, time: number): Float32Array;
    get_fov_slope_y(): number;
    get_game_controls(): number;
    get_head_time(time: number): number;
    get_run_time(bot: CompleteBot, time: number, mode_id: number): number | undefined;
    get_scale(): number;
    get_speed(bot: CompleteBot, time: number): number;
    is_run_finished(mode_id: number): boolean | undefined;
    is_run_in_progress(mode_id: number): boolean | undefined;
    constructor(bot: CompleteBot, time: number);
    /**
     * Advanced api: In a loop, call next_event and pass the result to process_event to advance the playback head.
     */
    next_event(bot: CompleteBot): Event | undefined;
    /**
     * Advanced api: In a loop, call next_event and pass the result to process_event to advance the playback head.
     */
    process_event(bot: CompleteBot, event: Event): void;
    /**
     * Set the playback head position to new_time.
     */
    set_head_time(bot: CompleteBot, time: number, new_time: number): void;
    set_paused(time: number, paused: boolean): void;
    set_scale(time: number, scale: number): void;
}

export function setup_graphics(canvas: HTMLCanvasElement): Promise<Graphics>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_completebot_free: (a: number, b: number) => void;
    readonly __wbg_completemap_free: (a: number, b: number) => void;
    readonly __wbg_event_free: (a: number, b: number) => void;
    readonly __wbg_graphics_free: (a: number, b: number) => void;
    readonly __wbg_playbackhead_free: (a: number, b: number) => void;
    readonly completebot_duration: (a: number) => number;
    readonly completebot_new: (a: number, b: number, c: number) => void;
    readonly completebot_run_duration: (a: number, b: number, c: number) => void;
    readonly completemap_new: (a: number, b: number, c: number) => void;
    readonly event_time: (a: number) => number;
    readonly event_type_id: (a: number) => number;
    readonly graphics_change_map: (a: number, b: number) => void;
    readonly graphics_render: (a: number, b: number, c: number, d: number) => void;
    readonly graphics_resize: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly playbackhead_advance_time: (a: number, b: number, c: number) => void;
    readonly playbackhead_get_angles: (a: number, b: number, c: number, d: number) => void;
    readonly playbackhead_get_fov_slope_y: (a: number) => number;
    readonly playbackhead_get_game_controls: (a: number) => number;
    readonly playbackhead_get_head_time: (a: number, b: number) => number;
    readonly playbackhead_get_run_time: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly playbackhead_get_scale: (a: number) => number;
    readonly playbackhead_get_speed: (a: number, b: number, c: number) => number;
    readonly playbackhead_is_run_finished: (a: number, b: number) => number;
    readonly playbackhead_is_run_in_progress: (a: number, b: number) => number;
    readonly playbackhead_new: (a: number, b: number) => number;
    readonly playbackhead_next_event: (a: number, b: number) => number;
    readonly playbackhead_process_event: (a: number, b: number, c: number) => void;
    readonly playbackhead_set_head_time: (a: number, b: number, c: number, d: number) => void;
    readonly playbackhead_set_paused: (a: number, b: number, c: number) => void;
    readonly playbackhead_set_scale: (a: number, b: number, c: number) => void;
    readonly setup_graphics: (a: number) => number;
    readonly __wasm_bindgen_func_elem_1221: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_637: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_1222: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_1642: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_638: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
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
