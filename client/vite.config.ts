import { defineConfig, loadEnv, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import eslintPlugin from "@nabla/vite-plugin-eslint";


export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");


	const apiTarget = env.VITE_API_PROXY_TARGET || "https://strafes.fiveman1.net";

	return {
		plugins: [
			react() as PluginOption[],
			tsconfigPaths() as PluginOption,
			eslintPlugin() as PluginOption
		],
		server: {
			port: 3000,
			host: "localhost",
			open: true,
			proxy: {
				"/api": {
					target: apiTarget,
					changeOrigin: true,
					secure: true
				}
			},
			watch: {
				ignored: ["!**/node_modules/shared/**"]
			}
		},
		build: {
			outDir: "build"
		},
		resolve: {
			preserveSymlinks: true
		},
		optimizeDeps: {
			exclude: ["shared"]
		}
	};
});
