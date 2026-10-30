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

/**
 * The theme switch as water: a LiquidToggle (sun drop by day, moon drop by night) on the shared
 * `em-theme` cookie, so every app flips with it. The page changes with the same reveal as the
 * sun/moon button (water pouring down from the top by default).
 */
export function LiquidThemeToggle({
  cookieDomain,
  effect = "stream",
  size = 30,
  className,
}: {
  /** the app's NEXT_PUBLIC_/VITE_COOKIE_DOMAIN — unset on localhost */
  cookieDomain?: string;
  effect?: ThemeEffect;
  /** track height in px (width is 2.1×) */
  size?: number;
  className?: string;
}) {
  // server render can't see the cookie; until mount the switch shows light
  const theme = useSyncExternalStore(subscribeTheme, resolvedNow, () => null);
  const box = useRef<HTMLSpanElement>(null);
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
          const from = box.current;
          const swap = () => {
            setThemeChoice(on ? "dark" : "light", cookieDomain);
            // this tab wrote the cookie; nudge the store (cookieStore may not report our own write)
            window.dispatchEvent(new Event("focus"));
          };
          if (from) revealPage(effect, from, swap, 900);
          else swap();
        }}
      />
    </span>
  );
}
