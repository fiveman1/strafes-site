/* @ts-self-types="./strafesnet_roblox_bot_player_wasm_module.d.ts" */

/**
 * A completed download request.
 */
export class BotBlockData {
    static __wrap(ptr) {
        const obj = Object.create(BotBlockData.prototype);
        obj.__wbg_ptr = ptr;
        BotBlockDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BotBlockDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_botblockdata_free(ptr, 0);
    }
}
if (Symbol.dispose) BotBlockData.prototype[Symbol.dispose] = BotBlockData.prototype.free;

/**
 * A range of data. StreamableBot considers this block to be
 * "currently downloading" so it must be either downloaded or cancelled.
 */
export class BotBlockRange {
    static __wrap(ptr) {
        const obj = Object.create(BotBlockRange.prototype);
        obj.__wbg_ptr = ptr;
        BotBlockRangeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BotBlockRangeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_botblockrange_free(ptr, 0);
    }
    /**
     * @returns {Range}
     */
    range() {
        const ret = wasm.botblockrange_range(this.__wbg_ptr);
        return Range.__wrap(ret);
    }
}
if (Symbol.dispose) BotBlockRange.prototype[Symbol.dispose] = BotBlockRange.prototype.free;

export class BotDownloader {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BotDownloaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_botdownloader_free(ptr, 0);
    }
    /**
     * @param {BotBlockRange} arg0
     * @returns {Promise<BotBlockData>}
     */
    download_bot_block_range(arg0) {
        _assertClass(arg0, BotBlockRange);
        var ptr0 = arg0.__destroy_into_raw();
        const ret = wasm.botdownloader_download_bot_block_range(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @returns {Promise<CompleteBot>}
     */
    get_complete_bot() {
        const ret = wasm.botdownloader_get_complete_bot(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string} url
     */
    constructor(url) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.botdownloader_new(ptr0, len0);
        this.__wbg_ptr = ret;
        BotDownloaderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) BotDownloader.prototype[Symbol.dispose] = BotDownloader.prototype.free;

export class Bvh {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BvhFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_bvh_free(ptr, 0);
    }
    /**
     * @param {CompleteBot} bot
     * @param {Vector3} point
     * @returns {number | undefined}
     */
    closest_time_to_point(bot, point) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(bot, CompleteBot);
            _assertClass(point, Vector3);
            var ptr0 = point.__destroy_into_raw();
            wasm.bvh_closest_time_to_point(retptr, this.__wbg_ptr, bot.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {CompleteBot} bot
     */
    constructor(bot) {
        _assertClass(bot, CompleteBot);
        const ret = wasm.bvh_new(bot.__wbg_ptr);
        this.__wbg_ptr = ret;
        BvhFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) Bvh.prototype[Symbol.dispose] = Bvh.prototype.free;

/**
 * When a run first reached a stage by touching a Teleport part, or finished.
 */
export class Checkpoint {
    static __wrap(ptr) {
        const obj = Object.create(Checkpoint.prototype);
        obj.__wbg_ptr = ptr;
        CheckpointFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CheckpointFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_checkpoint_free(ptr, 0);
    }
    /**
     * The run timer, in seconds
     * @returns {number}
     */
    get run_time() {
        const ret = wasm.__wbg_get_checkpoint_run_time(this.__wbg_ptr);
        return ret;
    }
    /**
     * Horizontal speed when it touched the Teleport or finished
     * @returns {number}
     */
    get speed() {
        const ret = wasm.__wbg_get_checkpoint_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * Undefined for the finish
     * @returns {number | undefined}
     */
    get stage() {
        const ret = wasm.__wbg_get_checkpoint_stage(this.__wbg_ptr);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Seconds since the replay's start
     * @returns {number}
     */
    get time() {
        const ret = wasm.__wbg_get_checkpoint_time(this.__wbg_ptr);
        return ret;
    }
    /**
     * The run timer, in seconds
     * @param {number} arg0
     */
    set run_time(arg0) {
        wasm.__wbg_set_checkpoint_run_time(this.__wbg_ptr, arg0);
    }
    /**
     * Horizontal speed when it touched the Teleport or finished
     * @param {number} arg0
     */
    set speed(arg0) {
        wasm.__wbg_set_checkpoint_speed(this.__wbg_ptr, arg0);
    }
    /**
     * Undefined for the finish
     * @param {number | null} [arg0]
     */
    set stage(arg0) {
        wasm.__wbg_set_checkpoint_stage(this.__wbg_ptr, isLikeNone(arg0) ? Number.MAX_SAFE_INTEGER : (arg0) >>> 0);
    }
    /**
     * Seconds since the replay's start
     * @param {number} arg0
     */
    set time(arg0) {
        wasm.__wbg_set_checkpoint_time(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Checkpoint.prototype[Symbol.dispose] = Checkpoint.prototype.free;

export class CompleteBot {
    static __wrap(ptr) {
        const obj = Object.create(CompleteBot.prototype);
        obj.__wbg_ptr = ptr;
        CompleteBotFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CompleteBotFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_completebot_free(ptr, 0);
    }
    /**
     * The run's checkpoints at the map's Teleports. Needs the map's regions with Teleports.
     * @param {StreamableMap} map
     * @returns {Checkpoint[]}
     */
    checkpoints(map) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(map, StreamableMap);
            wasm.completebot_checkpoints(retptr, this.__wbg_ptr, map.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    duration() {
        const ret = wasm.completebot_duration(this.__wbg_ptr);
        return ret;
    }
    /**
     * When the run finished: its Finish event, or the replay's end without one.
     * @returns {Checkpoint | undefined}
     */
    finish() {
        const ret = wasm.completebot_finish(this.__wbg_ptr);
        return ret === 0 ? undefined : Checkpoint.__wrap(ret);
    }
    /**
     * @param {Uint8Array | number[]} data
     */
    constructor(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.completebot_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeFromExternrefTable0(r1);
            }
            this.__wbg_ptr = r0;
            CompleteBotFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} mode_id
     * @returns {number}
     */
    run_duration(mode_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.completebot_run_duration(retptr, this.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getFloat64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeFromExternrefTable0(r2);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) CompleteBot.prototype[Symbol.dispose] = CompleteBot.prototype.free;

/**
 * A handle that tracks internal state for a bot replay.
 * Use StreamableSession for an object with looping and play/pause controls.
 * All timestamps are "BotTime", which starts at 0 at the beginning of the
 * replay.  Changing any setting also implicitly advances
 * the session machinery, which is why `bot:&CompleteBot` and `time:f64`
 * is required.
 */
export class CompleteHead {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        CompleteHeadFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_completehead_free(ptr, 0);
    }
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     * @returns {number}
     */
    get_angles_yaw_delta() {
        const ret = wasm.completehead_get_angles_yaw_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_fov_slope_y() {
        const ret = wasm.completehead_get_fov_slope_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_game_controls() {
        const ret = wasm.completehead_get_game_controls(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {CompleteBot} bot
     * @returns {Vector3}
     */
    get_position(bot) {
        _assertClass(bot, CompleteBot);
        const ret = wasm.completehead_get_position(this.__wbg_ptr, bot.__wbg_ptr);
        return Vector3.__wrap(ret);
    }
    /**
     * @param {CompleteBot} bot
     * @param {number} mode_id
     * @returns {number | undefined}
     */
    get_run_time(bot, mode_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(bot, CompleteBot);
            wasm.completehead_get_run_time(retptr, this.__wbg_ptr, bot.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {CompleteBot} bot
     * @returns {number}
     */
    get_speed(bot) {
        _assertClass(bot, CompleteBot);
        const ret = wasm.completehead_get_speed(this.__wbg_ptr, bot.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} mode_id
     * @returns {boolean | undefined}
     */
    is_run_finished(mode_id) {
        const ret = wasm.completehead_is_run_finished(this.__wbg_ptr, mode_id);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * @param {number} mode_id
     * @returns {boolean | undefined}
     */
    is_run_in_progress(mode_id) {
        const ret = wasm.completehead_is_run_in_progress(this.__wbg_ptr, mode_id);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * @param {CompleteBot} bot
     * @param {number} bot_time
     */
    constructor(bot, bot_time) {
        _assertClass(bot, CompleteBot);
        const ret = wasm.completehead_new(bot.__wbg_ptr, bot_time);
        this.__wbg_ptr = ret;
        CompleteHeadFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the playback head position to bot_time.
     * @param {CompleteBot} bot
     * @param {number} bot_time
     */
    set_time(bot, bot_time) {
        _assertClass(bot, CompleteBot);
        wasm.completehead_set_time(this.__wbg_ptr, bot.__wbg_ptr, bot_time);
    }
}
if (Symbol.dispose) CompleteHead.prototype[Symbol.dispose] = CompleteHead.prototype.free;

/**
 * The slow parts of a downloaded group, which StreamableMap.ingest_deferred leaves for the caller.
 */
export class DeferredJobs {
    static __wrap(ptr) {
        const obj = Object.create(DeferredJobs.prototype);
        obj.__wbg_ptr = ptr;
        DeferredJobsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DeferredJobsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_deferredjobs_free(ptr, 0);
    }
    /**
     * The group's mesh and region blocks in one buffer, empty without any. Pass them to ModelPreparer.prepare, in the
     * order the groups were ingested. Moves the data out, so it can only be taken once.
     * @returns {Uint8Array}
     */
    take_geometry() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.deferredjobs_take_geometry(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Moves the jobs out, so they can only be taken once.
     * @returns {LightmapChunkJob[]}
     */
    take_lightmap_chunks() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.deferredjobs_take_lightmap_chunks(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Moves the jobs out, so they can only be taken once.
     * @returns {TextureJob[]}
     */
    take_textures() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.deferredjobs_take_textures(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) DeferredJobs.prototype[Symbol.dispose] = DeferredJobs.prototype.free;

export class DownloadBotBlockRangeError {
    static __wrap(ptr) {
        const obj = Object.create(DownloadBotBlockRangeError.prototype);
        obj.__wbg_ptr = ptr;
        DownloadBotBlockRangeErrorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DownloadBotBlockRangeErrorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_downloadbotblockrangeerror_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    error() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.downloadbotblockrangeerror_error(ptr);
        return ret;
    }
    /**
     * @returns {BotBlockRange | undefined}
     */
    request() {
        const ret = wasm.downloadbotblockrangeerror_request(this.__wbg_ptr);
        return ret === 0 ? undefined : BotBlockRange.__wrap(ret);
    }
}
if (Symbol.dispose) DownloadBotBlockRangeError.prototype[Symbol.dispose] = DownloadBotBlockRangeError.prototype.free;

export class DownloadMapBlockRangeError {
    static __wrap(ptr) {
        const obj = Object.create(DownloadMapBlockRangeError.prototype);
        obj.__wbg_ptr = ptr;
        DownloadMapBlockRangeErrorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DownloadMapBlockRangeErrorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_downloadmapblockrangeerror_free(ptr, 0);
    }
    /**
     * @returns {any}
     */
    error() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.downloadmapblockrangeerror_error(ptr);
        return ret;
    }
    /**
     * @returns {MapBlockRange | undefined}
     */
    request() {
        const ret = wasm.downloadmapblockrangeerror_request(this.__wbg_ptr);
        return ret === 0 ? undefined : MapBlockRange.__wrap(ret);
    }
}
if (Symbol.dispose) DownloadMapBlockRangeError.prototype[Symbol.dispose] = DownloadMapBlockRangeError.prototype.free;

/**
 * Frames averaged into one for motion blur, see Graphics.add_video_sample.
 */
export class FrameBlend {
    static __wrap(ptr) {
        const obj = Object.create(FrameBlend.prototype);
        obj.__wbg_ptr = ptr;
        FrameBlendFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrameBlendFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frameblend_free(ptr, 0);
    }
}
if (Symbol.dispose) FrameBlend.prototype[Symbol.dispose] = FrameBlend.prototype.free;

export class Graphics {
    static __wrap(ptr) {
        const obj = Object.create(Graphics.prototype);
        obj.__wbg_ptr = ptr;
        GraphicsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GraphicsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graphics_free(ptr, 0);
    }
    /**
     * Like render_video_frame, but adds the frame into the blend at this weight instead of showing it, for motion
     * blur: a video frame is several of these a moment apart, then show_blended_frame. `first` starts a new one.
     * @param {Surface} surface
     * @param {FrameBlend} blend
     * @param {StreamableMap} map
     * @param {StreamableBot} bot
     * @param {StreamableSession} session
     * @param {number} weight
     * @param {boolean} first
     */
    add_video_sample(surface, blend, map, bot, session, weight, first) {
        _assertClass(surface, Surface);
        _assertClass(blend, FrameBlend);
        _assertClass(map, StreamableMap);
        _assertClass(bot, StreamableBot);
        _assertClass(session, StreamableSession);
        wasm.graphics_add_video_sample(this.__wbg_ptr, surface.__wbg_ptr, blend.__wbg_ptr, map.__wbg_ptr, bot.__wbg_ptr, session.__wbg_ptr, weight, first);
    }
    /**
     * The last render_session's camera as a render-snfm view, as one line, or undefined before one.
     * @returns {string | undefined}
     */
    camera_stats() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_camera_stats(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1);
                wasm.__wbindgen_export3(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * The adapter, enabled features and chosen formats, for bug reports from devices you can't test on.
     * @returns {string}
     */
    debug_info() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_debug_info(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * What the last rendered frame drew after skipping what was out of view, its lights and its shadows, as three lines,
     * and a fourth for the baked occlusion lists on maps with them.
     * @returns {string}
     */
    frame_stats() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_frame_stats(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export3(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The average GPU time of the frames rendered since the last call, as one line,
     * or undefined on devices without timestamp queries or before any frame was timed.
     * @returns {string | undefined}
     */
    gpu_stats() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_gpu_stats(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1);
                wasm.__wbindgen_export3(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * How far from the camera pixels add up local lights one by one, with highlights.
     * Farther pixels read the lights' light baked into the lightmap, which costs the same however many lights overlap.
     * 0 lights everything from the lightmap, Infinity never uses it.
     * @returns {number}
     */
    light_distance() {
        const ret = wasm.graphics_light_distance(this.__wbg_ptr);
        return ret;
    }
    /**
     * A FrameBlend the size of this surface, for add_video_sample.
     * @param {Surface} surface
     * @returns {FrameBlend}
     */
    new_frame_blend(surface) {
        _assertClass(surface, Surface);
        const ret = wasm.graphics_new_frame_blend(this.__wbg_ptr, surface.__wbg_ptr);
        return FrameBlend.__wrap(ret);
    }
    /**
     * @param {HTMLCanvasElement} canvas
     * @returns {Surface}
     */
    new_surface(canvas) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_new_surface(retptr, this.__wbg_ptr, canvas);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeFromExternrefTable0(r1);
            }
            return Surface.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {Surface} surface
     * @param {StreamableMap} map
     * @param {StreamableBot} bot
     * @param {StreamableHead} head
     */
    render_head(surface, map, bot, head) {
        _assertClass(surface, Surface);
        _assertClass(map, StreamableMap);
        _assertClass(bot, StreamableBot);
        _assertClass(head, StreamableHead);
        wasm.graphics_render_head(this.__wbg_ptr, surface.__wbg_ptr, map.__wbg_ptr, bot.__wbg_ptr, head.__wbg_ptr);
    }
    /**
     * @param {Surface} surface
     * @param {StreamableMap} map
     * @param {StreamableBot} bot
     * @param {StreamableSession} session
     */
    render_session(surface, map, bot, session) {
        _assertClass(surface, Surface);
        _assertClass(map, StreamableMap);
        _assertClass(bot, StreamableBot);
        _assertClass(session, StreamableSession);
        wasm.graphics_render_session(this.__wbg_ptr, surface.__wbg_ptr, map.__wbg_ptr, bot.__wbg_ptr, session.__wbg_ptr);
    }
    /**
     * Like render_session, for recording a video once the whole map is loaded (StreamableMap.is_loaded), see
     * with_video_settings. The debug stats keep the last render_session's camera.
     * @param {Surface} surface
     * @param {StreamableMap} map
     * @param {StreamableBot} bot
     * @param {StreamableSession} session
     */
    render_video_frame(surface, map, bot, session) {
        _assertClass(surface, Surface);
        _assertClass(map, StreamableMap);
        _assertClass(bot, StreamableBot);
        _assertClass(session, StreamableSession);
        wasm.graphics_render_video_frame(this.__wbg_ptr, surface.__wbg_ptr, map.__wbg_ptr, bot.__wbg_ptr, session.__wbg_ptr);
    }
    /**
     * Whether see-through textures like leaves are drawn as anti-aliased coverage instead of blended, on presets
     * with anti-aliasing. On by default.
     * @param {boolean} alpha_to_coverage
     */
    set_alpha_to_coverage(alpha_to_coverage) {
        wasm.graphics_set_alpha_to_coverage(this.__wbg_ptr, alpha_to_coverage);
    }
    /**
     * How much of the map's baked bounce light surfaces get, 1 as baked, 0 for none.
     * set_graphics_quality resets it to 1.
     * @param {number} bounce_light
     */
    set_bounce_light(bounce_light) {
        wasm.graphics_set_bounce_light(this.__wbg_ptr, bounce_light);
    }
    /**
     * Use a preset's settings, replacing any set one by one like the light distance. The default is Medium.
     * Only High uses 4x anti-aliasing, darkens corners with ambient occlusion and has water mirror what's on screen.
     * Low also skips sky reflections, Glass's bumps, lighting pixels by local lights one by one and see-through
     * shadows, softens shadow edges and slanted textures less, and blurs the glow more coarsely.
     * Render scale is up to the page: size the canvas smaller and let the browser stretch it.
     * @param {GraphicsQuality} quality
     */
    set_graphics_quality(quality) {
        wasm.graphics_set_graphics_quality(this.__wbg_ptr, quality);
    }
    /**
     * @param {number} light_distance
     */
    set_light_distance(light_distance) {
        wasm.graphics_set_light_distance(this.__wbg_ptr, light_distance);
    }
    /**
     * How much the sky a surface sees picks between the map's indoor and outdoor ambient, 1 as baked, 0 lights
     * every surface as though open to the sky.
     * @param {number} sky_occlusion
     */
    set_sky_occlusion(sky_occlusion) {
        wasm.graphics_set_sky_occlusion(this.__wbg_ptr, sky_occlusion);
    }
    /**
     * Shows the frames added to the blend on the surface's canvas.
     * @param {Surface} surface
     * @param {FrameBlend} blend
     */
    show_blended_frame(surface, blend) {
        _assertClass(surface, Surface);
        _assertClass(blend, FrameBlend);
        wasm.graphics_show_blended_frame(this.__wbg_ptr, surface.__wbg_ptr, blend.__wbg_ptr);
    }
    /**
     * GPU errors since the last call, oldest first.
     * WebGPU reports validation errors (like a shader the browser can't compile) and device loss
     * without throwing, and the frame just stays black, so poll this to show them.
     * @returns {string[]}
     */
    take_errors() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_take_errors(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * The average GPU time per frame of the frames rendered since the last call, in milliseconds,
     * or undefined on devices without timestamp queries or before any frame was timed.
     * Counted separately from gpu_stats, so both can be read.
     * @returns {number | undefined}
     */
    take_gpu_frame_ms() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.graphics_take_gpu_frame_ms(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Which compressed texture formats this device supports, for transcode_texture in a web worker.
     * @returns {number}
     */
    texture_support() {
        const ret = wasm.graphics_texture_support(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) Graphics.prototype[Symbol.dispose] = Graphics.prototype.free;

/**
 * Contains graphics and surface.  Call graphics() and surface() to get the
 * inner objects.  This is a silly api to make sure the bindgen code has
 * proper type inference.
 */
export class GraphicsAndSurface {
    static __wrap(ptr) {
        const obj = Object.create(GraphicsAndSurface.prototype);
        obj.__wbg_ptr = ptr;
        GraphicsAndSurfaceFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GraphicsAndSurfaceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_graphicsandsurface_free(ptr, 0);
    }
    /**
     * @returns {Graphics | undefined}
     */
    graphics() {
        const ret = wasm.graphicsandsurface_graphics(this.__wbg_ptr);
        return ret === 0 ? undefined : Graphics.__wrap(ret);
    }
    /**
     * @returns {Surface | undefined}
     */
    surface() {
        const ret = wasm.graphicsandsurface_surface(this.__wbg_ptr);
        return ret === 0 ? undefined : Surface.__wrap(ret);
    }
}
if (Symbol.dispose) GraphicsAndSurface.prototype[Symbol.dispose] = GraphicsAndSurface.prototype.free;

/**
 * Graphics presets, for devices from phones to fast desktops.
 * @enum {0 | 1 | 2}
 */
export const GraphicsQuality = Object.freeze({
    Low: 0, "0": "Low",
    Medium: 1, "1": "Medium",
    High: 2, "2": "High",
});

/**
 * Jump HUD stats for the most recent jump.  Percentages are fractions, 1.0 is optimal.
 */
export class JumpStats {
    static __wrap(ptr) {
        const obj = Object.create(JumpStats.prototype);
        obj.__wbg_ptr = ptr;
        JumpStatsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        JumpStatsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_jumpstats_free(ptr, 0);
    }
    /**
     * Mean speed gain relative to optimal, undefined for the first jump.
     * @returns {number | undefined}
     */
    get efficiency() {
        const ret = wasm.__wbg_get_jumpstats_efficiency(this.__wbg_ptr);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Speed gained since the previous jump, undefined for the first jump.
     * @returns {number | undefined}
     */
    get gain() {
        const ret = wasm.__wbg_get_jumpstats_gain(this.__wbg_ptr);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Jump number in the current chain, undefined while earlier parts of the replay are still downloading.
     * @returns {number | undefined}
     */
    get number() {
        const ret = wasm.__wbg_get_jumpstats_number(this.__wbg_ptr);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Horizontal speed on the jump tick.
     * @returns {number}
     */
    get speed() {
        const ret = wasm.__wbg_get_jumpstats_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * Mean strafe rate relative to optimal, undefined for the first jump.
     * @returns {number | undefined}
     */
    get strafe_rate() {
        const ret = wasm.__wbg_get_jumpstats_strafe_rate(this.__wbg_ptr);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Strafes since the previous jump, undefined while still downloading.
     * @returns {number | undefined}
     */
    get strafes() {
        const ret = wasm.__wbg_get_jumpstats_strafes(this.__wbg_ptr);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Mean speed gain relative to optimal, undefined for the first jump.
     * @param {number | null} [arg0]
     */
    set efficiency(arg0) {
        wasm.__wbg_set_jumpstats_efficiency(this.__wbg_ptr, isLikeNone(arg0) ? Number.MAX_SAFE_INTEGER : Math.fround(arg0));
    }
    /**
     * Speed gained since the previous jump, undefined for the first jump.
     * @param {number | null} [arg0]
     */
    set gain(arg0) {
        wasm.__wbg_set_jumpstats_gain(this.__wbg_ptr, isLikeNone(arg0) ? Number.MAX_SAFE_INTEGER : Math.fround(arg0));
    }
    /**
     * Jump number in the current chain, undefined while earlier parts of the replay are still downloading.
     * @param {number | null} [arg0]
     */
    set number(arg0) {
        wasm.__wbg_set_jumpstats_number(this.__wbg_ptr, isLikeNone(arg0) ? Number.MAX_SAFE_INTEGER : (arg0) >>> 0);
    }
    /**
     * Horizontal speed on the jump tick.
     * @param {number} arg0
     */
    set speed(arg0) {
        wasm.__wbg_set_jumpstats_speed(this.__wbg_ptr, arg0);
    }
    /**
     * Mean strafe rate relative to optimal, undefined for the first jump.
     * @param {number | null} [arg0]
     */
    set strafe_rate(arg0) {
        wasm.__wbg_set_jumpstats_strafe_rate(this.__wbg_ptr, isLikeNone(arg0) ? Number.MAX_SAFE_INTEGER : Math.fround(arg0));
    }
    /**
     * Strafes since the previous jump, undefined while still downloading.
     * @param {number | null} [arg0]
     */
    set strafes(arg0) {
        wasm.__wbg_set_jumpstats_strafes(this.__wbg_ptr, isLikeNone(arg0) ? Number.MAX_SAFE_INTEGER : (arg0) >>> 0);
    }
}
if (Symbol.dispose) JumpStats.prototype[Symbol.dispose] = JumpStats.prototype.free;

/**
 * A lightmap chunk from StreamableMap.ingest_deferred. Make it ready for the GPU with prepare_lightmap_chunk, usually in
 * a web worker, and pass both to StreamableMap.insert_lightmap_chunk.
 */
export class LightmapChunkJob {
    static __wrap(ptr) {
        const obj = Object.create(LightmapChunkJob.prototype);
        obj.__wbg_ptr = ptr;
        LightmapChunkJobFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LightmapChunkJobFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lightmapchunkjob_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get region_id() {
        const ret = wasm.lightmapchunkjob_region_id(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * The chunk as maps store it. Moves the data out, so it can only be taken once.
     * @returns {Uint8Array}
     */
    take_compressed() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.lightmapchunkjob_take_compressed(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) LightmapChunkJob.prototype[Symbol.dispose] = LightmapChunkJob.prototype.free;

/**
 * A completed download request.
 */
export class MapBlockData {
    static __wrap(ptr) {
        const obj = Object.create(MapBlockData.prototype);
        obj.__wbg_ptr = ptr;
        MapBlockDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MapBlockDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mapblockdata_free(ptr, 0);
    }
}
if (Symbol.dispose) MapBlockData.prototype[Symbol.dispose] = MapBlockData.prototype.free;

/**
 * A range of data. StreamableMap considers this block to be
 * "currently downloading" so it must be either downloaded or cancelled.
 */
export class MapBlockRange {
    static __wrap(ptr) {
        const obj = Object.create(MapBlockRange.prototype);
        obj.__wbg_ptr = ptr;
        MapBlockRangeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MapBlockRangeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mapblockrange_free(ptr, 0);
    }
    /**
     * @returns {Range}
     */
    range() {
        const ret = wasm.mapblockrange_range(this.__wbg_ptr);
        return Range.__wrap(ret);
    }
}
if (Symbol.dispose) MapBlockRange.prototype[Symbol.dispose] = MapBlockRange.prototype.free;

export class MapDownloader {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MapDownloaderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mapdownloader_free(ptr, 0);
    }
    /**
     * @param {MapBlockRange} arg0
     * @returns {Promise<MapBlockData>}
     */
    download_map_block_range(arg0) {
        _assertClass(arg0, MapBlockRange);
        var ptr0 = arg0.__destroy_into_raw();
        const ret = wasm.mapdownloader_download_map_block_range(this.__wbg_ptr, ptr0);
        return ret;
    }
    /**
     * @param {string} url
     */
    constructor(url) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mapdownloader_new(ptr0, len0);
        this.__wbg_ptr = ret;
        MapDownloaderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) MapDownloader.prototype[Symbol.dispose] = MapDownloader.prototype.free;

/**
 * Makes a streamed map's regions ready to draw from the geometry in DeferredJobs, which is most of the time spent
 * adding them. It needs no Graphics, so it can run in a web worker.
 */
export class ModelPreparer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ModelPreparerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_modelpreparer_free(ptr, 0);
    }
    /**
     * With StreamableMap.preparer_context.
     * @param {Uint8Array | number[]} context
     */
    constructor(context) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            const ptr0 = passArray8ToWasm0(context, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.modelpreparer_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeFromExternrefTable0(r1);
            }
            this.__wbg_ptr = r0;
            ModelPreparerFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Add a group's geometry from DeferredJobs.take_geometry, and prepare the regions which have all their meshes now,
     * for StreamableMap.insert_prepared_regions.
     * @param {Uint8Array | number[]} geometry
     * @returns {Uint8Array}
     */
    prepare(geometry) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            const ptr0 = passArray8ToWasm0(geometry, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.modelpreparer_prepare(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeFromExternrefTable0(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 1, 1);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) ModelPreparer.prototype[Symbol.dispose] = ModelPreparer.prototype.free;

export class Range {
    static __wrap(ptr) {
        const obj = Object.create(Range.prototype);
        obj.__wbg_ptr = ptr;
        RangeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RangeFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_range_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get end() {
        const ret = wasm.__wbg_get_range_end(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get start() {
        const ret = wasm.__wbg_get_range_start(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set end(arg0) {
        wasm.__wbg_set_range_end(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set start(arg0) {
        wasm.__wbg_set_range_start(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Range.prototype[Symbol.dispose] = Range.prototype.free;

export class StreamableBot {
    static __wrap(ptr) {
        const obj = Object.create(StreamableBot.prototype);
        obj.__wbg_ptr = ptr;
        StreamableBotFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamableBotFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamablebot_free(ptr, 0);
    }
    /**
     * @param {BotBlockRange} arg0
     */
    cancel(arg0) {
        _assertClass(arg0, BotBlockRange);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.streamablebot_cancel(this.__wbg_ptr, ptr0);
    }
    /**
     * The run's checkpoints at the map's Teleports. Needs the whole replay, and the map's regions with Teleports.
     * @param {StreamableMap} map
     * @returns {Checkpoint[]}
     */
    checkpoints(map) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(map, StreamableMap);
            wasm.streamablebot_checkpoints(retptr, this.__wbg_ptr, map.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeFromExternrefTable0(r2);
            }
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export3(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Clear all blocks marked as "currently downloading".
     * This may cause blocks to be downloaded multiple times.
     */
    clear_downloading() {
        wasm.streamablebot_clear_downloading(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    duration() {
        const ret = wasm.streamablebot_duration(this.__wbg_ptr);
        return ret;
    }
    /**
     * When the run finished: its Finish event, or the replay's end without one. Needs the whole replay.
     * @returns {Checkpoint | undefined}
     */
    finish() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.streamablebot_finish(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeFromExternrefTable0(r1);
            }
            return r0 === 0 ? undefined : Checkpoint.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {BotBlockData} arg0
     */
    ingest(arg0) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(arg0, BotBlockData);
            var ptr0 = arg0.__destroy_into_raw();
            wasm.streamablebot_ingest(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeFromExternrefTable0(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Returns the next block that will be needed to construct a StreamableHead
     *  at bot_time.  Do not lose track of this object, since it will never be
     * requested for download again unless cancelled.
     * @param {number} bot_time
     * @returns {BotBlockRange | undefined}
     */
    next_block_at_time(bot_time) {
        const ret = wasm.streamablebot_next_block_at_time(this.__wbg_ptr, bot_time);
        return ret === 0 ? undefined : BotBlockRange.__wrap(ret);
    }
    /**
     * Returns a reasonable block to download next, assuming no blocks are needed
     * within lookahead_seconds.  Only call this if next_block_throttled returned
     * None. Do not lose track of this object, since it will never be requested
     * for download again unless cancelled.
     * @param {StreamableSession} playback_session
     * @param {number} lookahead_seconds
     * @returns {BotBlockRange | undefined}
     */
    next_block_eager(playback_session, lookahead_seconds) {
        _assertClass(playback_session, StreamableSession);
        const ret = wasm.streamablebot_next_block_eager(this.__wbg_ptr, playback_session.__wbg_ptr, lookahead_seconds);
        return ret === 0 ? undefined : BotBlockRange.__wrap(ret);
    }
    /**
     * Returns the next block that will be needed within lookahead_seconds.  Do
     * not lose track of this object, since it will never be requested for
     * download again unless cancelled.
     * @param {StreamableSession} playback_session
     * @param {number} lookahead_seconds
     * @returns {BotBlockRange | undefined}
     */
    next_block_throttled(playback_session, lookahead_seconds) {
        _assertClass(playback_session, StreamableSession);
        const ret = wasm.streamablebot_next_block_throttled(this.__wbg_ptr, playback_session.__wbg_ptr, lookahead_seconds);
        return ret === 0 ? undefined : BotBlockRange.__wrap(ret);
    }
    /**
     * Contiguous ranges of downloaded replay in bot time (the same clock as StreamableSession.get_bot_time).
     * Provided as an array of f64 pairs [start0, end0, start1, end1, ...].
     * @returns {Float64Array}
     */
    ranges() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.streamablebot_ranges(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 8, 8);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * This function may return different values depending on streaming state.
     * @param {number} mode_id
     * @returns {number}
     */
    run_duration(mode_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.streamablebot_run_duration(retptr, this.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getFloat64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeFromExternrefTable0(r2);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Calculate active streaming details
     * @returns {StreamableBotStats}
     */
    stats() {
        const ret = wasm.streamablebot_stats(this.__wbg_ptr);
        return StreamableBotStats.__wrap(ret);
    }
}
if (Symbol.dispose) StreamableBot.prototype[Symbol.dispose] = StreamableBot.prototype.free;

export class StreamableBotStats {
    static __wrap(ptr) {
        const obj = Object.create(StreamableBotStats.prototype);
        obj.__wbg_ptr = ptr;
        StreamableBotStatsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamableBotStatsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamablebotstats_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get blocks_downloaded() {
        const ret = wasm.__wbg_get_streamablebotstats_blocks_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get blocks_total() {
        const ret = wasm.__wbg_get_streamablebotstats_blocks_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get bytes_downloaded() {
        const ret = wasm.__wbg_get_streamablebotstats_bytes_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get bytes_total() {
        const ret = wasm.__wbg_get_streamablebotstats_bytes_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get requests_in_flight() {
        const ret = wasm.__wbg_get_streamablebotstats_requests_in_flight(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set blocks_downloaded(arg0) {
        wasm.__wbg_set_streamablebotstats_blocks_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set blocks_total(arg0) {
        wasm.__wbg_set_streamablebotstats_blocks_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set bytes_downloaded(arg0) {
        wasm.__wbg_set_streamablebotstats_bytes_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set bytes_total(arg0) {
        wasm.__wbg_set_streamablebotstats_bytes_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set requests_in_flight(arg0) {
        wasm.__wbg_set_streamablebotstats_requests_in_flight(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) StreamableBotStats.prototype[Symbol.dispose] = StreamableBotStats.prototype.free;

/**
 * A handle that tracks internal state for a bot replay.
 * Use StreamableSession for an object with looping and play/pause controls.
 * All timestamps are "BotTime", which starts at 0 at the beginning of the
 * replay.  Changing any setting also implicitly advances
 * the session machinery, which is why `bot:&StreamableBot` and `time:f64`
 * is required.
 */
export class StreamableHead {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamableHeadFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamablehead_free(ptr, 0);
    }
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     * @returns {number}
     */
    get_angles_yaw_delta() {
        const ret = wasm.streamablehead_get_angles_yaw_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_fov_slope_y() {
        const ret = wasm.streamablehead_get_fov_slope_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_game_controls() {
        const ret = wasm.streamablehead_get_game_controls(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {StreamableBot} bot
     * @returns {Vector3}
     */
    get_position(bot) {
        _assertClass(bot, StreamableBot);
        const ret = wasm.streamablehead_get_position(this.__wbg_ptr, bot.__wbg_ptr);
        return Vector3.__wrap(ret);
    }
    /**
     * @param {StreamableBot} bot
     * @param {number} mode_id
     * @returns {number | undefined}
     */
    get_run_time(bot, mode_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(bot, StreamableBot);
            wasm.streamablehead_get_run_time(retptr, this.__wbg_ptr, bot.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {StreamableBot} bot
     * @returns {number}
     */
    get_speed(bot) {
        _assertClass(bot, StreamableBot);
        const ret = wasm.streamablehead_get_speed(this.__wbg_ptr, bot.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} mode_id
     * @returns {boolean | undefined}
     */
    is_run_finished(mode_id) {
        const ret = wasm.streamablehead_is_run_finished(this.__wbg_ptr, mode_id);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * @param {number} mode_id
     * @returns {boolean | undefined}
     */
    is_run_in_progress(mode_id) {
        const ret = wasm.streamablehead_is_run_in_progress(this.__wbg_ptr, mode_id);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * @param {StreamableBot} bot
     * @param {number} bot_time
     */
    constructor(bot, bot_time) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(bot, StreamableBot);
            wasm.streamablehead_new(retptr, bot.__wbg_ptr, bot_time);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeFromExternrefTable0(r1);
            }
            this.__wbg_ptr = r0;
            StreamableHeadFinalization.register(this, this.__wbg_ptr, this);
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Set the playback head position to bot_time.
     * @param {StreamableBot} bot
     * @param {number} bot_time
     */
    set_time(bot, bot_time) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(bot, StreamableBot);
            wasm.streamablehead_set_time(retptr, this.__wbg_ptr, bot.__wbg_ptr, bot_time);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeFromExternrefTable0(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
if (Symbol.dispose) StreamableHead.prototype[Symbol.dispose] = StreamableHead.prototype.free;

export class StreamableMap {
    static __wrap(ptr) {
        const obj = Object.create(StreamableMap.prototype);
        obj.__wbg_ptr = ptr;
        StreamableMapFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamableMapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamablemap_free(ptr, 0);
    }
    /**
     * Stop waiting for regions from ModelPreparer.prepare, for when the worker preparing them failed, so playback
     * doesn't buffer forever. The regions it hadn't prepared are never drawn.
     */
    abandon_prepared_regions() {
        wasm.streamablemap_abandon_prepared_regions(this.__wbg_ptr);
    }
    /**
     * @param {MapBlockRange} arg0
     */
    cancel(arg0) {
        _assertClass(arg0, MapBlockRange);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.streamablemap_cancel(this.__wbg_ptr, ptr0);
    }
    /**
     * Clear all blocks marked as "currently downloading".
     * This may cause blocks to be downloaded multiple times.
     */
    clear_downloading() {
        wasm.streamablemap_clear_downloading(this.__wbg_ptr);
    }
    /**
     * @param {Graphics} graphics
     * @param {MapBlockData} arg1
     */
    ingest(graphics, arg1) {
        _assertClass(graphics, Graphics);
        _assertClass(arg1, MapBlockData);
        var ptr0 = arg1.__destroy_into_raw();
        wasm.streamablemap_ingest(this.__wbg_ptr, graphics.__wbg_ptr, ptr0);
    }
    /**
     * Like ingest, but returns the group's texture files, lightmap chunks and geometry instead of loading them, which
     * takes most of the time. Transcode each texture with transcode_texture (in a web worker) and pass the result to
     * upload_texture; playback buffers at a spot until its textures are uploaded. Prepare each lightmap chunk with
     * prepare_lightmap_chunk (in a web worker) and pass it to insert_lightmap_chunk. Prepare the geometry with a
     * ModelPreparer (in a web worker) and pass the result to insert_prepared_regions; playback buffers at a spot until
     * then. Call take_runoff_jobs first and use only this, not ingest.
     * @param {MapBlockData} arg0
     * @returns {DeferredJobs}
     */
    ingest_deferred(arg0) {
        _assertClass(arg0, MapBlockData);
        var ptr0 = arg0.__destroy_into_raw();
        const ret = wasm.streamablemap_ingest_deferred(this.__wbg_ptr, ptr0);
        return DeferredJobs.__wrap(ret);
    }
    /**
     * Add a lightmap chunk from a LightmapChunkJob with what prepare_lightmap_chunk made of it. Without that (the worker
     * failed), or if it doesn't hold a chunk (a mismatched worker build), the chunk is decompressed here instead, a little
     * each frame.
     * @param {number} region_id
     * @param {Uint8Array | number[]} compressed
     * @param {Uint8Array | number[] | null} [prepared]
     */
    insert_lightmap_chunk(region_id, compressed, prepared) {
        const val3 = +region_id;
        let ptr0, len0, ptr1, len1;
        try {
            ptr0 = passArray8ToWasm0(compressed, wasm.__wbindgen_export);
            len0 = WASM_VECTOR_LEN;
            ptr1 = isLikeNone(prepared) ? 0 : passArray8ToWasm0(prepared, wasm.__wbindgen_export);
            len1 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr1) { wasm.__wbindgen_export3(ptr1, len1 * 1, 1); }
            if (ptr0) { wasm.__wbindgen_export3(ptr0, len0 * 1, 1); }
            throw e;
        }
        wasm.streamablemap_insert_lightmap_chunk(this.__wbg_ptr, val3, ptr0, len0, ptr1, len1);
    }
    /**
     * Add regions from ModelPreparer.prepare. Do this before promote_ready_assets. False if any were from a mismatched
     * worker build, and those regions are never drawn.
     * @param {Uint8Array | number[]} prepared
     * @returns {boolean}
     */
    insert_prepared_regions(prepared) {
        const ptr0 = passArray8ToWasm0(prepared, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.streamablemap_insert_prepared_regions(this.__wbg_ptr, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Whether the whole map is downloaded and in the scene: nothing left to download or in flight, no texture
     * transcoding and nothing waiting to be added by promote_ready_assets. Work handed to web workers through
     * ingest_deferred isn't known here until it comes back, so check that the caller's workers are done too.
     * Lightmap chunks still go on the GPU over the next frames rendered.
     * @returns {boolean}
     */
    is_loaded() {
        const ret = wasm.streamablemap_is_loaded(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {StreamableBot} bot
     * @param {StreamableHead} head
     * @param {Surface} surface
     * @returns {MapBlockRange | undefined}
     */
    next_block_head_throttled(bot, head, surface) {
        _assertClass(bot, StreamableBot);
        _assertClass(head, StreamableHead);
        _assertClass(surface, Surface);
        const ret = wasm.streamablemap_next_block_head_throttled(this.__wbg_ptr, bot.__wbg_ptr, head.__wbg_ptr, surface.__wbg_ptr);
        return ret === 0 ? undefined : MapBlockRange.__wrap(ret);
    }
    /**
     * Returns the next block to download in a reasonable order based on the
     * current camera view.  Do not lose track of this object, since it will
     * never be requested for download again unless cancelled.
     * @param {StreamableBot} bot
     * @param {StreamableSession} session
     * @param {Surface} surface
     * @returns {MapBlockRange | undefined}
     */
    next_block_session(bot, session, surface) {
        _assertClass(bot, StreamableBot);
        _assertClass(session, StreamableSession);
        _assertClass(surface, Surface);
        const ret = wasm.streamablemap_next_block_session(this.__wbg_ptr, bot.__wbg_ptr, session.__wbg_ptr, surface.__wbg_ptr);
        return ret === 0 ? undefined : MapBlockRange.__wrap(ret);
    }
    /**
     * What a ModelPreparer for this map is made with.
     * @returns {Uint8Array}
     */
    preparer_context() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.streamablemap_preparer_context(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Call this before rendering to promote streaming assets which are ready
     * to render onto the render queue.
     * @param {Graphics} graphics
     */
    promote_ready_assets(graphics) {
        _assertClass(graphics, Graphics);
        wasm.streamablemap_promote_ready_assets(this.__wbg_ptr, graphics.__wbg_ptr);
    }
    /**
     * Calculate active streaming details
     * @returns {StreamableMapStats}
     */
    stats() {
        const ret = wasm.streamablemap_stats(this.__wbg_ptr);
        return StreamableMapStats.__wrap(ret);
    }
    /**
     * What ingest_deferred returns for the blocks downloaded with the map's header. Call it once, before anything else.
     * @returns {DeferredJobs}
     */
    take_runoff_jobs() {
        const ret = wasm.streamablemap_take_runoff_jobs(this.__wbg_ptr);
        return DeferredJobs.__wrap(ret);
    }
    /**
     * Upload a texture from transcode_texture. Do this before promote_ready_assets.
     * @param {Graphics} graphics
     * @param {TranscodedTexture} texture
     */
    upload_texture(graphics, texture) {
        _assertClass(graphics, Graphics);
        _assertClass(texture, TranscodedTexture);
        var ptr0 = texture.__destroy_into_raw();
        wasm.streamablemap_upload_texture(this.__wbg_ptr, graphics.__wbg_ptr, ptr0);
    }
}
if (Symbol.dispose) StreamableMap.prototype[Symbol.dispose] = StreamableMap.prototype.free;

export class StreamableMapStats {
    static __wrap(ptr) {
        const obj = Object.create(StreamableMapStats.prototype);
        obj.__wbg_ptr = ptr;
        StreamableMapStatsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamableMapStatsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamablemapstats_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get baked_chunks_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_baked_chunks_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get baked_chunks_total() {
        const ret = wasm.__wbg_get_streamablemapstats_baked_chunks_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get bytes_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_bytes_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get bytes_total() {
        const ret = wasm.__wbg_get_streamablemapstats_bytes_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get lightmap_chunks_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_lightmap_chunks_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get lightmap_chunks_total() {
        const ret = wasm.__wbg_get_streamablemapstats_lightmap_chunks_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get meshes_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_meshes_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get meshes_total() {
        const ret = wasm.__wbg_get_streamablemapstats_meshes_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get reflection_probes_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_reflection_probes_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get reflection_probes_total() {
        const ret = wasm.__wbg_get_streamablemapstats_reflection_probes_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get regions_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_regions_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get regions_total() {
        const ret = wasm.__wbg_get_streamablemapstats_regions_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get requests_in_flight() {
        const ret = wasm.__wbg_get_streamablemapstats_requests_in_flight(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get textures_downloaded() {
        const ret = wasm.__wbg_get_streamablemapstats_textures_downloaded(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get textures_total() {
        const ret = wasm.__wbg_get_streamablemapstats_textures_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set baked_chunks_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_baked_chunks_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set baked_chunks_total(arg0) {
        wasm.__wbg_set_streamablemapstats_baked_chunks_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set bytes_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_bytes_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set bytes_total(arg0) {
        wasm.__wbg_set_streamablemapstats_bytes_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set lightmap_chunks_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_lightmap_chunks_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set lightmap_chunks_total(arg0) {
        wasm.__wbg_set_streamablemapstats_lightmap_chunks_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set meshes_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_meshes_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set meshes_total(arg0) {
        wasm.__wbg_set_streamablemapstats_meshes_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reflection_probes_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_reflection_probes_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reflection_probes_total(arg0) {
        wasm.__wbg_set_streamablemapstats_reflection_probes_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set regions_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_regions_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set regions_total(arg0) {
        wasm.__wbg_set_streamablemapstats_regions_total(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set requests_in_flight(arg0) {
        wasm.__wbg_set_streamablemapstats_requests_in_flight(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set textures_downloaded(arg0) {
        wasm.__wbg_set_streamablemapstats_textures_downloaded(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set textures_total(arg0) {
        wasm.__wbg_set_streamablemapstats_textures_total(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) StreamableMapStats.prototype[Symbol.dispose] = StreamableMapStats.prototype.free;

/**
 * A bot replay object with automatic looping, play/pause controls, and
 * timescale.  All timestamps are "SessionTime", which is expected to be a
 * monotonic external clock.  Changing any setting also implicitly advances
 * the session machinery, which is why `bot:&StreamableBot` and `time:f64`
 * is required.
 */
export class StreamableSession {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StreamableSessionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_streamablesession_free(ptr, 0);
    }
    /**
     * @param {StreamableBot} bot
     * @param {StreamableMap} map
     * @param {number} session_time
     */
    advance_time(bot, map, session_time) {
        _assertClass(bot, StreamableBot);
        _assertClass(map, StreamableMap);
        wasm.streamablesession_advance_time(this.__wbg_ptr, bot.__wbg_ptr, map.__wbg_ptr, session_time);
    }
    /**
     * Returns the camera angles yaw delta between the last game tick and the most recent game tick.
     * @returns {number}
     */
    get_angles_yaw_delta() {
        const ret = wasm.streamablesession_get_angles_yaw_delta(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_bot_time() {
        const ret = wasm.streamablesession_get_bot_time(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_fov_slope_y() {
        const ret = wasm.streamablesession_get_fov_slope_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_game_controls() {
        const ret = wasm.streamablesession_get_game_controls(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Jump HUD stats for the most recent jump in the current jump chain.
     * Undefined before the first jump, after standing on the ground, and for fly trials styles.
     * @param {StreamableBot} bot
     * @returns {JumpStats | undefined}
     */
    get_jump_stats(bot) {
        _assertClass(bot, StreamableBot);
        const ret = wasm.streamablesession_get_jump_stats(this.__wbg_ptr, bot.__wbg_ptr);
        return ret === 0 ? undefined : JumpStats.__wrap(ret);
    }
    /**
     * @param {StreamableBot} bot
     * @returns {Vector3}
     */
    get_position(bot) {
        _assertClass(bot, StreamableBot);
        const ret = wasm.streamablesession_get_position(this.__wbg_ptr, bot.__wbg_ptr);
        return Vector3.__wrap(ret);
    }
    /**
     * @param {StreamableBot} bot
     * @param {number} mode_id
     * @returns {number | undefined}
     */
    get_run_time(bot, mode_id) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            _assertClass(bot, StreamableBot);
            wasm.streamablesession_get_run_time(retptr, this.__wbg_ptr, bot.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r2 = getDataViewMemory0().getFloat64(retptr + 8 * 1, true);
            return r0 === 0 ? undefined : r2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    get_scale() {
        const ret = wasm.streamablesession_get_scale(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {StreamableBot} bot
     * @returns {number}
     */
    get_speed(bot) {
        _assertClass(bot, StreamableBot);
        const ret = wasm.streamablesession_get_speed(this.__wbg_ptr, bot.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    is_buffering() {
        const ret = wasm.streamablesession_is_buffering(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {number} mode_id
     * @returns {boolean | undefined}
     */
    is_run_finished(mode_id) {
        const ret = wasm.streamablesession_is_run_finished(this.__wbg_ptr, mode_id);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * @param {number} mode_id
     * @returns {boolean | undefined}
     */
    is_run_in_progress(mode_id) {
        const ret = wasm.streamablesession_is_run_in_progress(this.__wbg_ptr, mode_id);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
     * @param {StreamableBot} bot
     * @param {number} session_time
     */
    constructor(bot, session_time) {
        _assertClass(bot, StreamableBot);
        const ret = wasm.streamablesession_new(bot.__wbg_ptr, session_time);
        this.__wbg_ptr = ret;
        StreamableSessionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the playback position to new_time.
     * @param {StreamableBot} bot
     * @param {StreamableMap} map
     * @param {number} session_time
     * @param {number} bot_time
     */
    set_bot_time(bot, map, session_time, bot_time) {
        _assertClass(bot, StreamableBot);
        _assertClass(map, StreamableMap);
        wasm.streamablesession_set_bot_time(this.__wbg_ptr, bot.__wbg_ptr, map.__wbg_ptr, session_time, bot_time);
    }
    /**
     * @param {StreamableBot} bot
     * @param {StreamableMap} map
     * @param {number} session_time
     * @param {boolean} paused
     */
    set_paused(bot, map, session_time, paused) {
        _assertClass(bot, StreamableBot);
        _assertClass(map, StreamableMap);
        wasm.streamablesession_set_paused(this.__wbg_ptr, bot.__wbg_ptr, map.__wbg_ptr, session_time, paused);
    }
    /**
     * @param {StreamableBot} bot
     * @param {StreamableMap} map
     * @param {number} session_time
     * @param {number} scale
     */
    set_scale(bot, map, session_time, scale) {
        _assertClass(bot, StreamableBot);
        _assertClass(map, StreamableMap);
        wasm.streamablesession_set_scale(this.__wbg_ptr, bot.__wbg_ptr, map.__wbg_ptr, session_time, scale);
    }
}
if (Symbol.dispose) StreamableSession.prototype[Symbol.dispose] = StreamableSession.prototype.free;

export class Surface {
    static __wrap(ptr) {
        const obj = Object.create(Surface.prototype);
        obj.__wbg_ptr = ptr;
        SurfaceFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SurfaceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_surface_free(ptr, 0);
    }
    /**
     * @param {Graphics} graphics
     * @param {number} width
     * @param {number} height
     */
    resize(graphics, width, height) {
        _assertClass(graphics, Graphics);
        wasm.surface_resize(this.__wbg_ptr, graphics.__wbg_ptr, width, height);
    }
}
if (Symbol.dispose) Surface.prototype[Symbol.dispose] = Surface.prototype.free;

/**
 * A texture file from StreamableMap.ingest_deferred. Transcode it with transcode_texture,
 * usually in a web worker, and pass the result to StreamableMap.upload_texture.
 */
export class TextureJob {
    static __wrap(ptr) {
        const obj = Object.create(TextureJob.prototype);
        obj.__wbg_ptr = ptr;
        TextureJobFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TextureJobFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_texturejob_free(ptr, 0);
    }
    /**
     * The KTX2 or DDS file. Moves the data out, so it can only be taken once.
     * @returns {Uint8Array}
     */
    take_data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.texturejob_take_data(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    get texture_id() {
        const ret = wasm.texturejob_texture_id(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) TextureJob.prototype[Symbol.dispose] = TextureJob.prototype.free;

/**
 * A texture ready to upload, as plain data so it can be sent between a web worker and the page.
 */
export class TranscodedTexture {
    static __wrap(ptr) {
        const obj = Object.create(TranscodedTexture.prototype);
        obj.__wbg_ptr = ptr;
        TranscodedTextureFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TranscodedTextureFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_transcodedtexture_free(ptr, 0);
    }
    /**
     * Whether its alpha is mostly fully clear or fully solid, see Texture::coverage_alpha.
     * @returns {boolean}
     */
    get coverage_alpha() {
        const ret = wasm.transcodedtexture_coverage_alpha(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get format() {
        const ret = wasm.transcodedtexture_format(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get height() {
        const ret = wasm.transcodedtexture_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get mip_level_count() {
        const ret = wasm.transcodedtexture_mip_level_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Rebuild from the fields of a TranscodedTexture sent from a web worker.
     * @param {number} texture_id
     * @param {number} width
     * @param {number} height
     * @param {number} mip_level_count
     * @param {number} format
     * @param {boolean} coverage_alpha
     * @param {Uint8Array | number[]} data
     */
    constructor(texture_id, width, height, mip_level_count, format, coverage_alpha, data) {
        const val2 = +texture_id;
        const val3 = +width;
        const val4 = +height;
        const val5 = +mip_level_count;
        const val6 = +format;
        const val7 = +coverage_alpha;
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transcodedtexture_new(val2, val3, val4, val5, val6, val7, ptr0, len0);
        this.__wbg_ptr = ret;
        TranscodedTextureFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Every mip level, largest first. Moves the data out, so it can only be taken once.
     * @returns {Uint8Array}
     */
    take_data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
            wasm.transcodedtexture_take_data(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export3(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    get texture_id() {
        const ret = wasm.transcodedtexture_texture_id(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.transcodedtexture_width(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) TranscodedTexture.prototype[Symbol.dispose] = TranscodedTexture.prototype.free;

export class Vector3 {
    static __wrap(ptr) {
        const obj = Object.create(Vector3.prototype);
        obj.__wbg_ptr = ptr;
        Vector3Finalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Vector3Finalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vector3_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get x() {
        const ret = wasm.__wbg_get_vector3_x(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get y() {
        const ret = wasm.__wbg_get_vector3_y(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get z() {
        const ret = wasm.__wbg_get_vector3_z(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set x(arg0) {
        wasm.__wbg_set_vector3_x(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set y(arg0) {
        wasm.__wbg_set_vector3_y(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set z(arg0) {
        wasm.__wbg_set_vector3_z(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Vector3.prototype[Symbol.dispose] = Vector3.prototype.free;

/**
 * Initialize a StreamableBot by estimating the header length based on the leaderboard run duration.
 * This may make 2 requests if the file is a malformed outlier, or even 3 for a maliciously crafted file.
 * @param {BotDownloader} downloader
 * @param {number} run_duration
 * @param {number} group_split_size
 * @returns {Promise<StreamableBot>}
 */
export function new_streamable_bot(downloader, run_duration, group_split_size) {
    _assertClass(downloader, BotDownloader);
    const ret = wasm.new_streamable_bot(downloader.__wbg_ptr, run_duration, group_split_size);
    return ret;
}

/**
 * Initialize a StreamableMap by estimating the header length based on the leaderboard run duration.
 * This may make 2 requests if the file is a malformed outlier, or even 3 for a maliciously crafted file.
 * `group_split_size` (bytes) defines the preferred size for download requests.  0 makes the requests as small as possible.
 * @param {MapDownloader} downloader
 * @param {Graphics} graphics
 * @param {number} group_split_size
 * @returns {Promise<StreamableMap>}
 */
export function new_streamable_map(downloader, graphics, group_split_size) {
    _assertClass(downloader, MapDownloader);
    _assertClass(graphics, Graphics);
    const ret = wasm.new_streamable_map(downloader.__wbg_ptr, graphics.__wbg_ptr, group_split_size);
    return ret;
}

/**
 * Decompress a lightmap chunk from a LightmapChunkJob and lay it out as it goes on the GPU, as bytes for
 * StreamableMap.insert_lightmap_chunk. This is the slow part of a lightmap chunk, and it needs no Graphics, so it can
 * run in a web worker.
 * @param {Uint8Array | number[]} compressed
 * @returns {Uint8Array}
 */
export function prepare_lightmap_chunk(compressed) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
        const ptr0 = passArray8ToWasm0(compressed, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.prepare_lightmap_chunk(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeFromExternrefTable0(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export3(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Set up the graphics.  Returns an object that contains both graphics and surface.
 * Call graphics.new_surface to set up new surfaces as needed.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<GraphicsAndSurface>}
 */
export function setup_graphics(canvas) {
    const ret = wasm.setup_graphics(canvas);
    return ret;
}

/**
 * Transcode a texture file from a TextureJob into a format the device supports
 * (`texture_support` from Graphics.texture_support). This is the slow part of loading a map,
 * and it needs no Graphics, so it can run in a web worker.
 * A file which fails to load becomes the missing texture checkerboard.
 * @param {number} texture_id
 * @param {Uint8Array | number[]} data
 * @param {number} texture_support
 * @returns {TranscodedTexture}
 */
export function transcode_texture(texture_id, data, texture_support) {
    const val2 = +texture_id;
    const val3 = +texture_support;
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.transcode_texture(val2, ptr0, len0, val3);
    return TranscodedTexture.__wrap(ret);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_208446807d0d1e30: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Window_41838cbcc08822b5: function(arg0) {
            const ret = arg0.Window;
            return ret;
        },
        __wbg_WorkerGlobalScope_448e3830f27a30fd: function(arg0) {
            const ret = arg0.WorkerGlobalScope;
            return ret;
        },
        __wbg___wbindgen_debug_string_f249a2a76caa9a55: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_741ff2bb612836f5: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_c22311b1cc228e3a: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_string_fc456fee5d3317de: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_be5b34249ff1fc15: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_string_get_7ce8eee7fd327545: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_09736879a3f67559: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_arrayBuffer_2c99a9ba14ba536c: function() { return handleError(function (arg0) {
            const ret = arg0.arrayBuffer();
            return ret;
        }, arguments); },
        __wbg_beginComputePass_b3bb1a69e6a70bde: function(arg0, arg1) {
            const ret = arg0.beginComputePass(arg1);
            return ret;
        },
        __wbg_beginRenderPass_ac30593a03c9a74e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.beginRenderPass(arg1);
            return ret;
        }, arguments); },
        __wbg_botblockdata_new: function(arg0) {
            const ret = BotBlockData.__wrap(arg0);
            return ret;
        },
        __wbg_call_a410eb4b59ed5965: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_checkpoint_new: function(arg0) {
            const ret = Checkpoint.__wrap(arg0);
            return ret;
        },
        __wbg_completebot_new: function(arg0) {
            const ret = CompleteBot.__wrap(arg0);
            return ret;
        },
        __wbg_configure_2f4cbe7746e5aa81: function() { return handleError(function (arg0, arg1) {
            arg0.configure(arg1);
        }, arguments); },
        __wbg_copyBufferToBuffer_2c8a5726f948b97e: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_copyBufferToBuffer_d8141ff7d5df2685: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_copyTextureToTexture_aa278b6e539310a3: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyTextureToTexture(arg1, arg2, arg3);
        }, arguments); },
        __wbg_createBindGroupLayout_03a20e72b41b406e: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createBindGroupLayout(arg1);
            return ret;
        }, arguments); },
        __wbg_createBindGroup_ec4dc4d9e46e1104: function(arg0, arg1) {
            const ret = arg0.createBindGroup(arg1);
            return ret;
        },
        __wbg_createBuffer_baa81dab839b6c5c: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createBuffer(arg1);
            return ret;
        }, arguments); },
        __wbg_createCommandEncoder_a5136f45baaba888: function(arg0, arg1) {
            const ret = arg0.createCommandEncoder(arg1);
            return ret;
        },
        __wbg_createComputePipeline_6a05383609fddac6: function(arg0, arg1) {
            const ret = arg0.createComputePipeline(arg1);
            return ret;
        },
        __wbg_createPipelineLayout_a955ff1e35a63634: function(arg0, arg1) {
            const ret = arg0.createPipelineLayout(arg1);
            return ret;
        },
        __wbg_createQuerySet_b68dbafb01930a3a: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createQuerySet(arg1);
            return ret;
        }, arguments); },
        __wbg_createRenderPipelineAsync_b00fe5e332264ff7: function(arg0, arg1) {
            const ret = arg0.createRenderPipelineAsync(arg1);
            return ret;
        },
        __wbg_createRenderPipeline_f31fc336274aaab2: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createRenderPipeline(arg1);
            return ret;
        }, arguments); },
        __wbg_createSampler_2fe8901be471a83a: function(arg0, arg1) {
            const ret = arg0.createSampler(arg1);
            return ret;
        },
        __wbg_createShaderModule_f540847678b68e08: function(arg0, arg1) {
            const ret = arg0.createShaderModule(arg1);
            return ret;
        },
        __wbg_createTexture_5e2361f396945928: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createTexture(arg1);
            return ret;
        }, arguments); },
        __wbg_createView_e495f88700d28104: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createView(arg1);
            return ret;
        }, arguments); },
        __wbg_dispatchWorkgroups_74a6ec8812ef9f3b: function(arg0, arg1, arg2, arg3) {
            arg0.dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        },
        __wbg_document_3b5c3071b43e97ee: function(arg0) {
            const ret = arg0.document;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_downloadbotblockrangeerror_new: function(arg0) {
            const ret = DownloadBotBlockRangeError.__wrap(arg0);
            return ret;
        },
        __wbg_downloadmapblockrangeerror_new: function(arg0) {
            const ret = DownloadMapBlockRangeError.__wrap(arg0);
            return ret;
        },
        __wbg_drawIndexed_8bcec1419f35c7a6: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
        },
        __wbg_drawIndirect_193e39a1dda3a6c4: function(arg0, arg1, arg2) {
            arg0.drawIndirect(arg1, arg2);
        },
        __wbg_draw_977efcdcd4b12838: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        },
        __wbg_end_23ba48463344fbc0: function(arg0) {
            arg0.end();
        },
        __wbg_end_3bbedaa037606029: function(arg0) {
            arg0.end();
        },
        __wbg_error_2fa67a9496f77475: function(arg0) {
            const ret = arg0.error;
            return ret;
        },
        __wbg_error_d1fc0193610e0e39: function(arg0) {
            console.error(arg0);
        },
        __wbg_features_29757024dfb82d0d: function(arg0) {
            const ret = arg0.features;
            return ret;
        },
        __wbg_features_b650c8412d082ef1: function(arg0) {
            const ret = arg0.features;
            return ret;
        },
        __wbg_fetch_9b478faef8cda538: function(arg0) {
            const ret = fetch(arg0);
            return ret;
        },
        __wbg_finish_49529a046631ad9a: function(arg0) {
            const ret = arg0.finish();
            return ret;
        },
        __wbg_finish_678df663961386ff: function(arg0, arg1) {
            const ret = arg0.finish(arg1);
            return ret;
        },
        __wbg_getContext_1938edb9a972f63d: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getContext_d93f904b714852ae: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getCurrentTexture_e9d52aabce56f3fb: function() { return handleError(function (arg0) {
            const ret = arg0.getCurrentTexture();
            return ret;
        }, arguments); },
        __wbg_getMappedRange_fd3092e276caa831: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getMappedRange(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_getPreferredCanvasFormat_f775f4ebe1768892: function(arg0) {
            const ret = arg0.getPreferredCanvasFormat();
            return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 102) - 1;
        },
        __wbg_get_0c55869fe53c7d14: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_gpu_aa311a9494720027: function(arg0) {
            const ret = arg0.gpu;
            return ret;
        },
        __wbg_graphicsandsurface_new: function(arg0) {
            const ret = GraphicsAndSurface.__wrap(arg0);
            return ret;
        },
        __wbg_has_47b8eb16db92789a: function(arg0, arg1, arg2) {
            const ret = arg0.has(getStringFromWasm0(arg1, arg2));
            return ret;
        },
        __wbg_height_ac6f1c3f49c13fe2: function(arg0) {
            const ret = arg0.height;
            return ret;
        },
        __wbg_instanceof_Error_74e3cca0c4a69161: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Error;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuOutOfMemoryError_72d4f143d9ec20cb: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUOutOfMemoryError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuPipelineError_8bf568ea5566c0ef: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUPipelineError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuValidationError_cdb716bc3a7ed585: function(arg0) {
            let result;
            try {
                result = arg0 instanceof GPUValidationError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Response_5b0b4f7f1daeae51: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Response;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_TypeError_c5c1ddf07436286a: function(arg0) {
            let result;
            try {
                result = arg0 instanceof TypeError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_5cf453f5639aa1a2: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_label_b4e9fa173fb30ad5: function(arg0, arg1) {
            const ret = arg1.label;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_length_186163212ffe79c3: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_lightmapchunkjob_new: function(arg0) {
            const ret = LightmapChunkJob.__wrap(arg0);
            return ret;
        },
        __wbg_limits_06ac8ea738a0d93e: function(arg0) {
            const ret = arg0.limits;
            return ret;
        },
        __wbg_limits_7f838192fdb36f0a: function(arg0) {
            const ret = arg0.limits;
            return ret;
        },
        __wbg_lost_b5bea941ce66b09b: function(arg0) {
            const ret = arg0.lost;
            return ret;
        },
        __wbg_mapAsync_84aeaa5780c9b8c7: function(arg0, arg1, arg2, arg3) {
            const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3);
            return ret;
        },
        __wbg_mapblockdata_new: function(arg0) {
            const ret = MapBlockData.__wrap(arg0);
            return ret;
        },
        __wbg_matchMedia_b53687d22ec43649: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.matchMedia(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_matches_a47c420646498c64: function(arg0) {
            const ret = arg0.matches;
            return ret;
        },
        __wbg_maxBindGroupsPlusVertexBuffers_5a483d2af94e57bc: function(arg0) {
            const ret = arg0.maxBindGroupsPlusVertexBuffers;
            return ret;
        },
        __wbg_maxBindGroups_8280e3693e832071: function(arg0) {
            const ret = arg0.maxBindGroups;
            return ret;
        },
        __wbg_maxBindingsPerBindGroup_872ae44e536b19a5: function(arg0) {
            const ret = arg0.maxBindingsPerBindGroup;
            return ret;
        },
        __wbg_maxBufferSize_9dae4d9428e42f10: function(arg0) {
            const ret = arg0.maxBufferSize;
            return ret;
        },
        __wbg_maxColorAttachmentBytesPerSample_12d8884108587e97: function(arg0) {
            const ret = arg0.maxColorAttachmentBytesPerSample;
            return ret;
        },
        __wbg_maxColorAttachments_deb9217288cb10c6: function(arg0) {
            const ret = arg0.maxColorAttachments;
            return ret;
        },
        __wbg_maxComputeInvocationsPerWorkgroup_c4b13a829ed0b259: function(arg0) {
            const ret = arg0.maxComputeInvocationsPerWorkgroup;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeX_91c35c8e026d4b2e: function(arg0) {
            const ret = arg0.maxComputeWorkgroupSizeX;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeY_961e4fb0ccb8e424: function(arg0) {
            const ret = arg0.maxComputeWorkgroupSizeY;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeZ_62c453c3b2746fe1: function(arg0) {
            const ret = arg0.maxComputeWorkgroupSizeZ;
            return ret;
        },
        __wbg_maxComputeWorkgroupStorageSize_dcf9113c2281aa6c: function(arg0) {
            const ret = arg0.maxComputeWorkgroupStorageSize;
            return ret;
        },
        __wbg_maxComputeWorkgroupsPerDimension_c8e2df553b22565e: function(arg0) {
            const ret = arg0.maxComputeWorkgroupsPerDimension;
            return ret;
        },
        __wbg_maxDynamicStorageBuffersPerPipelineLayout_43810e253385b7f5: function(arg0) {
            const ret = arg0.maxDynamicStorageBuffersPerPipelineLayout;
            return ret;
        },
        __wbg_maxDynamicUniformBuffersPerPipelineLayout_e160bf315957a3a1: function(arg0) {
            const ret = arg0.maxDynamicUniformBuffersPerPipelineLayout;
            return ret;
        },
        __wbg_maxInterStageShaderVariables_62a6f8974aa80170: function(arg0) {
            const ret = arg0.maxInterStageShaderVariables;
            return ret;
        },
        __wbg_maxSampledTexturesPerShaderStage_45931d0d0e425368: function(arg0) {
            const ret = arg0.maxSampledTexturesPerShaderStage;
            return ret;
        },
        __wbg_maxSamplersPerShaderStage_fd87b1b55a1bce03: function(arg0) {
            const ret = arg0.maxSamplersPerShaderStage;
            return ret;
        },
        __wbg_maxStorageBufferBindingSize_bec702c6fccfd8d5: function(arg0) {
            const ret = arg0.maxStorageBufferBindingSize;
            return ret;
        },
        __wbg_maxStorageBuffersPerShaderStage_36af4d1cf6b73e49: function(arg0) {
            const ret = arg0.maxStorageBuffersPerShaderStage;
            return ret;
        },
        __wbg_maxStorageTexturesPerShaderStage_bf0523882733deac: function(arg0) {
            const ret = arg0.maxStorageTexturesPerShaderStage;
            return ret;
        },
        __wbg_maxTextureArrayLayers_7c675fa8f48e7e97: function(arg0) {
            const ret = arg0.maxTextureArrayLayers;
            return ret;
        },
        __wbg_maxTextureDimension1D_bb69683afe97bf80: function(arg0) {
            const ret = arg0.maxTextureDimension1D;
            return ret;
        },
        __wbg_maxTextureDimension2D_cee54c433bf3b9c1: function(arg0) {
            const ret = arg0.maxTextureDimension2D;
            return ret;
        },
        __wbg_maxTextureDimension3D_ae26b58b1450c99a: function(arg0) {
            const ret = arg0.maxTextureDimension3D;
            return ret;
        },
        __wbg_maxUniformBufferBindingSize_00f780f64f0dd7c4: function(arg0) {
            const ret = arg0.maxUniformBufferBindingSize;
            return ret;
        },
        __wbg_maxUniformBuffersPerShaderStage_2c2054e9d96df7ad: function(arg0) {
            const ret = arg0.maxUniformBuffersPerShaderStage;
            return ret;
        },
        __wbg_maxVertexAttributes_425aa710b80da882: function(arg0) {
            const ret = arg0.maxVertexAttributes;
            return ret;
        },
        __wbg_maxVertexBufferArrayStride_8f0c56e46eba7c97: function(arg0) {
            const ret = arg0.maxVertexBufferArrayStride;
            return ret;
        },
        __wbg_maxVertexBuffers_473f2615aa5963dd: function(arg0) {
            const ret = arg0.maxVertexBuffers;
            return ret;
        },
        __wbg_message_0c79c7c15b1865af: function(arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_message_43d8c8f1d543a349: function(arg0) {
            const ret = arg0.message;
            return ret;
        },
        __wbg_message_bb4d389df9355dd2: function(arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_message_fc58bc095885b5e5: function(arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_minStorageBufferOffsetAlignment_f9ce2fe03a21a2e4: function(arg0) {
            const ret = arg0.minStorageBufferOffsetAlignment;
            return ret;
        },
        __wbg_minUniformBufferOffsetAlignment_bca4b75f696bbf11: function(arg0) {
            const ret = arg0.minUniformBufferOffsetAlignment;
            return ret;
        },
        __wbg_name_d1fa514fdca6a975: function(arg0) {
            const ret = arg0.name;
            return ret;
        },
        __wbg_navigator_9641ab32fa612dd1: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_navigator_c17f443a6fe5d38d: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_new_07eab48280c9cd7e: function() { return handleError(function () {
            const ret = new URLSearchParams();
            return ret;
        }, arguments); },
        __wbg_new_13de428334042d26: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_277c27c26f94cbc2: function() { return handleError(function () {
            const ret = new Headers();
            return ret;
        }, arguments); },
        __wbg_new_2bfd0f45e60518b1: function() { return handleError(function (arg0, arg1) {
            const ret = new OffscreenCanvas(arg0 >>> 0, arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_new_96baed0986e0d99f: function() { return handleError(function (arg0, arg1) {
            const ret = new URL(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_new_cd4348290afae586: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_typed_6b60b99917da27d6: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_typed_e09da9dae6ee5935: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return __wasm_bindgen_func_elem_3429(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_with_byte_offset_and_length_3cd32055a417f095: function(arg0, arg1, arg2) {
            const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_new_with_str_and_init_d9f6b5611184e16b: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments); },
        __wbg_new_with_str_f3fabb7c01bc9cf7: function() { return handleError(function (arg0, arg1) {
            const ret = new Request(getStringFromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_onSubmittedWorkDone_f62945abb48d8a84: function(arg0) {
            const ret = arg0.onSubmittedWorkDone();
            return ret;
        },
        __wbg_prototypesetcall_13162965d1fe7aa3: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_querySelectorAll_6c1bd81d448fb480: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_queueMicrotask_1e8503a8a690f0a3: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_queueMicrotask_4a1a4d8dd332373b: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_queue_41b76331de876d9d: function(arg0) {
            const ret = arg0.queue;
            return ret;
        },
        __wbg_reason_0a4d63db91a10213: function(arg0) {
            const ret = arg0.reason;
            return (__wbindgen_enum_GpuPipelineErrorReason.indexOf(ret) + 1 || 3) - 1;
        },
        __wbg_reason_9ebfbaed7b40f058: function(arg0) {
            const ret = arg0.reason;
            return (__wbindgen_enum_GpuDeviceLostReason.indexOf(ret) + 1 || 3) - 1;
        },
        __wbg_requestAdapter_2cb1006baf7abd60: function(arg0) {
            const ret = arg0.requestAdapter();
            return ret;
        },
        __wbg_requestAdapter_b725cba92e32c4ce: function(arg0, arg1) {
            const ret = arg0.requestAdapter(arg1);
            return ret;
        },
        __wbg_requestDevice_45bc1149c3b98eaf: function(arg0, arg1) {
            const ret = arg0.requestDevice(arg1);
            return ret;
        },
        __wbg_resolveQuerySet_3eb16017fd6ef873: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.resolveQuerySet(arg1, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
        },
        __wbg_resolve_dbf78ab4942478b0: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_search_88703ce66d1580b3: function(arg0, arg1) {
            const ret = arg1.search;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_setBindGroup_09aa10258bd4dc11: function(arg0, arg1, arg2) {
            arg0.setBindGroup(arg1 >>> 0, arg2);
        },
        __wbg_setBindGroup_0e4a7b8b254673b9: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
        }, arguments); },
        __wbg_setBindGroup_1a145239764ea257: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
        }, arguments); },
        __wbg_setBindGroup_c3a39fd8d0149600: function(arg0, arg1, arg2) {
            arg0.setBindGroup(arg1 >>> 0, arg2);
        },
        __wbg_setBlendConstant_49282f54c2fa2e20: function() { return handleError(function (arg0, arg1) {
            arg0.setBlendConstant(arg1);
        }, arguments); },
        __wbg_setIndexBuffer_1872a074063dc4d2: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
        },
        __wbg_setPipeline_1368374122476dc8: function(arg0, arg1) {
            arg0.setPipeline(arg1);
        },
        __wbg_setPipeline_823fe7d48236b840: function(arg0, arg1) {
            arg0.setPipeline(arg1);
        },
        __wbg_setScissorRect_5b13089a95f2dadd: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        },
        __wbg_setVertexBuffer_6cb9f5432f1462e2: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
        },
        __wbg_setVertexBuffer_ff00b7e9bfd9257d: function(arg0, arg1, arg2, arg3) {
            arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
        },
        __wbg_set_118fefd528ab0a79: function(arg0, arg1, arg2) {
            arg0.set(arg1, arg2 >>> 0);
        },
        __wbg_set_2793479888329cb6: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_a_b8a7f56fa358e664: function(arg0, arg1) {
            arg0.a = arg1;
        },
        __wbg_set_access_46b3e62b6a30d608: function(arg0, arg1) {
            arg0.access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
        },
        __wbg_set_address_mode_u_f67593eba8917d58: function(arg0, arg1) {
            arg0.addressModeU = __wbindgen_enum_GpuAddressMode[arg1];
        },
        __wbg_set_address_mode_v_8366e992c3ec2680: function(arg0, arg1) {
            arg0.addressModeV = __wbindgen_enum_GpuAddressMode[arg1];
        },
        __wbg_set_address_mode_w_53ae7ff9fc27d31b: function(arg0, arg1) {
            arg0.addressModeW = __wbindgen_enum_GpuAddressMode[arg1];
        },
        __wbg_set_alpha_041ea339c691473c: function(arg0, arg1) {
            arg0.alpha = arg1;
        },
        __wbg_set_alpha_mode_edf7c742eee7ac74: function(arg0, arg1) {
            arg0.alphaMode = __wbindgen_enum_GpuCanvasAlphaMode[arg1];
        },
        __wbg_set_alpha_to_coverage_enabled_66b16e2395f2145a: function(arg0, arg1) {
            arg0.alphaToCoverageEnabled = arg1 !== 0;
        },
        __wbg_set_array_layer_count_f652f75c2d85d00b: function(arg0, arg1) {
            arg0.arrayLayerCount = arg1 >>> 0;
        },
        __wbg_set_array_stride_f64_d4a555ef4287a90a: function(arg0, arg1) {
            arg0.arrayStride = arg1;
        },
        __wbg_set_aspect_0820f36ab69e69c7: function(arg0, arg1) {
            arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        },
        __wbg_set_aspect_4eaf6e4f871485aa: function(arg0, arg1) {
            arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        },
        __wbg_set_attributes_6753fa3eefb33349: function(arg0, arg1, arg2) {
            arg0.attributes = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_b_1f0c9c5f62003b93: function(arg0, arg1) {
            arg0.b = arg1;
        },
        __wbg_set_base_array_layer_766baefe617e7450: function(arg0, arg1) {
            arg0.baseArrayLayer = arg1 >>> 0;
        },
        __wbg_set_base_mip_level_6c4e57453fe07edf: function(arg0, arg1) {
            arg0.baseMipLevel = arg1 >>> 0;
        },
        __wbg_set_bcb0ec2400cfa22e: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_set_beginning_of_pass_write_index_bda54c444871cf36: function(arg0, arg1) {
            arg0.beginningOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_beginning_of_pass_write_index_ce26d46a975d94e3: function(arg0, arg1) {
            arg0.beginningOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_bind_group_layouts_78efad321b8db306: function(arg0, arg1, arg2) {
            arg0.bindGroupLayouts = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_binding_49121810d92bb656: function(arg0, arg1) {
            arg0.binding = arg1 >>> 0;
        },
        __wbg_set_binding_921af47b178839b7: function(arg0, arg1) {
            arg0.binding = arg1 >>> 0;
        },
        __wbg_set_blend_9b68fe4192551c11: function(arg0, arg1) {
            arg0.blend = arg1;
        },
        __wbg_set_buffer_e254d16772ccdf1f: function(arg0, arg1) {
            arg0.buffer = arg1;
        },
        __wbg_set_buffer_f0412de54dad59a0: function(arg0, arg1) {
            arg0.buffer = arg1;
        },
        __wbg_set_buffers_4bae4e561a9fa5bc: function(arg0, arg1, arg2) {
            arg0.buffers = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_bytes_per_row_2edc74cba6ac1b69: function(arg0, arg1) {
            arg0.bytesPerRow = arg1 >>> 0;
        },
        __wbg_set_cache_7a23201e29cbd632: function(arg0, arg1) {
            arg0.cache = __wbindgen_enum_RequestCache[arg1];
        },
        __wbg_set_clear_value_gpu_color_dict_b12131c44b7f5a0b: function(arg0, arg1) {
            arg0.clearValue = arg1;
        },
        __wbg_set_code_71b4a924b594417d: function(arg0, arg1, arg2) {
            arg0.code = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_color_173beb3f62e0fe38: function(arg0, arg1) {
            arg0.color = arg1;
        },
        __wbg_set_color_attachments_bb683d934e2d6222: function(arg0, arg1, arg2) {
            arg0.colorAttachments = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_compare_1f37d6bc9b4479b5: function(arg0, arg1) {
            arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_compare_9f209c2a21e5f8cc: function(arg0, arg1) {
            arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_compute_6328b3ac805fa957: function(arg0, arg1) {
            arg0.compute = arg1;
        },
        __wbg_set_count_02820c919f8591db: function(arg0, arg1) {
            arg0.count = arg1 >>> 0;
        },
        __wbg_set_count_c31ce44133f5b28b: function(arg0, arg1) {
            arg0.count = arg1 >>> 0;
        },
        __wbg_set_cull_mode_2571e6256445d311: function(arg0, arg1) {
            arg0.cullMode = __wbindgen_enum_GpuCullMode[arg1];
        },
        __wbg_set_depth_bias_9ff79c074fab3395: function(arg0, arg1) {
            arg0.depthBias = arg1;
        },
        __wbg_set_depth_bias_clamp_b9dfc0449214a137: function(arg0, arg1) {
            arg0.depthBiasClamp = arg1;
        },
        __wbg_set_depth_bias_slope_scale_bacfbadca941fcf5: function(arg0, arg1) {
            arg0.depthBiasSlopeScale = arg1;
        },
        __wbg_set_depth_clear_value_bbfc087b5b4b6d06: function(arg0, arg1) {
            arg0.depthClearValue = arg1;
        },
        __wbg_set_depth_compare_706f99d5a7658960: function(arg0, arg1) {
            arg0.depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_depth_fail_op_8cc03f38206b087f: function(arg0, arg1) {
            arg0.depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_depth_load_op_96d40a8e26164544: function(arg0, arg1) {
            arg0.depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_depth_or_array_layers_41d9bf5003084813: function(arg0, arg1) {
            arg0.depthOrArrayLayers = arg1 >>> 0;
        },
        __wbg_set_depth_read_only_8be6458323119975: function(arg0, arg1) {
            arg0.depthReadOnly = arg1 !== 0;
        },
        __wbg_set_depth_stencil_attachment_7a083fe21730d473: function(arg0, arg1) {
            arg0.depthStencilAttachment = arg1;
        },
        __wbg_set_depth_stencil_f138ba545e6cc4d4: function(arg0, arg1) {
            arg0.depthStencil = arg1;
        },
        __wbg_set_depth_store_op_3e7ee4bf89cda835: function(arg0, arg1) {
            arg0.depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_depth_write_enabled_c1ad58fe7207ef11: function(arg0, arg1) {
            arg0.depthWriteEnabled = arg1 !== 0;
        },
        __wbg_set_device_2b7e0e4f69784351: function(arg0, arg1) {
            arg0.device = arg1;
        },
        __wbg_set_dimension_536f245d466cca10: function(arg0, arg1) {
            arg0.dimension = __wbindgen_enum_GpuTextureDimension[arg1];
        },
        __wbg_set_dimension_91e724d498a35c9a: function(arg0, arg1) {
            arg0.dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_dst_factor_9789f02ad2a0c61e: function(arg0, arg1) {
            arg0.dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        },
        __wbg_set_end_of_pass_write_index_4b0931cfb0c1f44c: function(arg0, arg1) {
            arg0.endOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_end_of_pass_write_index_bd996c6cc50b794b: function(arg0, arg1) {
            arg0.endOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_entries_02ae66da25c9ddae: function(arg0, arg1, arg2) {
            arg0.entries = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_entries_8036374af27741dc: function(arg0, arg1, arg2) {
            arg0.entries = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_79bb4d8fb01c97ec: function(arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_89ecd5ddd9c56d5c: function(arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_b4eb7d2dd59b5c76: function(arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_external_texture_34c43368e77cc844: function(arg0, arg1) {
            arg0.externalTexture = arg1;
        },
        __wbg_set_fail_op_e901d7b520ae0e15: function(arg0, arg1) {
            arg0.failOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_format_1d70746424721ed1: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_594ffafc6477f59d: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_781ab1cf2f8f2465: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuVertexFormat[arg1];
        },
        __wbg_set_format_8003fc2174c14359: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_c1603ca98ab9cb13: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_cdccd8422de3c885: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_df8baca64e04f5ef: function(arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_fragment_3635fd557dbd99bc: function(arg0, arg1) {
            arg0.fragment = arg1;
        },
        __wbg_set_front_face_13105806890daab7: function(arg0, arg1) {
            arg0.frontFace = __wbindgen_enum_GpuFrontFace[arg1];
        },
        __wbg_set_g_9d2890d6fb93dba4: function(arg0, arg1) {
            arg0.g = arg1;
        },
        __wbg_set_has_dynamic_offset_0086bc7faede16d1: function(arg0, arg1) {
            arg0.hasDynamicOffset = arg1 !== 0;
        },
        __wbg_set_headers_6d75a7df4eb22716: function(arg0, arg1) {
            arg0.headers = arg1;
        },
        __wbg_set_height_546367a98b9ab695: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_height_ae0610d318c3428c: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_height_ae24c2f7d580ae0a: function(arg0, arg1) {
            arg0.height = arg1 >>> 0;
        },
        __wbg_set_label_0b78f43973577425: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_16858d210dffe9ff: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_1d7c053bc726e08f: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_1e431973068c0ea4: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_2d3e4456ff9a120a: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_39038ba992db5f45: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_5e1a79b630ee9fa3: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_89172d31c03b3375: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_a71d5f5c41bed969: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_d133ac18919ae10f: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_dcaa5d479cbb5311: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_dcb16ec336a5420d: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_e9f1af9890ad68b6: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_ea59541fa72ee985: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_ef8bfd8864e594a4: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_f9171cd5c971dbf2: function(arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_layout_6b757fab7265d0f7: function(arg0, arg1) {
            arg0.layout = arg1;
        },
        __wbg_set_layout_905339a584186697: function(arg0, arg1) {
            arg0.layout = arg1;
        },
        __wbg_set_layout_bfddc4788acb0736: function(arg0, arg1) {
            arg0.layout = arg1;
        },
        __wbg_set_layout_gpu_auto_layout_mode_0e86cf27fd7c9e0c: function(arg0, arg1) {
            arg0.layout = __wbindgen_enum_GpuAutoLayoutMode[arg1];
        },
        __wbg_set_layout_gpu_auto_layout_mode_89827b74212f80b4: function(arg0, arg1) {
            arg0.layout = __wbindgen_enum_GpuAutoLayoutMode[arg1];
        },
        __wbg_set_load_op_9a24b40a8df7115b: function(arg0, arg1) {
            arg0.loadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_lod_max_clamp_c1935a38a79d7f3b: function(arg0, arg1) {
            arg0.lodMaxClamp = arg1;
        },
        __wbg_set_lod_min_clamp_27d01e7c2938fe09: function(arg0, arg1) {
            arg0.lodMinClamp = arg1;
        },
        __wbg_set_mag_filter_657599d734cdc0d9: function(arg0, arg1) {
            arg0.magFilter = __wbindgen_enum_GpuFilterMode[arg1];
        },
        __wbg_set_mapped_at_creation_a4cd55019116b792: function(arg0, arg1) {
            arg0.mappedAtCreation = arg1 !== 0;
        },
        __wbg_set_mask_7a39674fcbc00286: function(arg0, arg1) {
            arg0.mask = arg1 >>> 0;
        },
        __wbg_set_max_anisotropy_b05f95dcdfdae8bb: function(arg0, arg1) {
            arg0.maxAnisotropy = arg1;
        },
        __wbg_set_method_639e69af35614d36: function(arg0, arg1, arg2) {
            arg0.method = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_min_binding_size_f64_2458ad9bffad7ea7: function(arg0, arg1) {
            arg0.minBindingSize = arg1;
        },
        __wbg_set_min_filter_93e33f778b66ecb0: function(arg0, arg1) {
            arg0.minFilter = __wbindgen_enum_GpuFilterMode[arg1];
        },
        __wbg_set_mip_level_count_19560e4f63320832: function(arg0, arg1) {
            arg0.mipLevelCount = arg1 >>> 0;
        },
        __wbg_set_mip_level_count_ef313d3a441aa51e: function(arg0, arg1) {
            arg0.mipLevelCount = arg1 >>> 0;
        },
        __wbg_set_mip_level_dbdf4ee3ba07c689: function(arg0, arg1) {
            arg0.mipLevel = arg1 >>> 0;
        },
        __wbg_set_mipmap_filter_aacb60d49a794ef5: function(arg0, arg1) {
            arg0.mipmapFilter = __wbindgen_enum_GpuMipmapFilterMode[arg1];
        },
        __wbg_set_mode_73d9eb9243253108: function(arg0, arg1) {
            arg0.mode = __wbindgen_enum_GpuCanvasToneMappingMode[arg1];
        },
        __wbg_set_module_85e1d5368a2b9422: function(arg0, arg1) {
            arg0.module = arg1;
        },
        __wbg_set_module_bffb3e27ccc03d8d: function(arg0, arg1) {
            arg0.module = arg1;
        },
        __wbg_set_module_c746beebaa6ede01: function(arg0, arg1) {
            arg0.module = arg1;
        },
        __wbg_set_multisample_7471ab77b8e5a567: function(arg0, arg1) {
            arg0.multisample = arg1;
        },
        __wbg_set_multisampled_d385dcc24cbcdac9: function(arg0, arg1) {
            arg0.multisampled = arg1 !== 0;
        },
        __wbg_set_offset_f64_106ac70d42ed0b22: function(arg0, arg1) {
            arg0.offset = arg1;
        },
        __wbg_set_offset_f64_b1157147188cb175: function(arg0, arg1) {
            arg0.offset = arg1;
        },
        __wbg_set_offset_f64_f65aa794a52b87dc: function(arg0, arg1) {
            arg0.offset = arg1;
        },
        __wbg_set_onuncapturederror_1a772a1feba5ec1d: function(arg0, arg1) {
            arg0.onuncapturederror = arg1;
        },
        __wbg_set_operation_b82c9485304b393c: function(arg0, arg1) {
            arg0.operation = __wbindgen_enum_GpuBlendOperation[arg1];
        },
        __wbg_set_origin_gpu_origin_3d_dict_c2b5dc3bd3763139: function(arg0, arg1) {
            arg0.origin = arg1;
        },
        __wbg_set_pass_op_3b1d192c54b1a827: function(arg0, arg1) {
            arg0.passOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_power_preference_06107ba643e66249: function(arg0, arg1) {
            arg0.powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
        },
        __wbg_set_primitive_14377cb8cbd23584: function(arg0, arg1) {
            arg0.primitive = arg1;
        },
        __wbg_set_query_set_a1af7e0b244eb437: function(arg0, arg1) {
            arg0.querySet = arg1;
        },
        __wbg_set_query_set_da20f7d5b37c78e1: function(arg0, arg1) {
            arg0.querySet = arg1;
        },
        __wbg_set_r_473d4bd5f6ddbe44: function(arg0, arg1) {
            arg0.r = arg1;
        },
        __wbg_set_required_features_ef8aeb4d5f909e03: function(arg0, arg1, arg2) {
            arg0.requiredFeatures = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_required_limits_a80a53fd4744ccb2: function(arg0, arg1) {
            arg0.requiredLimits = arg1;
        },
        __wbg_set_resolve_target_gpu_texture_view_6c8f66cd96330a45: function(arg0, arg1) {
            arg0.resolveTarget = arg1;
        },
        __wbg_set_resource_d37005b6a3d3375f: function(arg0, arg1) {
            arg0.resource = arg1;
        },
        __wbg_set_resource_gpu_buffer_binding_8e9be21bc9a45330: function(arg0, arg1) {
            arg0.resource = arg1;
        },
        __wbg_set_resource_gpu_texture_view_e3bf3810e7168d2b: function(arg0, arg1) {
            arg0.resource = arg1;
        },
        __wbg_set_rows_per_image_e9f4da51b05f4ee1: function(arg0, arg1) {
            arg0.rowsPerImage = arg1 >>> 0;
        },
        __wbg_set_sample_count_a4d54cf5bcf23914: function(arg0, arg1) {
            arg0.sampleCount = arg1 >>> 0;
        },
        __wbg_set_sample_type_660a4d77497517e2: function(arg0, arg1) {
            arg0.sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
        },
        __wbg_set_sampler_35b5b2e68532815b: function(arg0, arg1) {
            arg0.sampler = arg1;
        },
        __wbg_set_search_79a1604a24707ef7: function(arg0, arg1, arg2) {
            arg0.search = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_shader_location_e0fdb186c91ac5df: function(arg0, arg1) {
            arg0.shaderLocation = arg1 >>> 0;
        },
        __wbg_set_size_f64_04b949f2af8176ba: function(arg0, arg1) {
            arg0.size = arg1;
        },
        __wbg_set_size_f64_2418f77508fb05d7: function(arg0, arg1) {
            arg0.size = arg1;
        },
        __wbg_set_size_gpu_extent_3d_dict_7180918365da46d5: function(arg0, arg1) {
            arg0.size = arg1;
        },
        __wbg_set_src_factor_e72cbac8c7084adc: function(arg0, arg1) {
            arg0.srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        },
        __wbg_set_stencil_back_4df76dba55137aa9: function(arg0, arg1) {
            arg0.stencilBack = arg1;
        },
        __wbg_set_stencil_clear_value_686c18ee265a672c: function(arg0, arg1) {
            arg0.stencilClearValue = arg1 >>> 0;
        },
        __wbg_set_stencil_front_ec8c0eedf46d4973: function(arg0, arg1) {
            arg0.stencilFront = arg1;
        },
        __wbg_set_stencil_load_op_1bce6d97f680eda7: function(arg0, arg1) {
            arg0.stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_stencil_read_mask_1f242f58d95e02e1: function(arg0, arg1) {
            arg0.stencilReadMask = arg1 >>> 0;
        },
        __wbg_set_stencil_read_only_50c3a3b3cbdc83c1: function(arg0, arg1) {
            arg0.stencilReadOnly = arg1 !== 0;
        },
        __wbg_set_stencil_store_op_9703f525bc5e8e0c: function(arg0, arg1) {
            arg0.stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_stencil_write_mask_463f4b6208354e15: function(arg0, arg1) {
            arg0.stencilWriteMask = arg1 >>> 0;
        },
        __wbg_set_step_mode_c10a50b921560088: function(arg0, arg1) {
            arg0.stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
        },
        __wbg_set_storage_texture_c2ed1f3eb327112e: function(arg0, arg1) {
            arg0.storageTexture = arg1;
        },
        __wbg_set_store_op_e3edba4d13e36cbf: function(arg0, arg1) {
            arg0.storeOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_strip_index_format_a7cb0b950f8653f8: function(arg0, arg1) {
            arg0.stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
        },
        __wbg_set_targets_b24b23a20f1c7f7f: function(arg0, arg1, arg2) {
            arg0.targets = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_texture_39ac35f54ef4c3ba: function(arg0, arg1) {
            arg0.texture = arg1;
        },
        __wbg_set_texture_c89ca659682f2fd6: function(arg0, arg1) {
            arg0.texture = arg1;
        },
        __wbg_set_timestamp_writes_90e77f617d9af260: function(arg0, arg1) {
            arg0.timestampWrites = arg1;
        },
        __wbg_set_timestamp_writes_9fd1c7b5cb0a6a5c: function(arg0, arg1) {
            arg0.timestampWrites = arg1;
        },
        __wbg_set_tone_mapping_92c0666fef742c68: function(arg0, arg1) {
            arg0.toneMapping = arg1;
        },
        __wbg_set_topology_ed2942658d3771ab: function(arg0, arg1) {
            arg0.topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
        },
        __wbg_set_type_4f916b69d83408df: function(arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuQueryType[arg1];
        },
        __wbg_set_type_6cc967b44400577b: function(arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuSamplerBindingType[arg1];
        },
        __wbg_set_type_dd6c71bc279b420e: function(arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuBufferBindingType[arg1];
        },
        __wbg_set_unclipped_depth_f24953dc0eb8c84c: function(arg0, arg1) {
            arg0.unclippedDepth = arg1 !== 0;
        },
        __wbg_set_usage_1d663151adcb7f1a: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_usage_63cd5e88050b26e8: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_usage_6c4bd5f209a0579c: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_usage_a65753b69e218ec9: function(arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        },
        __wbg_set_vertex_b8cfd3671e5edfbb: function(arg0, arg1) {
            arg0.vertex = arg1;
        },
        __wbg_set_view_dimension_ce6e77a9eb67aa53: function(arg0, arg1) {
            arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_view_dimension_d5c87d8c6f1266b5: function(arg0, arg1) {
            arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_view_formats_8b40d61be4d5be29: function(arg0, arg1, arg2) {
            arg0.viewFormats = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_view_formats_ea87e3d240842107: function(arg0, arg1, arg2) {
            arg0.viewFormats = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_view_gpu_texture_view_bf636cc659953b65: function(arg0, arg1) {
            arg0.view = arg1;
        },
        __wbg_set_view_gpu_texture_view_d53664457085e78b: function(arg0, arg1) {
            arg0.view = arg1;
        },
        __wbg_set_visibility_f68d6576737b8b45: function(arg0, arg1) {
            arg0.visibility = arg1 >>> 0;
        },
        __wbg_set_width_5f89a551b5472887: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_set_width_eb3001e1dcabb909: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_set_width_fc76d04c0309b403: function(arg0, arg1) {
            arg0.width = arg1 >>> 0;
        },
        __wbg_set_write_mask_51378295d978a0f8: function(arg0, arg1) {
            arg0.writeMask = arg1 >>> 0;
        },
        __wbg_set_x_aa58610e8a2b3347: function(arg0, arg1) {
            arg0.x = arg1 >>> 0;
        },
        __wbg_set_y_6a3e943d5ad07e0d: function(arg0, arg1) {
            arg0.y = arg1 >>> 0;
        },
        __wbg_set_z_dc1a88e5f0e1508d: function(arg0, arg1) {
            arg0.z = arg1 >>> 0;
        },
        __wbg_static_accessor_GLOBAL_THIS_003ee833af9699fc: function() {
            const ret = typeof globalThis === 'undefined' ? undefined : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_e4293fb22cbe77da: function() {
            const ret = typeof global === 'undefined' ? undefined : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_53bb20457401453d: function() {
            const ret = typeof self === 'undefined' ? undefined : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_b5e0810bfecb7feb: function() {
            const ret = typeof window === 'undefined' ? undefined : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_status_cb85b6c8d1769fa1: function(arg0) {
            const ret = arg0.status;
            return ret;
        },
        __wbg_streamablebot_new: function(arg0) {
            const ret = StreamableBot.__wrap(arg0);
            return ret;
        },
        __wbg_streamablemap_new: function(arg0) {
            const ret = StreamableMap.__wrap(arg0);
            return ret;
        },
        __wbg_submit_c4379e221512d3fa: function(arg0, arg1, arg2) {
            arg0.submit(getArrayJsValueViewFromWasm0(arg1, arg2));
        },
        __wbg_text_5240eb2c41de8292: function() { return handleError(function (arg0) {
            const ret = arg0.text();
            return ret;
        }, arguments); },
        __wbg_texturejob_new: function(arg0) {
            const ret = TextureJob.__wrap(arg0);
            return ret;
        },
        __wbg_then_3a4f899454bcf8c9: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_then_656f253a5dd7d8ea: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_e3f7f2d365708be8: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_toString_4d043badaf1f4f69: function(arg0) {
            const ret = arg0.toString();
            return ret;
        },
        __wbg_toString_55ffdf586349746b: function(arg0) {
            const ret = arg0.toString();
            return ret;
        },
        __wbg_unconfigure_7ca436ff70c0bcc3: function(arg0) {
            arg0.unconfigure();
        },
        __wbg_unmap_073211b910c6a369: function(arg0) {
            arg0.unmap();
        },
        __wbg_url_1be993c7b186415b: function(arg0, arg1) {
            const ret = arg1.url;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg_userAgent_a20b4771d027eeaa: function() { return handleError(function (arg0, arg1) {
            const ret = arg1.userAgent;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_valueOf_2ad4a09774ac959e: function(arg0) {
            const ret = arg0.valueOf();
            return ret;
        },
        __wbg_width_babc5dc7654771b1: function(arg0) {
            const ret = arg0.width;
            return ret;
        },
        __wbg_writeBuffer_dbc00ede89a23b5e: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
        }, arguments); },
        __wbg_writeTexture_ddcddb10ef4a4155: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.writeTexture(arg1, getArrayU8FromWasm0(arg2, arg3), arg4, arg5);
        }, arguments); },
        __wbindgen_generic_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 312, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_3412);
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUDevice")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_2056);
            return ret;
        },
        __wbindgen_generic_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUDeviceLostInfo")], shim_idx: 254, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_2061);
            return ret;
        },
        __wbindgen_generic_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPURenderPipeline")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_2056_201);
            return ret;
        },
        __wbindgen_generic_0000000000000005: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUUncapturedErrorEvent")], shim_idx: 254, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_2061_202);
            return ret;
        },
        __wbindgen_generic_0000000000000006: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("any")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_2056_203);
            return ret;
        },
        __wbindgen_generic_0000000000000007: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("undefined")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_2056_204);
            return ret;
        },
        __wbindgen_generic_0000000000000008: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000009: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_generic_000000000000000a: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            table.set(0, undefined);
            table.set(1024, undefined);
            table.set(1025, null);
            table.set(1026, true);
            table.set(1027, false);
        },
    };
    return {
        __proto__: null,
        "./strafesnet_roblox_bot_player_wasm_module_bg.js": import0,
    };
}

function __wasm_bindgen_func_elem_2061(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_2061(arg0, arg1, arg2);
}

function __wasm_bindgen_func_elem_2061_202(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_2061_202(arg0, arg1, arg2);
}

function __wasm_bindgen_func_elem_3429(arg0, arg1, arg2, arg3) {
    wasm.__wasm_bindgen_func_elem_3429(arg0, arg1, arg2, arg3);
}

function __wasm_bindgen_func_elem_3412(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
        wasm.__wasm_bindgen_func_elem_3412(retptr, arg0, arg1, arg2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeFromExternrefTable0(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_2056(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
        wasm.__wasm_bindgen_func_elem_2056(retptr, arg0, arg1, arg2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeFromExternrefTable0(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_2056_201(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
        wasm.__wasm_bindgen_func_elem_2056_201(retptr, arg0, arg1, arg2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeFromExternrefTable0(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_2056_203(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
        wasm.__wasm_bindgen_func_elem_2056_203(retptr, arg0, arg1, arg2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeFromExternrefTable0(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_2056_204(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16) >>> 0;
        wasm.__wasm_bindgen_func_elem_2056_204(retptr, arg0, arg1, arg2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeFromExternrefTable0(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}


const __wbindgen_enum_GpuAddressMode = ["clamp-to-edge", "repeat", "mirror-repeat"];


const __wbindgen_enum_GpuAutoLayoutMode = ["auto"];


const __wbindgen_enum_GpuBlendFactor = ["zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant", "src1", "one-minus-src1", "src1-alpha", "one-minus-src1-alpha"];


const __wbindgen_enum_GpuBlendOperation = ["add", "subtract", "reverse-subtract", "min", "max"];


const __wbindgen_enum_GpuBufferBindingType = ["uniform", "storage", "read-only-storage"];


const __wbindgen_enum_GpuCanvasAlphaMode = ["opaque", "premultiplied"];


const __wbindgen_enum_GpuCanvasToneMappingMode = ["standard", "extended"];


const __wbindgen_enum_GpuCompareFunction = ["never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always"];


const __wbindgen_enum_GpuCullMode = ["none", "front", "back"];


const __wbindgen_enum_GpuDeviceLostReason = ["unknown", "destroyed"];


const __wbindgen_enum_GpuFilterMode = ["nearest", "linear"];


const __wbindgen_enum_GpuFrontFace = ["ccw", "cw"];


const __wbindgen_enum_GpuIndexFormat = ["uint16", "uint32"];


const __wbindgen_enum_GpuLoadOp = ["load", "clear"];


const __wbindgen_enum_GpuMipmapFilterMode = ["nearest", "linear"];


const __wbindgen_enum_GpuPipelineErrorReason = ["validation", "internal"];


const __wbindgen_enum_GpuPowerPreference = ["low-power", "high-performance"];


const __wbindgen_enum_GpuPrimitiveTopology = ["point-list", "line-list", "line-strip", "triangle-list", "triangle-strip"];


const __wbindgen_enum_GpuQueryType = ["occlusion", "timestamp"];


const __wbindgen_enum_GpuSamplerBindingType = ["filtering", "non-filtering", "comparison"];


const __wbindgen_enum_GpuStencilOperation = ["keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap"];


const __wbindgen_enum_GpuStorageTextureAccess = ["write-only", "read-only", "read-write"];


const __wbindgen_enum_GpuStoreOp = ["store", "discard"];


const __wbindgen_enum_GpuTextureAspect = ["all", "stencil-only", "depth-only"];


const __wbindgen_enum_GpuTextureDimension = ["1d", "2d", "3d"];


const __wbindgen_enum_GpuTextureFormat = ["r8unorm", "r8snorm", "r8uint", "r8sint", "r16unorm", "r16snorm", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32uint", "r32sint", "r32float", "rg16unorm", "rg16snorm", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb9e5ufloat", "rgb10a2uint", "rgb10a2unorm", "rg11b10ufloat", "rg32uint", "rg32sint", "rg32float", "rgba16unorm", "rgba16snorm", "rgba16uint", "rgba16sint", "rgba16float", "rgba32uint", "rgba32sint", "rgba32float", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb"];


const __wbindgen_enum_GpuTextureSampleType = ["float", "unfilterable-float", "depth", "sint", "uint"];


const __wbindgen_enum_GpuTextureViewDimension = ["1d", "2d", "2d-array", "cube", "cube-array", "3d"];


const __wbindgen_enum_GpuVertexFormat = ["uint8", "uint8x2", "uint8x4", "sint8", "sint8x2", "sint8x4", "unorm8", "unorm8x2", "unorm8x4", "snorm8", "snorm8x2", "snorm8x4", "uint16", "uint16x2", "uint16x4", "sint16", "sint16x2", "sint16x4", "unorm16", "unorm16x2", "unorm16x4", "snorm16", "snorm16x2", "snorm16x4", "float16", "float16x2", "float16x4", "float32", "float32x2", "float32x3", "float32x4", "uint32", "uint32x2", "uint32x3", "uint32x4", "sint32", "sint32x2", "sint32x3", "sint32x4", "unorm10-10-10-2", "unorm8x4-bgra"];


const __wbindgen_enum_GpuVertexStepMode = ["vertex", "instance"];


const __wbindgen_enum_RequestCache = ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"];
const BotBlockDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_botblockdata_free(ptr, 1));
const BotBlockRangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_botblockrange_free(ptr, 1));
const BotDownloaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_botdownloader_free(ptr, 1));
const BvhFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_bvh_free(ptr, 1));
const CheckpointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_checkpoint_free(ptr, 1));
const CompleteBotFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_completebot_free(ptr, 1));
const CompleteHeadFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_completehead_free(ptr, 1));
const DeferredJobsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_deferredjobs_free(ptr, 1));
const DownloadBotBlockRangeErrorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_downloadbotblockrangeerror_free(ptr, 1));
const DownloadMapBlockRangeErrorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_downloadmapblockrangeerror_free(ptr, 1));
const FrameBlendFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frameblend_free(ptr, 1));
const GraphicsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_graphics_free(ptr, 1));
const GraphicsAndSurfaceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_graphicsandsurface_free(ptr, 1));
const JumpStatsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_jumpstats_free(ptr, 1));
const LightmapChunkJobFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lightmapchunkjob_free(ptr, 1));
const MapBlockDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mapblockdata_free(ptr, 1));
const MapBlockRangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mapblockrange_free(ptr, 1));
const MapDownloaderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mapdownloader_free(ptr, 1));
const ModelPreparerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_modelpreparer_free(ptr, 1));
const RangeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_range_free(ptr, 1));
const StreamableBotFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamablebot_free(ptr, 1));
const StreamableBotStatsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamablebotstats_free(ptr, 1));
const StreamableHeadFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamablehead_free(ptr, 1));
const StreamableMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamablemap_free(ptr, 1));
const StreamableMapStatsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamablemapstats_free(ptr, 1));
const StreamableSessionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_streamablesession_free(ptr, 1));
const SurfaceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_surface_free(ptr, 1));
const TextureJobFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_texturejob_free(ptr, 1));
const TranscodedTextureFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_transcodedtexture_free(ptr, 1));
const Vector3Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vector3_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__wbindgen_export5();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_export6(state.a, state.b));

function debugString(val) {
    switch (typeof val) {
        // primitive types
        case 'number':
        case 'boolean':
        case 'undefined':
        return `${val}`;
        case 'string':
        return JSON.stringify(val);
        case 'bigint':
        return `${val}n`;
        case 'symbol':
        return val.description !== undefined
            ? `Symbol(${val.description})`
            : 'Symbol';
        case 'function':
        return typeof val.name === 'string' && val.name !== ''
            ? `Function(${val.name})`
            : 'Function';
        case 'object': {
            if (val === null) {
                return 'null';
            }
            // objects
            if (Array.isArray(val)) {
                return '[' + Array.from(val, debugString).join(', ') + ']';
            }
            // errors
            if (val instanceof Error) {
                return `${val.name}: ${val.message}\n${val.stack}`;
            }

            const toStringOutput = toString.call(val);
            // Test for built-in
            const className = /\[object ([^\]]+)\]/.exec(toStringOutput)?.[1];

            // Failed to match the standard '[object ClassName]'
            if (className === undefined) {
                return toStringOutput;
            }
            if (className === 'Object') {
                // we're a user defined class or Object
                // JSON.stringify avoids problems with cycles, and is generally much
                // easier than looping through ownProperties of `val`.
                try {
                    return 'Object(' + JSON.stringify(val) + ')';
                } catch (_) {
                    return 'Object';
                }
            }
            // TODO we could test for more things here, like `Set`s and `Map`s.
            return className;
        }
        // Per MDN: 'This list of values is exhaustive.'
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#description
    }
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__wbindgen_export7(ptr, len);
    return result;
}

function getArrayJsValueViewFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    return result;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_export4(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_export6(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__wbindgen_export8(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
    numBytesDecoded += bytes.length;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
        cachedTextDecoder.decode();
        numBytesDecoded = bytes.length;
    }
    return cachedTextDecoder.decode(bytes);
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

let __wbg_init_promise;
async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (__wbg_init_promise === undefined) {
        __wbg_init_promise = __wbg_init_once(module_or_path);
        __wbg_init_promise.catch(() => { __wbg_init_promise = undefined; });
    }
    return __wbg_init_promise;
}

async function __wbg_init_once(module_or_path) {

    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('strafesnet_roblox_bot_player_wasm_module_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
