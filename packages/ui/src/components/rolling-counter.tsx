"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { osReducedMotion } from "@empire/core/theme";
import { reducedMotion } from "../lib/fade";

type Slot = { key: string; digit: number; text?: undefined } | { key: string; text: string };
type Item = { pos: number; vel: number; target: number; wait: number; el: HTMLElement | null };

const mod = (v: number, b: number) => ((v % b) + b) % b;
// where numeral n sits relative to the window, in strip heights (-5..4)
const wrap = (offset: number) => mod(offset + 5, 10) - 5;
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Steps from digit `a` to `b` going `way` (shortest when the value did not move up or down). */
export function stepBetween(a: number, b: number, way: "up" | "down" | "shortest") {
  const up = mod(b - a, 10);
  if (way === "up") return up;
  if (way === "down") return up === 0 ? 0 : up - 10;
  return up > 5 ? up - 10 : up;
}

function slotsOf(format: Intl.NumberFormat, value: number): Slot[] {
  const parts = format.formatToParts(value);
  let place = 0;
  for (const p of parts) if (p.type === "integer") place += p.value.length;
  let fraction = 0;
  let other = 0;
  const slots: Slot[] = [];
  for (const p of parts) {
    if (p.type === "integer" || p.type === "fraction") {
      for (const ch of p.value) {
        const key = p.type === "integer" ? `i${String(--place)}` : `f${String(fraction++)}`;
        slots.push({ key, digit: Math.max(0, DIGITS.indexOf(ch)) });
      }
    } else {
      // separators keyed by the place they follow, so they stay put as digits roll
      const key = p.type === "group" ? `g${String(place)}` : `s${String(other++)}-${p.type}`;
      slots.push({ key, text: p.value });
    }
  }
  return slots;
}

/**
 * A number whose digits roll like a meter: each digit is a strip of 0–9 on a damped spring, a
 * change ripples in from the right, and the first time it scrolls into view every digit spins
 * once and lands. Used for numbers the admin edits in the CMS, so a new value counts itself in.
 *
 * After React Bits' Counter (MIT): same motion, without the per-digit SVG motion-blur filter
 * (a main-thread filter per frame) and with only the props this site uses. The server HTML
 * already shows the real number; reduced motion jumps straight to it.
 */
