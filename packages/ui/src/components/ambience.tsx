"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { CloudRain, Flower2, Orbit, Snowflake, Sparkles, X } from "lucide-react";
import {
  currentAmbience,
  osDark,
  currentChoice,
  resolve,
  seasonFor,
  subscribeTheme,
  type Ambience as AmbienceChoice,
  type Season,
} from "@empire/core/theme";
import { cn } from "../lib/cn";
import { AmbiencePicker } from "./ambience-picker";

/**
 * Portfolio-wide ambience: meteors at night, rain / frost / golden-shower petals by Thai season.
 * The choice is the shared `em-ambience` cookie, so every app shows the same sky.
 *
 * Cost: a fixed, pointer-events-none layer of ≤40 elements animating transform + opacity only
 * (compositor), `contain: strict` so it never triggers layout. Hidden tabs pause CSS animations
 * on their own; reduced motion renders nothing.
 */

const COUNT: Record<Season, number> = { space: 5, rain: 40, snow: 34, bloom: 18 };

// deterministic scatter: same markup on server and client
const at = (i: number, a: number, b: number) => (((i * a) % b) + b) % b;

/* live preview while the picker is open: the page sky follows the highlighted card, without
   writing the shared cookie until the user confirms */
let preview: AmbienceChoice | null = null;
const previewSubs = new Set<() => void>();
export function setAmbiencePreview(value: AmbienceChoice | null) {
  preview = value;
  previewSubs.forEach((notify) => notify());
}
const subscribePreview = (notify: () => void) => {
  previewSubs.add(notify);
  return () => previewSubs.delete(notify);
};

export function useAmbience(): { choice: AmbienceChoice; season: Season | null } {
  const saved = useSyncExternalStore(subscribeTheme, currentAmbience, () => "off" as const);
  const previewing = useSyncExternalStore(
    subscribePreview,
    () => preview,
    () => null,
  );
  const choice = previewing ?? saved;
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => resolve(currentChoice(), osDark()) === "dark",
    () => false,
  );
  // month read after mount so the server render never guesses a different season
  const [month, setMonth] = useState<number | null>(null);
  useEffect(() => setMonth(new Date().getMonth()), []);
  if (choice === "off" || month === null) return { choice, season: null };
  return { choice, season: choice === "auto" ? seasonFor(month, dark) : choice };
}

export function Ambience() {
  const { season } = useAmbience();
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    // no matchMedia (test DOMs, very old embedded browsers): stay off, as if motion were reduced
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window.matchMedia !== "function") return;
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const on = () => setReduced(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  if (!season || reduced) return null;

  return (
    <div aria-hidden className={cn("em-ambience", `em-ambience--${season}`)}>
      {Array.from({ length: COUNT[season] }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${String(at(i, 37, 100))}%`,
              "--y": `${String(at(i, 23, 60))}%`,
              "--d": `${String(at(i, 53, 97) / 10)}s`,
              "--t": `${String(season === "space" ? 7 + at(i, 3, 6) : 5 + at(i, 7, 9))}s`,
              "--s": String(0.55 + at(i, 13, 10) / 20),
            } as CSSProperties
          }
        >
          <i />
        </span>
      ))}
    </div>
  );
}

/** Meteors inside one dark band only (position: absolute), whatever the page-wide ambience. */
export function Meteors({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden className="em-ambience em-ambience--space em-ambience--local">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${String(40 + at(i, 29, 60))}%`,
              "--y": `${String(at(i, 31, 50))}%`,
              "--d": `${String(1 + at(i, 41, 70) / 10)}s`,
              "--t": `${String(6 + at(i, 5, 5))}s`,
              "--s": String(0.6 + at(i, 13, 10) / 25),
            } as CSSProperties
          }
        >
          <i />
        </span>
      ))}
    </div>
  );
}

export const LABEL: Record<AmbienceChoice, string> = {
  auto: "ตามฤดูกาล",
  space: "อวกาศ · ดาวตก",
  rain: "ฝน",
  snow: "หนาว",
  bloom: "ดอกคูน",
  off: "ปิด",
};
export const ICON = {
  auto: Sparkles,
  space: Orbit,
  rain: CloudRain,
  snow: Snowflake,
  bloom: Flower2,
  off: X,
};

/** Round button showing the current sky; opens the picker sheet. */
export function AmbienceButton({
  cookieDomain,
  className,
}: {
  cookieDomain?: string;
  className?: string;
}) {
  const saved = useSyncExternalStore(subscribeTheme, currentAmbience, () => "auto" as const);
  const [open, setOpen] = useState(false);
  const Icon = ICON[saved];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`พื้นหลัง: ${LABEL[saved]}`}
        aria-label={`เลือกพื้นหลัง (ตอนนี้: ${LABEL[saved]})`}
        aria-haspopup="dialog"
        className={cn(
          "inline-grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground transition-transform active:scale-90",
          className,
        )}
      >
        <Icon aria-hidden className="size-[18px]" />
      </button>
      {open && <AmbiencePicker cookieDomain={cookieDomain} onClose={() => setOpen(false)} />}
    </>
  );
}
