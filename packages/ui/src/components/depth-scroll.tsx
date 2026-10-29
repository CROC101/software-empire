"use client";

import { useEffect } from "react";

/**
 * Page-wide depth on scroll, the calm cousin of the "One-person" parallax header. Mount it once.
 * Every direct child of an element marked `data-depth` rises out of the page as it enters: a
 * little lower, tilted back in 3D, slightly smaller and faint, settling flat as it reaches the
 * reading line; on the way out it drifts up and back a touch. Each child follows its own
 * position, so rows arrive one after another without timers.
 *
 * One passive scroll listener and one rAF loop for the whole page; values ease toward their
 * target (a soft follow, never a hijacked scroll). Transforms and opacity only. Children are
 * moved, never the marked element, so anchors (#id) and the nav land where they should.
 * Reduced motion: does nothing. Pinned (sticky) scenes must not be marked.
 */
export function DepthScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    type Item = { el: HTMLElement; top: number; h: number; e: number; x: number };
    let items: Item[] = [];
    let vh = window.innerHeight;
    let small = window.innerWidth < 640;
    let raf = 0;

    // layout position, ignoring our own transforms (offsetTop does not see them)
    const docTop = (el: HTMLElement) => {
      let y = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
        y += n.offsetTop;
      }
      return y;
    };
    const measure = () => {
      vh = window.innerHeight;
      small = window.innerWidth < 640;
      const els = [...document.querySelectorAll<HTMLElement>("[data-depth] > *")];
      const prev = new Map(items.map((it) => [it.el, it]));
      items = els.map((el) => {
        const old = prev.get(el);
        return { el, top: docTop(el), h: el.offsetHeight, e: old?.e ?? -1, x: old?.x ?? -1 };
      });
      kick();
    };

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const frame = () => {
      raf = 0;
      const y = window.scrollY;
      const lift = small ? 36 : 56; // px it rises from
      const tilt = small ? 6 : 9; // deg it leans back
      let moving = false;
      for (const it of items) {
        const rel = it.top - y; // its top, from the top of the screen
        // in: from the bottom edge up to 72% of the screen; out: its bottom from 30% to 0
        const tIn = clamp((vh - rel) / (vh * 0.28));
        const tOut = clamp((vh * 0.3 - (rel + it.h)) / (vh * 0.3));
        const eIn = 1 - (1 - tIn) ** 3;
        // first frame (or far away): jump, so nothing flies in on load
        const far = rel > vh * 1.5 || rel + it.h < -vh * 0.5;
        it.e = it.e < 0 || far ? eIn : it.e + (eIn - it.e) * 0.16;
        it.x = it.x < 0 || far ? tOut : it.x + (tOut - it.x) * 0.16;
        if (Math.abs(eIn - it.e) > 0.001 || Math.abs(tOut - it.x) > 0.001) moving = true;
        const k = 1 - it.e;
        if (k < 0.001 && it.x < 0.001) {
          if (it.el.style.transform) {
            it.el.style.transform = "";
            it.el.style.opacity = "";
          }
          continue;
        }
        it.el.style.transform =
          `perspective(1400px) translate3d(0, ${(k * lift - it.x * 28).toFixed(1)}px, 0) ` +
          `rotateX(${(k * tilt).toFixed(2)}deg) scale(${(1 - k * 0.04 - it.x * 0.025).toFixed(4)})`;
        it.el.style.opacity = (1 - k * 0.7 - it.x * 0.25).toFixed(3);
      }
      if (moving) kick();
    };
    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    let resizeT = 0;
    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(measure, 120);
    };
    // sections grow as images, fonts and lazy scenes load: re-measure when the page does
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize);
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeT);
      if (raf) cancelAnimationFrame(raf);
      for (const it of items) {
        it.el.style.transform = "";
        it.el.style.opacity = "";
      }
    };
  }, []);
  return null;
}
