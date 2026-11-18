/** What the HUD drawn into videos shows. */
export interface VideoHudSettings {
    speed: boolean
}

/** The values shown on one frame. */
export interface VideoHudValues {
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

function speedFont(scale: number) {
    return `bold ${SPEED_FONT_SIZE * scale}px ${FONT_FAMILY}`;
}

/** Draws the HUD over each video frame, as the player shows it. */
export class VideoHud {
    private readonly settings: VideoHudSettings;
    private readonly width: number;
    private readonly scale: number;
    private speedBaseline: number;

    private constructor(settings: VideoHudSettings, width: number, height: number) {
        this.settings = settings;
        this.width = width;
        this.scale = height / FULL_SIZE_HEIGHT;
        // the top of the speed's line until create measures the font
        this.speedBaseline = SPEED_COLUMN_BOTTOM * height - SPEED_COLUMN_HEIGHT * this.scale;
    }

    /** Waits for the HUD's font, which a canvas doesn't load by itself. */
    static async create(context: CanvasRenderingContext2D, settings: VideoHudSettings, width: number, height: number) {
        const hud = new VideoHud(settings, width, height);
        const font = speedFont(hud.scale);
        await document.fonts.load(font, "0123456789.");
        // centered in its line like text on the page: the font's own ascent and descent, not the glyphs'
        context.font = font;
        const metrics = context.measureText("0");
        const lineHeight = SPEED_FONT_SIZE * SPEED_LINE_HEIGHT * hud.scale;
        const ascent = metrics.fontBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent;
        hud.speedBaseline += (lineHeight - ascent - descent) / 2 + ascent;
        return hud;
    }

    draw(context: CanvasRenderingContext2D, values: VideoHudValues) {
        if (!this.settings.speed) return;
        context.save();
        context.shadowColor = SHADOW_COLOR;
        // canvas shadows aren't scaled with the text
        context.shadowBlur = SHADOW_BLUR * this.scale;
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.font = speedFont(this.scale);
        context.fillText(values.speed.toFixed(2), this.width / 2, this.speedBaseline);
        context.restore();
    }
}
