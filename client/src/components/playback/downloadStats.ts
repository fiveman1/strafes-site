import { StreamableBot, StreamableMap } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";

export interface FileDownloadStats {
    bytesDownloaded: number
    bytesTotal: number
    requestsInFlight: number
}

export interface DownloadStats {
    bot: FileDownloadStats & {
        blocksDownloaded: number
        blocksTotal: number
    }
    map: FileDownloadStats & {
        texturesDownloaded: number
        texturesTotal: number
        meshesDownloaded: number
        meshesTotal: number
        regionsDownloaded: number
        regionsTotal: number
    }
    /** Downloaded replay as pairs [start0, end0, start1, end1, ...] in seek bar time */
    ranges: number[]
}

/**
 * Download progress, shared without React state.
 * Undefined until the replay and map are set up.
 */
export interface DownloadStatsStore {
    get(): DownloadStats | undefined
    set(stats: DownloadStats | undefined): void
    subscribe(listener: (stats: DownloadStats | undefined) => void): () => void
}

export function createDownloadStats(): DownloadStatsStore {
    let stats: DownloadStats | undefined = undefined;
    const listeners = new Set<(stats: DownloadStats | undefined) => void>();
    return {
        get: () => stats,
        set(newStats: DownloadStats | undefined) {
            stats = newStats;
            for (const listener of listeners) {
                listener(stats);
            }
        },
        subscribe(listener: (stats: DownloadStats | undefined) => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        }
    };
}

/** Reads the current stats. `offset` converts bot time to seek bar time. */
export function readDownloadStats(bot: StreamableBot, map: StreamableMap, offset: number): DownloadStats {
    const botStats = bot.stats();
    const mapStats = map.stats();
    const stats: DownloadStats = {
        bot: {
            bytesDownloaded: botStats.bytes_downloaded,
            bytesTotal: botStats.bytes_total,
            requestsInFlight: botStats.requests_in_flight,
            blocksDownloaded: botStats.blocks_downloaded,
            blocksTotal: botStats.blocks_total
        },
        map: {
            bytesDownloaded: mapStats.bytes_downloaded,
            bytesTotal: mapStats.bytes_total,
            requestsInFlight: mapStats.requests_in_flight,
            texturesDownloaded: mapStats.textures_downloaded,
            texturesTotal: mapStats.textures_total,
            meshesDownloaded: mapStats.meshes_downloaded,
            meshesTotal: mapStats.meshes_total,
            regionsDownloaded: mapStats.regions_downloaded,
            regionsTotal: mapStats.regions_total
        },
        ranges: Array.from(bot.ranges(), time => time - offset)
    };
    botStats.free();
    mapStats.free();
    return stats;
}

/** Whether the whole replay and map are downloaded. */
export function isDownloadComplete(stats: DownloadStats) {
    return stats.bot.blocksDownloaded >= stats.bot.blocksTotal
        && stats.map.bytesDownloaded >= stats.map.bytesTotal;
}

export function formatBytes(bytes: number) {
    if (bytes < 1000) return `${bytes} B`;
    if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(0)} KB`;
    return `${(bytes / (1000 * 1000)).toFixed(1)} MB`;
}
