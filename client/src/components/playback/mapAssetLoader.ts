import { compiledWasm } from "./wasmModule";
import { DeferredJobs, Graphics, ModelPreparer, StreamableMap, TranscodedTexture, transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";

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

// A lightmap chunk to decompress and lay out for the GPU, see prepare_lightmap_chunk
export interface LightmapRequest {
    id: number;
    compressed: Uint8Array;
}

export type LightmapResponse = {
    id: number;
    prepared: Uint8Array;
} | {
    id: number;
    error: string;
};

// A group's geometry for the map's ModelPreparer in the worker. The first request for a map carries what the preparer
// is made with.
export interface GeometryRequest {
    id: number;
    mapKey: number;
    context?: Uint8Array;
    geometry: Uint8Array;
}

export type GeometryResponse = {
    id: number;
    prepared: Uint8Array;
} | {
    id: number;
    error: string;
};

// Drops a map's ModelPreparer in the worker
export interface GeometryRelease {
    release: number;
}

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
    // The worker decompressing it, if one is
    worker?: AssetWorker;
    regionId: number;
    // Kept for the map, which decompresses it again if it has to, and so the chunk can still be added if the worker fails
    compressed: Uint8Array;
}

// A map's geometry is prepared by one ModelPreparer, which keeps every mesh, so it stays on one worker.
interface MapGeometry {
    key: number;
    // The worker preparing it, until it fails
    worker?: AssetWorker;
    // Prepares it here when no worker can
    preparer?: ModelPreparer;
    contextSent: boolean;
}

interface PendingGeometry {
    map: StreamableMap;
    mapGeometry: MapGeometry;
    worker: AssetWorker;
    // Added to the worker's queuedBytes
    cost: number;
}

type ReadyJob = { map: StreamableMap, texture: TranscodedTexture } | { map: StreamableMap, lightmapChunk: PendingLightmapChunk, prepared?: Uint8Array } | { map: StreamableMap, regions: Uint8Array };

// Time per frame spent uploading finished textures and adding lightmap chunks and prepared regions. At least one is done
// each frame.
const UPLOAD_BUDGET_MS = 2;

