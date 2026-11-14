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
    textureId: number;
    // Kept so the texture can still be transcoded here if the worker fails
    data: Uint8Array;
    support: number;
}

interface PendingLightmapChunk {
    map: StreamableMap;
    regionId: number;
    // Kept for the map, which inflates it again if it has to, and so the chunk can still be added if the worker fails
    deflated: Uint8Array;
}

type ReadyJob = { map: StreamableMap, texture: TranscodedTexture } | { map: StreamableMap, lightmapChunk: PendingLightmapChunk, prepared?: Uint8Array };

// Time per frame spent uploading finished textures and adding lightmap chunks. At least one is done each frame.
const UPLOAD_BUDGET_MS = 2;

// Loads the slow parts of a map in a web worker: transcoding textures is most of the time spent loading a map (about
// 16 ms per 512 KB group), and a big lightmap chunk takes up to 60 ms to inflate. The results are added from the frame
// loop. If the worker can't be used, textures are transcoded here one per frame instead, and the map inflates lightmap
// chunks a little each frame.
class MapAssetLoader {
    private worker: Worker | null;
    private nextId = 0;
    private pendingTextures = new Map<number, PendingTexture>();
    private pendingLightmapChunks = new Map<number, PendingLightmapChunk>();
    private ready: ReadyJob[] = [];
    // Textures to transcode on the main thread after the worker failed
    private fallbackTextures: PendingTexture[] = [];

    constructor() {
        try {
            const worker = new Worker(new URL("./mapAssetWorker.ts", import.meta.url), { type: "module" });
            this.worker = worker;
            worker.addEventListener("message", (event: MessageEvent<TranscodeResponse | LightmapResponse>) => {
                if (this.pendingLightmapChunks.has(event.data.id)) this.onLightmapResponse(event.data as LightmapResponse);
                else this.onTextureResponse(event.data as TranscodeResponse);
            });
            worker.addEventListener("error", (event) => {
                console.error("Map asset worker failed, loading on the main thread instead", event);
                this.stopWorker();
            });
            compiledWasm().then(module => {
                const init: WorkerInit = { module };
                worker.postMessage(init);
            }, () => this.stopWorker());
        }
        catch (err) {
            console.error("Couldn't start the map asset worker, loading on the main thread instead", err);
            this.worker = null;
        }
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
            const chunk = { map, regionId: job.region_id, deflated: job.take_deflated() };
            job.free();
            if (this.worker) {
                const id = this.nextId++;
                this.pendingLightmapChunks.set(id, chunk);
                // Not transferred, so the chunk is still here to add to the map
                const request: LightmapRequest = { id, deflated: chunk.deflated };
                this.worker.postMessage(request);
            }
            else {
                map.insert_lightmap_chunk(chunk.regionId, chunk.deflated, undefined);
            }
        }
        for (const job of jobs) {
            const pendingJob = { map, textureId: job.texture_id, data: job.take_data(), support };
            job.free();
            if (this.worker) {
                const id = this.nextId++;
                this.pendingTextures.set(id, pendingJob);
                // Not transferred, so the data is still here for the fallback
                const request: TranscodeRequest = { id, textureId: pendingJob.textureId, data: pendingJob.data, support };
                this.worker.postMessage(request);
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
        if ("error" in response) {
            console.error("Couldn't transcode texture in the worker", response.error);
            this.fallbackTextures.push(job);
            return;
        }
        const texture = new TranscodedTexture(job.textureId, response.width, response.height, response.mipLevelCount, response.format, response.coverageAlpha, response.data);
        this.ready.push({ map: job.map, texture });
    }

    private stopWorker() {
        this.worker?.terminate();
        this.worker = null;
        this.fallbackTextures.push(...this.pendingTextures.values());
        this.pendingTextures.clear();
        for (const chunk of this.pendingLightmapChunks.values()) {
            // the map inflates them instead
            this.ready.push({ map: chunk.map, lightmapChunk: chunk });
        }
        this.pendingLightmapChunks.clear();
    }
}

let sharedLoader: MapAssetLoader | null = null;

// One worker for the whole tab, shared by every replay viewed.
export function getMapAssetLoader(): MapAssetLoader {
    sharedLoader ??= new MapAssetLoader();
    return sharedLoader;
}
