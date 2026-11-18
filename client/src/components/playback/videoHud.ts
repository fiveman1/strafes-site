import { formatDiff } from "shared";

/** What the HUD drawn into videos shows. */
export interface VideoHudSettings {
    speed: boolean
    /** The difference from the comparison run at each stage's Teleport */
    checkpoints: boolean
    /** The speed difference too, not just the time */
    checkpointSpeed: boolean
    /** The map's finish counts as a checkpoint */
    finish: boolean
}

/** How the run compared with the comparison run when it reached a stage. */
export interface CheckpointDiff {
    /** Seconds since the replay's start */
    time: number
    /** Run timer difference in seconds, positive when slower */
    timeDiff: number
    speedDiff: number
}

/** The values shown on one frame. */
export interface VideoHudValues {
    /** Seconds since the replay's start */
    time: number
    speed: number
}

/** The HUD is laid out for a video this tall and scaled with its height, like the player's HUD */
const FULL_SIZE_HEIGHT = 1000;
const FONT_FAMILY = '"Geist Mono", monospace';
const SHADOW_COLOR = "rgba(0, 0, 0, 0.9)";
const SHADOW_BLUR = 6;
// the player's speed text: the top of a 150 px column whose bottom is 10% above the bottom, see PlaybackOverlay
const SPEED_FONT_SIZE = 28;
const SPEED_LINE_HEIGHT = 1.2;
const SPEED_COLUMN_HEIGHT = 150;
const SPEED_COLUMN_BOTTOM = 0.9;
// a checkpoint's speed and time diffs below the speed, like the player's diff without its boxes
const DIFF_FONT_SIZE = 18;
const DIFF_LINE_HEIGHT = 1.4;
const DIFF_TOP_GAP = 2;
const DIFF_OUTLINE_COLOR = "rgba(0, 0, 0, 0.6)";
const DIFF_OUTLINE_WIDTH = 2;
const DIFF_SHADOW_BLUR = 4;
// the JHUD's colors for a gain and a loss
export const DIFF_GOOD_COLOR = "#5df25d";
export const DIFF_BAD_COLOR = "#ff5a4a";
// when a checkpoint's diff shows, in seconds from reaching it: fading in before, then fading out a while after
const DIFF_APPEAR = -0.5;
const DIFF_FADE_IN = 0.25;
const DIFF_HOLD = 2.5;
const DIFF_FADE_OUT = 0.5;
/** How long a checkpoint's diff shows after reaching it, in seconds */
export const DIFF_SHOWN_AFTER = DIFF_HOLD + DIFF_FADE_OUT;
/** How blurred the diff is while fading, at full size */
const DIFF_MAX_BLUR = 8;

function font(size: number, scale: number) {
    return `bold ${size * scale}px ${FONT_FAMILY}`;
}

function smoothstep(x: number) {
    const t = Math.min(Math.max(x, 0), 1);
    return t * t * (3 - 2 * t);
}

/** How visible a checkpoint's diff is, from 0 to 1, `since` seconds after reaching it. */
function diffVisibility(since: number) {
    const fadeIn = smoothstep((since - DIFF_APPEAR) / DIFF_FADE_IN);
    const fadeOut = 1 - smoothstep((since - DIFF_HOLD) / DIFF_FADE_OUT);
    return Math.min(fadeIn, fadeOut);
}

/**
 * From the top of a line to the baseline of text centered in it like text on the page: by the font's own ascent and
 * descent, not the glyphs'.
 */
function baselineInLine(context: CanvasRenderingContext2D, lineHeight: number) {
    const metrics = context.measureText("0");
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;
    return (lineHeight - ascent - descent) / 2 + ascent;
}

/** Draws the HUD over each video frame, as the player shows it. */
export class VideoHud {
    private readonly settings: VideoHudSettings;
    private readonly checkpoints: CheckpointDiff[];
    private readonly width: number;
    private readonly scale: number;
    /** The top of the speed's line */
    private readonly speedTop: number;
    private speedBaseline = 0;
    private diffBaseline = 0;

    private constructor(settings: VideoHudSettings, checkpoints: CheckpointDiff[], width: number, height: number) {
        this.settings = settings;
        this.checkpoints = checkpoints;
        this.width = width;
        this.scale = height / FULL_SIZE_HEIGHT;
        this.speedTop = SPEED_COLUMN_BOTTOM * height - SPEED_COLUMN_HEIGHT * this.scale;
    }

