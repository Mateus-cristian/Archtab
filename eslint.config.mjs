import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import jest from "eslint-plugin-jest";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const jestRecommended = jest.configs["flat/recommended"];
const nextCoreWebVitals = nextPlugin.configs["core-web-vitals"];
const reactHooksRecommended = reactHooks.configs.flat.recommended;

export default defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ...nextCoreWebVitals,
    files: ["**/*.{js,jsx,mjs,cjs}"],
  },
  {
    ...reactHooksRecommended,
    files: ["**/*.{js,jsx,mjs,cjs}"],
  },
  {
    ...jestRecommended,
    files: ["tests/**/*.js", "jest.setup.js"],
    languageOptions: {
      ...jestRecommended.languageOptions,
      globals: {
        ...jestRecommended.languageOptions.globals,
        ...globals.node,
      },
    },
  },
  {
    files: ["infra/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["jest.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  eslintConfigPrettier,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**"]),
]);
