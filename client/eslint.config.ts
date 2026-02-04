import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from "eslint-plugin-react-refresh";

export default defineConfig([
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite(),
	{
        files: ["**/*.{ts,tsx}"],
        languageOptions: { 
            ecmaVersion: 2020,
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname + "/client"
            }
        },
        rules: {
            "react-hooks/set-state-in-effect": "off",
            "react-refresh/only-export-components": "warn",
            "react-hooks/set-state-in-render": "off",
            "react-hooks/preserve-manual-memoization": "off"
        }
	},
]);