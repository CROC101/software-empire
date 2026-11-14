import { react } from "@empire/config/eslint/react";
import { globalIgnores } from "eslint/config";

export default [
  ...react(import.meta.dirname),
  // shortcut: pairs with noUncheckedIndexedAccess=false in tsconfig — without it every index
  // check looks "unnecessary". Re-enable both together.
  {
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      // tools split digit strings and charsets into code points on purpose
      "@typescript-eslint/no-misused-spread": "off",
    },
  },
  // public/craft: release builds (minified, downloaded by tools/craft/web.mjs)
  globalIgnores(["dist/**", "public/apps/*/", "public/craft/"]),
];
