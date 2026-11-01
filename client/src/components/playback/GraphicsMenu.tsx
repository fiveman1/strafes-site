import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import TuneIcon from '@mui/icons-material/Tune';
import { alpha, lighten } from "@mui/system";
import { useTheme } from "@mui/material/styles";
import React, { useCallback, useState } from "react";
import { GraphicsLevel, GraphicsMode, GraphicsSettings, MIN_RENDER_SCALE } from "./graphicsSettings";

const MODE_LABELS: [GraphicsMode, string][] = [
    ["auto", "Auto"],
    ["low", "Low"],
    ["medium", "Medium"],
    ["high", "High"],
];

const LEVEL_NAMES: Record<GraphicsLevel, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
};

interface GraphicsMenuProps {
    settings: GraphicsSettings
    /** The preset in use, which auto picks. */
    level: GraphicsLevel
}

/** The graphics part of the player's settings menu: the preset and the render scale. */
function GraphicsMenu(props: GraphicsMenuProps) {
    const { settings, level } = props;
    const { mode, setMode, autoLevel, renderScale, setRenderScale } = settings;
    const theme = useTheme();

    // the slider shows its value while dragging and saves it when let go
    const [ dragScale, setDragScale ] = useState<number | undefined>(undefined);
    const onChangeScale = useCallback((_: Event, value: number) => setDragScale(value), []);
    const onCommitScale = useCallback((_: React.SyntheticEvent | Event, value: number) => {
        setDragScale(undefined);
        setRenderScale(value);
    }, [setRenderScale]);
    const shownScale = dragScale ?? renderScale;

    const autoNote = mode !== "auto" ? undefined
        : autoLevel !== undefined ? LEVEL_NAMES[level]
        : `testing ${LEVEL_NAMES[level]}`;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                mt: 1.5
            }}>
            <Box sx={{
                display: "flex"
            }}>
                <Typography variant="subtitle2">
                    Graphics
                </Typography>
                <TuneIcon fontSize="small" sx={{ ml: 0.75 }} />
                {autoNote &&
                <Typography variant="caption" sx={{ ml: "auto", opacity: 0.8 }}>
                    {autoNote}
                </Typography>}
            </Box>
            <Box
                sx={{
                    mt: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.75,

                    "button": {
                        py: 0.25,
                        px: 0.75,
                        borderRadius: "8px",
                        cursor: "pointer",
                        userSelect: "none",
                        color: "white",
                        bgcolor: "#00000080",
                        transition: "background .15s ease",
                        border: 0,
                        fontWeight: "bold",
                        "&:hover": {
                            bgcolor: "#42424280"
                        },
                        "&.active": {
                            bgcolor: `${alpha(theme.palette.primary.main, 0.7)}`,
                            "&:hover": {
                                bgcolor: `${alpha(lighten(theme.palette.primary.main, 0.2), 0.7)}`
                            }
                        }
                    }
                }}>
                {MODE_LABELS.map(([buttonMode, label]) =>
                    <Typography
                        key={buttonMode}
                        variant="subtitle2"
                        component="button"
                        className={mode === buttonMode ? "active" : undefined}
                        onClick={() => setMode(buttonMode)}
                    >
                        {label}
                    </Typography>
                )}
            </Box>
            <Box sx={{
                mt: 1,
                display: "flex"
            }}>
                <Typography variant="subtitle2">
                    Render scale
                </Typography>
                <Typography variant="subtitle2" sx={{ ml: "auto" }}>
                    {Math.round(shownScale * 100)}%
                </Typography>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    pl: 1,
                    pr: 1
                }}>
                <Slider
                    size="small"
                    value={shownScale}
                    min={MIN_RENDER_SCALE}
                    max={1}
                    step={0.05}
                    onChange={onChangeScale}
                    onChangeCommitted={onCommitScale}
                />
            </Box>
        </Box>
    );
}

export default GraphicsMenu;
