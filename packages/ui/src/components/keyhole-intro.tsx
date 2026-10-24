"use client";

import * as React from "react";

/**
 * Keyhole intro: a first-visit preloader. While a counter climbs to 100 a typographic collage
 * assembles (the first letter prints pixel by pixel, the word wipes in, a tag pill drops, an ink
 * swoosh draws); at 100 a gilded key turns in a keyhole and the view dives through it into the
 * page. While it loads the key can be grabbed and thrown; it springs back into the lock. A
 * handwritten version counts 0.0 → 1.0. Click (outside the key), Enter or Escape skips.
 *
 * Our own build after "Portfolio Preloader with Skeleton Key" (21st.dev). It shows only when
 * the page's boot script put `em-intro` on <html> before paint (first visit this session, no
 * reduced motion), so there is no flash of the page and no intro for people who opt out.
 * Styles: `.ki` in styles.css. Transforms and opacity only.
 */

const PIXEL_C = [
  ".XXXXX.",
  "XX...XX",
  "XX.....",
  "XX.....",
  "XX.....",
  "XX.....",
  "XX.....",
  "XX...XX",
  ".XXXXX.",
];
const MIN_MS = 1500; // never shorter, so the collage can play
const MAX_MS = 3200; // never longer, even if the page is still loading
export const INTRO_KEY = "em-intro-seen";

