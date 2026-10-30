"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cn } from "../lib/cn";
import { reducedMotion } from "../lib/fade";

type Tile = { current: string; next: string; flipping: boolean; tick: number };
type Plan = {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
};

const CHARSETS = {
  alpha: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  numeric: "0123456789",
} as const;

const unit = (v: number | string) => (typeof v === "number" ? `${String(v)}px` : v);

/** Pads or trims a phrase to the board's width, placed left, right or centred. */
export function fitPhrase(
  phrase: string,
  width: number,
  align: "left" | "center" | "right" = "left",
) {
  const safe = phrase.slice(0, width);
  if (align === "right") return safe.padStart(width, " ");
  if (align === "center")
    return safe
      .padStart(safe.length + Math.floor((width - safe.length) / 2), " ")
      .padEnd(width, " ");
  return safe.padEnd(width, " ");
}

const tilesOf = (phrase: string): Tile[] =>
  Array.from(phrase, (ch) => ({ current: ch, next: ch, flipping: false, tick: 0 }));

const order = (
  i: number,
  width: number,
  cascade: "left" | "right" | "center" | "random",
  random: number[] | null,
) =>
  cascade === "right"
    ? width - 1 - i
    : cascade === "center"
      ? Math.floor(Math.abs(i - (width - 1) / 2))
      : cascade === "random" && random
        ? (random[i] ?? i)
        : i;

/**
 * A departure board: each tile flips through a few random glyphs and lands on the next phrase's
 * letter, cascading across the board, then holds and moves on. Meant for short Latin status
 * words (Thai is never set in mono or letter-spaced, so it does not belong here). The flaps are
 * CSS keyframes (transform / filter); a screen reader hears the phrase, not the glyphs.
 * Reduced motion: the board swaps whole phrases with no flipping.
 *
 * After React Bits' SplitFlapText (MIT): same mechanics and depth model. Left out: the
 * "minimal" tile style, glare, and the `text` prop (pass one phrase in `words`).
 */
