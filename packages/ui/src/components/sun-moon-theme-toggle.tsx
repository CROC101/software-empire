"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { Moon, Sun } from "lucide-react";
import {
  currentChoice,
  osDark,
  resolve,
  setThemeChoice,
  subscribeTheme,
  type ResolvedTheme,
} from "@empire/core/theme";
import { cn } from "../lib/cn";

/**
 * Sun / moon theme switch: the moon sets along an arc while the sun rises (and back), over a
 * night / day sky. The choice is the portfolio-wide `em-theme` cookie, so flipping it here
 * flips every other app too — including ones open in other tabs.
 */

type Body = { side: -1 | 1; spin: number };
const MOON: Body = { side: -1, spin: 25 };
const SUN: Body = { side: 1, spin: 120 };
const ARC = 115;
const QUARTER = Math.PI / 2;
const STEPS = 30;
const BODY = "pointer-events-none absolute inset-0 flex items-center justify-center";
const SKY = "pointer-events-none absolute inset-0 -z-10";
const SKY_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const STARS = [
  { x: 24, y: 22, r: 1.6, t: 2100 },
  { x: 66, y: 16, r: 1.2, t: 2600 },
  { x: 80, y: 42, r: 1.8, t: 1900 },
  { x: 38, y: 58, r: 1.1, t: 2900 },
  { x: 58, y: 74, r: 1.4, t: 2300 },
  { x: 14, y: 72, r: 1.2, t: 2500 },
];
const FADE_STYLE_ID = "em-theme-fade";
let fadeCleanup = 0;

// both bodies ride one circle centred below the button, like a sky dome
const arcPoint = (side: number, angle: number) => ({
  x: side * ARC * Math.sin(angle),
  y: ARC * (1 - Math.cos(angle)),
});
const easeInCubic = (t: number) => t ** 3;
const easeOutBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;

const setting = ({ side, spin }: Body): Keyframe[] =>
  Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const k = easeInCubic(t);
    const { x, y } = arcPoint(side, k * QUARTER);
    return {
      offset: t,
      transform: `translate(${String(x)}%, ${String(y)}%) rotate(${String(side * spin * k)}deg)`,
      opacity: t < 0.55 ? 1 : (1 - t) / 0.45,
    };
  });

const rising = ({ side, spin }: Body): Keyframe[] =>
  Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const left = 1 - easeOutBack(t);
    const { x, y } = arcPoint(side, left * QUARTER);
    return {
      offset: t,
      transform: `translate(${String(x)}%, ${String(y)}%) rotate(${String(side * spin * left)}deg) scale(${String(1 - 0.28 * left)})`,
      opacity: Math.min(1, t / 0.3),
    };
  });

const FRAMES = {
  moonSets: setting(MOON),
  moonRises: rising(MOON),
  sunSets: setting(SUN),
  sunRises: rising(SUN),
};

const reducedMotion = () =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- absent in test DOMs
  typeof window.matchMedia !== "function" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Fades every color on the page over the swap instead of snapping. */
function fadePage(duration: number) {
  if (reducedMotion()) return;
  const style =
    document.getElementById(FADE_STYLE_ID) ??
    document.head.appendChild(
      Object.assign(document.createElement("style"), { id: FADE_STYLE_ID }),
    );
  style.textContent = `*, *::before, *::after { transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke !important; transition-duration: ${String(duration)}ms !important; transition-timing-function: ${SKY_EASE} !important; transition-delay: 0s !important; }`;
  clearTimeout(fadeCleanup);
  fadeCleanup = window.setTimeout(() => style.remove(), duration + 100);
}

/**
 * How the page changes theme. "drop", "circle" and "wipe" use the View Transitions API: the
 * browser snapshots the old page and reveals the new one through a growing clip-path, on the
 * compositor. "drop" (the default) spreads the new theme from the button like a drop of ink in
 * water: a liquid edge that wobbles while it grows and settles round as it covers the screen,
 * while the old page sinks back a little and dims. Without the API (or with reduced motion) the
 * swap is instant; "fade" cross-fades colours. "wave" (the default) reveals the new theme from the
 * top down behind a falling, streaming water edge, so the colours change where the water has
 * passed; it skips to the end if the visitor scrolls, and without View Transitions it falls back
 * to "stream". "stream" is live, no snapshot: a
 * sheet of water in the coming theme's colour pours down in streams, the theme changes under
 * it, and it drains away, while the page keeps scrolling and moving underneath.
 */
export type ThemeEffect = "wave" | "stream" | "drop" | "circle" | "wipe" | "fade";

const REVEAL_MS = 560;
const DROP_MS = 1100;
const DROP_POINTS = 72;
const DROP_FRAMES = 36;

