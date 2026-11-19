import { base } from "@empire/config/eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  ...nextVitals,
  ...base(import.meta.dirname),
  globalIgnores([
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "public/r/**",
    "public/croc-ui.mjs",
    "public/tpl/**",
  ]),
);
