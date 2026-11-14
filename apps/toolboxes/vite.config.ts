/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

// time-zone-dependent tools (timestamps, cron, "days until") are asserted in Thai local time
process.env.TZ = "Asia/Bangkok";

/** Build-only CSP: the dev server needs inline scripts for HMR, the production bundle doesn't. */
function contentSecurityPolicy(supabaseUrl: string): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // React style={{…}} attributes and qrcode.react need inline styles; scripts stay locked
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    `connect-src 'self' ${new URL(supabaseUrl).origin}`,
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
    build: {
      rollupOptions: {
        // cloud save also runs inside /craft/* and /apps/* pages, which load it from a fixed URL
        input: { main: "index.html", sync: "src/sync/main.ts" },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === "sync" ? "sync/crocwork-sync.js" : "assets/[name]-[hash].js",
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      // threads start without spawning a process — forks timed out while turbo ran builds in parallel
      pool: "threads",
      // turbo runs every package's tests at once; half the cores each keeps workers from timing out on start
      maxWorkers: "50%",
      // CI has no .env.local — modules that read VITE_* at import still need valid values
      env: {
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
        VITE_SITE_URL: "http://localhost:3003",
        VITE_HUB_URL: "http://localhost:3000",
      },
    },
  };
});