const POUR_MS = 1250;
// screens tall: just enough that its solid middle covers the whole screen for a beat (~0.1s) to
// hide the swap, short enough that the page is never blank for long
const POUR_TALL = 1.45;

/**
 * The live water curtain for "stream": a tall, click-through sheet of the coming theme's colour,
 * with a wavy top and stream fingers at the bottom, falls through the screen. While it covers the
 * whole screen the theme swaps underneath; then it slides away. It only moves by transform (on
 * the compositor), so it keeps flowing even while the page recolours, and the real page keeps
 * scrolling under it the whole time. No View Transition, nothing frozen.
 */
function pourTheme(next: ResolvedTheme, swap: () => void) {
  const vh = innerHeight;
  const tall = Math.round(vh * POUR_TALL);
  const sheet = document.createElement("div");
  sheet.className = "em-pour";
  sheet.dataset.next = next;
  sheet.setAttribute("aria-hidden", "true");
  sheet.style.height = `${String(tall)}px`;
  // a popover lives in the top layer, so the water also covers an open <dialog> (the phone menu)
  sheet.popover = "manual";
  document.body.appendChild(sheet);
  sheet.showPopover();
  const run = sheet.animate(
    [
      { transform: `translate3d(0, ${String(-tall)}px, 0)` },
      { transform: `translate3d(0, ${String(vh)}px, 0)` },
    ],
    // symmetric, and gentle in the middle, so the covered moment lasts
    { duration: POUR_MS, easing: "cubic-bezier(0.3, 0, 0.7, 1)", fill: "both" },
  );
  // halfway through, the sheet is centred on the screen and covers all of it
  const swapAt = window.setTimeout(swap, POUR_MS * 0.5);
  const done = () => {
    window.clearTimeout(swapAt);
    sheet.remove();
  };
  run.finished.then(done, done);
}

const WAVE_MS = 1100;
const WAVE_POINTS = 96;
const WAVE_FRAMES = 40;

/**
 * Clip-path keyframes for "wave": the new theme fills the screen from the top down behind a
 * falling edge of water, streams of it racing ahead with rippling heads that calm as it lands.
 */
function waveFrames(w: number, h: number): Keyframe[] {
  const lag = (u: number) =>
    0.5 +
    0.24 * Math.sin(u * 9.1 + 0.6) +
    0.16 * Math.sin(u * 17.3 + 2.1) +
    0.1 * Math.sin(u * 31.7 + 4.4);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return Array.from({ length: WAVE_FRAMES + 1 }, (_, f) => {
    const t = f / WAVE_FRAMES;
    const edge = Array.from({ length: WAVE_POINTS + 1 }, (_, i) => {
      const u = 1 - i / WAVE_POINTS; // right to left along the falling edge
      const start = Math.max(0, Math.min(1, lag(u))) * 0.38;
      const k = Math.max(0, Math.min(1, (t - start) / (1 - start)));
      const ripple = k > 0 && k < 1 ? (1 - t) * 16 * Math.sin(u * 46 + t * 18) : 0;
      const y = smooth(k) ** 1.1 * (h + 48) + ripple;
      return `${(u * w).toFixed(1)}px ${Math.max(0, y).toFixed(1)}px`;
    });
    return { offset: t, clipPath: `polygon(0px 0px, ${w.toFixed(1)}px 0px, ${edge.join(",")})` };
  });
}

/** Clip-path keyframes for the ink drop; equal point counts, so the browser interpolates them. */
function dropFrames(x: number, y: number, reach: number): Keyframe[] {
  return Array.from({ length: DROP_FRAMES + 1 }, (_, f) => {
    const t = f / DROP_FRAMES;
    const grow = 1 - (1 - t) ** 3; // bursts out, then settles
    const wobble = 0.16 * (1 - t) ** 1.6; // liquid at first, round at the end
    const radius = reach * 1.12 * grow;
    const pts = Array.from({ length: DROP_POINTS }, (_, i) => {
      const a = (i / DROP_POINTS) * Math.PI * 2;
      const w =
        wobble *
        (0.55 * Math.sin(3 * a + 6 * t) +
          0.3 * Math.sin(5 * a - 9 * t + 1.3) +
          0.15 * Math.sin(8 * a + 13 * t + 0.4));
      const r = radius * (1 + w);
      return `${(x + r * Math.cos(a)).toFixed(1)}px ${(y + r * Math.sin(a)).toFixed(1)}px`;
    });
    return { offset: t, clipPath: `polygon(${pts.join(",")})` };
  });
}

