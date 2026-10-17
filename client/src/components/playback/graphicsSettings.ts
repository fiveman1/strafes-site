import { useCallback, useState } from "react";
import { GraphicsQuality } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";

/** A graphics preset. */
export type GraphicsLevel = "low" | "medium" | "high";
/** What the player picked: a preset, or "auto" to measure the device and pick one. */
export type GraphicsMode = "auto" | GraphicsLevel;

export const GRAPHICS_LEVELS: GraphicsLevel[] = ["low", "medium", "high"];

const MODE_KEY = "player_graphicsMode";
/** The preset auto picked on this device, so it's only measured once. */
const AUTO_LEVEL_KEY = "player_graphicsAutoLevel";
const RENDER_SCALE_KEY = "player_renderScale";

export const MIN_RENDER_SCALE = 0.5;

export function toGraphicsQuality(level: GraphicsLevel): GraphicsQuality {
    switch (level) {
        case "low": return GraphicsQuality.Low;
        case "medium": return GraphicsQuality.Medium;
        case "high": return GraphicsQuality.High;
    }
}

/**
 * Canvas pixels per CSS pixel. Each preset caps the device's pixel ratio, since a phone at 3x draws 9 times
 * the pixels of its CSS size, then the render scale shrinks it further. The browser stretches the canvas to fit.
 */
export function canvasPixelRatio(level: GraphicsLevel, renderScale: number): number {
    const cap = level === "low" ? 1 : level === "medium" ? 2 : Infinity;
    return Math.min(window.devicePixelRatio, cap) * renderScale;
}

/**
 * Where auto starts before measuring: Low for WebGL and touch devices (phones and tablets), Medium otherwise.
 */
export function guessGraphicsLevel(webgl: boolean): GraphicsLevel {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    return webgl || touch ? "low" : "medium";
}

function isLevel(value: string | null): value is GraphicsLevel {
    return value === "low" || value === "medium" || value === "high";
}

export interface GraphicsSettings {
    mode: GraphicsMode
    setMode: (mode: GraphicsMode) => void
    /** The preset auto settled on, if it has measured this device. */
    autoLevel: GraphicsLevel | undefined
    setAutoLevel: (level: GraphicsLevel) => void
    renderScale: number
    setRenderScale: (scale: number) => void
}

/** The player's graphics settings, saved in localStorage. */
export function useGraphicsSettings(): GraphicsSettings {
    const [ mode, setModeState ] = useState<GraphicsMode>(() => {
        const stored = localStorage.getItem(MODE_KEY);
        return isLevel(stored) ? stored : "auto";
    });
    const [ autoLevel, setAutoLevelState ] = useState<GraphicsLevel | undefined>(() => {
        const stored = localStorage.getItem(AUTO_LEVEL_KEY);
        return isLevel(stored) ? stored : undefined;
    });
    const [ renderScale, setRenderScaleState ] = useState(() => {
        const stored = Number(localStorage.getItem(RENDER_SCALE_KEY));
        return stored >= MIN_RENDER_SCALE && stored <= 1 ? stored : 1;
    });

    const setMode = useCallback((mode: GraphicsMode) => {
        localStorage.setItem(MODE_KEY, mode);
        // picking auto again measures again
        if (mode === "auto") {
            localStorage.removeItem(AUTO_LEVEL_KEY);
            setAutoLevelState(undefined);
        }
        setModeState(mode);
    }, []);
    const setAutoLevel = useCallback((level: GraphicsLevel) => {
        localStorage.setItem(AUTO_LEVEL_KEY, level);
        setAutoLevelState(level);
    }, []);
    const setRenderScale = useCallback((scale: number) => {
        localStorage.setItem(RENDER_SCALE_KEY, scale.toString());
        setRenderScaleState(scale);
    }, []);

    return { mode, setMode, autoLevel, setAutoLevel, renderScale, setRenderScale };
}

/** Frames ignored after starting or switching presets, while shaders compile and the light volume fills. */
const WARMUP_MS = 1500;
/** How long each preset is measured. */
const MEASURE_MS = 3000;
/** Refresh rates above this don't push the preset down. */
const MAX_TARGET_FPS = 144;
/**
 * Every preset should reach at least this. A device that never keeps up with its display has no quick frames
 * to tell its refresh rate from, so slow frames alone would look like a slow display.
 */
