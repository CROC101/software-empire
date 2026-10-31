"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/cn";

type Rgba = [number, number, number, number];

const EASINGS = {
  linear: (t: number) => t,
  smooth: (t: number) => 0.5 - Math.cos(Math.PI * t) / 2,
  snappy: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
};
const FALLOFF = [0, 0.2, 0.4, 0.6, 0.8, 1];
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

let paint: CanvasRenderingContext2D | null = null;

// any CSS colour (tokens, oklch included) to rgba: paint one pixel and read it back, because
// the canvas parser keeps oklch() as text and its numbers are not r, g, b
const parseColor = (value: string): Rgba | null => {
  paint ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!paint) return null;
  paint.clearRect(0, 0, 1, 1);
  paint.fillStyle = "#000000";
  paint.fillStyle = value;
  paint.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 255] = paint.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
};

// mixes in linear light so the band does not go muddy between the two colours
const blend = (from: Rgba, to: Rgba, amount: number) => {
  const ch = (a: number, b: number) =>
    Math.round(((a / 255) ** 2.2 * (1 - amount) + (b / 255) ** 2.2 * amount) ** (1 / 2.2) * 255);
  const alpha = from[3] * (1 - amount) + to[3] * amount;
  if (alpha <= 0) return "rgba(0, 0, 0, 0)";
  const weigh = (a: number, b: number) =>
    Math.round((a * from[3] * (1 - amount) + b * to[3] * amount) / alpha);
  const mix = from[3] === to[3] ? ch : weigh;
  return `rgba(${String(mix(from[0], to[0]))}, ${String(mix(from[1], to[1]))}, ${String(mix(from[2], to[2]))}, ${String(Math.round(alpha * 1000) / 1000)})`;
};

type Phase = "idle" | "sweep" | "wait" | "follow";

/**
 * A band of light that sweeps across text (loop, on hover, or once in view), painted as a
 * background-clipped gradient so it costs one style write per frame. Colours accept tokens
 * (`var(--em-…)` resolved through `color`). Stops when off screen; reduced motion: no loop.
 *
 * After React Bits' ShinyText (MIT): the same sweep, bands, glow, yoyo, pointer following and
 * pause on hover. Left out: the `disabled` prop (render plain text instead) and the `text` prop
 * (children only).
 */
