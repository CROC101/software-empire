"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";

/**
 * Blueprint reveal: a word drawn as a hairline outline with guide lines and registration ticks.
 * Move the pointer (or drag a finger) and an organic ink blot reveals the solid letters under
 * it; the ink dries away by itself. A coordinate readout follows the pointer.
 *
 * Our own build after "Blueprint Ink Reveal" (21st.dev). One canvas; the outline is drawn once
 * per resize into a cached layer, the loop only runs while there is wet ink.
 */
export function BlueprintReveal({ word, className }: { word: string; className?: string }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const readoutRef = React.useRef<HTMLSpanElement>(null);
  const colors = useTokenColors(["--em-ink-400", "--em-blue-500", "--em-ink-600"]);
  const [st] = React.useState(() => ({
    W: 0,
    H: 0,
    dpr: 1,
    outline: null as HTMLCanvasElement | null,
    solid: null as HTMLCanvasElement | null,
    ink: null as HTMLCanvasElement | null,
    mix: null as HTMLCanvasElement | null, // scratch: solid letters masked by the ink
    raf: 0,
    wetUntil: 0,
    reduced: false,
  }));

  const layer = React.useCallback(() => {
    const c = document.createElement("canvas");
    c.width = Math.round(st.W * st.dpr);
    c.height = Math.round(st.H * st.dpr);
    const g = c.getContext("2d");
    g?.scale(st.dpr, st.dpr);
    return [c, g] as const;
  }, [st]);

  /** Draw the word into `g`, sized to the box; returns where it landed. */
  const setWord = React.useCallback(
    (g: CanvasRenderingContext2D) => {
      const family = getComputedStyle(document.body).fontFamily || "sans-serif";
      g.font = `900 100px ${family}`;
      const w = g.measureText(word).width || 1;
      const size = Math.min(st.H * 0.62, ((st.W * 0.86) / w) * 100);
      g.font = `900 ${String(size)}px ${family}`;
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      const m = g.measureText(word);
      const base = st.H / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      return {
        size,
        base,
        left: st.W / 2 - m.width / 2,
        right: st.W / 2 + m.width / 2,
        cap: base - m.actualBoundingBoxAscent,
      };
    },
    [st, word],
  );

  const build = React.useCallback(() => {
    if (!colors || !st.W) return;
    const [line = "#9ca3af", fill = "#3b82f6", faint = "#4b5563"] = colors;
    const [outline, g] = layer();
    const [solid, s] = layer();
    if (!g || !s) return;
    const box = setWord(g);
    setWord(s);
    // guides: baseline and cap height across the sheet, ticks along them
    g.strokeStyle = faint;
    g.lineWidth = 1;
    for (const y of [box.base, box.cap]) {
      g.beginPath();
      g.moveTo(0, Math.round(y) + 0.5);
      g.lineTo(st.W, Math.round(y) + 0.5);
      g.stroke();
      for (let x = box.left; x <= box.right; x += 24) {
        g.beginPath();
        g.moveTo(Math.round(x) + 0.5, y - 4);
        g.lineTo(Math.round(x) + 0.5, y + 4);
        g.stroke();
      }
    }
    // registration crosses at the word's corners
    g.strokeStyle = line;
    for (const [x, y] of [
      [box.left - 18, box.cap - 18],
      [box.right + 18, box.cap - 18],
      [box.left - 18, box.base + 18],
      [box.right + 18, box.base + 18],
    ] as const) {
      g.beginPath();
      g.moveTo(x - 7, y);
      g.lineTo(x + 7, y);
      g.moveTo(x, y - 7);
      g.lineTo(x, y + 7);
      g.stroke();
      g.beginPath();
      g.arc(x, y, 3.5, 0, Math.PI * 2);
      g.stroke();
    }
    g.lineWidth = 1;
    g.strokeStyle = line;
    g.strokeText(word, st.W / 2, box.base);
    s.fillStyle = fill;
    s.fillText(word, st.W / 2, box.base);
    st.outline = outline;
    st.solid = solid;
    if (!st.ink) st.ink = layer()[0];
  }, [st, colors, layer, setWord, word]);

  const draw = React.useCallback(() => {
    st.raf = 0;
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    const ink = st.ink?.getContext("2d");
    if (!canvas || !g || !st.outline || !st.solid || !st.ink || !ink) return;
    // the ink dries: fade the mask a little every frame
    if (!st.reduced) {
      ink.setTransform(1, 0, 0, 1, 0, 0);
      ink.globalCompositeOperation = "destination-out";
      ink.fillStyle = "rgba(0,0,0,0.03)";
      ink.fillRect(0, 0, st.ink.width, st.ink.height);
      ink.globalCompositeOperation = "source-over";
      ink.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(st.outline, 0, 0);
    // solid letters, only where the ink is
    if (!st.mix || st.mix.width !== canvas.width || st.mix.height !== canvas.height) {
      st.mix = document.createElement("canvas");
      st.mix.width = canvas.width;
      st.mix.height = canvas.height;
    }
    const mg = st.mix.getContext("2d");
    if (mg) {
      mg.globalCompositeOperation = "copy";
      mg.drawImage(st.solid, 0, 0);
      mg.globalCompositeOperation = "destination-in";
      mg.drawImage(st.ink, 0, 0);
      g.drawImage(st.mix, 0, 0);
    }
    if (!st.reduced && performance.now() < st.wetUntil) st.raf = requestAnimationFrame(draw);
  }, [st]);

  React.useEffect(() => {
    st.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ro = new ResizeObserver(() => {
      st.W = box.clientWidth;
      st.H = box.clientHeight;
      st.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(st.W * st.dpr);
      canvas.height = Math.round(st.H * st.dpr);
      st.ink = null;
      build();
      draw();
    });
    ro.observe(box);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, [st, build, draw]);

  React.useEffect(() => {
    build();
    draw();
  }, [build, draw]);

  const blot = (e: React.PointerEvent) => {
    const r = boxRef.current?.getBoundingClientRect();
    const ink = st.ink?.getContext("2d");
    if (!r || !ink) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (readoutRef.current)
      readoutRef.current.textContent = `X: ${String(Math.round(x))}  Y: ${String(Math.round(y))}`;
    // an organic blot: a handful of soft circles scattered around the pointer
    const base = Math.max(26, st.H * 0.16);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * base * 0.6;
      const rad = base * (0.35 + Math.random() * 0.5);
      const cx = x + Math.cos(a) * d;
      const cy = y + Math.sin(a) * d;
      const grad = ink.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.75, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ink.fillStyle = grad;
      ink.beginPath();
      ink.arc(cx, cy, rad, 0, Math.PI * 2);
      ink.fill();
    }
    st.wetUntil = performance.now() + 2600;
    if (!st.raf) st.raf = requestAnimationFrame(draw);
  };

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={word}
      className={cn("relative h-48 w-full touch-pan-y select-none sm:h-64", className)}
      onPointerMove={blot}
      onPointerDown={blot}
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
      <span
        ref={readoutRef}
        aria-hidden
        className="absolute right-0 top-0 font-mono text-[10px] tracking-[0.2em] text-[var(--em-ink-500)]"
      >
        X: 0 Y: 0
      </span>
    </div>
  );
}
