"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTokenColors } from "../lib/token-colors";

/** Dispatch on window to replay the tour from anywhere (a button, the command palette). */
export const BUILD_TOUR_EVENT = "em-build-tour";

/** What counts as one layer: content, media, controls, and boxes that paint something. */
const CONTENT =
  "h1,h2,h3,h4,p,li,img,picture,video,canvas,svg,button,a,figure,blockquote,pre,input";
/** These are built whole; nothing inside them becomes a layer of its own. */
const ATOMIC = "img,picture,video,canvas,svg,button,a,input,pre";

const FLY = 380;
const DRAW = 300;
const HOLD = 140;
const FADE = 260;

type Kind = "Heading" | "Text" | "Image" | "Button" | "Item" | "Icon" | "Media" | "Frame";

/** The label an agent wears while it builds this element. */
export function layerKind(el: Element): Kind {
  const tag = el.tagName.toLowerCase();
  if (/^h[1-4]$/.test(tag)) return "Heading";
  if (tag === "p" || tag === "blockquote" || tag === "pre") return "Text";
  if (tag === "img" || tag === "picture" || tag === "figure") return "Image";
  if (tag === "a" || tag === "button" || tag === "input") return "Button";
  if (tag === "li") return "Item";
  if (tag === "svg") return "Icon";
  if (tag === "video" || tag === "canvas") return "Media";
  return "Frame";
}

/** A box with no content tag still counts when it paints a background, border or shadow. */
function paintsBox(el: Element) {
  const s = getComputedStyle(el);
  return (
    (s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent") ||
    s.backgroundImage !== "none" ||
    s.boxShadow !== "none" ||
    parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth) > 0
  );
}

function isLayer(el: Element) {
  if (el.closest("[data-tour-ui]")) return false;
  if (el.parentElement?.closest(ATOMIC)) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 6 || r.height < 6) return false;
  return el.matches(CONTENT) || paintsBox(el);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

type Agent = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  el: Element | null;
  kind: Kind;
  from: [number, number];
  t0: number;
};
type Ghost = { el: Element; t0: number; color: string };

export type BuildTourProps = {
  /** Start on its own when the boot script put `em-intro` on <html> (the first visit). */
  auto?: boolean;
  /** Text on the skip button (also its accessible name). */
  skipLabel?: string;
};

/**
 * The page builds itself: a swarm of agent cursors scans the screen, then each one flies to an
 * element, drags a selection box over it (a grey frame with handles, like a design tool) and the
 * real element fades in. The tour scrolls down section by section until the page is complete.
 * Elements inside `[data-tour-root]` are the layers. One canvas draws every cursor, ruler and box;
 * the page itself only flips a `data-tour` attribute, so nothing re-renders. Any wheel, touch or
 * key from the visitor ends it at once and shows everything.
 */
