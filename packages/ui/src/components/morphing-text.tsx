"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "../lib/cn";

const MORPH_S = 1.5;
const COOLDOWN_S = 0.5;

/**
 * Words melt into each other (blur + an SVG alpha threshold makes them look liquid).
 * Reduced motion: shows the first word, still. Screen readers get the whole list once.
 */
export function MorphingText({ texts, className }: { texts: string[]; className?: string }) {
  const filterId = useId().replace(/:/g, "");
  const [still, setStill] = useState(false);
  useEffect(() => {
    setStill(matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto h-16 w-full max-w-screen-md text-center text-[40pt] font-bold leading-none md:h-24 lg:text-[6rem]",
        className,
      )}
      style={{ filter: still ? undefined : `url(#${filterId}) blur(0.6px)` }}
    >
      <span className="sr-only">{texts.join(" · ")}</span>
      {still ? (
        <span aria-hidden className="absolute inset-x-0 top-0">
          {texts[0]}
        </span>
      ) : (
        <Morph texts={texts} />
      )}
      <svg aria-hidden className="hidden">
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function Morph({ texts }: { texts: string[] }) {
  const index = useRef(0);
  const morph = useRef(0);
  const cooldown = useRef(0);
  const a = useRef<HTMLSpanElement>(null);
  const b = useRef<HTMLSpanElement>(null);

  const paint = useCallback(
    (fraction: number) => {
      const [one, two] = [a.current, b.current];
      if (!one || !two) return;
      two.style.filter = `blur(${String(Math.min(8 / fraction - 8, 100))}px)`;
      two.style.opacity = `${String(fraction ** 0.4 * 100)}%`;
      const inverse = 1 - fraction;
      one.style.filter = `blur(${String(Math.min(8 / inverse - 8, 100))}px)`;
      one.style.opacity = `${String(inverse ** 0.4 * 100)}%`;
      one.textContent = texts[index.current % texts.length] ?? "";
      two.textContent = texts[(index.current + 1) % texts.length] ?? "";
    },
    [texts],
  );

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;
      cooldown.current -= dt;
      if (cooldown.current <= 0) {
        morph.current -= cooldown.current;
        cooldown.current = 0;
        let fraction = morph.current / MORPH_S;
        if (fraction > 1) {
          cooldown.current = COOLDOWN_S;
          fraction = 1;
        }
        paint(fraction);
        if (fraction === 1) index.current++;
      } else {
        morph.current = 0;
        const [one, two] = [a.current, b.current];
        if (one && two) {
          two.style.filter = "none";
          two.style.opacity = "100%";
          one.style.filter = "none";
          one.style.opacity = "0%";
        }
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paint]);

  return (
    <>
      <span aria-hidden ref={a} className="absolute inset-x-0 top-0 m-auto inline-block w-full" />
      <span aria-hidden ref={b} className="absolute inset-x-0 top-0 m-auto inline-block w-full" />
    </>
  );
}
