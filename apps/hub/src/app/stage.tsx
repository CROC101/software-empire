"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Sections within half a screen of the view stay live; the rest are put to sleep. */
const AWAKE = "50% 0px";

/**
 * One portfolio section that sleeps while it is away from the screen: it is unmounted, so its
 * DOM, canvases, WebGL contexts and animation loops are gone and their memory freed, and it
 * mounts fresh, with a short mist, when it comes back near. (Hiding it with <Activity> kept the
 * DOM, but WebGL parts lose their context on hide and came back blank.) The server renders every
 * section, so search engines and the first paint still get the whole page; nothing sleeps until
 * the page has loaded. While asleep the wrapper keeps the section's height (no scroll jump) and
 * borrows its id, so `#about` links still land.
 */
export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [awake, setAwake] = useState(true);
  const [sleep, setSleep] = useState<{ height: number; id?: string }>();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // the real height while awake; fonts, images and late content keep changing it
    let height = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      if (el.style.height === "") height = el.offsetHeight;
    });
    ro.observe(el);

    let isAwake = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry || entry.isIntersecting === isAwake) return;
        isAwake = entry.isIntersecting;
        if (isAwake) setFading(true);
        else setSleep({ height, id: el.querySelector("[id]")?.id });
        setAwake(isAwake);
      },
      { rootMargin: AWAKE },
    );
    // nothing sleeps before the page has finished loading, so every stored height is final
    let timer = 0;
    const start = () => {
      timer = window.setTimeout(() => io.observe(el), 1000);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      clearTimeout(timer);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      id={awake ? undefined : sleep?.id}
      style={awake ? undefined : { height: sleep?.height }}
      className={fading ? "em-stage-wake" : undefined}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setFading(false);
      }}
    >
      {awake && children}
    </div>
  );
}
