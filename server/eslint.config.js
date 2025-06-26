// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
    {
        ignores: ["**/*.js"],
    },
    eslint.configs.recommended,
    tseslint.configs.disableTypeChecked,
    {
        languageOptions: {
            parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            semi: ["error", "always"]
        }
    },
    perfectionist.configs["recommended-natural"],
);