import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Slider from "@mui/material/Slider";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VideocamIcon from "@mui/icons-material/Videocam";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { alpha, lighten } from "@mui/system";
import { useTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CompleteBot, Graphics, StreamableBot, StreamableMap } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import { formatBytes } from "./downloadStats";
import { GRAPHICS_LEVELS, GraphicsLevel } from "./graphicsSettings";
import { DIFF_BAD_COLOR, DIFF_GOOD_COLOR } from "./videoHud";
import { canEncodeSettings, DEFAULT_VIDEO_SETTINGS, MAX_BLUR_SAMPLES, MIN_BLUR_SAMPLES, endHold, recordVideo, RecordingProgress, VIDEO_RESOLUTIONS, VideoFrameRate, VideoQuality, VideoResolution, VideoSettings } from "./videoRecorder";

const SETTINGS_KEY = "player_videoSettings";
/** Width of the settings' labels, so their options line up */
const LABEL_WIDTH = "128px";
/** Size the preview is drawn at, scaled to fit the panel */
const PREVIEW_WIDTH = 640;
const PREVIEW_HEIGHT = 360;

const RESOLUTION_LABELS: [VideoResolution, string][] = [["720p", "720p"], ["1080p", "1080p"]];
const FPS_LABELS: [VideoFrameRate, string][] = [[30, "30"], [60, "60"]];
const QUALITY_LABELS: [VideoQuality, string][] = [["medium", "Medium"], ["high", "High"], ["very-high", "Very high"]];
const GRAPHICS_LABELS: Record<GraphicsLevel, string> = { low: "Low", medium: "Medium", high: "High" };
const OFF_ON_LABELS: [string, string][] = [["off", "Off"], ["on", "On"]];
type DiffChoice = "off" | "time" | "speed";

/** Example diff lines as the video draws them, for the Diff buttons: text, and whether it's better than the compared run */
function DiffPreview(props: { lines: [string, boolean][] }) {
    return (
        <Box
            component="span"
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontFamily: '"Geist Mono", monospace',
                fontWeight: "bold",
                fontSize: "13px",
                lineHeight: 1.25,
                textShadow: "0 0 3px rgba(0, 0, 0, 0.8)"
            }}>
            {props.lines.map(([text, good]) =>
                <span key={text} style={{ color: good ? DIFF_GOOD_COLOR : DIFF_BAD_COLOR }}>{text}</span>
            )}
        </Box>
    );
}

const DIFF_LABELS: [DiffChoice, React.ReactNode][] = [
    ["off", "Off"],
    ["time", <DiffPreview lines={[["-0.123s", true]]} />],
    ["speed", <DiffPreview lines={[["+4.56 u/s", true], ["+0.789s", false]]} />],
];

/** What a recording is made from, once the replay is ready. */
export interface RecordingSources {
    graphics: Graphics
    map: StreamableMap
    bot: StreamableBot
    /** The run the checkpoint diffs compare with, if there is one */
    compareBot?: CompleteBot
    /** Starts the downloads the replay and map still need */
    pump: () => void
}

type Phase =
    | { kind: "setup" }
    /** `encodeSeconds` is how long encoding has been going, for the speed and time left */
    | { kind: "running", progress: RecordingProgress, encodeSeconds: number }
    | { kind: "done", video: Blob }
    | { kind: "failed", error: string };