// Preparing a byte of geometry takes about an eighth of the time transcoding a byte of texture does
const GEOMETRY_COST_PER_BYTE = 1 / 8;

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
// 16 ms per 512 KB group), a big lightmap chunk takes up to 60 ms to decompress, and preparing a region's meshes up to
// 100 ms. The results are added from the frame loop. If no worker can be used, textures are transcoded here one per
// frame instead, the map decompresses lightmap chunks a little each frame, and geometry is prepared here as it arrives.
class MapAssetLoader {
    private workers: AssetWorker[] = [];
    private nextId = 0;
    private pendingTextures = new Map<number, PendingTexture>();
    private pendingLightmapChunks = new Map<number, PendingLightmapChunk>();
    private pendingGeometry = new Map<number, PendingGeometry>();
    private mapGeometry = new Map<StreamableMap, MapGeometry>();
    private nextMapKey = 0;
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
                worker.addEventListener("message", (event: MessageEvent<TranscodeResponse | LightmapResponse | GeometryResponse>) => {
                    if (this.pendingGeometry.has(event.data.id)) this.onGeometryResponse(event.data as GeometryResponse);
                    else if (this.pendingLightmapChunks.has(event.data.id)) this.onLightmapResponse(event.data as LightmapResponse);
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

    // Number of textures, lightmap chunks and groups of geometry waiting to be transcoded, decompressed, prepared or added
    get queued(): number {
        return this.pendingTextures.size + this.pendingLightmapChunks.size + this.pendingGeometry.size + this.fallbackTextures.length + this.ready.length;
    }

    // Takes ownership of the jobs.
    submit(map: StreamableMap, graphics: Graphics, deferred: DeferredJobs) {
        const support = graphics.texture_support();
        const jobs = deferred.take_textures();
        const lightmapJobs = deferred.take_lightmap_chunks();
        const geometry = deferred.take_geometry();
        deferred.free();
        // first, since which textures a region needs is only known once it's prepared
        if (geometry.length > 0) this.submitGeometry(map, geometry);
        for (const job of lightmapJobs) {
            const chunk: PendingLightmapChunk = { map, regionId: job.region_id, compressed: job.take_compressed() };
            job.free();
            const worker = this.leastBusyWorker();
            if (worker) {
                const id = this.nextId++;
                chunk.worker = worker;
                worker.queuedBytes += chunk.compressed.length;
                this.pendingLightmapChunks.set(id, chunk);
                // Not transferred, so the chunk is still here to add to the map
                const request: LightmapRequest = { id, compressed: chunk.compressed };
                worker.worker.postMessage(request);
            }
            else {
                map.insert_lightmap_chunk(chunk.regionId, chunk.compressed, undefined);
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

    // Call when a map is done with, so its worker drops its meshes.
    releaseMap(map: StreamableMap) {
        const mapGeometry = this.mapGeometry.get(map);
        if (!mapGeometry) return;
        this.mapGeometry.delete(map);
        mapGeometry.preparer?.free();
        if (mapGeometry.worker && mapGeometry.contextSent) {
            const release: GeometryRelease = { release: mapGeometry.key };
            mapGeometry.worker.worker.postMessage(release);
        }
    }

    private submitGeometry(map: StreamableMap, geometry: Uint8Array) {
        let mapGeometry = this.mapGeometry.get(map);
        if (!mapGeometry) {
            mapGeometry = { key: this.nextMapKey++, worker: this.leastBusyWorker(), contextSent: false };
            this.mapGeometry.set(map, mapGeometry);
        }
        const worker = mapGeometry.worker;
        if (!worker) {
            this.prepareHere(map, mapGeometry, geometry);
            return;
        }
        const id = this.nextId++;
        const cost = geometry.length * GEOMETRY_COST_PER_BYTE;
        worker.queuedBytes += cost;
        this.pendingGeometry.set(id, { map, mapGeometry, worker, cost });
        const request: GeometryRequest = { id, mapKey: mapGeometry.key, geometry };
        if (!mapGeometry.contextSent) {
            request.context = map.preparer_context();
            mapGeometry.contextSent = true;
        }
        worker.worker.postMessage(request, [geometry.buffer as ArrayBuffer]);
    }

    private prepareHere(map: StreamableMap, mapGeometry: MapGeometry, geometry: Uint8Array) {
        try {
            mapGeometry.preparer ??= new ModelPreparer(map.preparer_context());
            this.ready.push({ map, regions: mapGeometry.preparer.prepare(geometry) });
        }
        catch (err) {
            console.error("Couldn't prepare map geometry", err);
            map.abandon_prepared_regions();
        }
    }

    // The worker preparing a map's geometry failed, and its meshes with it: the map stops waiting for the regions it
    // was preparing, and later geometry is prepared here.
    private loseGeometryWorker(map: StreamableMap, mapGeometry: MapGeometry) {
        if (!mapGeometry.worker) return;
        mapGeometry.worker = undefined;
        // unless the map was released
        if (this.mapGeometry.get(map) === mapGeometry) map.abandon_prepared_regions();
    }

    private onGeometryResponse(response: GeometryResponse) {
        const pending = this.pendingGeometry.get(response.id);
        if (!pending) return;
        this.pendingGeometry.delete(response.id);
        pending.worker.queuedBytes -= pending.cost;
        if ("error" in response) {
            console.error("Couldn't prepare map geometry in the worker", response.error);
            this.loseGeometryWorker(pending.map, pending.mapGeometry);
            return;
        }
        this.ready.push({ map: pending.map, regions: response.prepared });
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
            else if ("regions" in job) {
                if (job.map === map && !map.insert_prepared_regions(job.regions)) {
                    console.error("Couldn't add prepared map regions: the worker is from another build");
                }
            }
            else if (job.map === map) {
                map.insert_lightmap_chunk(job.lightmapChunk.regionId, job.lightmapChunk.compressed, job.prepared);
            }
            if (performance.now() - start >= UPLOAD_BUDGET_MS) break;
        }
    }

    private onLightmapResponse(response: LightmapResponse) {
        const chunk = this.pendingLightmapChunks.get(response.id);
        if (!chunk) return;
        this.pendingLightmapChunks.delete(response.id);
        if (chunk.worker) chunk.worker.queuedBytes -= chunk.compressed.length;
        if ("error" in response) {
            console.error("Couldn't prepare lightmap chunk in the worker", response.error);
            // the map decompresses it instead
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
            // the map decompresses it instead
            this.ready.push({ map: chunk.map, lightmapChunk: chunk });
        }
        for (const [id, pending] of this.pendingGeometry) {
            if (pending.worker === assetWorker) this.pendingGeometry.delete(id);
        }
        for (const [map, mapGeometry] of this.mapGeometry) {
            if (mapGeometry.worker === assetWorker) this.loseGeometryWorker(map, mapGeometry);
        }
    }
}

let sharedLoader: MapAssetLoader | null = null;

// One set of workers for the whole tab, shared by every replay viewed.
export function getMapAssetLoader(): MapAssetLoader {
    sharedLoader ??= new MapAssetLoader();
    return sharedLoader;
}
