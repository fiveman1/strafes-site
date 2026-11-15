// Transcodes map textures, inflates lightmap chunks and prepares map geometry off the main thread. See mapAssetLoader.ts.
import init, { ModelPreparer, prepare_lightmap_chunk, transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import type { GeometryRelease, GeometryRequest, GeometryResponse, LightmapRequest, LightmapResponse, TranscodeRequest, TranscodeResponse, WorkerInit } from "./mapAssetLoader";

// Each map's preparer, which keeps every mesh sent to it, by the map's key
const preparers = new Map<number, ModelPreparer>();

// Loads the compiled module the page sends; jobs wait for it
let loadModule: (module: WebAssembly.Module) => void = () => {};
const ready = new Promise<WebAssembly.Module>(resolve => loadModule = resolve).then(module => init({ module_or_path: module }));

addEventListener("message", async (event: MessageEvent<WorkerInit | TranscodeRequest | LightmapRequest | GeometryRequest | GeometryRelease>) => {
    if ("module" in event.data) {
        loadModule(event.data.module);
        return;
    }
    if ("release" in event.data) {
        preparers.get(event.data.release)?.free();
        preparers.delete(event.data.release);
        return;
    }
    if ("geometry" in event.data) {
        const { id, mapKey, context, geometry } = event.data;
        let response: GeometryResponse;
        let transfer: Transferable[] = [];
        try {
            await ready;
            let preparer = preparers.get(mapKey);
            if (!preparer) {
                if (!context) throw new Error("no preparer context for map " + mapKey);
                preparer = new ModelPreparer(context);
                preparers.set(mapKey, preparer);
            }
            const prepared = preparer.prepare(geometry);
            response = { id, prepared };
            // copied out of wasm memory into its own buffer, so it can be moved
            transfer = [prepared.buffer as ArrayBuffer];
        }
        catch (err) {
            response = { id, error: String(err) };
        }
        postMessage(response, { transfer });
        return;
    }
    if ("deflated" in event.data) {
        const { id, deflated } = event.data;
        let response: LightmapResponse;
        let transfer: Transferable[] = [];
        try {
            await ready;
            const prepared = prepare_lightmap_chunk(deflated);
            response = { id, prepared };
            // copied out of wasm memory into its own buffer, so it can be moved
            transfer = [prepared.buffer as ArrayBuffer];
        }
        catch (err) {
            response = { id, error: String(err) };
        }
        postMessage(response, { transfer });
        return;
    }
    const { id, textureId, data, support } = event.data;
    let response: TranscodeResponse;
    let transfer: Transferable[] = [];
    try {
        await ready;
        const texture = transcode_texture(textureId, data, support);
        const transcoded = texture.take_data();
        response = {
            id,
            width: texture.width,
            height: texture.height,
            mipLevelCount: texture.mip_level_count,
            format: texture.format,
            coverageAlpha: texture.coverage_alpha,
            data: transcoded
        };
        texture.free();
        // take_data copies out of wasm memory into its own buffer, so it can be moved
        transfer = [transcoded.buffer as ArrayBuffer];
    }
    catch (err) {
        response = { id, error: String(err) };
    }
    postMessage(response, { transfer });
});
