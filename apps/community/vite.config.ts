/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

process.env.TZ = "Asia/Bangkok";

/** Build-only CSP: the dev server needs inline scripts for HMR, the production bundle doesn't. */
function contentSecurityPolicy(supabaseUrl: string): Plugin {
  const supabase = new URL(supabaseUrl).origin;
  const realtime = supabase.replace(/^http/, "ws");
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // avatars, covers, post media and link-preview images
    `img-src 'self' blob: data: https: ${supabase}`,
    `media-src 'self' blob: ${supabase}`,
    `font-src 'self' data: ${supabase}`,
    // REST + Realtime (chat, presence, call signalling)
    `connect-src 'self' ${supabase} ${realtime}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    name: "empire-csp",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: policy },
        injectTo: "head-prepend",
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "VITE_");

  return {
    plugins: [
      react(),
      tailwindcss(),
      contentSecurityPolicy(env.VITE_SUPABASE_URL ?? "http://localhost:54321"),
    ],
    resolve: { alias: { "@": `${import.meta.dirname}/src` } },
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      // threads start without spawning a process — forks timed out while turbo ran builds in parallel
      pool: "threads",
      // CI has no .env.local — modules that read VITE_* at import still need valid values
      env: {
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
        VITE_SITE_URL: "http://localhost:3001",
        VITE_HUB_URL: "http://localhost:3000",
      },
    },
  };
});
