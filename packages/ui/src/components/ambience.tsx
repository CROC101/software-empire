"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  CloudRain,
  Droplets,
  Flame,
  Flower2,
  Ghost,
  Orbit,
  PartyPopper,
  Snowflake,
  Sparkles,
  TreePine,
  X,
} from "lucide-react";
import {
  currentAmbience,
  osDark,
  currentChoice,
  resolve,
  festivalFor,
  seasonFor,
  subscribeTheme,
  type Ambience as AmbienceChoice,
  type Season,
} from "@empire/core/theme";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";
import { AmbiencePicker } from "./ambience-picker";
import { DataRain } from "./data-rain";
import { HoarfrostPane } from "./hoarfrost-pane";

/**
 * Portfolio-wide ambience: meteors at night, rain / frost / golden-shower petals by Thai season.
 * The choice is the shared `em-ambience` cookie, so every app shows the same sky.
 *
 * Cost: a fixed, pointer-events-none layer of ≤40 elements animating transform + opacity only
 * (compositor), `contain: strict` so it never triggers layout. Hidden tabs pause CSS animations
 * on their own; reduced motion renders nothing.
 */

const COUNT: Record<Season, number> = {
  space: 5,
  rain: 40,
  snow: 34,
  bloom: 18,
  halloween: 12,
  loykrathong: 16,
  christmas: 34,
  newyear: 30,
  songkran: 28,
};

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

export function useAmbience(): {
  choice: AmbienceChoice;
  season: Season | null;
  dark: boolean;
} {
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
  // date read after mount so the server render never guesses a different season
  const [date, setDate] = useState<[number, number] | null>(null);
  useEffect(() => {
    const d = new Date();
    setDate([d.getMonth(), d.getDate()]);
  }, []);
  if (choice === "off" || date === null) return { choice, season: null, dark };
  if (choice !== "auto") return { choice, season: choice, dark };
  // a festival wins over the season, day or night
  return { choice, season: festivalFor(date[0], date[1]) ?? seasonFor(date[0], dark), dark };
}

// rain over a page: glowing light at night, deep ink by day (a pale page would swallow light)
const RAIN_DARK = ["--em-sky-500", "--em-blue-500", "--em-violet-400"] as const;
const RAIN_LIGHT = ["--em-blue-600", "--em-blue-700", "--em-violet-600"] as const;

/**
 * `rich` (the portfolio): the rainy season becomes DataRain over the whole page, parting round
 * the pointer, and winter (cool season, Christmas) frosts the whole page from the screen's edges
 * with HoarfrostPane, wipeable. Without it (the working apps), the light CSS particles only.
 */
export function Ambience({ rich = false }: { rich?: boolean }) {
  const { season, dark } = useAmbience();
  const rainColors = useTokenColors(dark ? RAIN_DARK : RAIN_LIGHT);
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
  if (rich && season === "rain") {
    const [calm = "", mid = "", hot = ""] = rainColors ?? [];
    return rainColors ? (
      <DataRain
        overlay
        tone={dark ? "dark" : "light"}
        count={dark ? 2600 : 1800}
        flowSpeed={1.15}
        obstacleRadius={58}
        palette={{ calm, mid, hot }}
      />
    ) : null;
  }
  const frost =
    rich && (season === "snow" || season === "christmas") ? (
      <HoarfrostPane overlay tone={dark ? "dark" : "light"} coverage={0.22} interactive />
    ) : null;

  return (
    <>
      {frost}
      <div aria-hidden className={cn("em-ambience", `em-ambience--${season}`)}>
        {Array.from({ length: COUNT[season] }, (_, i) => (
          <span
            key={i}
            style={
              {
                "--x": `${String(at(i, 37, 100))}%`,
                "--y": `${String(at(i, 23, 60))}%`,
                "--d": `${String(at(i, 53, 97) / 10)}s`,
                "--t": `${String(season === "space" || season === "halloween" ? 7 + at(i, 3, 6) : 5 + at(i, 7, 9))}s`,
                "--s": String(0.55 + at(i, 13, 10) / 20),
              } as CSSProperties
            }
          >
            <i />
          </span>
        ))}
      </div>
    </>
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
  halloween: "ฮาโลวีน",
  loykrathong: "ลอยกระทง",
  christmas: "คริสต์มาส",
  newyear: "ปีใหม่",
  songkran: "สงกรานต์",
  off: "ปิด",
};
export const ICON = {
  auto: Sparkles,
  space: Orbit,
  rain: CloudRain,
  snow: Snowflake,
  bloom: Flower2,
  halloween: Ghost,
  loykrathong: Flame,
  christmas: TreePine,
  newyear: PartyPopper,
  songkran: Droplets,
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
