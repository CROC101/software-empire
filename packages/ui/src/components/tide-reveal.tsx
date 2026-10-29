"use client";

import { useEffect } from "react";

/**
 * Page-wide reveal, mounted once. Every direct child of an element marked `data-tide` rises into
 * view the first time it reaches the screen: a soft water line sweeps up through it while it
 * settles 14px and fades in, like the tide coming in over the page. Siblings follow 90ms apart.
 *
 * Calm on purpose: it plays once per element and is driven by time, not by the scroll, so nothing
 * lags behind the finger, tilts or drifts while reading. One IntersectionObserver, CSS
 * transitions only (see `.tide-*` in styles.css). Whatever is already on screen at load is left
 * alone; children move, never the marked element, so anchors land exactly. Reduced motion: off.
 */
export function TideReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("tide-in");
          // the mask is only needed while the water rises (without @property it just stays full)
          const done = (ev: TransitionEvent) => {
            if (ev.target !== el || ev.propertyName !== "--tide") return;
            el.classList.add("tide-done");
            el.removeEventListener("transitionend", done);
          };
          el.addEventListener("transitionend", done);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    const vh = window.innerHeight;
    const armed: HTMLElement[] = [];
    for (const group of document.querySelectorAll<HTMLElement>("[data-tide]")) {
      let i = 0;
      for (const el of group.children) {
        if (!(el instanceof HTMLElement) || el.getBoundingClientRect().top < vh) continue;
        el.style.setProperty("--tide-delay", `${String(Math.min(i++, 4) * 90)}ms`);
        el.classList.add("tide-armed");
        armed.push(el);
        io.observe(el);
      }
    }
    return () => {
      io.disconnect();
      for (const el of armed) el.classList.remove("tide-armed", "tide-in", "tide-done");
    };
  }, []);
  return null;
}
