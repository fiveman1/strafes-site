import { defineConfig, loadEnv, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import eslintPlugin from "@nabla/vite-plugin-eslint";
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { brotliCompress, constants } from "zlib";

const brotli = promisify(brotliCompress);

// Writes a max-quality .br next to each built asset, which the server sends to browsers that accept brotli.
// Cloudflare's on-the-fly brotli uses a much lower quality, so this saves ~15-20% on the JS and wasm.
function precompressAssets(): PluginOption {
	let assetsDir = "";
	return {
		name: "precompress-assets",
		apply: "build",
		configResolved(config) {
			assetsDir = path.resolve(config.root, config.build.outDir, config.build.assetsDir);
		},
		async closeBundle() {
			const files = (await readdir(assetsDir)).filter((file) => /\.(js|css|wasm)$/.test(file));
			await Promise.all(files.map(async (file) => {
				const filePath = path.join(assetsDir, file);
				const data = await readFile(filePath);
				const compressed = await brotli(data, {
					params: {
						[constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
						[constants.BROTLI_PARAM_SIZE_HINT]: data.length
					}
				});
				await writeFile(filePath + ".br", compressed);
			}));
		}
	};
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());

	return {
		plugins: [
			react() as PluginOption[],
			tsconfigPaths() as PluginOption,
			eslintPlugin() as PluginOption,
			precompressAssets()
		],
		server: {
			port: 3000,
			host: "localhost",
			open: true,
			proxy: {
				"/api": {
					target: env.VITE_USE_PROXY === "true" ? "https://strafes.fiveman1.net/" : "http://127.0.0.1:8080",
					changeOrigin: true,
					secure: false
				}
			},
			watch: {
				ignored: ["!**/node_modules/shared/**"]
			}
		},
		build: {
			outDir: "build"
		},
		worker: {
			// The texture worker imports the wasm module, which needs ES module output
			format: "es"
		},
		resolve: {
			preserveSymlinks: true
		},
		optimizeDeps: {
			exclude: ["shared", "@strafesnet/strafesnet_roblox_bot_player_wasm_module"]
		}
	};
});
