/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { fetchOembed, youtubeId } from "./src/lib/youtube";

/**
 * Build-only CSP: the dev server needs inline scripts for HMR, the production bundle doesn't.
 * YouTube's official player: its loader script from www.youtube.com, the frame from the
 * no-cookie host, thumbnails from i.ytimg.com. Nothing else from outside.
 */
function contentSecurityPolicy(supabaseUrl: string): Plugin {
  const supabase = new URL(supabaseUrl).origin;
  const realtime = supabase.replace(/^http/, "ws");
  const policy = [
    "default-src 'self'",
    "script-src 'self' https://www.youtube.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://i.ytimg.com",
    "frame-src https://www.youtube-nocookie.com",
    // REST + Realtime (watch together)
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

/** `pnpm dev` has no Worker: answer /api/oembed the same way worker.ts does. */
function devOembed(): Plugin {
  return {
    name: "stream-dev-oembed",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/oembed", (req, res) => {
        const id = youtubeId(new URL(req.url ?? "", "http://x").searchParams.get("id") ?? "");
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (!id) {
          send(400, { error: "not a YouTube link" });
          return;
        }
        fetchOembed(id).then(
          (info) => send(info ? 200 : 404, info ?? { error: "video not found" }),
          () => send(502, { error: "YouTube did not answer" }),
        );
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "VITE_");

  return {
    plugins: [
      react(),
      tailwindcss(),
      devOembed(),
      contentSecurityPolicy(env.VITE_SUPABASE_URL ?? "http://localhost:54321"),
    ],
    resolve: { alias: { "@": `${import.meta.dirname}/src` } },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      restoreMocks: true,
      pool: "threads",
      maxWorkers: "50%",
      env: {
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
        VITE_SITE_URL: "http://localhost:3008",
        VITE_HUB_URL: "http://localhost:3000",
      },
    },
  };
});
