import { cn } from "@empire/ui";
import { ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCheckins } from "@/lib/api";
import { bangkokDay } from "@/lib/reading";

/*
 * Check-in calendar, after the 21st.dev GlassCalendar: a month name that slides in, a strip of
 * days you scroll sideways (or the whole month as a grid), and the chosen day's coins below.
 * Tokens instead of the original's pink/orange, no backdrop blur (the hub's scroll lesson),
 * Intl for Thai dates instead of date-fns, motion/react instead of framer-motion.
 */

const WEEK = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const monthName = new Intl.DateTimeFormat("th-TH", { month: "long", timeZone: "UTC" });
const yearName = new Intl.DateTimeFormat("th-TH", { year: "numeric", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("th-TH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const iso = (y: number, m: number, d: number) =>
  `${String(y)}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const utc = (day: string) => new Date(`${day}T00:00:00Z`);

export function CheckInCalendar({ refresh }: { refresh: number }) {
  const today = bangkokDay();
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [mode, setMode] = useState<"strip" | "month">("strip");
  const [selected, setSelected] = useState(today);
  const [paid, setPaid] = useState<Map<string, number>>(new Map());
  const todayRef = useRef<HTMLButtonElement>(null);

  const total = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const lead = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const days = useMemo(
    () => Array.from({ length: total }, (_, i) => iso(view.y, view.m, i + 1)),
    [view, total],
  );
  const isThisMonth = view.y === ty && view.m === tm - 1;

  useEffect(() => {
    let active = true;
    getCheckins(iso(view.y, view.m, 1), iso(view.y, view.m, total))
      .then((rows) => {
        if (active) setPaid(new Map(rows.map((r) => [r.day, r.coins])));
      })
      .catch((error: unknown) => {
        console.error("โหลดปฏิทินไม่สำเร็จ", error);
      });
    return () => {
      active = false;
    };
  }, [view, total, refresh]);

  // the strip opens with today in view, not at the 1st
  useEffect(() => {
    if (mode === "strip" && isThisMonth)
      todayRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [mode, isThisMonth]);

  const step = (by: number) => {
    const d = new Date(Date.UTC(view.y, view.m + by, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  const dayButton = (day: string, i: number) => {
    const coins = paid.get(day);
    const chosen = day === selected;
    return (
      <button
        key={day}
        ref={day === today ? todayRef : undefined}
        type="button"
        onClick={() => setSelected(day)}
        aria-pressed={chosen}
        aria-label={`${longDay.format(utc(day))}${coins ? ` เช็กอินแล้ว ${String(coins)} เหรียญ` : ""}`}
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
          chosen
            ? "bg-gradient-to-br from-[var(--em-sky-400)] to-[var(--em-blue-600)] text-[var(--em-ink-0)] shadow-lg"
            : coins
              ? "bg-[color-mix(in_oklab,var(--em-blue-500)_35%,transparent)] text-[var(--em-ink-0)]"
              : "text-[var(--em-ink-200)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)]",
          day > today && "opacity-40",
        )}
      >
        {i + 1}
        {day === today && !chosen && (
          <span
            aria-hidden
            className="absolute bottom-1 size-1 rounded-full bg-[var(--em-gold-300)]"
          />
        )}
      </button>
    );
  };

  const chosenCoins = paid.get(selected);

  return (
    <div className="rounded-2xl border border-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_55%,transparent)] p-4">
      <div className="flex items-center justify-between">
        <div
          role="tablist"
          aria-label="มุมมอง"
          className="flex gap-1 rounded-lg bg-[color-mix(in_oklab,var(--em-ink-975)_60%,transparent)] p-1"
        >
          {(
            [
              ["strip", "รายวัน"],
              ["month", "รายเดือน"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className="min-h-8 rounded-md px-4 text-xs font-bold text-[var(--em-ink-300)] aria-selected:bg-[var(--em-ink-0)] aria-selected:text-[var(--em-ink-975)]"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="เดือนก่อน"
            className="grid size-10 place-items-center rounded-full text-[var(--em-ink-200)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={isThisMonth}
            aria-label="เดือนถัดไป"
            className="grid size-10 place-items-center rounded-full text-[var(--em-ink-200)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)] disabled:opacity-30"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="my-4 flex items-baseline gap-2" aria-live="polite">
        <motion.p
          key={`${String(view.y)}-${String(view.m)}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-black text-[var(--em-ink-0)]"
        >
          {monthName.format(new Date(Date.UTC(view.y, view.m, 1)))}
        </motion.p>
        <span className="text-sm text-[var(--em-ink-300)]">
          {yearName.format(new Date(Date.UTC(view.y, view.m, 1)))}
        </span>
      </div>

      {mode === "strip" ? (
        <div className="tt-no-scrollbar -mx-4 overflow-x-auto px-4">
          <div className="flex gap-3 pb-1">
            {days.map((day, i) => (
              <div key={day} className="flex shrink-0 flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--em-ink-400)]">
                  {WEEK[utc(day).getUTCDay()]}
                </span>
                {dayButton(day, i)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 justify-items-center gap-y-1.5">
          {WEEK.map((w) => (
            <span key={w} className="text-xs font-bold text-[var(--em-ink-400)]">
              {w}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${String(i)}`} aria-hidden />
          ))}
          {days.map((day, i) => dayButton(day, i))}
        </div>
      )}

      <div className="mt-4 h-px bg-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)]" />
      <p className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-[var(--em-ink-200)]">{longDay.format(utc(selected))}</span>
        {chosenCoins ? (
          <span className="flex items-center gap-1 font-bold text-[var(--em-gold-300)]">
            <Coins className="size-4" aria-hidden /> +{chosenCoins}
          </span>
        ) : (
          <span className="text-[var(--em-ink-400)]">
            {selected > today ? "ยังไม่ถึง" : "ไม่ได้เช็กอิน"}
          </span>
        )}
      </p>
    </div>
  );
}
