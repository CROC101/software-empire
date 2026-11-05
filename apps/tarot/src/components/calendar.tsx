import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getCheckins } from "@/lib/api";
import { bangkokDay } from "@/lib/reading";

const WEEK = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const monthName = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const iso = (y: number, m: number, d: number) =>
  `${String(y)}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** A month of check-ins: the days the reader came, what each paid, today ringed. */
export function CheckInCalendar({ refresh }: { refresh: number }) {
  const today = bangkokDay();
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const [view, setView] = useState({ y: ty, m: tm - 1 });
  const [paid, setPaid] = useState<Map<string, number>>(new Map());

  const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const lead = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();

  useEffect(() => {
    let active = true;
    getCheckins(iso(view.y, view.m, 1), iso(view.y, view.m, days))
      .then((rows) => {
        if (active) setPaid(new Map(rows.map((r) => [r.day, r.coins])));
      })
      .catch((error: unknown) => {
        console.error("โหลดปฏิทินไม่สำเร็จ", error);
      });
    return () => {
      active = false;
    };
  }, [view, days, refresh]);

  const step = (by: number) => {
    const d = new Date(Date.UTC(view.y, view.m + by, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };
  const isThisMonth = view.y === ty && view.m === tm - 1;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="เดือนก่อน"
          className="grid size-11 place-items-center rounded-md hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="font-semibold" aria-live="polite">
          {monthName.format(new Date(Date.UTC(view.y, view.m, 1)))}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={isThisMonth}
          aria-label="เดือนถัดไป"
          className="grid size-11 place-items-center rounded-md hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)] disabled:opacity-30"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>
      <div
        role="grid"
        aria-label="วันที่เช็กอิน"
        className="grid grid-cols-7 gap-1 text-center text-xs"
      >
        {WEEK.map((w) => (
          <span key={w} role="columnheader" className="py-1 text-[var(--em-ink-400)]">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${String(i)}`} aria-hidden />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = iso(view.y, view.m, i + 1);
          const coins = paid.get(day);
          return (
            <span
              key={day}
              role="gridcell"
              aria-label={`${String(i + 1)}${coins ? ` เช็กอินแล้ว ${String(coins)} เหรียญ` : ""}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-md ${
                coins
                  ? "bg-[var(--em-blue-500)] font-semibold text-[var(--em-ink-0)]"
                  : "bg-[color-mix(in_oklab,var(--em-ink-0)_6%,transparent)] text-[var(--em-ink-300)]"
              } ${day === today ? "ring-2 ring-[var(--em-gold-300)]" : ""}`}
            >
              <span>{i + 1}</span>
              {coins !== undefined && <span className="text-[10px] leading-none">+{coins}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}
