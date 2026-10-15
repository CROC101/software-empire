import { react } from "@empire/config/eslint/react";
import { globalIgnores } from "eslint/config";

export default [
  ...react(import.meta.dirname),
  // shortcut: pairs with noUncheckedIndexedAccess=false in tsconfig — without it every index
  // check looks "unnecessary". Re-enable both together.
  {
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      // ported code splits strings into code points on purpose (Thai text, digit strings)
      "@typescript-eslint/no-misused-spread": "off",
      // shortcut: the ported canvas engine asserts non-null (`ctx!`, `pages[i]!`) and uses
      // void-returning expressions in ~240 places; tighten when PL redesigns the editor
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      // literal-or-string unions (`'normal' | string`) keep editor autocomplete; zustand store
      // methods are plain functions, not `this`-bound methods
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-invalid-void-type": "off",
    },
  },
  globalIgnores(["dist/**", "public/**"]),
];
