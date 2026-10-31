import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    pool: "threads",
    // turbo runs every package's tests at once; half the cores each keeps workers from timing out on start
    maxWorkers: "50%",
  },
});
