"use client";

import { useEffect } from "react";
import { arm, playFade, reducedMotion, staggerDelay, type FadeEffect } from "../lib/fade";

// a block that is mostly a heading comes into focus; pictures develop; everything else rises
const HEADING = ":scope > :is(h1, h2, h3), :scope > * > :is(h1, h2)";
const MEDIA = "img, picture, video, canvas, figure";

const presetFor = (el: HTMLElement): FadeEffect => {
  const own = el.dataset.fade as FadeEffect | undefined;
  if (own) return own;
  if (/^H[1-3]$/.test(el.tagName) || el.querySelector(HEADING)) return "focus";
  if (el.matches(MEDIA)) return "develop";
  return "tide";
};

// lists and grids of several items play item by item
const isRun = (el: HTMLElement) =>
  el.children.length >= 3 && (/^(UL|OL)$/.test(el.tagName) || el.classList.contains("grid"));

/**
 * Page-wide reveal, mounted once. Every direct child of an element marked `data-tide` comes into
 * view the first time it reaches the screen, with a preset chosen for what it is (lib/fade.ts):
 * a heading block comes into focus, a picture develops from grey, a list or grid rises item by
 * item, anything else rises out of the water. `data-fade="mist"` (or any preset) on a child
 * overrides the choice. Siblings follow 90ms apart, list items 70ms.
 *
 * Calm on purpose: once per element, driven by time, not by the scroll, so nothing lags behind
 * the finger, tilts or drifts while reading. One IntersectionObserver; the animations run on the
 * compositor (opacity / transform / filter) and are cleared when they land. Whatever is already
 * on screen at load is left alone; children move, never the marked element, so anchors land
 * exactly. Reduced motion: off.
 */
export function TideReveal() {
  useEffect(() => {
    if (reducedMotion()) return;
    const plan = new Map<Element, () => void>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          plan.get(e.target)?.();
          plan.delete(e.target);
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
        const delay = Math.min(i++, 4) * 90;
        if (isRun(el)) {
          const items = Array.from(el.children).filter(
            (c): c is HTMLElement => c instanceof HTMLElement,
          );
          items.forEach(arm);
          armed.push(...items);
          plan.set(el, () => {
            items.forEach((item, k) => {
              void playFade(item, presetFor(item), {
                delay: delay + staggerDelay(Math.min(k, 8), Math.min(items.length, 9), 70, "start"),
              });
            });
          });
        } else {
          arm(el);
          armed.push(el);
          plan.set(el, () => void playFade(el, presetFor(el), { delay }));
        }
        io.observe(el);
      }
    }
    return () => {
      io.disconnect();
      for (const el of armed) {
        for (const a of el.getAnimations()) a.cancel();
        el.classList.remove("fade-armed");
      }
    };
  }, []);
  return null;
}
