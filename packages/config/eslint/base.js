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
    // tests fake async APIs with async functions that never await, and type vi.mock with import()
    {
      files: ["**/*.test.{ts,tsx}"],
      rules: {
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/await-thenable": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/consistent-type-imports": ["error", { disallowTypeAnnotations: false }],
      },
    },
    // JS config files sit outside tsconfig, so no type info there
    { files: ["**/*.{js,mjs,cjs}"], extends: [tseslint.configs.disableTypeChecked] },
  );
}
