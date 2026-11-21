"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { graphemes } from "../lib/graphemes";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";
import { BlurWord, type CloudHeroStat } from "./cloud-hero";
import { CloudSky } from "./cloud-sky";

/** Pointer offset (--hx / --hy, -1..1) times `x` / `y` pixels: each layer moves its own distance. */
const drift = (x: number, y: number): CSSProperties => ({
  transform: `translate3d(calc(var(--hx, 0) * ${String(x)}px), calc(var(--hy, 0) * ${String(y)}px), 0)`,
});

/**
 * The CloudSky WebGL clouds and a full-bleed night film blended into one sky: the film is screened
 * over the clouds (its black drops out, its light stays) and tinted to the crocwork blue, a flash of
 * lightning crosses the clouds now and then, and the sky, the film and the text drift apart under
 * the pointer. The headline comes out of a blur letter by letter, the last word of the line under it
 * swaps every few seconds, and true numbers sit along the bottom. Film and layout after the 21st.dev
 * hero-section (cloud-hero-original in the design registry). Reduced motion: one still frame, the
 * film paused, nothing drifts.
 */
export function StormHero({
  eyebrow,
  lines,
  lead,
  words,
  children,
  stats = [],
  video,
  seconds = 2.5,
  className,
}: {
  eyebrow?: ReactNode;
  /** The headline, one string per line; each comes out of a blur letter by letter. */
  lines: readonly string[];
  /** Text in front of the changing word, on the line under the headline. */
  lead?: ReactNode;
  /** The words that take turns at the end of the line under the headline. */
  words: readonly string[];
  /** Actions under the headline. */
  children?: ReactNode;
  stats?: readonly CloudHeroStat[];
  /** A muted looping film (mp4) screened over the clouds: light on black works best. */
  video?: string;
  /** Seconds each word stays. */
  seconds?: number;
  className?: string;
}) {
  const still = useReducedMotionAfterMount();
  const [at, setAt] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (still || words.length < 2) return;
    const id = setInterval(() => setAt((n) => (n + 1) % words.length), seconds * 1000);
    return () => clearInterval(id);
  }, [still, words.length, seconds]);

  // the film plays only while the hero is on screen
  useEffect(() => {
    const film = filmRef.current;
    if (!film) return;
    if (still) {
      film.pause();
      return;
    }
    const seen = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) film.play().catch(() => undefined);
      else film.pause();
    });
    seen.observe(film);
    return () => seen.disconnect();
  }, [still, video]);

  // pointer parallax: write two CSS variables once a frame, the layers turn them into transforms
  useEffect(() => {
    const root = rootRef.current;
    if (!root || still || matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    const set = (x: number, y: number) => {
      root.style.setProperty("--hx", x.toFixed(3));
      root.style.setProperty("--hy", y.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      set(0, 0);
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [still]);

  const layer = "pointer-events-none absolute transition-transform duration-700 ease-out";
  // where each line's first letter sits in the whole headline, so the blur runs on across lines
  const starts = lines.map((_, row) =>
    lines.slice(0, row).reduce((n, l) => n + graphemes(l).length, 0),
  );

  return (
    <section
      ref={rootRef}
      className={cn(
        "relative isolate flex min-h-svh flex-col justify-center overflow-hidden bg-(--em-ink-975) text-(--em-ink-0)",
        className,
      )}
    >
      <div aria-hidden className={cn(layer, "-inset-[3%]")} style={drift(-12, -8)}>
        <CloudSky className="size-full" />
      </div>
      {video ? (
        <div aria-hidden className={cn(layer, "-inset-[6%]")} style={drift(-30, -18)}>
          <video
            ref={filmRef}
            src={video}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            className="vt-live size-full object-cover object-[70%_center] opacity-60 mix-blend-screen md:opacity-90 [filter:hue-rotate(-110deg)_saturate(1.2)]"
          />
        </div>
      ) : null}
      {/* lightning somewhere in the clouds, top right, every few seconds */}
      <div
        aria-hidden
        className="em-storm-flash vt-live pointer-events-none absolute inset-0 mix-blend-screen [background:radial-gradient(60%_50%_at_72%_18%,color-mix(in_oklab,var(--em-blue-100)_70%,transparent),transparent)]"
      />
      {/* the text side stays readable whatever passes behind it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-(--em-blue-950)/75 via-(--em-blue-950)/30 to-transparent dark:from-(--em-ink-975)/85 dark:via-(--em-ink-975)/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-(--em-ink-975)/30 via-transparent to-(--em-ink-975)/80"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_bottom,color-mix(in_oklab,var(--em-ink-0)_12%,transparent)_1px,transparent_1px),linear-gradient(to_right,color-mix(in_oklab,var(--em-ink-0)_12%,transparent)_1px,transparent_1px)] [background-size:100%_12.5%,8.333%_100%]"
      />

      <div
        className="relative mx-auto w-full max-w-7xl px-4 pb-44 pt-24 transition-transform duration-700 ease-out sm:px-6 lg:pt-28"
        style={drift(8, 5)}
      >
        {eyebrow ? (
          <p className="mb-8 flex items-center gap-3 text-sm text-(--em-ink-0)/75">
            <span aria-hidden className="h-px w-10 bg-(--em-blue-300)" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-[14ch] font-sans text-[clamp(3rem,9vw,8.5rem)] font-black leading-[0.95] drop-shadow-[0_2px_24px_color-mix(in_oklab,var(--em-ink-975)_55%,transparent)]">
          <span className="sr-only">{lines.join(" ")}</span>
          {lines.map((line, row) => (
            <span key={row} aria-hidden className="vt-live block">
              {graphemes(line).map((g, i) => (
                <span
                  // the headline is fixed for this render, so the index is a stable key
                  key={i}
                  className="em-blur-in inline-block whitespace-pre"
                  style={{ animationDelay: `${String(120 + ((starts[row] ?? 0) + i) * 38)}ms` }}
                >
                  {g}
                </span>
              ))}
            </span>
          ))}
        </h1>
        {/* the changing line has its own size, so a long word never reflows the headline */}
        <p className="mt-6 min-h-[1.2em] font-sans text-[clamp(1.5rem,3.4vw,3rem)] font-black leading-tight text-(--em-blue-200)">
          {lead}
          {lead ? " " : null}
          <span className="sr-only">{words.join(", ")}</span>
          <span className="text-(--em-ink-0)">
            <BlurWord word={words[at] ?? ""} />
          </span>
        </p>
        {children ? <div className="mt-10 flex flex-wrap gap-3">{children}</div> : null}
      </div>

      {stats.length ? (
        <dl className="absolute inset-x-0 bottom-8 mx-auto grid w-full max-w-7xl grid-cols-3 gap-4 px-4 sm:px-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col-reverse gap-1 border-t border-(--em-ink-0)/25 pt-3"
            >
              <dt className="text-xs text-(--em-ink-0)/70">{s.label}</dt>
              <dd className="font-heading text-3xl font-bold tabular-nums sm:text-4xl lg:text-5xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
