import { GlobalsClient } from "./globals.js";

export type GraphicsBackend = "webgpu" | "webgl";

// Counts a replay player session by the graphics backend it got, per day; nothing about the viewer is kept.
// hasWebgpuApi tells WebGL sessions without WebGPU in the browser apart from ones whose WebGPU had no usable adapter.
export async function logGraphicsBackend(client: GlobalsClient, backend: GraphicsBackend, hasWebgpuApi: boolean) {
    const query = `INSERT INTO graphics_backends (day, backend, has_webgpu_api, count) VALUES (UTC_DATE(), ?, ?, 1)
        ON DUPLICATE KEY UPDATE count = count + 1`;
    await client.pool.execute(query, [backend, hasWebgpuApi]);
}
