"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { useEffect, useRef } from "react";

const ramp = " .:-=+*#%@";

/**
 * The word drawn in typewriter characters: it is painted once to a hidden canvas, sampled into a
 * grid, and each cell picks a character by how much ink it holds. A slow wave shimmers through it.
 */
export default function GlyphText({
  text = "CROC",
  cols = 72,
  wave = 0.6,
}: {
  text?: string;
  cols?: number;
  wave?: number;
}) {
  const pre = useRef<HTMLPreElement>(null);
  const still = useReducedMotionAfterMount();

  useEffect(() => {
    const el = pre.current;
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!el || !ctx) return;
    const rows = Math.round(cols * 0.28);
    // a cell is about twice as tall as wide in a mono font, so sample 2:1
    cv.width = cols;
    cv.height = rows * 2;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fs = cv.height * 0.9;
    ctx.font = `900 ${String(fs)}px ${getComputedStyle(el).getPropertyValue("--glyph-font")}`;
    const w = ctx.measureText(text).width;
    if (w > cols * 0.95) fs *= (cols * 0.95) / w;
    ctx.font = `900 ${String(fs)}px ${getComputedStyle(el).getPropertyValue("--glyph-font")}`;
    ctx.fillText(text, cols / 2, cv.height / 2);
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const ink = (x: number, y: number) =>
      ((data[(y * 2 * cols + x) * 4 + 3] ?? 0) + (data[((y * 2 + 1) * cols + x) * 4 + 3] ?? 0)) /
      510;

    let raf = 0;
    let last = 0;
    let on = true;
    const draw = (t: number) => {
      if (t - last > 60) {
        last = t;
        let out = "";
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const v = ink(x, y);
            const s = still ? 0 : Math.sin(t / 400 - x * 0.25 + y * 0.4) * wave * 0.3;
            out +=
              v < 0.05
                ? " "
                : (ramp[
                    Math.min(ramp.length - 1, Math.max(1, Math.round((v + s) * (ramp.length - 1))))
                  ] ?? "@");
          }
          out += "\n";
        }
        el.textContent = out;
      }
      if (on && !still) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      on = Boolean(e?.isIntersecting);
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(draw);
    });
    io.observe(el);
    draw(performance.now());
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, cols, wave, still]);

  return (
    <div className="grid size-full min-h-56 place-items-center overflow-hidden bg-(--em-ink-975) p-4">
      <pre
        ref={pre}
        role="img"
        aria-label={text}
        className="font-mono text-[clamp(5px,1.1vw,11px)] leading-[1.05] text-(--em-blue-300) [--glyph-font:var(--font-heading)]"
      />
    </div>
  );
}
