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
 * How the page changes theme. "circle" and "wipe" use the View Transitions API: the browser
 * snapshots the old page and reveals the new one through a growing clip-path, on the compositor.
 * Without that API (or with reduced motion) the swap is instant; "fade" cross-fades colours.
 */
export type ThemeEffect = "circle" | "wipe" | "fade";

const REVEAL_MS = 560;

function revealPage(effect: ThemeEffect, from: HTMLElement, swap: () => void, fadeMs: number) {
  if (reducedMotion()) {
    swap();
    return;
  }
  if (effect === "fade" || !("startViewTransition" in document)) {
    if (effect === "fade") fadePage(fadeMs);
    swap();
    return;
  }
  const transition = document.startViewTransition(swap);
  const box = from.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  // far enough to cover the corner furthest from the button
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const clipPath =
    effect === "circle"
      ? [
          `circle(0px at ${String(x)}px ${String(y)}px)`,
          `circle(${String(r)}px at ${String(x)}px ${String(y)}px)`,
        ]
      : ["inset(0 100% 0 0)", "inset(0 0 0 0)"];
  void transition.ready.then(() =>
    document.documentElement.animate(
      { clipPath },
      { duration: REVEAL_MS, easing: SKY_EASE, pseudoElement: "::view-transition-new(root)" },
    ),
  );
}

const resolvedNow = (): ResolvedTheme => resolve(currentChoice(), osDark());

export function SunMoonThemeToggle({
  cookieDomain,
  effect = "circle",
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
