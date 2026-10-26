import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { DownloadStats, DownloadStatsStore, FileDownloadStats, formatBytes, isDownloadComplete } from "./downloadStats";

/** How long the panel stays after everything finishes downloading, so it doesn't vanish the instant it hits 100%. */
const HIDE_DELAY_MS = 750;

interface DownloadPanelProps {
    downloadStats: DownloadStatsStore
    /** Playback is waiting on downloads */
    buffering: boolean
    /** Keep the panel up and show block counts */
    showDetails: boolean
}

function DownloadRow(props: { label: string, stats: FileDownloadStats }) {
    const { label, stats } = props;
    const theme = useTheme();
    const fraction = stats.bytesTotal > 0 ? Math.min(stats.bytesDownloaded / stats.bytesTotal, 1) : 0;
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span style={{ width: "6ch" }}>{label}</span>
            <Box sx={{
                position: "relative",
                width: "80px",
                height: "4px",
                borderRadius: "2px",
                overflow: "hidden",
                bgcolor: "#ffffff40"
            }}>
                <Box
                    style={{ width: `${fraction * 100}%` }}
                    sx={{
                        height: "100%",
                        bgcolor: theme.palette.primary.main,
                        transition: "width .25s linear"
                    }} />
            </Box>
            <span style={{ width: "4ch", textAlign: "right" }}>{Math.floor(fraction * 100)}%</span>
            <span>{formatBytes(stats.bytesDownloaded)} / {formatBytes(stats.bytesTotal)}</span>
        </Box>
    );
}

function DownloadDetails(props: { stats: DownloadStats }) {
    const { bot, map } = props.stats;
    return (
        <>
            <span>replay blocks {bot.blocksDownloaded}/{bot.blocksTotal}, {bot.requestsInFlight} in flight</span>
            <span>map regions {map.regionsDownloaded}/{map.regionsTotal}, meshes {map.meshesDownloaded}/{map.meshesTotal}, textures {map.texturesDownloaded}/{map.texturesTotal}{map.skyChunksTotal > 0 && `, sky ${map.skyChunksDownloaded}/${map.skyChunksTotal}`}, {map.requestsInFlight} in flight</span>
        </>
    );
}

/** Replay and map download progress. Shows while anything is downloading or playback is buffering, then fades out. */
function DownloadPanel(props: DownloadPanelProps) {
    const { downloadStats, buffering, showDetails } = props;
    const [ stats, setStats ] = useState(() => downloadStats.get());
    const [ visible, setVisible ] = useState(false);
    // Off when the debug HUD alone shows or hides the panel, so toggling it doesn't fade
    const [ fade, setFade ] = useState(true);

    useEffect(() => {
        setStats(downloadStats.get());
        return downloadStats.subscribe(setStats);
    }, [downloadStats]);

    // Stats only update as downloads start and finish, so hiding after the last one needs its own timer
    const downloading = !!stats && (buffering || !isDownloadComplete(stats));
    const active = downloading || (!!stats && showDetails);
    // Whether downloading was what kept the panel up, as opposed to the debug HUD
    const wasDownloading = useRef(false);
    useEffect(() => {
        const finishedDownloading = wasDownloading.current && !downloading;
        wasDownloading.current = downloading;
        if (active) {
            setFade(downloading);
            setVisible(true);
            return;
        }
        // Closing the debug HUD after everything finished hides it right away
        if (!finishedDownloading) {
            setFade(false);
            setVisible(false);
            return;
        }
        const timeout = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
        return () => clearTimeout(timeout);
    }, [active, downloading]);

    if (!stats) {
        return null;
    }
    return (
        <Typography
            component="div"
            className="debugText"
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                whiteSpace: "nowrap",
                transition: fade ? "opacity .4s ease" : "none",
                opacity: visible ? 1 : 0
            }}>
            <DownloadRow label="Replay" stats={stats.bot} />
            <DownloadRow label="Map" stats={stats.map} />
            {showDetails && <DownloadDetails stats={stats} />}
        </Typography>
    );
}

export default DownloadPanel;
