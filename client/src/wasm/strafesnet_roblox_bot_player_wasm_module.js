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
        return takeObject(ret);
    }
    /**
     * @returns {Promise<CompleteBot>}
     */
    get_complete_bot() {
        const ret = wasm.botdownloader_get_complete_bot(this.__wbg_ptr);
        return takeObject(ret);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
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
     * @returns {number}
     */
    duration() {
        const ret = wasm.completebot_duration(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Uint8Array} data
     */
    constructor(data) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.completebot_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.completebot_run_duration(retptr, this.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getFloat64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.deferredjobs_take_geometry(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.deferredjobs_take_lightmap_chunks(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export5(r0, r1 * 4, 4);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.deferredjobs_take_textures(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export5(r0, r1 * 4, 4);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
     * The last render_session's camera as a render-snfm view, as one line, or undefined before one.
     * @returns {string | undefined}
     */
    camera_stats() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphics_camera_stats(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1);
                wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphics_debug_info(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export5(deferred1_0, deferred1_1, 1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphics_frame_stats(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export5(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * The average GPU time of the frames rendered since the last call, as one line,
     * or undefined on devices without timestamp queries or before any frame was timed.
     * @returns {string | undefined}
     */
    gpu_stats() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphics_gpu_stats(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1);
                wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
     * @param {HTMLCanvasElement} canvas
     * @returns {Surface}
     */
    new_surface(canvas) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphics_new_surface(retptr, this.__wbg_ptr, addHeapObject(canvas));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
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
     * Leaves parts of the frame out, to find which one a device's GPU driver fails on: a comma-separated list of hzb
     * (occlusion culling's depth-only pass, depth pyramid and second cull), its parts depthpass (the depth-only pass's
     * draws), hzbbuild (building the depth pyramid), occlusiontest (the second cull reading it) and seethrough (hiding
     * see-through models behind it), which each leave nothing hidden by it, cullpass (the compute pass culling
     * opaque models: every model in view drawn at full detail), indirect (indirect draws: plain draws instead, while any
     * cull pass still runs), cull (both), cullwork (the cull pass's threads return at once), atomics (the cull pass stores
     * whether each cluster is in view instead of listing it with atomic adds; with indirect draws these two draw no
     * opaque models), argcopy (the cull's draw counts start over from a queue write instead of a copy; these three also
     * leave out hzb and shadows), sharedargs (indirect draws read a copy of the culls' draw counts, in a buffer only
     * they use), onesubmit (the camera's cull is submitted on its own before the frame; leaves out hzb and shadows),
     * drawcounts (no cull pass, and indirect draws of no vertices, so no opaque models), shadows, timestamps (GPU timing, so
     * gpu_stats stays undefined), glow (the blur), its parts glowdownsample (picking the bright part of the frame, so no glow)
     * and glowblur (the two blur passes, so the glow is unblurred), transparent and lightmap. Without cullpass or
     * indirect there are no shadows or hzb either. Call once, before rendering; parts left out stay out until the page
     * reloads.
     * @param {string} without
     */
    set_diagnostics(without) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(without, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len0 = WASM_VECTOR_LEN;
            wasm.graphics_set_diagnostics(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Use a preset's settings, replacing any set one by one like the light distance. The default is Medium.
     * Only High uses 4x anti-aliasing and darkens corners with ambient occlusion. Low also skips sky reflections,
     * material normal maps, lighting pixels by local lights one by one and see-through shadows, softens shadow edges
     * and slanted textures less, and blurs the glow more coarsely.
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
     * GPU errors since the last call, oldest first.
     * WebGPU reports validation errors (like a shader the browser can't compile) and device loss
     * without throwing, and the frame just stays black, so poll this to show them.
     * @returns {string[]}
     */
    take_errors() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.graphics_take_errors(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1);
            wasm.__wbindgen_export5(r0, r1 * 4, 4);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lightmapchunkjob_take_compressed(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
        return takeObject(ret);
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
     * @param {Uint8Array} context
     */
    constructor(context) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(context, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.modelpreparer_new(retptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
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
     * @param {Uint8Array} geometry
     * @returns {Uint8Array}
     */
    prepare(geometry) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(geometry, wasm.__wbindgen_export);
            const len0 = WASM_VECTOR_LEN;
            wasm.modelpreparer_prepare(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
            }
            var v2 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
     * @param {BotBlockData} arg0
     */
    ingest(arg0) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(arg0, BotBlockData);
            var ptr0 = arg0.__destroy_into_raw();
            wasm.streamablebot_ingest(retptr, this.__wbg_ptr, ptr0);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.streamablebot_ranges(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 8, 8);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.streamablebot_run_duration(retptr, this.__wbg_ptr, mode_id);
            var r0 = getDataViewMemory0().getFloat64(retptr + 8 * 0, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
            if (r3) {
                throw takeObject(r2);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(bot, StreamableBot);
            wasm.streamablehead_new(retptr, bot.__wbg_ptr, bot_time);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(bot, StreamableBot);
            wasm.streamablehead_set_time(retptr, this.__wbg_ptr, bot.__wbg_ptr, bot_time);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
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
     * @param {Uint8Array} compressed
     * @param {Uint8Array | null} [prepared]
     */
    insert_lightmap_chunk(region_id, compressed, prepared) {
        const ptr0 = passArray8ToWasm0(compressed, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(prepared) ? 0 : passArray8ToWasm0(prepared, wasm.__wbindgen_export);
        var len1 = WASM_VECTOR_LEN;
        wasm.streamablemap_insert_lightmap_chunk(this.__wbg_ptr, region_id, ptr0, len0, ptr1, len1);
    }
    /**
     * Add regions from ModelPreparer.prepare. Do this before promote_ready_assets. False if any were from a mismatched
     * worker build, and those regions are never drawn.
     * @param {Uint8Array} prepared
     * @returns {boolean}
     */
    insert_prepared_regions(prepared) {
        const ptr0 = passArray8ToWasm0(prepared, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.streamablemap_insert_prepared_regions(this.__wbg_ptr, ptr0, len0);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.streamablemap_preparer_context(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.texturejob_take_data(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
     * @param {Uint8Array} data
     */
    constructor(texture_id, width, height, mip_level_count, format, coverage_alpha, data) {
        const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.transcodedtexture_new(texture_id, width, height, mip_level_count, format, coverage_alpha, ptr0, len0);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.transcodedtexture_take_data(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
    return takeObject(ret);
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
    return takeObject(ret);
}

/**
 * Decompress a lightmap chunk from a LightmapChunkJob and lay it out as it goes on the GPU, as bytes for
 * StreamableMap.insert_lightmap_chunk. This is the slow part of a lightmap chunk, and it needs no Graphics, so it can
 * run in a web worker.
 * @param {Uint8Array} compressed
 * @returns {Uint8Array}
 */
export function prepare_lightmap_chunk(compressed) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(compressed, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.prepare_lightmap_chunk(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        if (r3) {
            throw takeObject(r2);
        }
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export5(r0, r1 * 1, 1);
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
    const ret = wasm.setup_graphics(addHeapObject(canvas));
    return takeObject(ret);
}

/**
 * Transcode a texture file from a TextureJob into a format the device supports
 * (`texture_support` from Graphics.texture_support). This is the slow part of loading a map,
 * and it needs no Graphics, so it can run in a web worker.
 * A file which fails to load becomes the missing texture checkerboard.
 * @param {number} texture_id
 * @param {Uint8Array} data
 * @param {number} texture_support
 * @returns {TranscodedTexture}
 */
export function transcode_texture(texture_id, data, texture_support) {
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.transcode_texture(texture_id, ptr0, len0, texture_support);
    return TranscodedTexture.__wrap(ret);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_30c8987f7c2ed4e2: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        },
        __wbg_Window_e6de206fcec1f90b: function(arg0) {
            const ret = getObject(arg0).Window;
            return addHeapObject(ret);
        },
        __wbg_WorkerGlobalScope_5b1c3fa5eed8a42d: function(arg0) {
            const ret = getObject(arg0).WorkerGlobalScope;
            return addHeapObject(ret);
        },
        __wbg___wbindgen_debug_string_4687d8d8c2017d52: function(arg0, arg1) {
            const ret = debugString(getObject(arg1));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_1f9d30630b8b1d3d: function(arg0) {
            const ret = typeof(getObject(arg0)) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_e343b7d08827ba72: function(arg0) {
            const ret = getObject(arg0) === null;
            return ret;
        },
        __wbg___wbindgen_is_string_90b56bc79aad6f6c: function(arg0) {
            const ret = typeof(getObject(arg0)) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_8865fb403f8fe9d8: function(arg0) {
            const ret = getObject(arg0) === undefined;
            return ret;
        },
        __wbg___wbindgen_string_get_0380ccaa2f57f0d9: function(arg0, arg1) {
            const obj = getObject(arg1);
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_dcc1a90847f04c41: function(arg0) {
            getObject(arg0)._wbg_cb_unref();
        },
        __wbg_arrayBuffer_f07be74819944ea2: function() { return handleError(function (arg0) {
            const ret = getObject(arg0).arrayBuffer();
            return addHeapObject(ret);
        }, arguments); },
        __wbg_beginComputePass_b3bb1a69e6a70bde: function(arg0, arg1) {
            const ret = getObject(arg0).beginComputePass(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_beginRenderPass_0d07417115f8f7c8: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).beginRenderPass(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_botblockdata_new: function(arg0) {
            const ret = BotBlockData.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_call_187d372bd5fdd4aa: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_completebot_new: function(arg0) {
            const ret = CompleteBot.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_configure_f99faab92b5e744d: function() { return handleError(function (arg0, arg1) {
            getObject(arg0).configure(getObject(arg1));
        }, arguments); },
        __wbg_copyBufferToBuffer_7b074d535b0f5d07: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).copyBufferToBuffer(getObject(arg1), arg2, getObject(arg3), arg4, arg5);
        }, arguments); },
        __wbg_copyBufferToBuffer_e590dbbb1f6af2a1: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).copyBufferToBuffer(getObject(arg1), arg2, getObject(arg3), arg4);
        }, arguments); },
        __wbg_createBindGroupLayout_45e16e6a488ebf6b: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).createBindGroupLayout(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_createBindGroup_ec4dc4d9e46e1104: function(arg0, arg1) {
            const ret = getObject(arg0).createBindGroup(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createBuffer_9f4e696755111e6a: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).createBuffer(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_createCommandEncoder_a5136f45baaba888: function(arg0, arg1) {
            const ret = getObject(arg0).createCommandEncoder(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createComputePipeline_6a05383609fddac6: function(arg0, arg1) {
            const ret = getObject(arg0).createComputePipeline(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createPipelineLayout_a955ff1e35a63634: function(arg0, arg1) {
            const ret = getObject(arg0).createPipelineLayout(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createQuerySet_fc2971127161e550: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).createQuerySet(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_createRenderPipelineAsync_b00fe5e332264ff7: function(arg0, arg1) {
            const ret = getObject(arg0).createRenderPipelineAsync(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createRenderPipeline_5147343dc33b1e18: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).createRenderPipeline(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_createSampler_2fe8901be471a83a: function(arg0, arg1) {
            const ret = getObject(arg0).createSampler(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createShaderModule_f540847678b68e08: function(arg0, arg1) {
            const ret = getObject(arg0).createShaderModule(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_createTexture_5e05f1b82904ab79: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).createTexture(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_createView_e5524224d95f3815: function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).createView(getObject(arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_dispatchWorkgroups_74a6ec8812ef9f3b: function(arg0, arg1, arg2, arg3) {
            getObject(arg0).dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        },
        __wbg_document_9854e03c05fc8834: function(arg0) {
            const ret = getObject(arg0).document;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_downloadbotblockrangeerror_new: function(arg0) {
            const ret = DownloadBotBlockRangeError.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_downloadmapblockrangeerror_new: function(arg0) {
            const ret = DownloadMapBlockRangeError.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_drawIndexed_8bcec1419f35c7a6: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
        },
        __wbg_drawIndirect_193e39a1dda3a6c4: function(arg0, arg1, arg2) {
            getObject(arg0).drawIndirect(getObject(arg1), arg2);
        },
        __wbg_draw_977efcdcd4b12838: function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        },
        __wbg_end_23ba48463344fbc0: function(arg0) {
            getObject(arg0).end();
        },
        __wbg_end_3bbedaa037606029: function(arg0) {
            getObject(arg0).end();
        },
        __wbg_error_200f31277a98b99f: function(arg0) {
            const ret = getObject(arg0).error;
            return addHeapObject(ret);
        },
        __wbg_error_c9cf3fc2064683a9: function(arg0) {
            console.error(getObject(arg0));
        },
        __wbg_features_05f2c29f778eefeb: function(arg0) {
            const ret = getObject(arg0).features;
            return addHeapObject(ret);
        },
        __wbg_features_c00dd668abf7e418: function(arg0) {
            const ret = getObject(arg0).features;
            return addHeapObject(ret);
        },
        __wbg_fetch_9b478faef8cda538: function(arg0) {
            const ret = fetch(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_finish_49529a046631ad9a: function(arg0) {
            const ret = getObject(arg0).finish();
            return addHeapObject(ret);
        },
        __wbg_finish_678df663961386ff: function(arg0, arg1) {
            const ret = getObject(arg0).finish(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_getContext_635e36719cad2623: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        }, arguments); },
        __wbg_getContext_e567868594d2e0c6: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        }, arguments); },
        __wbg_getCurrentTexture_de7133bb1a828045: function() { return handleError(function (arg0) {
            const ret = getObject(arg0).getCurrentTexture();
            return addHeapObject(ret);
        }, arguments); },
        __wbg_getMappedRange_cd3dc2fcd533d3b9: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).getMappedRange(arg1, arg2);
            return addHeapObject(ret);
        }, arguments); },
        __wbg_getPreferredCanvasFormat_f775f4ebe1768892: function(arg0) {
            const ret = getObject(arg0).getPreferredCanvasFormat();
            return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 102) - 1;
        },
        __wbg_get_fd12a9100976c296: function(arg0, arg1) {
            const ret = getObject(arg0)[arg1 >>> 0];
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_gpu_c7d57fb68edbac19: function(arg0) {
            const ret = getObject(arg0).gpu;
            return addHeapObject(ret);
        },
        __wbg_graphicsandsurface_new: function(arg0) {
            const ret = GraphicsAndSurface.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_has_47b8eb16db92789a: function(arg0, arg1, arg2) {
            const ret = getObject(arg0).has(getStringFromWasm0(arg1, arg2));
            return ret;
        },
        __wbg_height_fc97e1a0c2e7331f: function(arg0) {
            const ret = getObject(arg0).height;
            return ret;
        },
        __wbg_instanceof_Error_80a725f81f2e102d: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof Error;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuOutOfMemoryError_829d8185d83170f0: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof GPUOutOfMemoryError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuPipelineError_9e3ee63b8346b534: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof GPUPipelineError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_GpuValidationError_83f906582a640f23: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof GPUValidationError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Response_b8758567269c30b2: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof Response;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_TypeError_7837a7bf26afc217: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof TypeError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_82d71df4eddf88bc: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_label_0752a49b0bb6f2c4: function(arg0, arg1) {
            const ret = getObject(arg1).label;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_length_7f3c00c40364105e: function(arg0) {
            const ret = getObject(arg0).length;
            return ret;
        },
        __wbg_lightmapchunkjob_new: function(arg0) {
            const ret = LightmapChunkJob.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_limits_a55115608ac6de8d: function(arg0) {
            const ret = getObject(arg0).limits;
            return addHeapObject(ret);
        },
        __wbg_limits_f4203404018656d1: function(arg0) {
            const ret = getObject(arg0).limits;
            return addHeapObject(ret);
        },
        __wbg_lost_fa085c0cf1bffae4: function(arg0) {
            const ret = getObject(arg0).lost;
            return addHeapObject(ret);
        },
        __wbg_mapAsync_84aeaa5780c9b8c7: function(arg0, arg1, arg2, arg3) {
            const ret = getObject(arg0).mapAsync(arg1 >>> 0, arg2, arg3);
            return addHeapObject(ret);
        },
        __wbg_mapblockdata_new: function(arg0) {
            const ret = MapBlockData.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_maxBindGroupsPlusVertexBuffers_d6dffc4ad89f024c: function(arg0) {
            const ret = getObject(arg0).maxBindGroupsPlusVertexBuffers;
            return ret;
        },
        __wbg_maxBindGroups_e8bcce17037d7413: function(arg0) {
            const ret = getObject(arg0).maxBindGroups;
            return ret;
        },
        __wbg_maxBindingsPerBindGroup_ef08905e194a1e54: function(arg0) {
            const ret = getObject(arg0).maxBindingsPerBindGroup;
            return ret;
        },
        __wbg_maxBufferSize_b1db4c8964be17cf: function(arg0) {
            const ret = getObject(arg0).maxBufferSize;
            return ret;
        },
        __wbg_maxColorAttachmentBytesPerSample_ac08ed619898c87e: function(arg0) {
            const ret = getObject(arg0).maxColorAttachmentBytesPerSample;
            return ret;
        },
        __wbg_maxColorAttachments_d1f42a41baed04ad: function(arg0) {
            const ret = getObject(arg0).maxColorAttachments;
            return ret;
        },
        __wbg_maxComputeInvocationsPerWorkgroup_2fee70c64ef20a73: function(arg0) {
            const ret = getObject(arg0).maxComputeInvocationsPerWorkgroup;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeX_2c2884390e0f2002: function(arg0) {
            const ret = getObject(arg0).maxComputeWorkgroupSizeX;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeY_a6dbdf413372949b: function(arg0) {
            const ret = getObject(arg0).maxComputeWorkgroupSizeY;
            return ret;
        },
        __wbg_maxComputeWorkgroupSizeZ_40ec8315d6a923ec: function(arg0) {
            const ret = getObject(arg0).maxComputeWorkgroupSizeZ;
            return ret;
        },
        __wbg_maxComputeWorkgroupStorageSize_d0d1d2e746e81bcf: function(arg0) {
            const ret = getObject(arg0).maxComputeWorkgroupStorageSize;
            return ret;
        },
        __wbg_maxComputeWorkgroupsPerDimension_61b16abcf0d80b79: function(arg0) {
            const ret = getObject(arg0).maxComputeWorkgroupsPerDimension;
            return ret;
        },
        __wbg_maxDynamicStorageBuffersPerPipelineLayout_797d17e6e6944fdb: function(arg0) {
            const ret = getObject(arg0).maxDynamicStorageBuffersPerPipelineLayout;
            return ret;
        },
        __wbg_maxDynamicUniformBuffersPerPipelineLayout_edb82f86942b7949: function(arg0) {
            const ret = getObject(arg0).maxDynamicUniformBuffersPerPipelineLayout;
            return ret;
        },
        __wbg_maxInterStageShaderVariables_908ab3a923f07870: function(arg0) {
            const ret = getObject(arg0).maxInterStageShaderVariables;
            return ret;
        },
        __wbg_maxSampledTexturesPerShaderStage_191dbad7e2506090: function(arg0) {
            const ret = getObject(arg0).maxSampledTexturesPerShaderStage;
            return ret;
        },
        __wbg_maxSamplersPerShaderStage_cf1a5d29de6387c1: function(arg0) {
            const ret = getObject(arg0).maxSamplersPerShaderStage;
            return ret;
        },
        __wbg_maxStorageBufferBindingSize_6c66dbb2e10b3ebf: function(arg0) {
            const ret = getObject(arg0).maxStorageBufferBindingSize;
            return ret;
        },
        __wbg_maxStorageBuffersPerShaderStage_e9cde31564b6860e: function(arg0) {
            const ret = getObject(arg0).maxStorageBuffersPerShaderStage;
            return ret;
        },
        __wbg_maxStorageTexturesPerShaderStage_80c81f127106f576: function(arg0) {
            const ret = getObject(arg0).maxStorageTexturesPerShaderStage;
            return ret;
        },
        __wbg_maxTextureArrayLayers_2315e52a2a6ad4f6: function(arg0) {
            const ret = getObject(arg0).maxTextureArrayLayers;
            return ret;
        },
        __wbg_maxTextureDimension1D_8adabbb69e668b5d: function(arg0) {
            const ret = getObject(arg0).maxTextureDimension1D;
            return ret;
        },
        __wbg_maxTextureDimension2D_9023132dcda08d76: function(arg0) {
            const ret = getObject(arg0).maxTextureDimension2D;
            return ret;
        },
        __wbg_maxTextureDimension3D_bb2e13eec8c6a78b: function(arg0) {
            const ret = getObject(arg0).maxTextureDimension3D;
            return ret;
        },
        __wbg_maxUniformBufferBindingSize_825882c54699eb99: function(arg0) {
            const ret = getObject(arg0).maxUniformBufferBindingSize;
            return ret;
        },
        __wbg_maxUniformBuffersPerShaderStage_5b1f83edc54e5013: function(arg0) {
            const ret = getObject(arg0).maxUniformBuffersPerShaderStage;
            return ret;
        },
        __wbg_maxVertexAttributes_a026b2a337f0bdd5: function(arg0) {
            const ret = getObject(arg0).maxVertexAttributes;
            return ret;
        },
        __wbg_maxVertexBufferArrayStride_ba288c75efda40ac: function(arg0) {
            const ret = getObject(arg0).maxVertexBufferArrayStride;
            return ret;
        },
        __wbg_maxVertexBuffers_b40d07717d2856fd: function(arg0) {
            const ret = getObject(arg0).maxVertexBuffers;
            return ret;
        },
        __wbg_message_31dd74b6690b5316: function(arg0, arg1) {
            const ret = getObject(arg1).message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_message_5f8387f0c32b90a7: function(arg0) {
            const ret = getObject(arg0).message;
            return addHeapObject(ret);
        },
        __wbg_message_6f556f23bc8a4aff: function(arg0, arg1) {
            const ret = getObject(arg1).message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_message_d988ea596c5f5c9a: function(arg0, arg1) {
            const ret = getObject(arg1).message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_minStorageBufferOffsetAlignment_2c84ffed8659a936: function(arg0) {
            const ret = getObject(arg0).minStorageBufferOffsetAlignment;
            return ret;
        },
        __wbg_minUniformBufferOffsetAlignment_35a3aa8f239bba4a: function(arg0) {
            const ret = getObject(arg0).minUniformBufferOffsetAlignment;
            return ret;
        },
        __wbg_name_e2eac7cdfa054f65: function(arg0) {
            const ret = getObject(arg0).name;
            return addHeapObject(ret);
        },
        __wbg_navigator_2156486643462a87: function(arg0) {
            const ret = getObject(arg0).navigator;
            return addHeapObject(ret);
        },
        __wbg_navigator_c9bce48d4b578c9c: function(arg0) {
            const ret = getObject(arg0).navigator;
            return addHeapObject(ret);
        },
        __wbg_new_1dbf7428bba60a42: function(arg0) {
            const ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_new_617a8cdb8bb1130e: function() {
            const ret = new Object();
            return addHeapObject(ret);
        },
        __wbg_new_820eb53f620ccf82: function() { return handleError(function (arg0, arg1) {
            const ret = new URL(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_new_83ca405eae412a62: function() { return handleError(function () {
            const ret = new Headers();
            return addHeapObject(ret);
        }, arguments); },
        __wbg_new_a217df4351db4b9b: function() { return handleError(function (arg0, arg1) {
            const ret = new OffscreenCanvas(arg0 >>> 0, arg1 >>> 0);
            return addHeapObject(ret);
        }, arguments); },
        __wbg_new_d92488e3f585ed02: function() { return handleError(function () {
            const ret = new URLSearchParams();
            return addHeapObject(ret);
        }, arguments); },
        __wbg_new_typed_689a3a281a8d4da6: function() {
            const ret = new Object();
            return addHeapObject(ret);
        },
        __wbg_new_typed_b01cb72a8af741a3: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return __wasm_bindgen_func_elem_3169(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return addHeapObject(ret);
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_with_byte_offset_and_length_2f5d7fc2a828b74d: function(arg0, arg1, arg2) {
            const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        },
        __wbg_new_with_str_2d1292ac88699448: function() { return handleError(function (arg0, arg1) {
            const ret = new Request(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_new_with_str_and_init_4618dee4e950224f: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_onSubmittedWorkDone_f62945abb48d8a84: function(arg0) {
            const ret = getObject(arg0).onSubmittedWorkDone();
            return addHeapObject(ret);
        },
        __wbg_prototypesetcall_bc27214492979395: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
        },
        __wbg_querySelectorAll_6aebfe3df1fb2014: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).querySelectorAll(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        }, arguments); },
        __wbg_queueMicrotask_9833f9a49df95a49: function(arg0) {
            const ret = getObject(arg0).queueMicrotask;
            return addHeapObject(ret);
        },
        __wbg_queueMicrotask_a72f977e97f23c5f: function(arg0) {
            queueMicrotask(getObject(arg0));
        },
        __wbg_queue_6e272de986f8f6fc: function(arg0) {
            const ret = getObject(arg0).queue;
            return addHeapObject(ret);
        },
        __wbg_reason_33b7423157d5e170: function(arg0) {
            const ret = getObject(arg0).reason;
            return (__wbindgen_enum_GpuDeviceLostReason.indexOf(ret) + 1 || 3) - 1;
        },
        __wbg_reason_87ecf5240a0ef7ad: function(arg0) {
            const ret = getObject(arg0).reason;
            return (__wbindgen_enum_GpuPipelineErrorReason.indexOf(ret) + 1 || 3) - 1;
        },
        __wbg_requestAdapter_2cb1006baf7abd60: function(arg0) {
            const ret = getObject(arg0).requestAdapter();
            return addHeapObject(ret);
        },
        __wbg_requestAdapter_b725cba92e32c4ce: function(arg0, arg1) {
            const ret = getObject(arg0).requestAdapter(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_requestDevice_45bc1149c3b98eaf: function(arg0, arg1) {
            const ret = getObject(arg0).requestDevice(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_resolveQuerySet_3eb16017fd6ef873: function(arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).resolveQuerySet(getObject(arg1), arg2 >>> 0, arg3 >>> 0, getObject(arg4), arg5 >>> 0);
        },
        __wbg_resolve_0076e10020304ede: function(arg0) {
            const ret = Promise.resolve(getObject(arg0));
            return addHeapObject(ret);
        },
        __wbg_search_c401c3a62c560ce7: function(arg0, arg1) {
            const ret = getObject(arg1).search;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_setBindGroup_09aa10258bd4dc11: function(arg0, arg1, arg2) {
            getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2));
        },
        __wbg_setBindGroup_91e8d4a44688d339: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2), getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
        }, arguments); },
        __wbg_setBindGroup_c3a39fd8d0149600: function(arg0, arg1, arg2) {
            getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2));
        },
        __wbg_setBindGroup_e94a2cd341685dbc: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).setBindGroup(arg1 >>> 0, getObject(arg2), getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
        }, arguments); },
        __wbg_setIndexBuffer_1872a074063dc4d2: function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).setIndexBuffer(getObject(arg1), __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
        },
        __wbg_setPipeline_1368374122476dc8: function(arg0, arg1) {
            getObject(arg0).setPipeline(getObject(arg1));
        },
        __wbg_setPipeline_823fe7d48236b840: function(arg0, arg1) {
            getObject(arg0).setPipeline(getObject(arg1));
        },
        __wbg_setScissorRect_5b13089a95f2dadd: function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        },
        __wbg_setVertexBuffer_6cb9f5432f1462e2: function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).setVertexBuffer(arg1 >>> 0, getObject(arg2), arg3, arg4);
        },
        __wbg_setVertexBuffer_ff00b7e9bfd9257d: function(arg0, arg1, arg2, arg3) {
            getObject(arg0).setVertexBuffer(arg1 >>> 0, getObject(arg2), arg3);
        },
        __wbg_set_145a351398b48c65: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
            return ret;
        }, arguments); },
        __wbg_set_34d08fd992d43d61: function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        },
        __wbg_set_a_1fdf746cc2b8222e: function(arg0, arg1) {
            getObject(arg0).a = arg1;
        },
        __wbg_set_access_d85c61c63a8f0054: function(arg0, arg1) {
            getObject(arg0).access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
        },
        __wbg_set_address_mode_u_422d09a7c7c6808b: function(arg0, arg1) {
            getObject(arg0).addressModeU = __wbindgen_enum_GpuAddressMode[arg1];
        },
        __wbg_set_address_mode_v_995b8eaecea12eb2: function(arg0, arg1) {
            getObject(arg0).addressModeV = __wbindgen_enum_GpuAddressMode[arg1];
        },
        __wbg_set_address_mode_w_3d44c8d95e17713b: function(arg0, arg1) {
            getObject(arg0).addressModeW = __wbindgen_enum_GpuAddressMode[arg1];
        },
        __wbg_set_af5932e3f78b5648: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_set_alpha_9f269bbd6ece367d: function(arg0, arg1) {
            getObject(arg0).alpha = getObject(arg1);
        },
        __wbg_set_alpha_mode_64fac09c2c8ce2a3: function(arg0, arg1) {
            getObject(arg0).alphaMode = __wbindgen_enum_GpuCanvasAlphaMode[arg1];
        },
        __wbg_set_alpha_to_coverage_enabled_325bc46f0e28d1e1: function(arg0, arg1) {
            getObject(arg0).alphaToCoverageEnabled = arg1 !== 0;
        },
        __wbg_set_array_layer_count_bffa36fc24b79df0: function(arg0, arg1) {
            getObject(arg0).arrayLayerCount = arg1 >>> 0;
        },
        __wbg_set_array_stride_f64_6aa9b1b64c512846: function(arg0, arg1) {
            getObject(arg0).arrayStride = arg1;
        },
        __wbg_set_aspect_27f3eed305bd8169: function(arg0, arg1) {
            getObject(arg0).aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        },
        __wbg_set_aspect_f5a98aa400a5a3a5: function(arg0, arg1) {
            getObject(arg0).aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        },
        __wbg_set_attributes_bf0350bfb0e148d9: function(arg0, arg1, arg2) {
            getObject(arg0).attributes = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_b_f3fe26f326729156: function(arg0, arg1) {
            getObject(arg0).b = arg1;
        },
        __wbg_set_base_array_layer_343a636d6599095b: function(arg0, arg1) {
            getObject(arg0).baseArrayLayer = arg1 >>> 0;
        },
        __wbg_set_base_mip_level_15a401680a308b29: function(arg0, arg1) {
            getObject(arg0).baseMipLevel = arg1 >>> 0;
        },
        __wbg_set_beginning_of_pass_write_index_8038443ce9e1d332: function(arg0, arg1) {
            getObject(arg0).beginningOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_beginning_of_pass_write_index_be1b8c649beccb0d: function(arg0, arg1) {
            getObject(arg0).beginningOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_bind_group_layouts_3586ff59b180c6f6: function(arg0, arg1, arg2) {
            getObject(arg0).bindGroupLayouts = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_binding_5c2fb74e9df71acc: function(arg0, arg1) {
            getObject(arg0).binding = arg1 >>> 0;
        },
        __wbg_set_binding_dd48e769b9abd49c: function(arg0, arg1) {
            getObject(arg0).binding = arg1 >>> 0;
        },
        __wbg_set_blend_06a2cc3d12d05417: function(arg0, arg1) {
            getObject(arg0).blend = getObject(arg1);
        },
        __wbg_set_buffer_3446218584f17583: function(arg0, arg1) {
            getObject(arg0).buffer = getObject(arg1);
        },
        __wbg_set_buffer_9924a87f5165fce6: function(arg0, arg1) {
            getObject(arg0).buffer = getObject(arg1);
        },
        __wbg_set_buffers_b16f472e92a88793: function(arg0, arg1, arg2) {
            getObject(arg0).buffers = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_bytes_per_row_28510a23c97e58c2: function(arg0, arg1) {
            getObject(arg0).bytesPerRow = arg1 >>> 0;
        },
        __wbg_set_cache_7507c4cc5938ccc7: function(arg0, arg1) {
            getObject(arg0).cache = __wbindgen_enum_RequestCache[arg1];
        },
        __wbg_set_clear_value_gpu_color_dict_99021f5e376737f8: function(arg0, arg1) {
            getObject(arg0).clearValue = getObject(arg1);
        },
        __wbg_set_code_e21341a422769059: function(arg0, arg1, arg2) {
            getObject(arg0).code = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_color_52712a5762e024a5: function(arg0, arg1) {
            getObject(arg0).color = getObject(arg1);
        },
        __wbg_set_color_attachments_5f259d10d3f3ccb9: function(arg0, arg1, arg2) {
            getObject(arg0).colorAttachments = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_compare_3bf121787fa29957: function(arg0, arg1) {
            getObject(arg0).compare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_compare_8dfcf70fcd8cfb94: function(arg0, arg1) {
            getObject(arg0).compare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_compute_22ea0424f53da942: function(arg0, arg1) {
            getObject(arg0).compute = getObject(arg1);
        },
        __wbg_set_count_7d1a50f691560ead: function(arg0, arg1) {
            getObject(arg0).count = arg1 >>> 0;
        },
        __wbg_set_count_f2995ad163d1cc9b: function(arg0, arg1) {
            getObject(arg0).count = arg1 >>> 0;
        },
        __wbg_set_cull_mode_7adceafd1445c2a6: function(arg0, arg1) {
            getObject(arg0).cullMode = __wbindgen_enum_GpuCullMode[arg1];
        },
        __wbg_set_depth_bias_2ff83b7698756d98: function(arg0, arg1) {
            getObject(arg0).depthBias = arg1;
        },
        __wbg_set_depth_bias_clamp_c47db91f0dc154bc: function(arg0, arg1) {
            getObject(arg0).depthBiasClamp = arg1;
        },
        __wbg_set_depth_bias_slope_scale_1d54ca553d61de73: function(arg0, arg1) {
            getObject(arg0).depthBiasSlopeScale = arg1;
        },
        __wbg_set_depth_clear_value_6d54e630021b8d0a: function(arg0, arg1) {
            getObject(arg0).depthClearValue = arg1;
        },
        __wbg_set_depth_compare_7907c518ffb9c07a: function(arg0, arg1) {
            getObject(arg0).depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
        },
        __wbg_set_depth_fail_op_287eae3d77fec685: function(arg0, arg1) {
            getObject(arg0).depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_depth_load_op_66e18cce0adc6d04: function(arg0, arg1) {
            getObject(arg0).depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_depth_or_array_layers_b977da6f11e5640d: function(arg0, arg1) {
            getObject(arg0).depthOrArrayLayers = arg1 >>> 0;
        },
        __wbg_set_depth_read_only_9107ee4dd8709efb: function(arg0, arg1) {
            getObject(arg0).depthReadOnly = arg1 !== 0;
        },
        __wbg_set_depth_stencil_9789642fce399621: function(arg0, arg1) {
            getObject(arg0).depthStencil = getObject(arg1);
        },
        __wbg_set_depth_stencil_attachment_42e5e53fa0739216: function(arg0, arg1) {
            getObject(arg0).depthStencilAttachment = getObject(arg1);
        },
        __wbg_set_depth_store_op_be93b0ac5d45803f: function(arg0, arg1) {
            getObject(arg0).depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_depth_write_enabled_ae5d4ffd893432e4: function(arg0, arg1) {
            getObject(arg0).depthWriteEnabled = arg1 !== 0;
        },
        __wbg_set_device_603f685db59c1649: function(arg0, arg1) {
            getObject(arg0).device = getObject(arg1);
        },
        __wbg_set_dimension_13da043f59bc977f: function(arg0, arg1) {
            getObject(arg0).dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_dimension_443383e1f360a896: function(arg0, arg1) {
            getObject(arg0).dimension = __wbindgen_enum_GpuTextureDimension[arg1];
        },
        __wbg_set_dst_factor_16e250bd2f5f8a77: function(arg0, arg1) {
            getObject(arg0).dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        },
        __wbg_set_end_of_pass_write_index_61a9cd23380259bd: function(arg0, arg1) {
            getObject(arg0).endOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_end_of_pass_write_index_88a6e72ec61673dd: function(arg0, arg1) {
            getObject(arg0).endOfPassWriteIndex = arg1 >>> 0;
        },
        __wbg_set_entries_7dfa89a00bdff489: function(arg0, arg1, arg2) {
            getObject(arg0).entries = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_entries_f60b26345b2c7977: function(arg0, arg1, arg2) {
            getObject(arg0).entries = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_40a004953671c1a0: function(arg0, arg1, arg2) {
            getObject(arg0).entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_571795ff6bd3e5bc: function(arg0, arg1, arg2) {
            getObject(arg0).entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_entry_point_f385a5280d07a91f: function(arg0, arg1, arg2) {
            getObject(arg0).entryPoint = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_external_texture_bdd5ebdc331c0d06: function(arg0, arg1) {
            getObject(arg0).externalTexture = getObject(arg1);
        },
        __wbg_set_fail_op_dcbcb832b22acb0d: function(arg0, arg1) {
            getObject(arg0).failOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_format_4ae9d5555ecce919: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_5444425dee1be1ea: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_586edf6514c11751: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_617abf73e2d5bc21: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_9272f72a7f2c0700: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_format_d607f5bd6106e2fc: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuVertexFormat[arg1];
        },
        __wbg_set_format_d916525ae7d18e88: function(arg0, arg1) {
            getObject(arg0).format = __wbindgen_enum_GpuTextureFormat[arg1];
        },
        __wbg_set_fragment_788168872bc7434a: function(arg0, arg1) {
            getObject(arg0).fragment = getObject(arg1);
        },
        __wbg_set_front_face_ab616b7a790ea568: function(arg0, arg1) {
            getObject(arg0).frontFace = __wbindgen_enum_GpuFrontFace[arg1];
        },
        __wbg_set_g_b5ea7c69d5f86113: function(arg0, arg1) {
            getObject(arg0).g = arg1;
        },
        __wbg_set_has_dynamic_offset_ccafd64f17d0552b: function(arg0, arg1) {
            getObject(arg0).hasDynamicOffset = arg1 !== 0;
        },
        __wbg_set_headers_40ad33dcf016613f: function(arg0, arg1) {
            getObject(arg0).headers = getObject(arg1);
        },
        __wbg_set_height_1c5337b96202bcec: function(arg0, arg1) {
            getObject(arg0).height = arg1 >>> 0;
        },
        __wbg_set_height_c9789c1c77eaedff: function(arg0, arg1) {
            getObject(arg0).height = arg1 >>> 0;
        },
        __wbg_set_height_fde391767df1ce27: function(arg0, arg1) {
            getObject(arg0).height = arg1 >>> 0;
        },
        __wbg_set_label_1804369b72a4e735: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_346bf11b8ec29fea: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_3ac34d6a447c14b6: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_48cf960febfa9f8b: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_4ff277997e6b21ec: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_59ba23a4c997818b: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_5bd53d250b9493ed: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_6e7bc8922dca66f7: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_71cdebfb246d71f9: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_79a74f675ac8c6f6: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_83d1c79a73f44a36: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_8a971b985701494c: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_8bef035fed27f91a: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_951186a6d8fcd032: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_ec5af0e2c24eb6d3: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_label_fe4b30a50c9ac9c2: function(arg0, arg1, arg2) {
            getObject(arg0).label = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_layout_75642eb58293c075: function(arg0, arg1) {
            getObject(arg0).layout = getObject(arg1);
        },
        __wbg_set_layout_7d84fb1f1fb10257: function(arg0, arg1) {
            getObject(arg0).layout = getObject(arg1);
        },
        __wbg_set_layout_94658faf9a0be06d: function(arg0, arg1) {
            getObject(arg0).layout = getObject(arg1);
        },
        __wbg_set_layout_gpu_auto_layout_mode_4ee68bed4b80a76e: function(arg0, arg1) {
            getObject(arg0).layout = __wbindgen_enum_GpuAutoLayoutMode[arg1];
        },
        __wbg_set_layout_gpu_auto_layout_mode_dd4e8e7a665074fb: function(arg0, arg1) {
            getObject(arg0).layout = __wbindgen_enum_GpuAutoLayoutMode[arg1];
        },
        __wbg_set_load_op_18749bb4ddd7ea87: function(arg0, arg1) {
            getObject(arg0).loadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_lod_max_clamp_fef0518bc3ead2d3: function(arg0, arg1) {
            getObject(arg0).lodMaxClamp = arg1;
        },
        __wbg_set_lod_min_clamp_350395dcc004a30c: function(arg0, arg1) {
            getObject(arg0).lodMinClamp = arg1;
        },
        __wbg_set_mag_filter_dcaf3efc70dadf8b: function(arg0, arg1) {
            getObject(arg0).magFilter = __wbindgen_enum_GpuFilterMode[arg1];
        },
        __wbg_set_mapped_at_creation_f771fc107b1310a5: function(arg0, arg1) {
            getObject(arg0).mappedAtCreation = arg1 !== 0;
        },
        __wbg_set_mask_7963aed8bfc37ee8: function(arg0, arg1) {
            getObject(arg0).mask = arg1 >>> 0;
        },
        __wbg_set_max_anisotropy_a5ad085256586d87: function(arg0, arg1) {
            getObject(arg0).maxAnisotropy = arg1;
        },
        __wbg_set_method_dcb32343247ec427: function(arg0, arg1, arg2) {
            getObject(arg0).method = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_min_binding_size_f64_74baaf5086ba50e2: function(arg0, arg1) {
            getObject(arg0).minBindingSize = arg1;
        },
        __wbg_set_min_filter_d78cdacbc0f7dd89: function(arg0, arg1) {
            getObject(arg0).minFilter = __wbindgen_enum_GpuFilterMode[arg1];
        },
        __wbg_set_mip_level_60bb0b4f30d8147f: function(arg0, arg1) {
            getObject(arg0).mipLevel = arg1 >>> 0;
        },
        __wbg_set_mip_level_count_05d78552d6bb9c0b: function(arg0, arg1) {
            getObject(arg0).mipLevelCount = arg1 >>> 0;
        },
        __wbg_set_mip_level_count_7be98f67608cff20: function(arg0, arg1) {
            getObject(arg0).mipLevelCount = arg1 >>> 0;
        },
        __wbg_set_mipmap_filter_eed32e31e8eb5a81: function(arg0, arg1) {
            getObject(arg0).mipmapFilter = __wbindgen_enum_GpuMipmapFilterMode[arg1];
        },
        __wbg_set_mode_cd0f311d22e1087e: function(arg0, arg1) {
            getObject(arg0).mode = __wbindgen_enum_GpuCanvasToneMappingMode[arg1];
        },
        __wbg_set_module_131df59380b6a8c1: function(arg0, arg1) {
            getObject(arg0).module = getObject(arg1);
        },
        __wbg_set_module_4626f14c145a0bee: function(arg0, arg1) {
            getObject(arg0).module = getObject(arg1);
        },
        __wbg_set_module_b30bf16f8c1fab4a: function(arg0, arg1) {
            getObject(arg0).module = getObject(arg1);
        },
        __wbg_set_multisample_95e56b50ee346453: function(arg0, arg1) {
            getObject(arg0).multisample = getObject(arg1);
        },
        __wbg_set_multisampled_82f133b97717fed0: function(arg0, arg1) {
            getObject(arg0).multisampled = arg1 !== 0;
        },
        __wbg_set_offset_f64_a2781064c004de37: function(arg0, arg1) {
            getObject(arg0).offset = arg1;
        },
        __wbg_set_offset_f64_b9040b7b4b3b58ef: function(arg0, arg1) {
            getObject(arg0).offset = arg1;
        },
        __wbg_set_offset_f64_f6c19c7eab3139c3: function(arg0, arg1) {
            getObject(arg0).offset = arg1;
        },
        __wbg_set_onuncapturederror_47c12cc2f5c09a08: function(arg0, arg1) {
            getObject(arg0).onuncapturederror = getObject(arg1);
        },
        __wbg_set_operation_6e3e9951bf90ea60: function(arg0, arg1) {
            getObject(arg0).operation = __wbindgen_enum_GpuBlendOperation[arg1];
        },
        __wbg_set_origin_gpu_origin_3d_dict_bcab737ae5849293: function(arg0, arg1) {
            getObject(arg0).origin = getObject(arg1);
        },
        __wbg_set_pass_op_e450050db694810b: function(arg0, arg1) {
            getObject(arg0).passOp = __wbindgen_enum_GpuStencilOperation[arg1];
        },
        __wbg_set_power_preference_08fe83a5eadb70d0: function(arg0, arg1) {
            getObject(arg0).powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
        },
        __wbg_set_primitive_c7b06d4b7e532d79: function(arg0, arg1) {
            getObject(arg0).primitive = getObject(arg1);
        },
        __wbg_set_query_set_dd5312ccb0fc400d: function(arg0, arg1) {
            getObject(arg0).querySet = getObject(arg1);
        },
        __wbg_set_query_set_ec44c9644d5fb7aa: function(arg0, arg1) {
            getObject(arg0).querySet = getObject(arg1);
        },
        __wbg_set_r_f315342365057bfd: function(arg0, arg1) {
            getObject(arg0).r = arg1;
        },
        __wbg_set_required_features_a03feb65576a939d: function(arg0, arg1, arg2) {
            getObject(arg0).requiredFeatures = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_required_limits_715c4f61cab45cbd: function(arg0, arg1) {
            getObject(arg0).requiredLimits = getObject(arg1);
        },
        __wbg_set_resolve_target_gpu_texture_view_596d364279303c36: function(arg0, arg1) {
            getObject(arg0).resolveTarget = getObject(arg1);
        },
        __wbg_set_resource_8535e18d45831050: function(arg0, arg1) {
            getObject(arg0).resource = getObject(arg1);
        },
        __wbg_set_resource_gpu_buffer_binding_5450144e7744c01d: function(arg0, arg1) {
            getObject(arg0).resource = getObject(arg1);
        },
        __wbg_set_resource_gpu_texture_view_18f08044da0f00bb: function(arg0, arg1) {
            getObject(arg0).resource = getObject(arg1);
        },
        __wbg_set_rows_per_image_7cf25f1f6da0dbf0: function(arg0, arg1) {
            getObject(arg0).rowsPerImage = arg1 >>> 0;
        },
        __wbg_set_sample_count_2698a73135c00d4c: function(arg0, arg1) {
            getObject(arg0).sampleCount = arg1 >>> 0;
        },
        __wbg_set_sample_type_18ebe049de8b818f: function(arg0, arg1) {
            getObject(arg0).sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
        },
        __wbg_set_sampler_5d6e781457aaf9ac: function(arg0, arg1) {
            getObject(arg0).sampler = getObject(arg1);
        },
        __wbg_set_search_de4e8694f3b52c24: function(arg0, arg1, arg2) {
            getObject(arg0).search = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_shader_location_1aa266e5091a4621: function(arg0, arg1) {
            getObject(arg0).shaderLocation = arg1 >>> 0;
        },
        __wbg_set_size_f64_1de16d25a7c2d7db: function(arg0, arg1) {
            getObject(arg0).size = arg1;
        },
        __wbg_set_size_f64_6db4344b19dff88b: function(arg0, arg1) {
            getObject(arg0).size = arg1;
        },
        __wbg_set_size_gpu_extent_3d_dict_fda5a4953e4d53d2: function(arg0, arg1) {
            getObject(arg0).size = getObject(arg1);
        },
        __wbg_set_src_factor_b9dea09afc88ffb7: function(arg0, arg1) {
            getObject(arg0).srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        },
        __wbg_set_stencil_back_e7d5a419c46a2fc7: function(arg0, arg1) {
            getObject(arg0).stencilBack = getObject(arg1);
        },
        __wbg_set_stencil_clear_value_b3fb1a1021fa2bd0: function(arg0, arg1) {
            getObject(arg0).stencilClearValue = arg1 >>> 0;
        },
        __wbg_set_stencil_front_4bfa06cae0a38cf4: function(arg0, arg1) {
            getObject(arg0).stencilFront = getObject(arg1);
        },
        __wbg_set_stencil_load_op_23472dd8295389a5: function(arg0, arg1) {
            getObject(arg0).stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        },
        __wbg_set_stencil_read_mask_d5e64669f0e42581: function(arg0, arg1) {
            getObject(arg0).stencilReadMask = arg1 >>> 0;
        },
        __wbg_set_stencil_read_only_641c611c5324d3a6: function(arg0, arg1) {
            getObject(arg0).stencilReadOnly = arg1 !== 0;
        },
        __wbg_set_stencil_store_op_2a18c3c02cbdd402: function(arg0, arg1) {
            getObject(arg0).stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_stencil_write_mask_3da7a76a556cae24: function(arg0, arg1) {
            getObject(arg0).stencilWriteMask = arg1 >>> 0;
        },
        __wbg_set_step_mode_d92d664d27163aab: function(arg0, arg1) {
            getObject(arg0).stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
        },
        __wbg_set_storage_texture_dccfcb6d8685a28b: function(arg0, arg1) {
            getObject(arg0).storageTexture = getObject(arg1);
        },
        __wbg_set_store_op_8847746a474253c8: function(arg0, arg1) {
            getObject(arg0).storeOp = __wbindgen_enum_GpuStoreOp[arg1];
        },
        __wbg_set_strip_index_format_7a32ee9bf6f4f18f: function(arg0, arg1) {
            getObject(arg0).stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
        },
        __wbg_set_targets_53333081ad7283b3: function(arg0, arg1, arg2) {
            getObject(arg0).targets = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_texture_60283d5a3509281c: function(arg0, arg1) {
            getObject(arg0).texture = getObject(arg1);
        },
        __wbg_set_texture_893b0a155eac7bb3: function(arg0, arg1) {
            getObject(arg0).texture = getObject(arg1);
        },
        __wbg_set_timestamp_writes_5e040caa4c5ec65c: function(arg0, arg1) {
            getObject(arg0).timestampWrites = getObject(arg1);
        },
        __wbg_set_timestamp_writes_e7961e2d69722523: function(arg0, arg1) {
            getObject(arg0).timestampWrites = getObject(arg1);
        },
        __wbg_set_tone_mapping_ae4cebc9871e0e30: function(arg0, arg1) {
            getObject(arg0).toneMapping = getObject(arg1);
        },
        __wbg_set_topology_b009640c64f39f91: function(arg0, arg1) {
            getObject(arg0).topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
        },
        __wbg_set_type_056caf72f0e17195: function(arg0, arg1) {
            getObject(arg0).type = __wbindgen_enum_GpuQueryType[arg1];
        },
        __wbg_set_type_87c1847bf338c3cf: function(arg0, arg1) {
            getObject(arg0).type = __wbindgen_enum_GpuBufferBindingType[arg1];
        },
        __wbg_set_type_e3051f91e1914ac5: function(arg0, arg1) {
            getObject(arg0).type = __wbindgen_enum_GpuSamplerBindingType[arg1];
        },
        __wbg_set_unclipped_depth_011df4d1ed8c4a83: function(arg0, arg1) {
            getObject(arg0).unclippedDepth = arg1 !== 0;
        },
        __wbg_set_usage_29b8c421aa91de96: function(arg0, arg1) {
            getObject(arg0).usage = arg1 >>> 0;
        },
        __wbg_set_usage_79b5edecf249b5a0: function(arg0, arg1) {
            getObject(arg0).usage = arg1 >>> 0;
        },
        __wbg_set_usage_95369f4e048501d2: function(arg0, arg1) {
            getObject(arg0).usage = arg1 >>> 0;
        },
        __wbg_set_usage_f7fa258e2db2a3be: function(arg0, arg1) {
            getObject(arg0).usage = arg1 >>> 0;
        },
        __wbg_set_vertex_d0c223291efc6077: function(arg0, arg1) {
            getObject(arg0).vertex = getObject(arg1);
        },
        __wbg_set_view_dimension_79c4ba7d05ee0f18: function(arg0, arg1) {
            getObject(arg0).viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_view_dimension_c8a3183d873d8457: function(arg0, arg1) {
            getObject(arg0).viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        },
        __wbg_set_view_formats_382ea2030d170c54: function(arg0, arg1, arg2) {
            getObject(arg0).viewFormats = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_view_formats_6fcf6f94ff60bd4c: function(arg0, arg1, arg2) {
            getObject(arg0).viewFormats = getArrayJsValueViewFromWasm0(arg1, arg2);
        },
        __wbg_set_view_gpu_texture_view_3a5332cb959dc2ec: function(arg0, arg1) {
            getObject(arg0).view = getObject(arg1);
        },
        __wbg_set_view_gpu_texture_view_e9f3236d28582143: function(arg0, arg1) {
            getObject(arg0).view = getObject(arg1);
        },
        __wbg_set_visibility_13119ae63ddb4d54: function(arg0, arg1) {
            getObject(arg0).visibility = arg1 >>> 0;
        },
        __wbg_set_width_0ca908d167690992: function(arg0, arg1) {
            getObject(arg0).width = arg1 >>> 0;
        },
        __wbg_set_width_b0e1267db4b196b5: function(arg0, arg1) {
            getObject(arg0).width = arg1 >>> 0;
        },
        __wbg_set_width_c854f1a0cc753050: function(arg0, arg1) {
            getObject(arg0).width = arg1 >>> 0;
        },
        __wbg_set_write_mask_b58f1a07dcba6420: function(arg0, arg1) {
            getObject(arg0).writeMask = arg1 >>> 0;
        },
        __wbg_set_x_c6eb18f8be4cfdfa: function(arg0, arg1) {
            getObject(arg0).x = arg1 >>> 0;
        },
        __wbg_set_y_47ec164aaba8896b: function(arg0, arg1) {
            getObject(arg0).y = arg1 >>> 0;
        },
        __wbg_set_z_bef3955d95557928: function(arg0, arg1) {
            getObject(arg0).z = arg1 >>> 0;
        },
        __wbg_static_accessor_GLOBAL_266715b9d96ba635: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_10fb7dc1ae063179: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_SELF_0b583911f537483a: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_static_accessor_WINDOW_d7f903d1508cbdc4: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        },
        __wbg_status_ce0a98d3c57125f3: function(arg0) {
            const ret = getObject(arg0).status;
            return ret;
        },
        __wbg_streamablebot_new: function(arg0) {
            const ret = StreamableBot.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_streamablemap_new: function(arg0) {
            const ret = StreamableMap.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_submit_c4379e221512d3fa: function(arg0, arg1, arg2) {
            getObject(arg0).submit(getArrayJsValueViewFromWasm0(arg1, arg2));
        },
        __wbg_text_ff3f476b3d6b1246: function() { return handleError(function (arg0) {
            const ret = getObject(arg0).text();
            return addHeapObject(ret);
        }, arguments); },
        __wbg_texturejob_new: function(arg0) {
            const ret = TextureJob.__wrap(arg0);
            return addHeapObject(ret);
        },
        __wbg_then_c8a35d4ad59c6b8e: function(arg0, arg1) {
            const ret = getObject(arg0).then(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_then_c949d5a25a4e78f8: function(arg0, arg1, arg2) {
            const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        },
        __wbg_then_e71170d78fcf8954: function(arg0, arg1) {
            const ret = getObject(arg0).then(getObject(arg1));
            return addHeapObject(ret);
        },
        __wbg_toString_0a6162345e699dea: function(arg0) {
            const ret = getObject(arg0).toString();
            return addHeapObject(ret);
        },
        __wbg_toString_83fab3d7c865ecd3: function(arg0) {
            const ret = getObject(arg0).toString();
            return addHeapObject(ret);
        },
        __wbg_unconfigure_7ca436ff70c0bcc3: function(arg0) {
            getObject(arg0).unconfigure();
        },
        __wbg_unmap_073211b910c6a369: function(arg0) {
            getObject(arg0).unmap();
        },
        __wbg_url_7bfada5c2297bc70: function(arg0, arg1) {
            const ret = getObject(arg1).url;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_valueOf_02fd4d101b7553c7: function(arg0) {
            const ret = getObject(arg0).valueOf();
            return addHeapObject(ret);
        },
        __wbg_width_3d0dce3d9892e35e: function(arg0) {
            const ret = getObject(arg0).width;
            return ret;
        },
        __wbg_writeBuffer_badef58fae6c9543: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).writeBuffer(getObject(arg1), arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
        }, arguments); },
        __wbg_writeTexture_4d444c92b271de25: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).writeTexture(getObject(arg1), getArrayU8FromWasm0(arg2, arg3), getObject(arg4), getObject(arg5));
        }, arguments); },
        __wbindgen_generic_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 308, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_3154);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUDevice")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_1814);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUDeviceLostInfo")], shim_idx: 254, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_1818);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000004: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPURenderPipeline")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_1814_181);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000005: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUUncapturedErrorEvent")], shim_idx: 254, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_1818_182);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000006: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("any")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_1814_183);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000007: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("undefined")], shim_idx: 250, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, __wasm_bindgen_func_elem_1814_184);
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000008: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return addHeapObject(ret);
        },
        __wbindgen_generic_0000000000000009: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return addHeapObject(ret);
        },
        __wbindgen_generic_000000000000000a: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        },
        __wbindgen_object_clone_ref: function(arg0) {
            const ret = getObject(arg0);
            return addHeapObject(ret);
        },
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject(arg0);
        },
    };
    return {
        __proto__: null,
        "./strafesnet_roblox_bot_player_wasm_module_bg.js": import0,
    };
}

function __wasm_bindgen_func_elem_1818(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_1818(arg0, arg1, addHeapObject(arg2));
}

function __wasm_bindgen_func_elem_1818_182(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_1818_182(arg0, arg1, addHeapObject(arg2));
}

function __wasm_bindgen_func_elem_3169(arg0, arg1, arg2, arg3) {
    wasm.__wasm_bindgen_func_elem_3169(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

function __wasm_bindgen_func_elem_3154(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.__wasm_bindgen_func_elem_3154(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_1814(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.__wasm_bindgen_func_elem_1814(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_1814_181(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.__wasm_bindgen_func_elem_1814_181(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_1814_183(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.__wasm_bindgen_func_elem_1814_183(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function __wasm_bindgen_func_elem_1814_184(arg0, arg1, arg2) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.__wasm_bindgen_func_elem_1814_184(retptr, arg0, arg1, addHeapObject(arg2));
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
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

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_export4(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function dropObject(idx) {
    if (idx < 1028) return;
    heap[idx] = heap_next;
    heap_next = idx;
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
        result.push(takeObject(mem.getUint32(i, true)));
    }
    return result;
}

function getArrayJsValueViewFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(getObject(mem.getUint32(i, true)));
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
    return decodeText(ptr >>> 0, len);
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

function getObject(idx) { return heap[idx]; }

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export3(addHeapObject(e));
    }
}

let heap = new Array(1024).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

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
            wasm.__wbindgen_export4(state.a, state.b);
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

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
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

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


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
