// Transcodes map textures off the main thread. See textureTranscoder.ts.
import init, { transcode_texture } from "../../wasm/strafesnet_roblox_bot_player_wasm_module";
import type { TranscodeRequest, TranscodeResponse } from "./textureTranscoder";

const ready = init();

addEventListener("message", async (event: MessageEvent<TranscodeRequest>) => {
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
