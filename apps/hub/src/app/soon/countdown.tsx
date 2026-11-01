"use client";

import { RollingCounter } from "@empire/ui";
import { useEffect, useState } from "react";

const UNITS = [
  { label: "วัน", ms: 86_400_000, cap: Infinity },
  { label: "ชั่วโมง", ms: 3_600_000, cap: 24 },
  { label: "นาที", ms: 60_000, cap: 60 },
  { label: "วินาที", ms: 1000, cap: 60 },
] as const;

/** Days, hours, minutes and seconds left, each rolling to its new value; reloads at zero. */
export function Countdown({ target }: { target: number }) {
  // null until mounted: the server's clock and the visitor's differ, so the first paint must not
  // carry a number that hydration would then contradict
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const t = Date.now();
      setNow(t);
      // the gate opens on the server at the same moment; reload lands on the real site
      if (t >= target) location.reload();
    };
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [target]);

  const left = Math.max(0, target - (now ?? target));
  return (
    <dl className="grid w-fit grid-cols-4 gap-x-4 sm:gap-x-10" aria-live="off">
      {UNITS.map(({ label, ms, cap }) => (
        <div key={label} className="flex flex-col-reverse gap-2">
          <dt className="text-base text-[var(--em-ink-100)] sm:text-lg">{label}</dt>
          <dd className="font-heading text-5xl font-black leading-none tabular-nums sm:text-8xl lg:text-9xl">
            {now === null ? (
              <span className="opacity-0">00</span>
            ) : (
              <RollingCounter
                value={Math.floor(left / ms) % cap}
                format={{ minimumIntegerDigits: 2 }}
                intro={false}
              />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
