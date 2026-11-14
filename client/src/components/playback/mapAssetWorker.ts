// Transcodes map textures and inflates lightmap chunks off the main thread. See mapAssetLoader.ts.
import init, { prepare_lightmap_chunk, transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import type { LightmapRequest, LightmapResponse, TranscodeRequest, TranscodeResponse, WorkerInit } from "./mapAssetLoader";

// Loads the compiled module the page sends; jobs wait for it
let loadModule: (module: WebAssembly.Module) => void = () => {};
const ready = new Promise<WebAssembly.Module>(resolve => loadModule = resolve).then(module => init({ module_or_path: module }));

addEventListener("message", async (event: MessageEvent<WorkerInit | TranscodeRequest | LightmapRequest>) => {
    if ("module" in event.data) {
        loadModule(event.data.module);
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