const MIN_TARGET_FPS = 60;
/** A preset is too slow when the GPU needs more than this share of a frame. */
const TOO_SLOW_GPU_SHARE = 0.8;
/** A preset can go up when the GPU needs less than this share of a frame. */
const FAST_GPU_SHARE = 0.35;
/** Without GPU timing, a preset is too slow when the median frame takes this much longer than the refresh interval. */
const TOO_SLOW_FRAME_RATIO = 1.25;
/** Without GPU timing, a preset can go up when the median frame is within this of the refresh interval. */
const KEEPING_UP_FRAME_RATIO = 1.1;

/**
 * Measures playback at one preset at a time and moves one step down when the device can't keep up,
 * or one step up when it has plenty of room, then settles. Uses the GPU timer where the browser has one
 * (WebGPU in Chrome), and frame times otherwise. Only counts frames while the replay is playing.
 */
export class AutoGraphicsTuner {
    level: GraphicsLevel;
    private wentDown = false;
    private triedUp = false;
    private phaseStart: number | undefined;
    private lastFrame: number | undefined;
    private frameMs: number[] = [];
    private gpuMs = 0;
    private gpuWindows = 0;

    constructor(start: GraphicsLevel) {
        this.level = start;
    }

    /**
     * Call once per animation frame. `takeGpuFrameMs` reads the GPU's average frame time since its last call.
     * Returns undefined while measuring, and after each measurement the preset to use and whether that's final.
     */
    update(timeMs: number, counting: boolean, takeGpuFrameMs: () => number | undefined): AutoGraphicsDecision | undefined {
        const lastFrame = this.lastFrame;
        this.lastFrame = timeMs;
        if (!counting || lastFrame === undefined) {
            // start the phase over after any pause, so frames around it aren't counted
            this.restart();
            return undefined;
        }
        if (this.phaseStart === undefined) {
            this.phaseStart = timeMs;
        }
        const elapsed = timeMs - this.phaseStart;
        if (elapsed < WARMUP_MS) {
            // drop GPU times from the warm-up
            takeGpuFrameMs();
            return undefined;
        }
        this.frameMs.push(timeMs - lastFrame);
        // GPU times average over whatever frames arrived since the last read, so read them now and then
        if (this.frameMs.length % 30 === 0) {
            const gpu = takeGpuFrameMs();
            if (gpu !== undefined) {
                this.gpuMs += gpu;
                ++this.gpuWindows;
            }
        }
        if (elapsed < WARMUP_MS + MEASURE_MS) {
            return undefined;
        }
        return this.decide();
    }

    private restart() {
        this.phaseStart = undefined;
        this.frameMs = [];
        this.gpuMs = 0;
        this.gpuWindows = 0;
    }

    private decide(): AutoGraphicsDecision {
        const sorted = [...this.frameMs].sort((a, b) => a - b);
        const quantile = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
        // the refresh interval: the quickest frames are the ones that kept up with the display,
        // but aim for MIN_TARGET_FPS even when no frame did
        const interval = Math.min(Math.max(quantile(0.1), 1000 / MAX_TARGET_FPS), 1000 / MIN_TARGET_FPS);
        const gpu = this.gpuWindows > 0 ? this.gpuMs / this.gpuWindows : undefined;
        const tooSlow = gpu !== undefined
            ? gpu > TOO_SLOW_GPU_SHARE * interval
            : quantile(0.5) > TOO_SLOW_FRAME_RATIO * interval;
        // without GPU timing there's no telling how much room is left, so only try one step up, and only when keeping up
        const roomToGrow = gpu !== undefined
            ? gpu < FAST_GPU_SHARE * interval
            : quantile(0.5) <= KEEPING_UP_FRAME_RATIO * interval;
        const index = GRAPHICS_LEVELS.indexOf(this.level);
        this.restart();
        if (tooSlow && index > 0) {
            this.wentDown = true;
            this.level = GRAPHICS_LEVELS[index - 1];
            // stepping back down from a step up is the answer; otherwise measure the lower preset too
            return { level: this.level, done: this.triedUp };
        }
        if (roomToGrow && !this.wentDown && !this.triedUp && index < GRAPHICS_LEVELS.length - 1) {
            this.triedUp = true;
            this.level = GRAPHICS_LEVELS[index + 1];
            return { level: this.level, done: false };
        }
        return { level: this.level, done: true };
    }
}

export interface AutoGraphicsDecision {
    level: GraphicsLevel
    /** Whether auto has settled on this preset. */
    done: boolean
}
