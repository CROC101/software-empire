"use client";

import { useEffect } from "react";

/**
 * A reload or the back button lands where the page was. The browser's own restore runs before the
 * library's cards exist, so it stops at the top; this keeps scrolling as the page grows (up to 4 s)
 * and gives up the moment the person scrolls or types themselves. A fresh link still opens at the top.
 */
export function ScrollKeeper() {
  useEffect(() => {
    const key = `croc-scroll:${location.pathname}`;
    const save = () => {
      try {
        sessionStorage.setItem(key, String(Math.round(scrollY)));
      } catch {
        // storage blocked: nothing kept
      }
    };
    addEventListener("pagehide", save);

    const nav = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    let target = 0;
    try {
      target = Number(sessionStorage.getItem(key)) || 0;
    } catch {
      target = 0;
    }
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      for (const t of ["wheel", "touchstart", "keydown", "pointerdown"])
        removeEventListener(t, stop);
    };
    if (target > 0 && (nav?.type === "reload" || nav?.type === "back_forward")) {
      const until = performance.now() + 4000;
      const step = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        scrollTo({ top: Math.min(target, max), behavior: "instant" });
        if (max >= target || performance.now() > until) stop();
        else raf = requestAnimationFrame(step);
      };
      for (const t of ["wheel", "touchstart", "keydown", "pointerdown"])
        addEventListener(t, stop, { passive: true });
      raf = requestAnimationFrame(step);
    }
    return () => {
      stop();
      removeEventListener("pagehide", save);
    };
  }, []);
  return null;
}
