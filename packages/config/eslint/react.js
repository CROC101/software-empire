import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import { base } from "./base.js";

/**
 * Shared config for React SPAs (Next apps use eslint-config-next instead).
 * Includes the React Compiler rules (purity, refs, set-state-in-effect…).
 * @param {string} tsconfigRootDir directory holding the package's tsconfig.json
 */
export function react(tsconfigRootDir) {
  return defineConfig(...base(tsconfigRootDir), {
    files: ["**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
    rules: { "react-hooks/exhaustive-deps": "error" },
  });
}