function readSettings(): VideoSettings {
    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
        return {
            resolution: stored.resolution in VIDEO_RESOLUTIONS ? stored.resolution : DEFAULT_VIDEO_SETTINGS.resolution,
            fps: FPS_LABELS.some(([fps]) => fps === stored.fps) ? stored.fps : DEFAULT_VIDEO_SETTINGS.fps,
            quality: QUALITY_LABELS.some(([quality]) => quality === stored.quality) ? stored.quality : DEFAULT_VIDEO_SETTINGS.quality,
            graphics: GRAPHICS_LEVELS.includes(stored.graphics) ? stored.graphics : DEFAULT_VIDEO_SETTINGS.graphics,
            motionBlur: typeof stored.motionBlur === "boolean" ? stored.motionBlur : DEFAULT_VIDEO_SETTINGS.motionBlur,
            blurSamples: Number.isInteger(stored.blurSamples) && stored.blurSamples >= MIN_BLUR_SAMPLES && stored.blurSamples <= MAX_BLUR_SAMPLES
                ? stored.blurSamples
                : DEFAULT_VIDEO_SETTINGS.blurSamples,
            hud: Object.fromEntries(Object.entries(DEFAULT_VIDEO_SETTINGS.hud).map(([key, value]) =>
                [key, typeof stored.hud?.[key] === "boolean" ? stored.hud[key] : value]
            )) as VideoSettings["hud"]
        };
    }
    catch {
        return DEFAULT_VIDEO_SETTINGS;
    }
}

/** Saves a file the page made. */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    // the download has its own copy once started
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatDuration(seconds: number) {
    const whole = Math.max(0, Math.round(seconds));
    return `${Math.floor(whole / 60)}:${(whole % 60).toString().padStart(2, "0")}`;
}

interface ChoiceRowProps<T> {
    label: string
    /** Explains the setting in a tooltip on an info icon after the label */
    info?: string
    options: [T, React.ReactNode][]
    value: T
    onChange: (value: T) => void
    isDisabled?: (value: T) => boolean
}

interface ButtonRowProps {
    label: string
    info?: string
    children: React.ReactNode
}

/** A labeled row of buttons, highlighted with the "active" class, like the graphics presets in the settings menu. */
function ButtonRow(props: ButtonRowProps) {
    const { label, info, children } = props;
    const theme = useTheme();
    return (
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
            <Typography variant="subtitle2" sx={{ width: LABEL_WIDTH, display: "flex", alignItems: "center" }}>
                {label}
                {info &&
                <Tooltip
                    title={info}
                    enterTouchDelay={0}
                    // inside the player, which may be fullscreen
                    slotProps={{ popper: { disablePortal: true } }}>
                    <InfoOutlinedIcon aria-label={info} tabIndex={0} sx={{ fontSize: "16px", ml: 0.5, opacity: 0.7 }} />
                </Tooltip>}
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,

                    "button": {
                        display: "flex",
                        alignItems: "center",
                        py: 0.25,
                        px: 0.75,
                        borderRadius: "8px",
                        cursor: "pointer",
                        userSelect: "none",
                        color: "white",
                        bgcolor: "#ffffff1a",
                        transition: "background .15s ease",
                        border: 0,
                        fontWeight: "bold",
                        "&:hover": {
                            bgcolor: "#ffffff33"
                        },
                        "&.active": {
                            bgcolor: `${alpha(theme.palette.primary.main, 0.7)}`,
                            "&:hover": {
                                bgcolor: `${alpha(lighten(theme.palette.primary.main, 0.2), 0.7)}`
                            }
                        },
                        "&:disabled": {
                            opacity: 0.4,
                            cursor: "default"
                        }
                    }
                }}>
                {children}
            </Box>
        </Box>
    );
}

/** A row of buttons picking one option. */
function ChoiceRow<T extends string | number>(props: ChoiceRowProps<T>) {
    const { label, info, options, value, onChange, isDisabled } = props;
    return (
        <ButtonRow label={label} info={info}>
            {options.map(([option, optionLabel]) =>
                <Typography
                    key={option}
                    variant="subtitle2"
                    component="button"
                    className={value === option ? "active" : undefined}
                    disabled={isDisabled?.(option)}
                    onClick={() => onChange(option)}
                >
                    {optionLabel}
                </Typography>
            )}
        </ButtonRow>
    );
}

