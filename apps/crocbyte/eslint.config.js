import nextVitals from "eslint-config-next/core-web-vitals";
import { defineConfig, globalIgnores } from "eslint/config";

// legacy import (see tsconfig.json): Next's rules only until the Supabase port.
// shortcut: the old pages read localStorage/cookies with setState inside effects and use one
// handler before its const is declared (safe: it only runs after render). Kept as warnings so
// they stay visible; fix them page by page during the Supabase port.
export default defineConfig(
  ...nextVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  globalIgnores([".next/**", ".open-next/**", ".wrangler/**", "next-env.d.ts"]),
);