export function KeyholeIntro({
  rest,
  welcome,
  tag,
  lines,
  aboutLabel = "about/",
  grabLabel = "grab the key ↗",
  brand,
  skipLabel,
}: {
  /** The word after the pixel-printed first letter, e.g. "rocwork" for "Crocwork". */
  rest: string;
  welcome: string;
  tag: string;
  lines: readonly string[];
  aboutLabel?: string;
  grabLabel?: string;
  /** Bottom-right signature, e.g. the domain. */
  brand?: string;
  skipLabel: string;
}) {
  const grabRef = React.useRef<HTMLSpanElement>(null);
  // the thrown key: position, velocity and tilt, sprung back to the lock (no React renders)
  const [key] = React.useState(() => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 0,
    held: false,
    sx: 0,
    sy: 0,
    raf: 0,
  }));
  const [pct, setPct] = React.useState(0);
  const [phase, setPhase] = React.useState<"load" | "turn" | "dive" | "done">("load");

  const finish = React.useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // private mode: the intro may show again next visit, nothing breaks
    }
    document.documentElement.classList.remove("em-intro");
    setPhase("done");
  }, []);

  React.useEffect(() => {
    if (!document.documentElement.classList.contains("em-intro")) {
      setPhase("done");
      return;
    }
    const start = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad);
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      // eases toward 100 over MIN_MS, but holds at 96 until the page has loaded (or MAX_MS)
      let p = 100 * (1 - Math.pow(1 - Math.min(1, t / MIN_MS), 3));
      if (!loaded && t < MAX_MS) p = Math.min(p, 96);
      setPct(Math.round(p));
      if (p >= 100) setPhase("turn");
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  React.useEffect(() => {
    if (phase === "turn") {
      const id = window.setTimeout(() => setPhase("dive"), 520);
      return () => window.clearTimeout(id);
    }
    if (phase === "dive") {
      const id = window.setTimeout(finish, 700);
      return () => window.clearTimeout(id);
    }
  }, [phase, finish]);

  React.useEffect(() => {
    if (phase === "done") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, finish]);

  const keyFrame = React.useCallback(() => {
    key.raf = 0;
    if (!key.held) {
      key.vx = (key.vx - key.x * 0.07) * 0.86;
      key.vy = (key.vy - key.y * 0.07) * 0.86;
      key.x += key.vx;
      key.y += key.vy;
    }
    key.r += (Math.max(-40, Math.min(40, key.vx * 2.2)) - key.r) * 0.2;
    if (grabRef.current)
      grabRef.current.style.transform = `translate(${key.x.toFixed(1)}px, ${key.y.toFixed(1)}px) rotate(${key.r.toFixed(1)}deg)`;
    const moving =
      key.held || Math.abs(key.x) + Math.abs(key.y) + Math.abs(key.vx) + Math.abs(key.vy) > 0.3;
    if (moving) key.raf = requestAnimationFrame(keyFrame);
    else if (grabRef.current) grabRef.current.style.transform = "";
  }, [key]);

  // the key goes home before it turns
  React.useEffect(() => {
    if (phase === "load") return;
    key.held = false;
    key.x = key.y = key.vx = key.vy = key.r = 0;
    cancelAnimationFrame(key.raf);
    key.raf = 0;
    if (grabRef.current) grabRef.current.style.transform = "";
  }, [phase, key]);

  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      if (phase !== "load") return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      key.held = true;
      key.sx = e.clientX - key.x;
      key.sy = e.clientY - key.y;
      if (!key.raf) key.raf = requestAnimationFrame(keyFrame);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!key.held) return;
      const x = e.clientX - key.sx;
      const y = e.clientY - key.sy;
      key.vx = x - key.x;
      key.vy = y - key.y;
      key.x = x;
      key.y = y;
    },
    onPointerUp: () => {
      key.held = false; // keeps its velocity: a throw
    },
    // a drag must not count as the click that skips the intro
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  if (phase === "done") return null;

  return (
    <div className="ki" data-phase={phase} role="presentation" onClick={finish}>
      <div className="ki__stage">
        <p className="ki__welcome">{welcome}</p>

        <div className="ki__word" aria-hidden>
          <span className="ki__pixel">
            {PIXEL_C.flatMap((row, y) =>
              Array.from(row, (c, x) =>
                c === "X" ? (
                  <i
                    key={`${String(x)}-${String(y)}`}
                    style={{
                      gridColumn: x + 1,
                      gridRow: y + 1,
                      animationDelay: `${String((y * 7 + x) * 14)}ms`,
                    }}
                  />
                ) : null,
              ),
            )}
          </span>
          <span className="ki__rest">{rest}</span>
          <svg className="ki__swoosh" viewBox="0 0 400 40" preserveAspectRatio="none">
            <path d="M4 30 C 90 6, 200 40, 396 12" />
          </svg>
        </div>

        <span className="ki__tag">{tag}</span>
        <span className="ki__ver" aria-hidden>
          {(pct / 100).toFixed(1)}
        </span>

        <div className="ki__lines">
          <span className="ki__about" style={{ animationDelay: "420ms" }}>
            {aboutLabel}
          </span>
          {lines.map((l, i) => (
            <span key={l} style={{ animationDelay: `${String(500 + i * 160)}ms` }}>
              {l}
            </span>
          ))}
        </div>

        {/* the keyhole the view dives through, with the key that turns in it */}
        <div className="ki__hole">
          <svg viewBox="0 0 120 120" className="ki__ring">
            <circle cx="60" cy="60" r="56" />
          </svg>
          <svg viewBox="0 0 40 60" className="ki__slot" aria-hidden>
            <circle cx="20" cy="18" r="12" />
            <path d="M13 24 L9 56 H31 L27 24 Z" />
          </svg>
          <span ref={grabRef} className="ki__grab">
            <svg viewBox="0 0 160 60" className="ki__key" aria-hidden {...grab}>
              <defs>
                <linearGradient id="ki-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" style={{ stopColor: "var(--em-gold-300)" }} />
                  <stop offset="0.5" style={{ stopColor: "var(--em-gold-500)" }} />
                  <stop offset="1" style={{ stopColor: "var(--em-gold-300)" }} />
                </linearGradient>
              </defs>
              <g fill="url(#ki-gold)">
                <circle cx="26" cy="30" r="22" />
                <rect x="44" y="26" width="104" height="8" rx="3" />
                <path d="M122 34 h8 v14 h-8z M138 34 h8 v10 h-8z" />
              </g>
              <circle cx="26" cy="30" r="9" style={{ fill: "var(--em-ink-975)" }} />
              <circle
                cx="26"
                cy="30"
                r="17"
                fill="none"
                style={{ stroke: "var(--em-ink-975)" }}
                strokeOpacity={0.35}
                strokeWidth={2}
              />
            </svg>
          </span>
        </div>

        <p className="ki__count">LOADING · {String(pct).padStart(3, "0")}%</p>
        <p className="ki__hint">{grabLabel}</p>
        {brand && <p className="ki__brand">{brand}</p>}
        <button type="button" className="ki__skip" onClick={finish}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
