"use client";

import { useRef, useSyncExternalStore } from "react";
import {
  currentChoice,
  osDark,
  resolve,
  setThemeChoice,
  subscribeTheme,
  type ResolvedTheme,
} from "@empire/core/theme";
import { LiquidToggle, NimbusToggleIcons } from "./liquid-toggle";
import { revealPage, type ThemeEffect } from "./sun-moon-theme-toggle";

const resolvedNow = (): ResolvedTheme => resolve(currentChoice(), osDark());
// the drop has nearly crossed the track by now (90ms lag, then the spring)
const DROP_LEAD_MS = 280;

/**
 * The theme switch as water: a LiquidToggle (sun drop by day, moon drop by night) on the shared
 * `em-theme` cookie, so every app flips with it. The page changes with the same reveal as the
 * sun/moon button (the theme follows a wave of water down the page by default).
 */
export function LiquidThemeToggle({
  cookieDomain,
  effect = "wave",
  size = 30,
  initial,
  className,
}: {
  /** The theme the server read from the cookie, so the first paint is already right. */
  initial?: ResolvedTheme;
  /** the app's NEXT_PUBLIC_/VITE_COOKIE_DOMAIN — unset on localhost */
  cookieDomain?: string;
  effect?: ThemeEffect;
  /** track height in px (width is 2.1×) */
  size?: number;
  className?: string;
}) {
  // the server passes the cookie's theme as `initial`; with none ("system") it starts light
  const theme = useSyncExternalStore(subscribeTheme, resolvedNow, () => initial ?? null);
  const box = useRef<HTMLSpanElement>(null);
  const lead = useRef<number | undefined>(undefined);
  const dark = theme === "dark";
  return (
    <span ref={box} className={className} style={{ display: "inline-flex" }}>
      <LiquidToggle
        size={size}
        tone={dark ? "dark" : "light"}
        checked={dark}
        icons={{ off: NimbusToggleIcons.sun, on: NimbusToggleIcons.moon }}
        label={dark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
        onCheckedChange={(on) => {
          clearTimeout(lead.current);
          // flipped back before the page moved: nothing to change
          if (on === dark) return;
          const from = box.current;
          const swap = () => {
            setThemeChoice(on ? "dark" : "light", cookieDomain);
            // this tab wrote the cookie; nudge the store (cookieStore may not report our own write)
            window.dispatchEvent(new Event("focus"));
          };
          // the drop crosses the track first, then the page follows it, so the snapshot the wave
          // pours over already shows the drop where it landed
          const wait = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : DROP_LEAD_MS;
          lead.current = window.setTimeout(() => {
            if (from) revealPage(effect, from, swap, 900);
            else swap();
          }, wait);
        }}
      />
    </span>
  );
}