/** Swap the theme with a page transition from `from` (the control that was used). */
export function revealPage(
  effect: ThemeEffect,
  from: HTMLElement,
  swap: () => void,
  fadeMs: number,
) {
  if (reducedMotion()) {
    swap();
    return;
  }
  if (effect === "stream") {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    pourTheme(next, swap);
    return;
  }
  const canTransition = "startViewTransition" in document;
  if (effect === "wave" && !canTransition) {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    pourTheme(next, swap);
    return;
  }
  if (effect === "fade" || !canTransition) {
    if (effect === "fade") fadePage(fadeMs);
    swap();
    return;
  }
  // the reveal clips the root snapshot only; flatten every live / sticky element into it so the
  // water (or drop) passes over all of them, then let them have their own snapshots again
  const root = document.documentElement;
  root.classList.add("vt-flat");
  // the control that was pressed stays live above the reveal: its own water animation would
  // otherwise play unseen behind the old snapshot
  from.style.viewTransitionName = "em-theme-control";
  const transition = document.startViewTransition(swap);
  const restore = () => {
    root.classList.remove("vt-flat");
    from.style.viewTransitionName = "";
  };
  if (effect === "wave") {
    // the page swapped before the wave starts, so the main thread is free while it runs; and if
    // the visitor scrolls (or keys through the page) mid-wave, it finishes at once instead of
    // holding a still picture of the page
    const finish = () => {
      transition.skipTransition();
    };
    const keys = (e: KeyboardEvent) => {
      if (/^(Arrow|Page|Home|End| )/.test(e.key)) finish();
    };
    window.addEventListener("wheel", finish, { passive: true, once: true });
    window.addEventListener("touchmove", finish, { passive: true, once: true });
    window.addEventListener("keydown", keys);
    const unlisten = () => {
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchmove", finish);
      window.removeEventListener("keydown", keys);
      restore();
    };
    transition.ready
      .then(() => {
        root.animate(waveFrames(innerWidth, innerHeight), {
          duration: WAVE_MS,
          easing: "linear", // the frames carry their own easing
          pseudoElement: "::view-transition-new(root)",
        });
        // the old page darkens a little as the water comes over it
        root.animate([{ filter: "brightness(1)" }, { filter: "brightness(0.85)" }], {
          duration: WAVE_MS,
          easing: SKY_EASE,
          pseudoElement: "::view-transition-old(root)",
        });
      })
      .catch(() => undefined);
    transition.updateCallbackDone.catch(() => undefined);
    transition.finished.then(unlisten, unlisten);
    return;
  }
  const box = from.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  // far enough to cover the corner furthest from the button
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  if (effect === "drop") {
    transition.ready
      .then(() => {
        // the old page sinks toward the drop, not toward the middle of the screen
        root.style.setProperty("--vt-origin", `${String(x)}px ${String(y)}px`);
        root.animate(dropFrames(x, y, r), {
          duration: DROP_MS,
          easing: "linear", // the frames carry their own easing
          pseudoElement: "::view-transition-new(root)",
        });
        // the old page sinks back and dims under the spreading drop
        root.animate(
          [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(0.985)", filter: "brightness(0.8)" },
          ],
          { duration: DROP_MS, easing: SKY_EASE, pseudoElement: "::view-transition-old(root)" },
        );
      })
      .catch(() => undefined);
    transition.updateCallbackDone.catch(() => undefined);
    transition.finished.then(restore, restore);
    return;
  }
  const clipPath =
    effect === "circle"
      ? [
          `circle(0px at ${String(x)}px ${String(y)}px)`,
          `circle(${String(r)}px at ${String(x)}px ${String(y)}px)`,
        ]
      : ["inset(0 100% 0 0)", "inset(0 0 0 0)"];
  // On a long, busy page Chrome may give up capturing ("Transition was aborted because of timeout
  // in DOM update"). The theme has still swapped; only the reveal is skipped, so swallow the
  // rejections instead of surfacing them as unhandled errors.
  const skip = () => undefined;
  transition.updateCallbackDone.catch(skip);
  transition.finished.then(restore, restore);
  transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath },
        { duration: REVEAL_MS, easing: SKY_EASE, pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(skip);
}

const resolvedNow = (): ResolvedTheme => resolve(currentChoice(), osDark());

