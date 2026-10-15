import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * Shared flat config. Call from each package's eslint.config.js:
 *   export default base(import.meta.dirname);
 * @param {string} tsconfigRootDir directory holding the package's tsconfig.json
 */
export function base(tsconfigRootDir) {
  return defineConfig(
    { ignores: ["**/dist/**", "**/.next/**", "**/.turbo/**", "**/coverage/**"] },
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    {
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
      rules: {
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        "@typescript-eslint/no-confusing-void-expression": [
          "error",
          { ignoreArrowShorthand: true },
        ],
        // `_name` marks a parameter that must exist for the signature but is unused
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
        ],
      },
    },
    // JS config files sit outside tsconfig, so no type info there
    { files: ["**/*.{js,mjs,cjs}"], extends: [tseslint.configs.disableTypeChecked] },
  );
}
