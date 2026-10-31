"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import {
  arm,
  playFade,
  reducedMotion,
  staggerDelay,
  type FadeEffect,
  type StaggerFrom,
} from "../lib/fade";

/**
 * Fades its content in when it scrolls into view (or on mount), with one of the site's presets:
 * `tide` (rises out of the water, the default), `focus` (blur to sharp, for headings), `develop`
 * (grey to colour, for pictures), `mist` (slow drift out of a haze) or `fade`. `stagger` plays
 * each direct child in turn.
 *
 * After React Bits' FadeContent (MIT): its props and presets, rebuilt on the Web Animations API
 * (lib/fade.ts) so it adds no dependency and runs on the compositor. Left out: scrub, exit and
 * disappearAfter (scroll-linked motion made people dizzy here; see the crocwork-design skill).
 * Content already on screen at load is left alone unless `trigger="mount"`; reduced motion: none.
 */
export function FadeContent({
  children,
  effect = "tide",
  blur = false,
  duration,
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  stagger = 0,
  staggerFrom = "start",
  trigger = "scroll",
  once = true,
  onStart,
  onComplete,
  className,
  style,
}: {
  children: React.ReactNode;
  effect?: FadeEffect;
  /** Extra blur to start from, in px; `true` adds 10px. */
  blur?: boolean | number;
  /** ms; the preset's own length when left out. */
  duration?: number;
  /** ms */
  delay?: number;
  /** How far into the view (0–1 of its height) the content must come before it plays. */
  threshold?: number;
  initialOpacity?: number;
  /** ms between direct children; 0 plays the whole block at once. */
  stagger?: number;
  staggerFrom?: StaggerFrom;
  trigger?: "scroll" | "mount";
  /** false: it hides again when it goes back below the view, and plays again. */
  once?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const calls = React.useRef({ onStart, onComplete });
  React.useLayoutEffect(() => {
    calls.current = { onStart, onComplete };
  });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const targets =
      stagger > 0 && el.children.length
        ? Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
        : [el];
    // anything already on screen stays put when it scrolls in; only `mount` fades it in
    if (trigger === "scroll" && el.getBoundingClientRect().top < window.innerHeight) return;
    const b = blur === true ? 10 : Math.max(0, Number(blur) || 0);
    const from = Math.min(1, Math.max(0, initialOpacity));
    const play = () => {
      calls.current.onStart?.();
      void Promise.all(
        targets.map((t, i) =>
          playFade(t, effect, {
            delay: delay + staggerDelay(i, targets.length, stagger, staggerFrom),
            duration,
            blur: b,
            from,
          }),
        ),
      ).then(() => calls.current.onComplete?.());
    };
    targets.forEach(arm);
    if (trigger === "mount") {
      play();
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting) {
          if (once) io.disconnect();
          play();
        } else if (!once && e.boundingClientRect.top > 0) {
          // gone back below the view: hide again, ready to play on the way down
          for (const t of targets) {
            for (const a of t.getAnimations()) a.cancel();
            arm(t);
          }
        }
      },
      {
        rootMargin: `0px 0px -${String(Math.round(Math.min(Math.max(threshold, 0), 1) * 100))}% 0px`,
      },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      for (const t of targets) {
        for (const a of t.getAnimations()) a.cancel();
        t.classList.remove("fade-armed");
      }
    };
  }, [
    effect,
    blur,
    duration,
    delay,
    threshold,
    initialOpacity,
    stagger,
    staggerFrom,
    trigger,
    once,
  ]);

  return (
    <div ref={ref} className={cn(className)} style={style}>
      {children}
    </div>
  );
}