export function RollingCounter({
  value,
  locale = "th-TH",
  format,
  prefix,
  suffix,
  duration = 0.7,
  bounce = 0.2,
  stagger = 0.04,
  intro = true,
  lite = true,
  className,
}: {
  value: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** seconds a roll takes, roughly */
  duration?: number;
  /** overshoot, 0–0.9 */
  bounce?: number;
  /** seconds between neighbouring digits */
  stagger?: number;
  intro?: boolean;
  /** false keeps rolling in LITE mode (the device's own reduced-motion setting still wins) */
  lite?: boolean;
  className?: string;
}) {
  const still = lite ? reducedMotion : osReducedMotion;
  const formatter = React.useMemo(
    () => new Intl.NumberFormat(locale, { ...format, numberingSystem: "latn" }),
    [locale, JSON.stringify(format ?? {})],
  );
  const slots = React.useMemo(() => slotsOf(formatter, value), [formatter, value]);
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const engine = React.useRef({
    items: new Map<string, Item>(),
    value,
    raf: 0,
    last: 0,
    tune: { duration, bounce, stagger },
  });
  engine.current.tune = { duration, bounce, stagger };

  const paint = (item: Item) => {
    if (!item.el) return;
    item.el.querySelectorAll<HTMLElement>("[data-n]").forEach((n, i) => {
      n.style.transform = `translateY(${(wrap(i - item.pos) * 100).toFixed(2)}%)`;
    });
  };

  const kick = React.useCallback(() => {
    const e = engine.current;
    if (e.raf) return;
    e.last = performance.now();
    const frame = (now: number) => {
      e.raf = 0;
      const { duration: d, bounce: b } = e.tune;
      const omega = (2 * Math.PI) / Math.max(0.05, d);
      const zeta = 1 - Math.min(0.9, Math.max(0, b));
      const left = Math.min(0.05, (now - e.last) / 1000);
      e.last = now;
      let busy = false;
      for (const item of e.items.values()) {
        let t = left;
        if (item.wait > 0) {
          const used = Math.min(item.wait, t);
          item.wait -= used;
          t -= used;
        }
        // fixed small steps keep the spring stable at any frame rate
        const steps = Math.ceil(t * 240);
        for (let s = 0; s < steps; s++) {
          const dt = t / steps;
          item.vel +=
            (-omega * omega * (item.pos - item.target) - 2 * zeta * omega * item.vel) * dt;
          item.pos += item.vel * dt;
        }
        if (
          item.wait <= 0 &&
          Math.abs(item.pos - item.target) < 0.002 &&
          Math.abs(item.vel) < 0.02
        ) {
          item.target = mod(Math.round(item.target), 10);
          item.pos = item.target;
          item.vel = 0;
        } else busy = true;
        paint(item);
      }
      if (busy) e.raf = requestAnimationFrame(frame);
    };
    e.raf = requestAnimationFrame(frame);
  }, []);

  // a new value: each digit rolls the way the number moved, rightmost first
  React.useLayoutEffect(() => {
    const e = engine.current;
    const previous = e.value;
    e.value = value;
    const way =
      Math.abs(value) > Math.abs(previous)
        ? "up"
        : Math.abs(value) < Math.abs(previous)
          ? "down"
          : "shortest";
    const live = new Set<string>();
    const moving: { item: Item; rank: number }[] = [];
    slots.forEach((slot, rank) => {
      if (slot.text !== undefined) return;
      live.add(slot.key);
      let item = e.items.get(slot.key);
      if (!item) {
        item = { pos: slot.digit, vel: 0, target: slot.digit, wait: 0, el: null };
        e.items.set(slot.key, item);
        if (previous === value) return;
        item.pos = item.target = 0;
      }
      const step = stepBetween(mod(Math.round(item.target), 10), slot.digit, way);
      if (step !== 0) {
        item.target += step;
        moving.push({ item, rank });
      }
    });
    for (const key of e.items.keys()) if (!live.has(key)) e.items.delete(key);
    rootRef.current?.querySelectorAll<HTMLElement>("[data-slot]").forEach((el) => {
      const item = e.items.get(el.dataset.slot ?? "");
      if (item) item.el = el;
    });
    if (still()) {
      for (const item of e.items.values()) {
        item.target = mod(Math.round(item.target), 10);
        item.pos = item.target;
        paint(item);
      }
      return;
    }
    moving
      .sort((a, b) => b.rank - a.rank)
      .forEach(({ item }, order) => {
        item.wait = order * e.tune.stagger;
      });
    if (moving.length) kick();
  }, [slots, value, kick, still]);

  // first time on screen: every digit spins once and lands, left to right
  React.useEffect(() => {
    const root = rootRef.current;
    if (!intro || !root || still()) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((x) => x.isIntersecting)) return;
        io.disconnect();
        let order = 0;
        for (const item of engine.current.items.values()) {
          item.target += 10;
          item.wait = order++ * engine.current.tune.stagger;
        }
        kick();
      },
      { threshold: 0.5 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, [intro, kick, still]);

  React.useEffect(() => () => cancelAnimationFrame(engine.current.raf), []);

  return (
    <span ref={rootRef} className={cn("rc", className)}>
      <span className="sr-only">{formatter.format(value)}</span>
      <span className="rc-row" aria-hidden>
        {prefix != null && <span className="rc-affix">{prefix}</span>}
        {slots.map((slot) =>
          slot.text !== undefined ? (
            <span key={slot.key}>{slot.text}</span>
          ) : (
            <span key={slot.key} className="rc-digit" data-slot={slot.key}>
              <span className="rc-sizer">{slot.digit}</span>
              <span className="rc-window">
                {DIGITS.map((d, n) => (
                  <span
                    key={d}
                    data-n=""
                    className="rc-numeral"
                    style={{ transform: `translateY(${String(wrap(n - slot.digit) * 100)}%)` }}
                  >
                    {d}
                  </span>
                ))}
              </span>
            </span>
          ),
        )}
        {suffix != null && <span className="rc-affix">{suffix}</span>}
      </span>
    </span>
  );
}
