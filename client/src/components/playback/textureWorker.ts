// Transcodes map textures off the main thread. See textureTranscoder.ts.
import init, { transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import type { TranscodeRequest, TranscodeResponse, WorkerInit } from "./textureTranscoder";

// Loads the compiled module the page sends; jobs wait for it
let loadModule: (module: WebAssembly.Module) => void = () => {};
const ready = new Promise<WebAssembly.Module>(resolve => loadModule = resolve).then(module => init({ module_or_path: module }));

addEventListener("message", async (event: MessageEvent<WorkerInit | TranscodeRequest>) => {
    if ("module" in event.data) {
        loadModule(event.data.module);
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