    /** Waits for the HUD's font, which a canvas doesn't load by itself. `checkpoints` is in time order. */
    static async create(context: CanvasRenderingContext2D, settings: VideoHudSettings, checkpoints: CheckpointDiff[], width: number, height: number) {
        const hud = new VideoHud(settings, checkpoints, width, height);
        const speedFont = font(SPEED_FONT_SIZE, hud.scale);
        const diffFont = font(DIFF_FONT_SIZE, hud.scale);
        await Promise.all([document.fonts.load(speedFont, "0123456789."), document.fonts.load(diffFont, "+-0123456789.ms u/")]);
        context.font = speedFont;
        hud.speedBaseline = baselineInLine(context, SPEED_FONT_SIZE * SPEED_LINE_HEIGHT * hud.scale);
        context.font = diffFont;
        hud.diffBaseline = baselineInLine(context, DIFF_FONT_SIZE * DIFF_LINE_HEIGHT * hud.scale);
        return hud;
    }

    draw(context: CanvasRenderingContext2D, values: VideoHudValues) {
        if (this.settings.speed) {
            this.drawSpeed(context, values.speed);
        }
        if (this.settings.checkpoints) {
            this.drawCheckpoint(context, values.time);
        }
    }

    private drawSpeed(context: CanvasRenderingContext2D, speed: number) {
        context.save();
        context.shadowColor = SHADOW_COLOR;
        // canvas shadows aren't scaled with the text
        context.shadowBlur = SHADOW_BLUR * this.scale;
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.font = font(SPEED_FONT_SIZE, this.scale);
        context.fillText(speed.toFixed(2), this.width / 2, this.speedTop + this.speedBaseline);
        context.restore();
    }

    /** The diffs of the latest checkpoint that has started showing, under the speed. */
    private drawCheckpoint(context: CanvasRenderingContext2D, time: number) {
        let checkpoint: CheckpointDiff | undefined = undefined;
        for (const next of this.checkpoints) {
            if (time - next.time < DIFF_APPEAR) break;
            checkpoint = next;
        }
        if (!checkpoint) return;
        const visibility = diffVisibility(time - checkpoint.time);
        if (visibility <= 0) return;

        // as the player shows them: text, and whether it's better than the compared run
        const diffMs = Math.round(checkpoint.timeDiff * 1000);
        const speedDiff = Math.round(checkpoint.speedDiff * 100) / 100;
        const rows: [string, boolean][] = [];
        if (this.settings.checkpointSpeed) {
            rows.push([(speedDiff >= 0 ? "+" : "") + speedDiff.toFixed(2) + " u/s", speedDiff >= 0]);
        }
        rows.push([(diffMs >= 0 ? "+" : "-") + formatDiff(Math.abs(diffMs)), diffMs < 0]);
        const scale = this.scale;
        const lineHeight = DIFF_FONT_SIZE * DIFF_LINE_HEIGHT * scale;
        const x = this.width / 2;
        let top = this.speedTop + SPEED_FONT_SIZE * SPEED_LINE_HEIGHT * scale + DIFF_TOP_GAP * scale;

        context.save();
        context.globalAlpha = visibility;
        const blur = (1 - visibility) * DIFF_MAX_BLUR * scale;
        if (blur > 0.05) {
            context.filter = `blur(${blur}px)`;
        }
        context.font = font(DIFF_FONT_SIZE, scale);
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.lineJoin = "round";
        context.lineWidth = DIFF_OUTLINE_WIDTH * scale;
        context.strokeStyle = DIFF_OUTLINE_COLOR;
        for (const [text, good] of rows) {
            const baseline = top + this.diffBaseline;
            // the outline casts the shadow, and the text goes over both
            context.shadowColor = "black";
            context.shadowBlur = DIFF_SHADOW_BLUR * scale;
            context.strokeText(text, x, baseline);
            context.shadowColor = "transparent";
            context.fillStyle = good ? DIFF_GOOD_COLOR : DIFF_BAD_COLOR;
            context.fillText(text, x, baseline);
            top += lineHeight;
        }
        context.restore();
    }
}
