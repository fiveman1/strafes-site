import wasmUrl from "../../wasm/strafesnet_roblox_bot_player_wasm_module_bg.wasm?url";

let compiled: Promise<WebAssembly.Module> | null = null;

// The player's wasm module, fetched and compiled once for the page and the texture worker.
export function compiledWasm(): Promise<WebAssembly.Module> {
    compiled ??= (async () => {
        const response = await fetch(wasmUrl);
        if (!response.ok) throw new Error(`Couldn't fetch the player module: ${response.status}`);
        try {
            return await WebAssembly.compileStreaming(response.clone());
        }
        catch {
            // a server that sends the wrong content type
            return await WebAssembly.compile(await response.arrayBuffer());
        }
    })();
    // a failed fetch is tried again by the next replay, instead of failing every one until a reload
    compiled.catch(() => { compiled = null; });
    return compiled;
}