export function SunMoonThemeToggle({
  cookieDomain,
  effect = "wave",
  duration = 1740,
  size = 40,
  className,
  style,
}: {
  /** the app's NEXT_PUBLIC_/VITE_COOKIE_DOMAIN — unset on localhost */
  cookieDomain?: string;
  /** page transition when switching: growing circle from the button (default), wipe, or fade */
  effect?: ThemeEffect;
  duration?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  // server render can't see the cookie; the boot script already painted the right page colors
  const theme = useSyncExternalStore(subscribeTheme, resolvedNow, () => null);
  const moon = useRef<HTMLSpanElement>(null);
  const sun = useRef<HTMLSpanElement>(null);
  const night = useRef<HTMLSpanElement>(null);
  const day = useRef<HTMLSpanElement>(null);
  const flight = useRef<Animation[]>([]);
  const shown = useRef(theme);

  // animate on every change — this button's click or another app flipping the cookie
  useIsoLayoutEffect(() => {
    const before = shown.current;
    shown.current = theme;
    if (!before || !theme || before === theme) return;
    // toggling mid-flight = the running swap played backwards from where it is
    if (flight.current.length > 0) {
      for (const a of flight.current) a.reverse();
      return;
    }
    const [m, s] = [moon.current, sun.current];
    if (!m || !s || typeof m.animate !== "function" || reducedMotion()) return;
    const toLight = theme === "light";
    const pair = [
      (toLight ? m : s).animate(toLight ? FRAMES.moonSets : FRAMES.sunSets, {
        duration: duration * 0.65,
        fill: "both",
      }),
      (toLight ? s : m).animate(toLight ? FRAMES.sunRises : FRAMES.moonRises, {
        duration: duration * 0.64,
        delay: duration * 0.36,
        fill: "both",
      }),
    ];
    if (night.current && day.current) {
      const options = { duration, easing: SKY_EASE, fill: "both" as const };
      pair.push(
        night.current.animate(
          [{ opacity: toLight ? 1 : 0 }, { opacity: toLight ? 0 : 1 }],
          options,
        ),
        day.current.animate([{ opacity: toLight ? 0 : 1 }, { opacity: toLight ? 1 : 0 }], options),
      );
    }
    flight.current = pair;
    void Promise.all(pair.map((a) => a.finished)).then(
      () => {
        if (flight.current !== pair) return;
        flight.current = [];
        for (const a of pair) a.cancel();
      },
      () => undefined, // cancelled: unmounted mid-flight
    );
  }, [theme, duration]);

  useEffect(() => {
    const sky = night.current;
    if (!sky || reducedMotion() || typeof sky.animate !== "function") return;
    const twinkles = [...sky.querySelectorAll<HTMLElement>("[data-star]")].map((star, i) =>
      star.animate([{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }], {
        duration: STARS[i]?.t ?? 2400,
        delay: -i * 530,
        iterations: Infinity,
        easing: "ease-in-out",
      }),
    );
    const pending = flight;
    return () => {
      twinkles.forEach((a) => a.cancel());
      pending.current.forEach((a) => a.cancel());
    };
  }, []);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (!theme) return;
    const next = theme === "dark" ? "light" : "dark";
    revealPage(
      effect,
      event.currentTarget,
      () => {
        setThemeChoice(next, cookieDomain);
        // this tab wrote the cookie; nudge the store (cookieStore may not report our own write)
        window.dispatchEvent(new Event("focus"));
      },
      duration,
    );
  };

  const rest = (body: Body, visible: boolean): CSSProperties => ({
    transform: visible ? "none" : `translate(${String(body.side * ARC)}%, ${String(ARC)}%)`,
    opacity: theme && visible ? 1 : 0,
  });

  return (
    <button
      type="button"
      data-state={theme ?? undefined}
      aria-label={theme === "dark" ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
      className={cn(
        "relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-background text-foreground transition-[filter] hover:brightness-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      style={{ width: size, height: size, ...style }}
      onClick={toggle}
    >
      <span
        ref={night}
        aria-hidden
        className={SKY}
        style={{ background: "var(--em-sky-night)", opacity: theme === "dark" ? 1 : 0 }}
      >
        {STARS.map((star, i) => (
          <span
            key={i}
            data-star
            className="absolute rounded-full bg-[var(--em-ink-0)]"
            style={{
              left: `${String(star.x)}%`,
              top: `${String(star.y)}%`,
              width: star.r * 2,
              height: star.r * 2,
              opacity: 0.6,
            }}
          />
        ))}
      </span>
      <span
        ref={day}
        aria-hidden
        className={SKY}
        style={{ background: "var(--em-sky-day)", opacity: theme === "light" ? 1 : 0 }}
      />
      <span
        ref={moon}
        aria-hidden
        className={cn(BODY, "text-[var(--em-moon)] drop-shadow-[0_0_8px_var(--em-moon)]")}
        style={rest(MOON, theme === "dark")}
      >
        <Moon className="size-1/2" fill="currentColor" />
      </span>
      <span
        ref={sun}
        aria-hidden
        className={cn(BODY, "text-[var(--em-sun)] drop-shadow-[0_0_10px_var(--em-sun)]")}
        style={rest(SUN, theme === "light")}
      >
        <Sun className="size-1/2" />
      </span>
    </button>
  );
}
