"use client";

import {
  CountUp,
  RotatingText,
  SeasonTree,
  ShinyText,
  type TreeFruit,
  type TreeSeason,
} from "@empire/ui";

const ROLES = [
  "Product Manager",
  "Tech Lead",
  "AI Engineer",
  "UX Designer",
  "DBA",
  "คนเดียวทั้งหมด",
];

const FRUITS: TreeFruit[] = [
  { id: "community", label: "Community", href: "#community" },
  { id: "commerce", label: "Commerce", href: "#commerce" },
  { id: "toolboxes", label: "Toolboxes", href: "#toolboxes" },
  { id: "tarot", label: "Tarot", href: "#tarot" },
  { id: "design", label: "Design", href: "#design" },
  { id: "canva", label: "Canvas", href: "#canva" },
  { id: "stream", label: "Stream", href: "#stream" },
];

// the hub's water-menu glass, written out so the part needs no app stylesheet
const glass =
  "border border-(--foreground)/10 bg-(--background)/80 shadow-[inset_0_1px_0_color-mix(in_oklab,white_55%,transparent),0_10px_30px_-14px_color-mix(in_oklab,var(--em-blue-700)_35%,transparent)] backdrop-blur-md";

/**
 * เผ่าน้ำ (Water Tribe): the crocwork hub hero before the cloud sky. A glass chip with a glint on
 * the name, a heavy Thai headline whose last line counts up in water blue over a hand-drawn
 * underline, a glass tank where team roles rise one after another, and SeasonTree on the right:
 * a tree by the water whose fruit are the systems, its season following the calendar.
 */
export default function WaterTribeHero({
  line1 = "ระบบที่ผมสร้าง",
  line2 = "ทำงานได้จริง",
  count = 7,
  season = "theme",
}: {
  line1?: string;
  line2?: string;
  count?: number;
  /** "theme" = spring by day, a starry night in the dark theme */
  season?: TreeSeason | "theme";
}) {
  return (
    <section className="relative isolate mx-auto grid w-full max-w-6xl items-center gap-6 bg-(--background) px-4 py-12 text-(--foreground) sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-16">
      <div className="flex flex-col items-start gap-6">
        <p
          className={`${glass} inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs`}
        >
          <span aria-hidden className="size-2 rounded-full bg-(--em-sky-500)" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
            <ShinyText
              color="var(--em-blue-500)"
              shineColor="var(--em-ink-0)"
              speed={2.4}
              delay={3}
            >
              crocwork studio
            </ShinyText>
          </span>
          <span className="text-(--muted-foreground)">ซอฟต์แวร์ · AI · ระบบหลังบ้าน</span>
        </p>
        <h1 className="font-sans text-5xl font-black leading-[1.05] sm:text-7xl">
          {line1}
          <br />
          {line2}
          <br />
          <span className="relative inline-block">
            {/* water is the only gradient */}
            <span className="bg-linear-to-r from-(--em-sky-500) via-(--em-blue-500) to-(--em-blue-700) bg-clip-text text-transparent">
              ครบ <CountUp to={count} /> ระบบ
            </span>
            <svg
              aria-hidden
              viewBox="0 0 300 14"
              preserveAspectRatio="none"
              className="absolute -bottom-3 left-0 w-full text-(--em-blue-600)"
            >
              <path
                d="M3 8 Q 40.5 2, 78 8 T 153 8 T 228 8 T 297 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>
        <div
          className={`${glass} flex w-full max-w-lg items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-2xl font-black leading-none sm:text-3xl`}
        >
          <span className="shrink-0">ทีมของผม =</span>
          <RotatingText
            texts={ROLES}
            effect="slide"
            staggerDuration={0.018}
            staggerFrom="first"
            rotationInterval={2400}
            splitLevelClassName="overflow-hidden pb-1"
            className="vt-live min-w-0 flex-nowrap whitespace-nowrap text-(--em-blue-600)"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="#work"
            className="inline-flex items-center gap-2 rounded-xl bg-(--em-blue-600) px-5 py-3 text-sm font-bold text-(--em-ink-0) transition-transform hover:-translate-y-0.5"
          >
            ดูผลงาน <span aria-hidden>↓</span>
          </a>
          <a
            href="#try"
            className={`${glass} inline-flex items-center rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5`}
          >
            ลองเล่นดู
          </a>
        </div>
      </div>
      <SeasonTree
        fruits={FRUITS}
        season={season === "theme" ? undefined : season}
        sceneClassName="h-[46svh] min-h-[19rem] lg:h-[36rem]"
      />
    </section>
  );
}
