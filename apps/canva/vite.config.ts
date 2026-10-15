/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

process.env.TZ = "Asia/Bangkok";

/** Build-only CSP: the dev server needs inline scripts for HMR, the production bundle doesn't. */
function contentSecurityPolicy(supabaseUrl: string): Plugin {
  const supabase = new URL(supabaseUrl).origin;
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // uploads live in Supabase Storage; "insert image from link" draws any https image
    `img-src 'self' blob: data: https: ${supabase}`,
    `media-src 'self' blob: ${supabase}`,
    `font-src 'self' data: ${supabase}`,
    // same reason as img-src: the link importer fetches the image to check it
    `connect-src 'self' https: ${supabase}`,
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
      setupFiles: ["./src/test-setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      // threads start without spawning a process — forks timed out while turbo ran builds in parallel
      pool: "threads",
    },
  };
});
