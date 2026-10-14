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
      },
    },
  );
}