export function SplitFlapText({
  words,
  flipDuration = 0.12,
  stagger = 0.06,
  cycleDelay = 2400,
  charset = "alphanumeric",
  flipsPerChar = 8,
  tileColor = "var(--em-ink-900)",
  textColor = "var(--em-ink-0)",
  tileRadius = 6,
  gap = 4,
  fontSize = 28,
  loop = true,
  padTo = 12,
  align = "left",
  intro = true,
  depth = 0.5,
  order: cascade = "left",
  className,
  style,
}: {
  words: readonly string[];
  /** s per flap */
  flipDuration?: number;
  /** s between tiles starting */
  stagger?: number;
  /** ms each phrase holds */
  cycleDelay?: number;
  charset?: keyof typeof CHARSETS | (string & {});
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  /** tiles on the board, so its width never changes */
  padTo?: number;
  align?: "left" | "center" | "right";
  /** start blank and flip to the first phrase */
  intro?: boolean;
  /** 0 flat … 1 deep hinge shadows */
  depth?: number;
  order?: "left" | "right" | "center" | "random";
  className?: string;
  style?: CSSProperties;
}) {
  const key = words.join("\u001f");
  const width = useMemo(
    () => Math.max(1, Math.ceil(padTo), ...key.split("\u001f").map((w) => w.length)),
    [key, padTo],
  );
  const phrases = useMemo(
    () => key.split("\u001f").map((w) => fitPhrase(w, width, align)),
    [key, width, align],
  );
  const glyphs =
    charset in CHARSETS
      ? CHARSETS[charset as keyof typeof CHARSETS]
      : charset || CHARSETS.alphanumeric;
  const timing = useRef({ flipMs: 120, staggerMs: 60, holdMs: 2400, flips: 8, glyphs, cascade });
  timing.current = {
    flipMs: Math.max(40, flipDuration * 1000),
    staggerMs: Math.max(0, stagger * 1000),
    holdMs: Math.max(400, cycleDelay),
    flips: Math.max(0, Math.floor(flipsPerChar)),
    glyphs,
    cascade,
  };

  const [tiles, setTiles] = useState(() => tilesOf(intro ? " ".repeat(width) : (phrases[0] ?? "")));
  const [active, setActive] = useState(0);
  const shown = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let raf = 0;
    const still = reducedMotion();
    shown.current ??= intro ? " ".repeat(width) : (phrases[0] ?? "");

    const animateTo = (target: string) => {
      const t = timing.current;
      const from = fitPhrase(shown.current ?? target, target.length);
      shown.current = target;
      cancelAnimationFrame(raf);
      const random =
        t.cascade === "random"
          ? Array.from({ length: target.length }, (_, i) => i).sort(() => Math.random() - 0.5)
          : null;
      const plans: Plan[] = [];
      if (!still) {
        for (let i = 0; i < target.length; i++) {
          const a = from[i] ?? " ";
          const b = target[i] ?? " ";
          if (a === b) continue;
          const sequence = Array.from(
            { length: t.flips },
            () => t.glyphs.charAt(Math.floor(Math.random() * t.glyphs.length)) || " ",
          );
          sequence.push(b);
          plans.push({
            index: i,
            from: a,
            target: b,
            sequence,
            start: order(i, target.length, t.cascade, random) * t.staggerMs,
            step: -1,
            done: false,
          });
        }
      }
      if (!plans.length) {
        setTiles(tilesOf(target));
        return 0;
      }
      setTiles(tilesOf(from));
      const total = Math.max(...plans.map((p) => p.start + p.sequence.length * t.flipMs));
      const began = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = now - began;
        const updates: { index: number; current: string; next: string; done: boolean }[] = [];
        let running = false;
        for (const p of plans) {
          const local = elapsed - p.start;
          if (local < 0) {
            running = true;
            continue;
          }
          const step = Math.floor(local / t.flipMs);
          if (step < p.sequence.length) {
            running = true;
            if (step !== p.step) {
              p.step = step;
              updates.push({
                index: p.index,
                current: step === 0 ? p.from : (p.sequence[step - 1] ?? p.target),
                next: p.sequence[step] ?? p.target,
                done: false,
              });
            }
          } else if (!p.done) {
            p.done = true;
            updates.push({ index: p.index, current: p.target, next: p.target, done: true });
          }
        }
        if (updates.length) {
          setTiles((prev) => {
            const out = [...prev];
            for (const u of updates) {
              const tile = out[u.index];
              if (tile)
                out[u.index] = {
                  current: u.current,
                  next: u.next,
                  flipping: !u.done,
                  tick: tile.tick + 1,
                };
            }
            return out;
          });
        }
        if (running) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return total;
    };

    let index = 0;
    const show = (i: number) => {
      index = i;
      setActive(i);
      return animateTo(phrases[i] ?? "");
    };
    const schedule = (wait: number) => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (document.hidden) {
          schedule(timing.current.holdMs);
          return;
        }
        const next = index + 1;
        if (next >= phrases.length && !loop) return;
        schedule(timing.current.holdMs + show(next % phrases.length));
      }, wait);
    };
    const first = show(0);
    if (phrases.length > 1) schedule(timing.current.holdMs + first);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [phrases, width, loop, intro]);

  const level = Math.min(1, Math.max(0, depth));
  const flat = Math.min(1, level * 2);
  const deep = Math.max(0, level - 0.5) * 2;
  const r = (v: number) => Number(v.toFixed(3));
  const vars = {
    "--split-flap-tile-color": tileColor,
    "--split-flap-text-color": textColor,
    "--split-flap-radius": unit(tileRadius),
    "--split-flap-gap": unit(gap),
    "--split-flap-font-size": unit(fontSize),
    "--split-flap-flip-duration": `${String(Math.max(0.04, flipDuration))}s`,
    "--split-flap-front-from": r(1 + 0.08 * flat),
    "--split-flap-front-to": r(1 - 0.48 * flat - 0.3 * deep),
    "--split-flap-back-from": r(1 - 0.42 * flat - 0.3 * deep),
    "--split-flap-hinge": `calc(1px + ${String(r(deep * 0.05))}em)`,
    "--split-flap-hinge-shade": r(0.25 + 0.39 * flat + 0.21 * deep),
    "--split-flap-drop": r(0.28 * flat + 0.2 * deep),
    "--split-flap-lift": r(0.4 + 0.6 * flat + 0.7 * deep),
    "--split-flap-cast": r(deep * 0.62),
    "--split-flap-edge": `${String(r(deep * 0.035))}em`,
    ...style,
  } as CSSProperties;
  const label = (words[active] ?? words[0] ?? "").trim();

  return (
    <div className={cn("split-flap-text", className)} style={vars}>
      <span className="sr-only">{label}</span>
      {tiles.map((tile, i) => (
        <span
          className={cn("split-flap-text__tile", tile.flipping && "is-flipping")}
          aria-hidden
          key={`${String(i)}-${String(tiles.length)}`}
        >
          <span className="split-flap-text__half split-flap-text__half--top">
            <span className="split-flap-text__char">
              {tile.flipping ? tile.next : tile.current}
            </span>
          </span>
          <span className="split-flap-text__half split-flap-text__half--bottom">
            <span className="split-flap-text__char">{tile.current}</span>
          </span>
          {tile.flipping && (
            <>
              {deep > 0 && (
                <>
                  <span
                    className="split-flap-text__shade split-flap-text__shade--top"
                    key={`st-${String(tile.tick)}`}
                  />
                  <span
                    className="split-flap-text__shade split-flap-text__shade--bottom"
                    key={`sb-${String(tile.tick)}`}
                  />
                </>
              )}
              <span
                className="split-flap-text__flap split-flap-text__flap--front"
                key={`f-${String(tile.tick)}`}
              >
                <span className="split-flap-text__char">{tile.current}</span>
              </span>
              <span
                className="split-flap-text__flap split-flap-text__flap--back"
                key={`b-${String(tile.tick)}`}
              >
                <span className="split-flap-text__char">{tile.next}</span>
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}
