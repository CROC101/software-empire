/**
 * Toolboxes chrome for the separate builds under /apps/<slug>/ and /craft/<slug>/ (no React there):
 * a "back to Toolboxes" pill, a loading orbit while the app starts, the shared theme kept in step
 * with the hub and every other tab, and the visit written to this browser's history.
 * Lives in a closed shadow root so the app's CSS cannot reach it, and it cannot reach the app.
 */
import { currentChoice, resolve, osDark, setThemeChoice, subscribeTheme } from "@empire/core/theme";
import { logVisit } from "@/lib/history";

const match = /^\/(apps|craft)\/([a-z0-9-]+)\//.exec(location.pathname);

/** Colours: the app's own page has no crocwork tokens, so these mirror --em-blue-600 / --em-ink-*. */
const CSS = `
:host { all: initial; }
.pill {
  position: fixed; left: 12px; bottom: 12px; z-index: 2147483646;
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px 0 9px;
  border-radius: 999px; font: 600 13px/1 system-ui, "Noto Sans Thai UI", sans-serif;
  text-decoration: none; color: light-dark(#0b1220, #f2f5fa);
  background: light-dark(rgb(255 255 255 / .82), rgb(16 22 34 / .82));
  border: 1px solid light-dark(rgb(11 18 32 / .14), rgb(242 245 250 / .16));
  box-shadow: 0 6px 20px rgb(0 0 0 / .18); backdrop-filter: blur(10px);
  opacity: .9; transition: opacity .2s, transform .2s;
}
.pill:hover, .pill:focus-visible { opacity: 1; transform: translateY(-1px); }
.pill:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.pill svg { width: 16px; height: 16px; flex: none; }
.label { max-width: 90px; overflow: hidden; white-space: nowrap; transition: max-width .3s, opacity .3s; }
.pill.small .label { max-width: 0; opacity: 0; }
.pill.small:hover .label, .pill.small:focus-visible .label { max-width: 90px; opacity: 1; }
.veil {
  position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
  background: light-dark(#f6f8fb, #070a12); color: light-dark(#0b1220, #f2f5fa);
  transition: opacity .35s; font: 600 12px/1 ui-monospace, monospace; letter-spacing: .2em;
}
.veil.out { opacity: 0; pointer-events: none; }
.orbit { position: relative; width: 132px; height: 132px; margin: 0 auto 22px; }
.ring { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed currentColor; opacity: .18; }
.spin { position: absolute; inset: 0; animation: spin 2.4s linear infinite; }
.dot { position: absolute; left: 50%; top: 0; width: 14px; height: 14px; margin-left: -7px; border-radius: 4px; }
.spin:nth-child(3) { animation-delay: -.8s; } .spin:nth-child(4) { animation-delay: -1.6s; }
.mark { position: absolute; inset: 40px; display: grid; place-items: center; }
.mark svg { width: 46px; height: 40px; fill: #2563eb; }
@keyframes spin { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } .pill, .label, .veil { transition: none; } }
`;

const MARK = `<svg viewBox="0 0 40 34" aria-hidden="true"><path d="M20 0 L40 0 L33 9 L23 9 L15 25 L33 25 L40 34 L10 34 L0 25 L12 3 Z"/></svg>`;
const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`;

function keepTheme(kind: string) {
  const apply = () => {
    const theme = resolve(currentChoice(), osDark());
    const root = document.documentElement;
    root.style.colorScheme = theme;
    // /apps read :root[data-theme="dark"] (crocwork.css); craft builds read the dark class
    if (kind === "apps") root.dataset.theme = theme;
    else root.classList.toggle("dark", theme === "dark");
  };
  apply();
  subscribeTheme(apply);
  if (kind !== "apps") return;
  // /apps carry their own theme switch: on boot it deletes data-theme ("system"), which hid the
  // shared theme. Put ours back; once the app is up, its own toggle becomes the shared choice.
  let ready = document.readyState === "complete";
  if (!ready) addEventListener("load", () => (ready = true), { once: true });
  new MutationObserver(() => {
    const root = document.documentElement;
    const now = root.dataset.theme;
    if (now === resolve(currentChoice(), osDark())) return;
    if (ready && (now === "light" || now === "dark"))
      setThemeChoice(now, import.meta.env.VITE_COOKIE_DOMAIN);
    apply();
  }).observe(document.documentElement, { attributeFilter: ["data-theme"] });
}

function mount(kind: string, slug: string) {
  const host = document.createElement("crocwork-chrome");
  const shadow = host.attachShadow({ mode: "closed" });
  const lang = /(?:^|;\s*)em-lang=en(?:;|$)/.test(document.cookie) ? "en" : "th";
  const back = kind === "apps" ? "/apps" : "/#lineup";
  shadow.innerHTML = `<style>${CSS}</style>
<a class="pill" href="${back}" aria-label="${lang === "en" ? "Back to Toolboxes" : "กลับไปหน้า Toolboxes"}">${ARROW}<span class="label">Toolboxes</span></a>`;

  // the loading orbit: only when the app has not finished loading after a moment
  if (document.readyState !== "complete") {
    const timer = setTimeout(() => {
      const veil = document.createElement("div");
      veil.className = "veil";
      veil.setAttribute("role", "status");
      const colours = ["#2563eb", "#0ea5e9", "#f59e0b"];
      veil.innerHTML = `<div><div class="orbit"><div class="ring"></div>${colours
        .map((c) => `<div class="spin"><span class="dot" style="background:${c}"></span></div>`)
        .join(
          "",
        )}<div class="mark">${MARK}</div></div><div>LOADING ${slug.toUpperCase()}</div></div>`;
      shadow.append(veil);
      const done = () => {
        veil.classList.add("out");
        setTimeout(() => veil.remove(), 400);
      };
      addEventListener("load", done, { once: true });
      setTimeout(done, 15_000); // never trap the user behind it
    }, 250);
    addEventListener("load", () => clearTimeout(timer), { once: true });
  }

  (document.body ?? document.documentElement).append(host);
  // the label folds away after a few seconds so it covers less of the app
  setTimeout(() => shadow.querySelector(".pill")?.classList.add("small"), 4000);
}

if (match) {
  const [, kind = "", slug = ""] = match;
  keepTheme(kind);
  if (document.body) mount(kind, slug);
  else addEventListener("DOMContentLoaded", () => mount(kind, slug), { once: true });
  logVisit(`${kind === "apps" ? "app" : "craft"}-${slug}`);
}
