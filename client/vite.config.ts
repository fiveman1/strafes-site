import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import eslintPlugin from "@nabla/vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig(() => {
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
					target: "http://localhost:8080",
					changeOrigin: true,
					secure: false
				}
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
