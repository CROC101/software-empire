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
  {
    // Third-party originals kept as their authors wrote them (Exclusive "V.original" and new parts).
    // Only the strict style/type rules are off; correctness rules (hooks order, no-undef, ...) still run.
    files: [
      "src/registry/ui/*-original.tsx",
      "src/registry/ui/link-preview.tsx",
      "src/registry/ui/text-scroll.tsx",
      "src/registry/ui/user-dropdown.tsx",
    ],
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-useless-assignment": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
);
