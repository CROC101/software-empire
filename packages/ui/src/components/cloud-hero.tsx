"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { graphemes } from "../lib/graphemes";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";
import { CloudSky } from "./cloud-sky";

/** One word whose letters come out of a blur one after another, tinted like water, then settle white. */
export function BlurWord({ word }: { word: string }) {
  return (
    <span key={word} aria-hidden className="vt-live inline-block whitespace-nowrap">
      {graphemes(word).map((g, i) => (
        <span
          // the word is fixed for this render, so the index is a stable key
          key={i}
          className="em-blur-in inline-block whitespace-pre"
          style={{ animationDelay: `${String(i * 45)}ms` }}
        >
          {g}
        </span>
      ))}
    </span>
  );
}

export type CloudHeroStat = { value: ReactNode; label: string };

/**
 * A full-height hero over a sky of drifting clouds (a moonlit night in the dark theme): eyebrow,
 * a big headline, a line under it whose last word swaps every few seconds (letters come out of a blur),
 * the actions, and true numbers along the bottom. Layout after the 21st.dev hero-section
 * (cloud-hero-original in the design registry); the sky is CloudSky.
 */
export function CloudHero({
  eyebrow,
  title,
  lead,
  words,
  children,
  stats = [],
  seconds = 2.5,
  className,
}: {
  eyebrow?: ReactNode;
  /** The headline. */
  title: ReactNode;
  /** Text in front of the changing word, on the line under the headline. */
  lead?: ReactNode;
  /** The words that take turns at the end of the headline. */
  words: readonly string[];
  /** Actions under the headline. */
  children?: ReactNode;
  stats?: readonly CloudHeroStat[];
  /** Seconds each word stays. */
  seconds?: number;
  className?: string;
}) {
  const still = useReducedMotionAfterMount();
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (still || words.length < 2) return;
    const id = setInterval(() => setAt((n) => (n + 1) % words.length), seconds * 1000);
    return () => clearInterval(id);
  }, [still, words.length, seconds]);

  return (
    <CloudSky
      className={cn(
        "flex min-h-[calc(100svh-4rem)] flex-col justify-center text-(--em-ink-0)",
        className,
      )}
    >
      {/* the text side stays readable whatever cloud passes behind it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-(--em-blue-950)/65 via-(--em-blue-950)/25 to-transparent dark:from-(--em-ink-975)/80 dark:via-(--em-ink-975)/35"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-(--em-blue-950)/45 dark:to-(--em-ink-975)/70"
      />
      {/* a quiet survey grid, eight rows by twelve columns */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_bottom,color-mix(in_oklab,var(--em-ink-0)_12%,transparent)_1px,transparent_1px),linear-gradient(to_right,color-mix(in_oklab,var(--em-ink-0)_12%,transparent)_1px,transparent_1px)] [background-size:100%_12.5%,8.333%_100%]"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-40 pt-24 sm:px-6 lg:pb-44 lg:pt-28">
        <div className="max-w-3xl lg:max-w-[62%]">
          {eyebrow ? (
            <p className="mb-8 flex items-center gap-3 text-sm text-(--em-ink-0)/75">
              <span aria-hidden className="h-px w-8 bg-(--em-ink-0)/40" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-sans text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[1.05]">
            {title}
          </h1>
          {/* the changing line sits under the headline at its own size, so a long word never reflows it */}
          <p className="mt-4 min-h-[1.2em] font-sans text-[clamp(1.5rem,3.2vw,2.75rem)] font-black leading-tight">
            {lead}
            {lead ? " " : null}
            <span className="sr-only">{words.join(", ")}</span>
            <BlurWord word={words[at] ?? ""} />
          </p>
          {children ? <div className="mt-10 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </div>

      {stats.length ? (
        <dl className="absolute inset-x-0 bottom-10 mx-auto flex w-full max-w-6xl flex-wrap items-start gap-x-10 gap-y-4 px-4 sm:px-6 lg:gap-x-20">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse gap-1">
              <dt className="text-xs text-(--em-ink-0)/70">{s.label}</dt>
              <dd className="font-heading text-3xl font-bold tabular-nums lg:text-4xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </CloudSky>
  );
}
