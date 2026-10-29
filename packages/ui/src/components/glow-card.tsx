"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Glow card: a frosted card whose border lights up where the pointer is, with a soft spotlight
 * inside. One pointer listener per card writes four custom properties (no re-render); the glow is
 * a fixed-attachment gradient, so neighbouring cards light up as one sweep. `hue` sets the base
 * colour and the hue drifts with the pointer across the screen. Styles: `.glow-card` in styles.css.
 *
 * After "Spotlight Card" (21st.dev): CSS moved out of a per-render <style>, `touch-action: none`
 * dropped (it blocked page scrolling on phones), radius and backdrop from our tokens.
 */
export function GlowCard({
  children,
  hue = 220,
  spread = 120,
  className,
}: {
  children: React.ReactNode;
  /** Base hue, degrees (oklch-ish: 250 blue, 290 violet, 175 teal, 30 coral). */
  hue?: number;
  /** How far the hue drifts as the pointer crosses the screen, degrees. */
  spread?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = (e: PointerEvent) => {
      el.style.setProperty("--x", e.clientX.toFixed(1));
      el.style.setProperty("--y", e.clientY.toFixed(1));
      el.style.setProperty("--xp", (e.clientX / window.innerWidth).toFixed(3));
    };
    document.addEventListener("pointermove", sync, { passive: true });
    return () => {
      document.removeEventListener("pointermove", sync);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("glow-card", className)}
      style={{ "--base": hue, "--spread": spread } as React.CSSProperties}
    >
      <div aria-hidden className="glow-card__outer" />
      {children}
    </div>
  );
}
