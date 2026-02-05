import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: { 
            globals: globals.node,
            parserOptions: {
                project: ['./tsconfig.eslint.json'],
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: { 
            semi: "error",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off"
        }
    },
]);
