"use client";

import { useEffect } from "react";

/**
 * Scroll spy: calls `onEnter(id)` when the element with that id crosses the `rootMargin` band.
 * Pages may swap a section for a new node (the hub's Stage unmounts far sections and remounts
 * them fresh), so the targets are found again whenever the DOM changes; watching the first nodes
 * only froze the spy after the first swap. `onEnter` must be stable (a state setter or useCallback).
 */
export function useSectionSpy(
  ids: readonly string[],
  rootMargin: string,
  onEnter: (id: string) => void,
) {
  const key = ids.join(" ");
  useEffect(() => {
    const list = key ? key.split(" ") : [];
    if (!list.length) return;
    const owner = new Map<Element, string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = owner.get(e.target);
          if (e.isIntersecting && id) onEnter(id);
        }
      },
      { rootMargin },
    );
    const attach = () => {
      for (const [el, id] of owner)
        if (!el.isConnected || el.id !== id) {
          io.unobserve(el);
          owner.delete(el);
        }
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && !owner.has(el)) {
          owner.set(el, id);
          io.observe(el);
        }
      }
    };
    attach();
    // shortcut: rescans every id on each DOM batch; cheap for a page's ~20 sections, revisit past hundreds
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [key, rootMargin, onEnter]);
}
