import { Graphics, StreamableMap, TextureJob, TranscodedTexture, transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";

export interface TranscodeRequest {
    id: number;
    textureId: number;
    data: Uint8Array;
    support: number;
}

export type TranscodeResponse = {
    id: number;
    width: number;
    height: number;
    mipLevelCount: number;
    format: number;
    data: Uint8Array;
} | {
    id: number;
    error: string;
};

interface PendingJob {
    map: StreamableMap;
    textureId: number;
    // Kept so the texture can still be transcoded here if the worker fails
    data: Uint8Array;
    support: number;
}

// Time per frame spent uploading finished textures. At least one is uploaded each frame.
const UPLOAD_BUDGET_MS = 2;

// Transcoding map textures is most of the time spent loading a map (about 16 ms per 512 KB group), so it runs in a
// web worker, and the textures are uploaded from the frame loop. If the worker can't be used, textures are transcoded
// here one per frame instead.
class TextureTranscoder {
    private worker: Worker | null;
    private nextId = 0;
    private pending = new Map<number, PendingJob>();
    private ready: { map: StreamableMap, texture: TranscodedTexture }[] = [];
    // Jobs to transcode on the main thread after the worker failed
    private fallback: PendingJob[] = [];

    constructor() {
        try {
            this.worker = new Worker(new URL("./textureWorker.ts", import.meta.url), { type: "module" });
            this.worker.addEventListener("message", (event: MessageEvent<TranscodeResponse>) => this.onResponse(event.data));
            this.worker.addEventListener("error", (event) => {
                console.error("Texture worker failed, transcoding on the main thread instead", event);
                this.stopWorker();
            });
        }
        catch (err) {
            console.error("Couldn't start the texture worker, transcoding on the main thread instead", err);
            this.worker = null;
        }
    }

    // Number of textures waiting to be transcoded or uploaded
    get queued(): number {
        return this.pending.size + this.fallback.length + this.ready.length;
    }

    // Takes ownership of the jobs.
    submit(map: StreamableMap, graphics: Graphics, jobs: TextureJob[]) {
        const support = graphics.texture_support();
        for (const job of jobs) {
            const pendingJob = { map, textureId: job.texture_id, data: job.take_data(), support };
            job.free();
            if (this.worker) {
                const id = this.nextId++;
                this.pending.set(id, pendingJob);
                // Not transferred, so the data is still here for the fallback
                const request: TranscodeRequest = { id, textureId: pendingJob.textureId, data: pendingJob.data, support };
                this.worker.postMessage(request);
            }
            else {
                this.fallback.push(pendingJob);
            }
        }
    }

    // Uploads finished textures for the current map. Call it every frame before promote_ready_assets.
    // Textures for any other map (a replay that was closed) are dropped.
    uploadReady(map: StreamableMap, graphics: Graphics) {
        const fallbackJob = this.fallback.shift();
        if (fallbackJob) {
            const texture = transcode_texture(fallbackJob.textureId, fallbackJob.data, fallbackJob.support);
            this.ready.push({ map: fallbackJob.map, texture });
        }
        const start = performance.now();
        while (this.ready.length > 0) {
            const { map: textureMap, texture } = this.ready.shift()!;
            if (textureMap === map) {
                // Consumes the texture
                map.upload_texture(graphics, texture);
            }
            else {
                texture.free();
            }
            if (performance.now() - start >= UPLOAD_BUDGET_MS) break;
        }
    }

    private onResponse(response: TranscodeResponse) {
        const job = this.pending.get(response.id);
        if (!job) return;
        this.pending.delete(response.id);
        if ("error" in response) {
            console.error("Couldn't transcode texture in the worker", response.error);
            this.fallback.push(job);
            return;
        }
        const texture = new TranscodedTexture(job.textureId, response.width, response.height, response.mipLevelCount, response.format, response.data);
        this.ready.push({ map: job.map, texture });
    }

    private stopWorker() {
        this.worker?.terminate();
        this.worker = null;
        this.fallback.push(...this.pending.values());
        this.pending.clear();
    }
}

let sharedTranscoder: TextureTranscoder | null = null;

// One worker for the whole tab, shared by every replay viewed.
export function getTextureTranscoder(): TextureTranscoder {
    sharedTranscoder ??= new TextureTranscoder();
    return sharedTranscoder;
}
