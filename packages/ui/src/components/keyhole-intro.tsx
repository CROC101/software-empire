"use client";

import * as React from "react";

/**
 * Keyhole intro: a first-visit preloader. While a counter climbs to 100 a typographic collage
 * assembles (the first letter prints pixel by pixel, the word wipes in, a tag pill drops, an ink
 * swoosh draws); at 100 a gilded key turns in a keyhole and the view dives through it into the
 * page. Click, Enter or Escape skips.
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
  skipLabel,
}: {
  /** The word after the pixel-printed first letter, e.g. "rocwork" for "Crocwork". */
  rest: string;
  welcome: string;
  tag: string;
  lines: readonly string[];
  skipLabel: string;
}) {
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

        <div className="ki__lines">
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
          <svg viewBox="0 0 160 60" className="ki__key" aria-hidden>
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
        </div>

        <p className="ki__count">LOADING · {String(pct).padStart(3, "0")}%</p>
        <button type="button" className="ki__skip" onClick={finish}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