interface VideoPanelProps {
    /** What to record from, or undefined while the replay isn't ready */
    getSources: () => RecordingSources | undefined
    filename: string
    /** Seconds of replay, from its start to its end */
    replaySeconds: number
    /** Whether there's a run to compare with for the diffs */
    canCompare: boolean
    /** The page's render loop doesn't draw while recording, since both share the graphics */
    onRecordingChange: (recording: boolean) => void
    onClose: () => void
}

/** Records the replay to a video file: settings, then progress with a preview, then saving it. Covers the player. */
function VideoPanel(props: VideoPanelProps) {
    const { getSources, filename, replaySeconds, canCompare, onRecordingChange, onClose } = props;

    const [ settings, setSettingsState ] = useState(readSettings);
    const setSettings = useCallback((change: Partial<VideoSettings>) => {
        setSettingsState(old => {
            const settings = { ...old, ...change };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            return settings;
        });
    }, []);
    const [ phase, setPhase ] = useState<Phase>({ kind: "setup" });
    const abortRef = useRef<AbortController | null>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    // when encoding started, see Phase
    const encodeStartRef = useRef<number | undefined>(undefined);

    // which resolutions the browser can encode at this frame rate and quality
    const [ unsupported, setUnsupported ] = useState<Set<VideoResolution>>(new Set());
    useEffect(() => {
        let canceled = false;
        const resolutions = RESOLUTION_LABELS.map(([resolution]) => resolution);
        Promise.all(resolutions.map(resolution => canEncodeSettings({ ...settings, resolution }).catch(() => false)))
            .then(supported => {
                if (!canceled) setUnsupported(new Set(resolutions.filter((_, i) => !supported[i])));
            });
        return () => {
            canceled = true;
        };
    }, [settings]);

    // a recording belongs to the replay it started on
    useEffect(() => () => abortRef.current?.abort(), []);

    const onPreview = useCallback((frame: HTMLCanvasElement) => {
        previewRef.current?.getContext("2d")?.drawImage(frame, 0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
    }, []);

    const onProgress = useCallback((progress: RecordingProgress) => {
        const now = performance.now();
        if (progress.step === "recording") {
            encodeStartRef.current ??= now;
        }
        setPhase({ kind: "running", progress, encodeSeconds: (now - (encodeStartRef.current ?? now)) / 1000 });
    }, []);

    const onRecord = useCallback(async () => {
        if (abortRef.current) return;
        const sources = getSources();
        if (!sources) {
            setPhase({ kind: "failed", error: "the replay is still loading, try again in a moment." });
            return;
        }
        const controller = new AbortController();
        abortRef.current = controller;
        encodeStartRef.current = undefined;
        const preview = previewRef.current;
        preview?.getContext("2d")?.clearRect(0, 0, preview.width, preview.height);
        setPhase({ kind: "running", progress: { step: "loading", fraction: 0 }, encodeSeconds: 0 });
        onRecordingChange(true);
        try {
            const video = await recordVideo({ ...sources, settings, signal: controller.signal, onProgress, onPreview });
            if (video) {
                downloadBlob(video, filename);
                setPhase({ kind: "done", video });
            }
            else {
                setPhase({ kind: "setup" });
            }
        }
        catch (err) {
            console.error(err);
            setPhase({ kind: "failed", error: err instanceof Error ? err.message : String(err) });
        }
        finally {
            abortRef.current = null;
            onRecordingChange(false);
        }
    }, [getSources, settings, filename, onProgress, onPreview, onRecordingChange]);

    const onCancel = useCallback(() => abortRef.current?.abort(), []);

    const videoSeconds = replaySeconds + endHold(settings, canCompare);
    const hud = settings.hud;
    const diff: DiffChoice = !canCompare || !hud.checkpoints ? "off" : hud.checkpointSpeed ? "speed" : "time";
    const onChangeDiff = (choice: DiffChoice) => setSettings({
        hud: { ...hud, checkpoints: choice !== "off", checkpointSpeed: choice === "off" ? hud.checkpointSpeed : choice === "speed" }
    });
    const running = phase.kind === "running";

    let status: React.ReactNode = null;
    if (phase.kind === "running") {
        const progress = phase.progress;
        if (progress.step === "loading") {
            status = <>
                <Typography variant="body2">Loading the whole map first: {Math.floor(progress.fraction * 100)}%</Typography>
                <LinearProgress variant="determinate" value={progress.fraction * 100} />
            </>;
        }
        else if (progress.step === "recording") {
            const { frame, frameCount, bytes } = progress;
            const framesPerSecond = phase.encodeSeconds > 0 ? frame / phase.encodeSeconds : 0;
            const measured = frame > 0 && framesPerSecond > 0;
            const stats: [string, string][] = [
                ["Speed", measured ? `${(framesPerSecond / settings.fps).toFixed(1)}x real time` : "-"],
                ["Time left", measured ? `about ${formatDuration((frameCount - frame) / framesPerSecond)}` : "-"],
                ["Size", measured ? `${formatBytes(bytes)} of about ${formatBytes(bytes * frameCount / frame)}` : "-"],
            ];
            status = <>
                <Box sx={{ display: "flex", justifyContent: "space-between", fontVariantNumeric: "tabular-nums" }}>
                    <Typography variant="body2">Recording</Typography>
                    <Typography variant="body2">
                        {formatDuration(frame / settings.fps)} / {formatDuration(frameCount / settings.fps)}
                    </Typography>
                </Box>
                <LinearProgress variant="determinate" value={frame / frameCount * 100} />
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        columnGap: 1,
                        mt: 0.5,
                        fontVariantNumeric: "tabular-nums"
                    }}>
                    {stats.map(([label, value]) =>
                        <Box key={label} sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>{label}</Typography>
                            <Typography variant="body2">{value}</Typography>
                        </Box>
                    )}
                </Box>
            </>;
        }
        else {
            status = <>
                <Typography variant="body2">Saving</Typography>
                <LinearProgress variant="indeterminate" />
            </>;
        }
    }
    else if (phase.kind === "done") {
        status = <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CheckCircleIcon fontSize="small" color="success" />
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>Saved</Typography>
                <Typography variant="body2" sx={{ ml: "auto", opacity: 0.7 }}>{formatBytes(phase.video.size)}</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, overflowWrap: "anywhere" }}>{filename}</Typography>
        </>;
    }
    else if (phase.kind === "failed") {
        status = <Typography variant="body2" color="error.light">Couldn't record the video: {phase.error}</Typography>;
    }

    return (
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0, 0, 0, 0.5)",
                p: 1
            }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    width: "min(520px, 100%)",
                    maxHeight: "100%",
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                    p: 2,
                    borderRadius: "8px",
                    bgcolor: "rgba(20, 20, 20, 0.92)",
                    color: "white"
                }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <VideocamIcon fontSize="small" sx={{ mr: 0.75 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        Record video
                    </Typography>
                    {!running &&
                    <IconButton size="small" aria-label="Close" onClick={onClose} sx={{ ml: "auto", color: "white" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>}
                </Box>
                {/* kept while setting up, so the last frame stays after recording and shows again on the next one */}
                <Box
                    sx={{
                        display: phase.kind === "setup" ? "none" : "block",
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        bgcolor: "black",
                        borderRadius: "4px",
                        overflow: "hidden"
                    }}>
                    <canvas
                        ref={previewRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        style={{ width: "100%", height: "100%", display: "block" }} />
                </Box>
                {phase.kind === "setup" ?
                <>
                    <ChoiceRow
                        label="Resolution"
                        options={RESOLUTION_LABELS}
                        value={settings.resolution}
                        onChange={resolution => setSettings({ resolution })}
                        isDisabled={resolution => unsupported.has(resolution)} />
                    <ChoiceRow label="Frame rate" options={FPS_LABELS} value={settings.fps} onChange={fps => setSettings({ fps })} />
                    <ChoiceRow label="Quality" options={QUALITY_LABELS} value={settings.quality} onChange={quality => setSettings({ quality })} />
                    <ChoiceRow
                        label="Graphics"
                        options={GRAPHICS_LEVELS.map(level => [level, GRAPHICS_LABELS[level]])}
                        value={settings.graphics}
                        onChange={graphics => setSettings({ graphics })} />
                    <Box sx={{ display: "flex", alignItems: "center", columnGap: 1.5 }}>
                        <ChoiceRow
                            label="Motion blur"
                            options={OFF_ON_LABELS}
                            value={settings.motionBlur ? "on" : "off"}
                            onChange={value => setSettings({ motionBlur: value === "on" })} />
                        {settings.motionBlur &&
                        <>
                            {/* no height of its own, so turning blur on doesn't make the row taller than its buttons */}
                            <Box sx={{ flex: 1, minWidth: "80px", height: 0, display: "flex", alignItems: "center" }}>
                                <Slider
                                    size="small"
                                    aria-label="Motion blur frame samples"
                                    min={MIN_BLUR_SAMPLES}
                                    max={MAX_BLUR_SAMPLES}
                                    step={1}
                                    value={settings.blurSamples}
                                    onChange={(_, value) => setSettings({ blurSamples: value })} />
                            </Box>
                            <Typography variant="body2" sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                                {settings.blurSamples} <Box component="span" sx={{ opacity: 0.7 }}>frame samples</Box>
                            </Typography>
                        </>}
                    </Box>
                    <Typography variant="caption" sx={{ mb: -0.75, opacity: 0.7, fontWeight: "bold", letterSpacing: "0.08em" }}>
                        HUD
                    </Typography>
                    <ChoiceRow
                        label="Speed"
                        options={OFF_ON_LABELS}
                        value={hud.speed ? "on" : "off"}
                        onChange={value => setSettings({ hud: { ...hud, speed: value === "on" } })} />
                    <ChoiceRow
                        label="Diff"
                        info={canCompare ? "The current diff is shown briefly after each teleport in the replay" : "There's no other run to compare with"}
                        options={DIFF_LABELS}
                        value={diff}
                        onChange={onChangeDiff}
                        isDisabled={() => !canCompare} />
                    <ChoiceRow
                        label="Include finish?"
                        info="Include the map's finish zone as a checkpoint in the diff display"
                        options={OFF_ON_LABELS}
                        value={diff !== "off" && hud.finish ? "on" : "off"}
                        onChange={value => setSettings({ hud: { ...hud, finish: value === "on" } })}
                        isDisabled={() => diff === "off"} />
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: `${LABEL_WIDTH} 1fr`,
                            columnGap: 0.75,
                            rowGap: 0.25,
                            "& > :nth-of-type(odd)": { opacity: 0.7 },
                            "& > :nth-of-type(even)": { overflowWrap: "anywhere" }
                        }}>
                        <Typography variant="body2">Length</Typography>
                        <Typography variant="body2">{formatDuration(videoSeconds)}</Typography>
                        <Typography variant="body2">File</Typography>
                        <Typography variant="body2">{filename}</Typography>

                    </Box>
                    {unsupported.has(settings.resolution) &&
                    <Typography variant="caption" color="error.light">
                        This browser can't encode video at {settings.resolution}.
                    </Typography>}
                    <Button
                        variant="contained"
                        onClick={onRecord}
                        disabled={unsupported.has(settings.resolution)}
                        sx={{ alignSelf: "flex-end" }}>
                        Record
                    </Button>
                </>
                :
                <>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                        {status}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        {running &&
                        <Button color="inherit" onClick={onCancel}>Cancel</Button>}
                        {phase.kind === "done" &&
                        <Button color="inherit" onClick={() => downloadBlob(phase.video, filename)}>Save again</Button>}
                        {!running &&
                        <Button variant="contained" onClick={() => setPhase({ kind: "setup" })}>Back to settings</Button>}
                    </Box>
                </>}
            </Box>
        </Box>
    );
}

export default VideoPanel;
