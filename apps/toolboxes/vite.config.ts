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
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
    },
  };
});
