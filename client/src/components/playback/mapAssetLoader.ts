import { compiledWasm } from "./wasmModule";
import { DeferredJobs, Graphics, StreamableMap, TranscodedTexture, transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";

// First message to the worker: the module compiled here, so the worker doesn't fetch it again
export interface WorkerInit {
    module: WebAssembly.Module;
}

export interface TranscodeRequest {
    id: number;
    textureId: number;
    data: Uint8Array;
    support: number;
}

// A lightmap chunk to inflate and lay out for the GPU, see prepare_lightmap_chunk
export interface LightmapRequest {
    id: number;
    deflated: Uint8Array;
}

export type LightmapResponse = {
    id: number;
    prepared: Uint8Array;
} | {
    id: number;
    error: string;
};

export type TranscodeResponse = {
    id: number;
    width: number;
    height: number;
    mipLevelCount: number;
    format: number;
    coverageAlpha: boolean;
    data: Uint8Array;
} | {
    id: number;
    error: string;
};

interface PendingTexture {
    map: StreamableMap;
    // The worker transcoding it, if one is
    worker?: AssetWorker;
    textureId: number;
    // Kept so the texture can still be transcoded here if the worker fails
    data: Uint8Array;
    support: number;
}

interface PendingLightmapChunk {
    map: StreamableMap;
    // The worker inflating it, if one is
    worker?: AssetWorker;
    regionId: number;
    // Kept for the map, which inflates it again if it has to, and so the chunk can still be added if the worker fails
    deflated: Uint8Array;
}

type ReadyJob = { map: StreamableMap, texture: TranscodedTexture } | { map: StreamableMap, lightmapChunk: PendingLightmapChunk, prepared?: Uint8Array };

// Time per frame spent uploading finished textures and adding lightmap chunks. At least one is done each frame.
const UPLOAD_BUDGET_MS = 2;

// How many workers transcode at once: one core is left for the page, and phones get fewer since each worker holds
// its own copy of the module's memory.
function workerCount(): number {
    const cores = navigator.hardwareConcurrency || 2;
    const max = matchMedia("(pointer: coarse)").matches ? 2 : 4;
    return Math.max(1, Math.min(max, cores - 1));
}

interface AssetWorker {
    worker: Worker;
    // Bytes of jobs sent to it and not answered yet, so new jobs go to the least busy worker
    queuedBytes: number;
}

// Loads the slow parts of a map in web workers: transcoding textures is most of the time spent loading a map (about
// 16 ms per 512 KB group), and a big lightmap chunk takes up to 60 ms to inflate. The results are added from the frame
// loop. If no worker can be used, textures are transcoded here one per frame instead, and the map inflates lightmap
// chunks a little each frame.
class MapAssetLoader {
    private workers: AssetWorker[] = [];
    private nextId = 0;
    private pendingTextures = new Map<number, PendingTexture>();
    private pendingLightmapChunks = new Map<number, PendingLightmapChunk>();
    private ready: ReadyJob[] = [];
    // Textures to transcode on the main thread after the worker failed
    private fallbackTextures: PendingTexture[] = [];

    constructor() {
        const module = compiledWasm();
        for (let i = 0; i < workerCount(); i++) {
            try {
                const assetWorker: AssetWorker = { worker: new Worker(new URL("./mapAssetWorker.ts", import.meta.url), { type: "module" }), queuedBytes: 0 };
                const worker = assetWorker.worker;
                this.workers.push(assetWorker);
                worker.addEventListener("message", (event: MessageEvent<TranscodeResponse | LightmapResponse>) => {
                    if (this.pendingLightmapChunks.has(event.data.id)) this.onLightmapResponse(event.data as LightmapResponse);
                    else this.onTextureResponse(event.data as TranscodeResponse);
                });
                worker.addEventListener("error", (event) => {
                    console.error("Map asset worker failed, loading its jobs on the main thread instead", event);
                    this.stopWorker(assetWorker);
                });
                module.then(module => {
                    const init: WorkerInit = { module };
                    worker.postMessage(init);
                }, () => this.stopWorker(assetWorker));
            }
            catch (err) {
                console.error("Couldn't start a map asset worker", err);
                break;
            }
        }
        if (this.workers.length === 0) console.error("No map asset workers, loading on the main thread instead");
    }

    // Number of textures and lightmap chunks waiting to be transcoded, inflated or uploaded
    get queued(): number {
        return this.pendingTextures.size + this.pendingLightmapChunks.size + this.fallbackTextures.length + this.ready.length;
    }

    // Takes ownership of the jobs.
    submit(map: StreamableMap, graphics: Graphics, deferred: DeferredJobs) {
        const support = graphics.texture_support();
        const jobs = deferred.take_textures();
        const lightmapJobs = deferred.take_lightmap_chunks();
        deferred.free();
        for (const job of lightmapJobs) {
            const chunk: PendingLightmapChunk = { map, regionId: job.region_id, deflated: job.take_deflated() };
            job.free();
            const worker = this.leastBusyWorker();
            if (worker) {
                const id = this.nextId++;
                chunk.worker = worker;
                worker.queuedBytes += chunk.deflated.length;
                this.pendingLightmapChunks.set(id, chunk);
                // Not transferred, so the chunk is still here to add to the map
                const request: LightmapRequest = { id, deflated: chunk.deflated };
                worker.worker.postMessage(request);
            }
            else {
                map.insert_lightmap_chunk(chunk.regionId, chunk.deflated, undefined);
            }
        }
        for (const job of jobs) {
            const pendingJob: PendingTexture = { map, textureId: job.texture_id, data: job.take_data(), support };
            job.free();
            const worker = this.leastBusyWorker();
            if (worker) {
                const id = this.nextId++;
                pendingJob.worker = worker;
                worker.queuedBytes += pendingJob.data.length;
                this.pendingTextures.set(id, pendingJob);
                // Not transferred, so the data is still here for the fallback
                const request: TranscodeRequest = { id, textureId: pendingJob.textureId, data: pendingJob.data, support };
                worker.worker.postMessage(request);
            }
            else {
                this.fallbackTextures.push(pendingJob);
            }
        }
    }

    // Uploads finished textures for the current map. Call it every frame before promote_ready_assets.
    // Textures for any other map (a replay that was closed) are dropped.
    uploadReady(map: StreamableMap, graphics: Graphics) {
        const fallbackJob = this.fallbackTextures.shift();
        if (fallbackJob) {
            const texture = transcode_texture(fallbackJob.textureId, fallbackJob.data, fallbackJob.support);
            this.ready.push({ map: fallbackJob.map, texture });
        }
        const start = performance.now();
        while (this.ready.length > 0) {
            const job = this.ready.shift()!;
            if ("texture" in job) {
                if (job.map === map) {
                    // Consumes the texture
                    map.upload_texture(graphics, job.texture);
                }
                else {
                    job.texture.free();
                }
            }
            else if (job.map === map) {
                map.insert_lightmap_chunk(job.lightmapChunk.regionId, job.lightmapChunk.deflated, job.prepared);
            }
            if (performance.now() - start >= UPLOAD_BUDGET_MS) break;
        }
    }

    private onLightmapResponse(response: LightmapResponse) {
        const chunk = this.pendingLightmapChunks.get(response.id);
        if (!chunk) return;
        this.pendingLightmapChunks.delete(response.id);
        if (chunk.worker) chunk.worker.queuedBytes -= chunk.deflated.length;
        if ("error" in response) {
            console.error("Couldn't prepare lightmap chunk in the worker", response.error);
            // the map inflates it instead
            this.ready.push({ map: chunk.map, lightmapChunk: chunk });
            return;
        }
        this.ready.push({ map: chunk.map, lightmapChunk: chunk, prepared: response.prepared });
    }

    private onTextureResponse(response: TranscodeResponse) {
        const job = this.pendingTextures.get(response.id);
        if (!job) return;
        this.pendingTextures.delete(response.id);
        if (job.worker) job.worker.queuedBytes -= job.data.length;
        if ("error" in response) {
            console.error("Couldn't transcode texture in the worker", response.error);
            this.fallbackTextures.push(job);
            return;
        }
        const texture = new TranscodedTexture(job.textureId, response.width, response.height, response.mipLevelCount, response.format, response.coverageAlpha, response.data);
        this.ready.push({ map: job.map, texture });
    }

    private leastBusyWorker(): AssetWorker | undefined {
        let best: AssetWorker | undefined;
        for (const worker of this.workers) {
            if (!best || worker.queuedBytes < best.queuedBytes) best = worker;
        }
        return best;
    }

    // Its jobs are done here instead
    private stopWorker(assetWorker: AssetWorker) {
        assetWorker.worker.terminate();
        this.workers = this.workers.filter(worker => worker !== assetWorker);
        for (const [id, job] of this.pendingTextures) {
            if (job.worker !== assetWorker) continue;
            this.pendingTextures.delete(id);
            this.fallbackTextures.push(job);
        }
        for (const [id, chunk] of this.pendingLightmapChunks) {
            if (chunk.worker !== assetWorker) continue;
            this.pendingLightmapChunks.delete(id);
            // the map inflates it instead
            this.ready.push({ map: chunk.map, lightmapChunk: chunk });
        }
    }
}

let sharedLoader: MapAssetLoader | null = null;

// One set of workers for the whole tab, shared by every replay viewed.
export function getMapAssetLoader(): MapAssetLoader {
    sharedLoader ??= new MapAssetLoader();
    return sharedLoader;
}
