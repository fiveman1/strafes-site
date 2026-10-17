import { Graphics } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import { getTextureTranscoder } from "./textureTranscoder";

/** Time spent adding downloaded map blocks to the scene, since the stats last showed it. */
export const mapIngestStats = { totalMs: 0, maxMs: 0, count: 0 };

/** How long each FPS and debug stats window lasts, so the numbers are readable. */
const STATS_WINDOW_MS = 500;

/**
 * The player's FPS counter and debug HUD stats, averaged over half second windows
 * and written straight into the DOM instead of rendered.
 */
export class PlaybackStats {
    private fpsFrames = 0;
    private windowStart = performance.now();
    // Set with each FPS update, cleared once the next main view render reports its stats
    private statsDue = false;
    // CPU time spent in render_session since the last stats update.
    // WebGPU only records and sends commands there, so this is the cost of issuing draws, not GPU time.
    private renderMsTotal = 0;
    private renderMsMax = 0;
    private renderCount = 0;
    private promoteMsTotal = 0;
    private promoteMsMax = 0;
    // GPU times arrive a few frames late, so keep the last line when a window has none
    private lastGpuStats: string | undefined;

    /** Call at the start of each animation frame. */
    frame(timeMs: number, fpsText: HTMLElement | null) {
        ++this.fpsFrames;
        const elapsed = timeMs - this.windowStart;
        if (elapsed < STATS_WINDOW_MS) {
            return;
        }
        if (fpsText) {
            fpsText.innerText = `${Math.round(this.fpsFrames * 1000 / elapsed)} FPS`;
        }
        this.fpsFrames = 0;
        this.windowStart = timeMs;
        this.statsDue = true;
    }

    /** Adds one main view render: the CPU time of promoting assets and of render_session. */
    addRender(promoteMs: number, renderMs: number) {
        this.promoteMsTotal += promoteMs;
        this.promoteMsMax = Math.max(this.promoteMsMax, promoteMs);
        this.renderMsTotal += renderMs;
        this.renderMsMax = Math.max(this.renderMsMax, renderMs);
        ++this.renderCount;
    }

    /**
     * Writes the debug stats once per window. Call right after the main view renders,
     * before the thumbnail does, since the stats are for the last render.
     */
    report(frameStatsText: HTMLElement | null, graphics: Graphics) {
        if (!this.statsDue || !frameStatsText) {
            return;
        }
        const renderMsAverage = this.renderMsTotal / this.renderCount;
        const promoteMsAverage = this.promoteMsTotal / this.renderCount;
        // timing first, then what was drawn, then loading and the camera
        const lines: string[] = [];
        // undefined on WebGL, which has no GPU timestamps
        this.lastGpuStats = graphics.gpu_stats() ?? this.lastGpuStats;
        if (this.lastGpuStats !== undefined) {
            lines.push(this.lastGpuStats);
        }
        lines.push(`CPU render ${renderMsAverage.toFixed(2)} ms avg (${this.renderMsMax.toFixed(2)} max), promote ${promoteMsAverage.toFixed(2)} (${this.promoteMsMax.toFixed(2)})`);
        lines.push(graphics.frame_stats());
        // only while the map is still loading
        const texturesQueued = getTextureTranscoder().queued;
        if (mapIngestStats.count > 0 || texturesQueued > 0) {
            const ingestMsAverage = mapIngestStats.count > 0 ? mapIngestStats.totalMs / mapIngestStats.count : 0;
            lines.push(`Loading: ingest ${ingestMsAverage.toFixed(2)} ms avg (${mapIngestStats.maxMs.toFixed(2)} max), ${mapIngestStats.count} groups, ${texturesQueued} textures queued`);
        }
        const cameraStats = graphics.camera_stats();
        if (cameraStats !== undefined) {
            lines.push(cameraStats);
        }
        frameStatsText.innerText = lines.join("\n");

        this.renderMsTotal = 0;
        this.renderMsMax = 0;
        this.renderCount = 0;
        this.promoteMsTotal = 0;
        this.promoteMsMax = 0;
        mapIngestStats.totalMs = 0;
        mapIngestStats.maxMs = 0;
        mapIngestStats.count = 0;
        this.statsDue = false;
    }
}
