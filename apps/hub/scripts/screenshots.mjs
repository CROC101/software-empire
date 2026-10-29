// Re-shoots the real screens in public/previews at 2x, so they stay sharp on retina screens.
// Needs: local Supabase seeded (pnpm db:reset), hub on :3000, community :3001, toolboxes :3003,
// canva :3006, and Chrome installed. Signs in with the local seed account (supabase/seed.sql).
//   node apps/hub/scripts/screenshots.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "../public/previews");
const EMAIL = process.env.SHOT_EMAIL ?? "admin@empire.local";
const PASSWORD = process.env.SHOT_PASSWORD ?? "empire-demo-2026"; // local seed only
const CHROME =
  process.env.CHROME ??
  (process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "google-chrome");

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const SHOTS = [
  ["hub.webp", "http://localhost:3000/", DESKTOP],
  ["community.webp", "http://localhost:3001/feed", DESKTOP],
  ["canva.webp", "http://localhost:3006/", DESKTOP],
  ["toolboxes.webp", "http://localhost:3003/", DESKTOP],
  ["m-community.webp", "http://localhost:3001/feed", PHONE],
  ["m-messages.webp", "http://localhost:3001/messages", PHONE],
  ["m-canva.webp", "http://localhost:3006/", PHONE],
  ["m-toolboxes.webp", "http://localhost:3003/", PHONE],
  ["m-tools.webp", "http://localhost:3003/tools", PHONE],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "shots-"));
const PORT = 9341;
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${String(PORT)}`,
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "about:blank",
]);

try {
  let page;
  for (let i = 0; i < 40 && !page; i++) {
    await sleep(250);
    page = await fetch(`http://127.0.0.1:${String(PORT)}/json`)
      .then((r) => r.json())
      .then((t) => t.find((x) => x.type === "page"))
      .catch(() => undefined);
  }
  if (!page) throw new Error("Chrome did not start");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id !== n) return;
        ws.removeEventListener("message", onMsg);
        if (d.error) reject(new Error(`${method}: ${d.error.message}`));
        else resolve(d.result);
      };
      ws.addEventListener("message", onMsg);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const run = (expression) =>
    call("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }).then(
      (r) => r.result.value,
    );
  const open = async (url) => {
    await call("Page.navigate", { url });
    await sleep(1500);
    await run("document.fonts.ready.then(() => true)");
  };

  await call("Page.enable");
  await call("Network.enable");
  // apps that sync a "system" account preference into the shared cookie follow this
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "light" }],
  });
  const lightCookies = async () => {
    for (const [name, value] of [
      ["em-theme", "light"],
      ["em-ambience", "off"],
    ]) {
      await call("Network.setCookie", { name, value, domain: "localhost", path: "/" });
    }
  };
  await lightCookies();

  // sign in at the hub; the session cookie is shared by every localhost port
  await call("Emulation.setDeviceMetricsOverride", DESKTOP);
  await open("http://localhost:3000/login");
  await run(`(() => {
    const set = (n, v) => {
      const el = document.querySelector('input[name="' + n + '"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set("email", ${JSON.stringify(EMAIL)});
    set("password", ${JSON.stringify(PASSWORD)});
    document.querySelector('button[name="intent"][value="signin"]').click();
  })()`);
  await sleep(4000);
  if ((await run("location.pathname")).startsWith("/login")) throw new Error("sign-in failed");
  await run("sessionStorage.setItem('em-intro-seen', '1')");

  for (const [file, url, metrics] of SHOTS) {
    await call("Emulation.setDeviceMetricsOverride", metrics);
    await lightCookies(); // canva writes the account's theme back into the shared cookie
    await open(url);
    await sleep(3500); // data, images and entrance animations settle
    const { data } = await call("Page.captureScreenshot", { format: "webp", quality: 86 });
    writeFileSync(join(OUT, file), Buffer.from(data, "base64"));
    console.log(`${file}  ${url}  ${String(metrics.width * 2)}x${String(metrics.height * 2)}`);
  }
  ws.close();
} finally {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
}
