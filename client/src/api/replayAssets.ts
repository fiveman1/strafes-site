import { queryOptions, QueryClient } from "@tanstack/react-query";
import { getBotFileResponse, getMapFileResponse } from "./api";

export interface ReplayAssetProgress {
    received: number
    total: number
    status: "loading" | "success" | "error"
}

type ProgressListener = (progress: ReplayAssetProgress) => void;

const progressByAsset = new Map<string, ReplayAssetProgress>();
const listenersByAsset = new Map<string, Set<ProgressListener>>();

export const mapAssetProgressKey = (mapId: number) => `map:${mapId}`;
export const botAssetProgressKey = (timeId: string) => `bot:${timeId}`;

function updateProgress(key: string, progress: ReplayAssetProgress) {
    progressByAsset.set(key, progress);
    listenersByAsset.get(key)?.forEach((listener) => listener(progress));
}

export function subscribeToReplayAssetProgress(key: string, listener: ProgressListener) {
    let listeners = listenersByAsset.get(key);
    if (!listeners) {
        listeners = new Set();
        listenersByAsset.set(key, listeners);
    }
    listeners.add(listener);

    const currentProgress = progressByAsset.get(key);
    if (currentProgress) listener(currentProgress);

    return () => {
        listeners?.delete(listener);
        if (listeners?.size === 0) listenersByAsset.delete(key);
    };
}

function chunksToArray(chunks: Uint8Array[], length: number) {
    const file = new Uint8Array(length);
    let position = 0;
    for (const chunk of chunks) {
        file.set(chunk, position);
        position += chunk.length;
    }
    return file;
}

async function readWithProgress(response: Response, key: string) {
    const expectedLength = +(response.headers.get("Content-Length") ?? 0);
    updateProgress(key, { received: 0, total: expectedLength, status: "loading" });

    if (!response.body) {
        const file = new Uint8Array(await response.arrayBuffer());
        updateProgress(key, { received: file.byteLength, total: file.byteLength, status: "success" });
        return file;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    const preallocatedFile = expectedLength > 0 ? new Uint8Array(expectedLength) : null;
    let received = 0;
    let lastProgressUpdate = performance.now();

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            if (preallocatedFile && received + value.byteLength <= preallocatedFile.byteLength) {
                preallocatedFile.set(value, received);
            }
            else {
                if (preallocatedFile && chunks.length === 0 && received > 0) {
                    chunks.push(preallocatedFile.slice(0, received));
                }
                chunks.push(value);
            }
            received += value.byteLength;

            const now = performance.now();
            if (now - lastProgressUpdate >= 100) {
                updateProgress(key, { received, total: expectedLength, status: "loading" });
                lastProgressUpdate = now;
            }
        }
    }
    catch (error) {
        await reader.cancel().catch(() => undefined);
        updateProgress(key, { received, total: expectedLength, status: "error" });
        throw error;
    }
    finally {
        reader.releaseLock();
    }

    const file = preallocatedFile && chunks.length === 0
        ? (received === preallocatedFile.byteLength ? preallocatedFile : preallocatedFile.slice(0, received))
        : chunksToArray(chunks, received);
    updateProgress(key, { received, total: expectedLength || received, status: "success" });
    return file;
}

async function downloadReplayAsset(responsePromise: Promise<Response | null>, key: string) {
    const response = await responsePromise;
    if (!response) {
        updateProgress(key, { received: 0, total: 0, status: "error" });
        throw new Error("Couldn't download replay asset.");
    }
    return readWithProgress(response, key);
}

const replayAssetQueryDefaults = {
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false
} as const;

export const replayAssetQueries = {
    map: (mapId: number) => queryOptions({
        queryKey: ["replayAssets", "map", mapId] as const,
        queryFn: () => downloadReplayAsset(getMapFileResponse(mapId), mapAssetProgressKey(mapId)),
        ...replayAssetQueryDefaults
    }),
    bot: (timeId: string) => queryOptions({
        queryKey: ["replayAssets", "bot", timeId] as const,
        queryFn: () => downloadReplayAsset(getBotFileResponse(timeId), botAssetProgressKey(timeId)),
        ...replayAssetQueryDefaults
    })
};

export function prefetchReplayMap(queryClient: QueryClient, mapId: number) {
    return queryClient.prefetchQuery(replayAssetQueries.map(mapId));
}