export function BuildTour({ auto = true, skipLabel = "Skip" }: BuildTourProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // a fresh number per run, so a replay restarts the loop even mid-tour; 0 = not running
  const [run, setRun] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [phase, setPhase] = useState<"scan" | "tour" | "done">("scan");
  const [count, setCount] = useState({ built: 0, total: 0 });
  const [fast, setFast] = useState(false);
  const speed = useRef(1);
  const stopRef = useRef<() => void>(() => {});
  const colors = useTokenColors([
    "--em-blue-400",
    "--em-sky-400",
    "--em-teal-400",
    "--em-violet-400",
    "--em-coral-400",
    "--em-gold-300",
    "--em-fuchsia-400",
    "--em-croc-400",
    "--em-blue-500",
    "--em-ink-975",
    "--em-ink-0",
    "--em-ink-400",
  ]);

  // read through a ref: a theme flip mid-tour must not restart it and hide the page again
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const ready = colors !== null;

  const start = useCallback(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setRun(performance.now() + 1);
  }, []);

  // first visit: the boot script already hid the page before paint
  useEffect(() => {
    if (auto && document.documentElement.classList.contains("em-intro")) start();
    const replay = () => {
      stopRef.current();
      window.scrollTo({ top: 0, behavior: "instant" });
      start();
    };
    window.addEventListener(BUILD_TOUR_EVENT, replay);
    return () => window.removeEventListener(BUILD_TOUR_EVENT, replay);
  }, [auto, start]);

  useEffect(() => {
    speed.current = fast ? 2 : 1;
  }, [fast]);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    const colors = colorsRef.current;
    if (!run || !colors || !cv || !ctx) return;
    const [blue, ink, paper, grey] = colors.slice(8);
    const palette = colors.slice(0, 8);
    const html = document.documentElement;
    const roots = [...document.querySelectorAll("[data-tour-root]")];

    // every layer, in document order; new ones appear when a sleeping section remounts
    const waiting: Element[] = [];
    const marked = new Set<Element>();
    const mark = (scope: Element) => {
      const found = [scope, ...scope.querySelectorAll("*")].filter(
        (el) => !marked.has(el) && roots.some((r) => r.contains(el)) && isLayer(el),
      );
      for (const el of found) {
        el.setAttribute("data-tour", "wait");
        marked.add(el);
        waiting.push(el);
      }
      return found.length;
    };
    for (const r of roots) mark(r);
    let built = 0;
    const total = () => built + waiting.length;
    setCount({ built: 0, total: total() });
    setPhase("scan");
    html.classList.add("em-touring");
    html.classList.remove("em-intro");

    // React commits, then this runs before paint: remounted sections never flash unbuilt
    const mo = new MutationObserver((records) => {
      let added = 0;
      for (const rec of records)
        for (const n of rec.addedNodes) if (n instanceof Element) added += mark(n);
      if (added) {
        waiting.sort((a, b) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
        );
        setCount({ built, total: total() });
      }
    });
    for (const r of roots) mo.observe(r, { childList: true, subtree: true });

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const n = W < 640 ? 10 : 20;
    setAgentCount(n);
    const agents: Agent[] = Array.from({ length: n }, (_, i) => {
      // small flocks drift in from both sides, like the scan in a design tool
      const side = i % 2 ? W + 40 : -40;
      return {
        x: side,
        y: H * (0.2 + ((i * 0.37) % 0.6)),
        vx: i % 2 ? -1 : 1,
        vy: 0,
        color: palette[i % palette.length] ?? blue ?? "",
        el: null,
        kind: "Frame",
        from: [0, 0],
        t0: 0,
      };
    });
    const ghosts: Ghost[] = [];
    let raf = 0;
    let last = performance.now();
    let clock = 0;
    let scrolling = 0;
    let finishing = 0;
    let shown: "scan" | "tour" = "scan";
    let sent = "";
    const report = () => {
      const key = `${String(built)}/${String(total())}`;
      if (key === sent) return;
      sent = key;
      setCount({ built, total: total() });
    };

    const reveal = (el: Element) => {
      el.setAttribute("data-tour", "done");
      built++;
    };

    const finish = () => {
      if (finishing) return;
      finishing = clock;
      setPhase("done");
      for (const el of waiting.splice(0)) el.setAttribute("data-tour", "done");
      for (const a of agents) {
        if (a.el) a.el.setAttribute("data-tour", "done");
        a.el = null;
      }
      setCount({ built: total(), total: total() });
      try {
        sessionStorage.setItem("em-intro-seen", "1");
      } catch {
        // storage blocked: the tour may play again next visit, nothing breaks
      }
    };

    const teardown = () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", resize);
      for (const ev of ["wheel", "touchstart", "keydown"] as const)
        window.removeEventListener(ev, interrupt);
      for (const el of marked) el.removeAttribute("data-tour");
      html.classList.remove("em-touring", "em-intro");
      ctx.clearRect(0, 0, W, H);
    };
    const end = () => {
      teardown();
      setRun(0);
    };
    stopRef.current = end;

    // the visitor takes over: show everything now, never fight their scroll
    const interrupt = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === "Tab") return;
      // the HUD's own buttons (1x, skip) must not count as taking over
      if (e.target instanceof Element && e.target.closest("[data-tour-ui]")) return;
      end();
    };
    for (const ev of ["wheel", "touchstart", "keydown"] as const)
      window.addEventListener(ev, interrupt, { passive: true });

    const available = () => {
      const out: Element[] = [];
      for (let i = waiting.length - 1; i >= 0; i--) {
        const el = waiting[i];
        if (!el?.isConnected) waiting.splice(i, 1);
      }
      for (const el of waiting) {
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= H * 0.92) continue;
        // off to the side (a marquee, a closed drawer): no one can reach it, show it
        if (r.right <= 0 || r.left >= W || r.width * r.height === 0) {
          out.push(el);
          continue;
        }
        // a parent still waiting goes first, or the child would build inside an empty box
        if (el.parentElement?.closest('[data-tour="wait"]')) continue;
        out.push(el);
      }
      return out;
    };

    const drawRulers = () => {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = ink ?? "";
      ctx.fillRect(0, 0, W, 16);
      ctx.fillRect(0, 0, 16, H);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = paper ?? "";
      ctx.fillStyle = paper ?? "";
      ctx.lineWidth = 1;
      ctx.font = '8px ui-monospace, "Plus Jakarta Sans UI", monospace';
      ctx.beginPath();
      for (let x = 50; x < W; x += 50) {
        const big = x % 100 === 0;
        ctx.moveTo(x + 0.5, 16);
        ctx.lineTo(x + 0.5, big ? 8 : 12);
        if (big) ctx.fillText(String(x), x + 2, 7);
      }
      const sy = window.scrollY;
      for (let y = 50 - (sy % 50); y < H; y += 50) {
        const page = Math.round(y + sy);
        const big = page % 100 === 0;
        ctx.moveTo(16, y + 0.5);
        ctx.lineTo(big ? 8 : 12, y + 0.5);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };

    const drawBox = (r: DOMRect, w: number, h: number, alpha: number, color: string) => {
      ctx.globalAlpha = 0.28 * alpha;
      ctx.fillStyle = grey ?? "";
      ctx.fillRect(r.left, r.top, w, h);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = blue ?? color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.left + 0.5, r.top + 0.5, w, h);
      ctx.fillStyle = paper ?? "";
      for (const [hx, hy] of [
        [r.left, r.top],
        [r.left + w, r.top],
        [r.left, r.top + h],
        [r.left + w, r.top + h],
      ] as const) {
        ctx.fillRect(hx - 3, hy - 3, 6, 6);
        ctx.strokeRect(hx - 3, hy - 3, 6, 6);
      }
      ctx.globalAlpha = 1;
    };

    const drawCursor = (a: Agent) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(4, 11.5);
      ctx.lineTo(7, 18);
      ctx.lineTo(9.5, 17);
      ctx.lineTo(6.6, 10.6);
      ctx.lineTo(11.5, 10.6);
      ctx.closePath();
      ctx.fillStyle = a.color;
      ctx.fill();
      ctx.strokeStyle = ink ?? "";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (a.el) {
        ctx.font = '600 10px "Plus Jakarta Sans UI", sans-serif';
        const w = ctx.measureText(a.kind).width + 10;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.roundRect(12, 16, w, 15, 4);
        ctx.fill();
        ctx.fillStyle = ink ?? "";
        ctx.fillText(a.kind, 17, 27);
      }
      ctx.restore();
    };

    const SCAN = 1400;
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) * speed.current;
      last = now;
      clock += dt;
      ctx.clearRect(0, 0, W, H);

      if (clock > SCAN && shown === "scan" && !finishing) {
        shown = "tour";
        setPhase("tour");
      }

      // hand out work
      if (clock > SCAN && !finishing) {
        const idle = agents.filter((a) => !a.el);
        if (idle.length) {
          const free = available().filter((el) => !agents.some((a) => a.el === el));
          for (const a of idle) {
            const el = free.shift();
            if (!el) break;
            const r = el.getBoundingClientRect();
            if (r.right <= 0 || r.left >= W || r.width * r.height === 0) {
              waiting.splice(waiting.indexOf(el), 1);
              reveal(el);
              continue;
            }
            waiting.splice(waiting.indexOf(el), 1);
            el.setAttribute("data-tour", "build");
            a.el = el;
            a.kind = layerKind(el);
            a.from = [a.x, a.y];
            a.t0 = clock;
          }
          if (free.length === 0 && agents.filter((a) => a.el).length < 3 && clock > scrolling) {
            const bottom = window.scrollY + H >= document.documentElement.scrollHeight - 4;
            if (bottom && !agents.some((a) => a.el)) finish();
            else if (!bottom) {
              window.scrollBy({ top: H * 0.72, behavior: "smooth" });
              scrolling = clock + 700;
            }
          }
          report();
        }
      }

      for (const a of agents) {
        if (!a.el) {
          // wander: a slow drift that turns now and then
          a.vx += (Math.random() - 0.5) * 0.12;
          a.vy += (Math.random() - 0.5) * 0.12;
          const toCx = (W / 2 - a.x) * 0.0004;
          const toCy = (H / 2 - a.y) * 0.0004;
          a.vx = (a.vx + toCx) * 0.98;
          a.vy = (a.vy + toCy) * 0.98;
          a.x += a.vx * dt * 0.12;
          a.y += a.vy * dt * 0.12;
          continue;
        }
        const r = a.el.getBoundingClientRect();
        const t = clock - a.t0;
        if (t < FLY) {
          const k = ease(t / FLY);
          // a slight arc, so the swarm does not move on rails
          const arc = Math.sin(k * Math.PI) * 24;
          a.x = a.from[0] + (r.left - a.from[0]) * k + arc;
          a.y = a.from[1] + (r.top - a.from[1]) * k - arc * 0.5;
        } else if (t < FLY + DRAW) {
          const k = ease((t - FLY) / DRAW);
          const w = Math.max(1, r.width * k);
          const h = Math.max(1, r.height * k);
          drawBox(r, w, h, 1, a.color);
          a.x = r.left + w;
          a.y = r.top + h;
        } else if (t < FLY + DRAW + HOLD) {
          drawBox(r, r.width, r.height, 1, a.color);
          a.x = r.right;
          a.y = r.bottom;
        } else {
          reveal(a.el);
          ghosts.push({ el: a.el, t0: clock, color: a.color });
          a.el = null;
          a.vx = (Math.random() - 0.5) * 2;
          a.vy = (Math.random() - 0.5) * 2;
        }
      }

      for (let i = ghosts.length - 1; i >= 0; i--) {
        const g = ghosts[i];
        if (!g) continue;
        const k = (clock - g.t0) / FADE;
        if (k >= 1) {
          ghosts.splice(i, 1);
          continue;
        }
        const r = g.el.getBoundingClientRect();
        drawBox(r, r.width, r.height, 1 - clamp01(k), g.color);
      }

      if (!finishing) drawRulers();
      ctx.globalAlpha = finishing ? 1 - clamp01((clock - finishing) / 600) : 1;
      for (const a of agents) drawCursor(a);
      ctx.globalAlpha = 1;

      if (finishing && clock - finishing > 900) {
        end();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return teardown;
  }, [run, ready]);

  if (!run) return null;
  const pct = count.total ? Math.min(100, (count.built / count.total) * 100) : 0;
  const swatches = (colors ?? []).slice(0, 5);
  return (
    <>
      <canvas
        ref={canvas}
        aria-hidden
        data-tour-ui
        className="vt-live pointer-events-none fixed inset-0 z-[90] h-full w-full"
      />
      <div
        data-tour-ui
        className="em-tour-hud vt-top fixed bottom-4 left-1/2 z-[91] flex -translate-x-1/2 items-center gap-3 rounded-full px-3 py-2 text-xs font-semibold"
      >
        <span className="flex" aria-hidden>
          {swatches.map((c, i) => (
            <span
              key={i}
              className="-ml-1.5 size-4 rounded-full first:ml-0"
              style={{ background: c, boxShadow: "0 0 0 2px var(--em-ink-975)" }}
            />
          ))}
        </span>
        <span className="whitespace-nowrap max-sm:hidden">
          {phase === "scan" ? "Scanning page…" : `${String(agentCount)} agents`}
        </span>
        <span className="whitespace-nowrap tabular-nums">
          {count.built} / {count.total} layers
        </span>
        <span aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-[var(--em-ink-800)]">
          <span
            className="block h-full bg-[var(--em-blue-500)] transition-[width] duration-200"
            style={{ width: `${String(pct)}%` }}
          />
        </span>
        <span
          role="status"
          className="rounded-md bg-[var(--em-blue-600)] px-2 py-1 text-[var(--em-ink-0)]"
        >
          {phase === "scan" ? "Scanning" : phase === "tour" ? "Touring" : "Done"}
        </span>
        <button
          type="button"
          onClick={() => setFast((f) => !f)}
          aria-label={fast ? "speed 2x, switch to 1x" : "speed 1x, switch to 2x"}
          className="min-h-8 min-w-8 rounded-md border border-[var(--em-ink-700)] px-1.5"
        >
          {fast ? "2x" : "1x"}
        </button>
        <button
          type="button"
          onClick={() => stopRef.current()}
          aria-label={skipLabel}
          className="min-h-8 min-w-8 rounded-md border border-[var(--em-ink-700)] px-1.5"
        >
          ×
        </button>
      </div>
    </>
  );
}