export function ShinyText({
  children,
  color = "var(--em-ink-400)",
  shineColor = "var(--em-ink-0)",
  speed = 2,
  delay = 0,
  angle = 120,
  shineWidth = 40,
  softness = 0.8,
  bands = 1,
  glow = 0,
  direction = "left",
  easing = "smooth",
  trigger = "loop",
  yoyo = false,
  followPointer = false,
  pauseOnHover = false,
  className,
  style,
}: {
  children: ReactNode;
  /** base text colour; any CSS colour or token */
  color?: string;
  shineColor?: string;
  /** seconds per sweep */
  speed?: number;
  /** seconds between sweeps */
  delay?: number;
  angle?: number;
  /** % of the text */
  shineWidth?: number;
  softness?: number;
  bands?: number;
  glow?: number;
  direction?: "left" | "right";
  easing?: keyof typeof EASINGS;
  trigger?: "loop" | "hover" | "view";
  yoyo?: boolean;
  followPointer?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const s = {
    color,
    shineColor,
    speed: Math.max(0.1, speed),
    delay: Math.max(0, delay),
    angle,
    shineWidth: clamp(shineWidth, 2, 200),
    softness: clamp(softness, 0, 1),
    bands: clamp(Math.round(bands), 1, 3),
    glow: clamp(glow, 0, 1),
    sign: direction === "right" ? 1 : -1,
    ease: EASINGS[easing],
    trigger,
    yoyo,
    followPointer,
    pauseOnHover,
  };
  const settings = useRef(s);
  const sync = useRef<(() => void) | null>(null);
  useEffect(() => {
    settings.current = s;
    sync.current?.();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const st = {
      pos: null as number | null,
      vel: 0,
      phase: "idle" as Phase,
      from: 0,
      to: 0,
      start: 0,
      duration: 1,
      resume: 0,
      flip: false,
      inside: false,
      target: 0,
      visible: true,
      seen: false,
      colors: "",
    };
    let base: Rgba | null = null;
    let shine: Rgba | null = null;
    let clear: Rgba | null = null;
    let raf = 0;
    let timer = 0;
    let last = 0;
    let alive = true;

    const extent = () =>
      settings.current.shineWidth / 2 +
      (settings.current.bands - 1) * settings.current.shineWidth * 1.3 +
      2;
    const entry = () => (settings.current.sign > 0 ? -extent() : 100 + extent());
    const exit = () => (settings.current.sign > 0 ? 100 + extent() : -extent());
    const nearest = () => (st.target < 50 ? -extent() : 100 + extent());

    const gradient = (pos: number, fill: Rgba, light: Rgba) => {
      const c = settings.current;
      const half = c.shineWidth / 2;
      const core = half * (1 - c.softness);
      const fade = half - core;
      const stops: [number, number][] = [];
      for (let band = 0; band < c.bands; band++) {
        const center = pos - c.sign * band * c.shineWidth * 1.3;
        const strength = 1 - band * 0.28;
        for (const side of [-1, 1]) {
          for (const f of FALLOFF)
            stops.push([center + side * (core + fade * (1 - f)), f * f * (3 - 2 * f) * strength]);
        }
      }
      stops.sort((a, b) => a[0] - b[0]);
      const list = stops.map(([at, amount]) => `${blend(fill, light, amount)} ${at.toFixed(2)}%`);
      const edge = blend(fill, light, 0);
      return `linear-gradient(${String(c.angle)}deg, ${edge} 0%, ${list.join(", ")}, ${edge} 100%)`;
    };

    const draw = () => {
      const c = settings.current;
      const key = `${c.color}|${c.shineColor}`;
      if (key !== st.colors) {
        st.colors = key;
        // resolve tokens against the element, so var(--em-…) works in the canvas parser
        root.style.color = c.color;
        base = parseColor(getComputedStyle(root).color);
        root.style.color = c.shineColor;
        shine = parseColor(getComputedStyle(root).color);
        root.style.color = "";
        clear = shine ? [shine[0], shine[1], shine[2], 0] : null;
      }
      if (!base || !shine || st.pos === null) {
        root.style.backgroundImage = `linear-gradient(${c.color}, ${c.color})`;
        if (glowRef.current) glowRef.current.style.backgroundImage = "none";
        return;
      }
      root.style.backgroundImage = gradient(st.pos, base, shine);
      if (glowRef.current && clear) {
        glowRef.current.style.backgroundImage = gradient(st.pos, clear, shine);
        glowRef.current.style.opacity = String(c.glow);
      }
    };

    const sweep = (from: number, to: number, now: number) => {
      const span = Math.abs(exit() - entry()) || 1;
      st.phase = "sweep";
      st.from = from;
      st.to = to;
      st.start = now;
      st.duration = settings.current.speed * 1000 * Math.max(0.15, Math.abs(to - from) / span);
    };

    const wake = () => {
      if (raf || !alive) return;
      window.clearTimeout(timer);
      timer = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const c = settings.current;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (c.followPointer && st.inside) {
        st.pos ??= nearest();
        const k = 220;
        st.vel += ((st.target - st.pos) * k - st.vel * 2 * Math.sqrt(k)) * dt;
        st.pos += st.vel * dt;
        st.phase = "follow";
        draw();
        raf = requestAnimationFrame(tick);
        return;
      }
      if (st.phase === "follow") {
        st.vel = 0;
        sweep(st.pos ?? nearest(), nearest(), now);
      }
      if (st.phase === "sweep") {
        if (c.pauseOnHover && st.inside) {
          st.start += dt * 1000;
          raf = requestAnimationFrame(tick);
          return;
        }
        const t = clamp((now - st.start) / st.duration, 0, 1);
        st.pos = st.from + (st.to - st.from) * c.ease(t);
        draw();
        if (t < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        if (c.trigger !== "loop" || reduce) {
          st.phase = "idle";
          st.pos = null;
          draw();
          return;
        }
        st.phase = "wait";
        st.resume = now + c.delay * 1000;
      }
      if (st.phase === "wait") {
        if (!st.visible) return;
        if (now < st.resume) {
          timer = window.setTimeout(wake, st.resume - now);
          return;
        }
        if (c.yoyo) {
          st.flip = !st.flip;
          sweep(st.flip ? exit() : entry(), st.flip ? entry() : exit(), now);
        } else sweep(entry(), exit(), now);
        raf = requestAnimationFrame(tick);
        return;
      }
      if (st.phase === "idle" && c.trigger === "loop" && !reduce && st.visible) {
        st.flip = false;
        sweep(entry(), exit(), now);
        raf = requestAnimationFrame(tick);
      }
    };

    // where the pointer is along the band's travel, in %
    const locate = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const rad = (settings.current.angle * Math.PI) / 180;
      const dx = Math.sin(rad);
      const dy = -Math.cos(rad);
      const length = Math.abs(rect.width * dx) + Math.abs(rect.height * dy) || 1;
      const along =
        (e.clientX - rect.left - rect.width / 2) * dx +
        (e.clientY - rect.top - rect.height / 2) * dy;
      return 50 + (along / length) * 100;
    };
    const onEnter = (e: PointerEvent) => {
      const c = settings.current;
      st.inside = true;
      st.target = locate(e);
      if (c.followPointer) st.pos ??= nearest();
      else if (c.trigger === "hover" && st.phase === "idle" && !reduce)
        sweep(entry(), exit(), performance.now());
      wake();
    };
    const onMove = (e: PointerEvent) => {
      st.target = locate(e);
      if (settings.current.followPointer) wake();
    };
    const onLeave = () => {
      st.inside = false;
      wake();
    };

    const io = new IntersectionObserver((entries) => {
      st.visible = entries.some((x) => x.isIntersecting);
      if (!st.visible) return;
      if (settings.current.trigger === "view" && !st.seen && !reduce) {
        st.seen = true;
        sweep(entry(), exit(), performance.now());
      }
      wake();
    });
    io.observe(root);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    sync.current = () => {
      if (settings.current.trigger !== "loop" && st.phase === "wait") {
        st.phase = "idle";
        st.pos = null;
      }
      draw();
      wake();
    };
    draw();
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      io.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      sync.current = null;
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className={cn("shiny-text", className)}
      style={{ backgroundImage: `linear-gradient(${color}, ${color})`, ...style }}
    >
      {children}
      {glow > 0 && (
        <span ref={glowRef} className="shiny-text__glow" aria-hidden>
          {children}
        </span>
      )}
    </span>
  );
}
