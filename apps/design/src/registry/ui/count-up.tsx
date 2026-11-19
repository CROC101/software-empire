"use client";

import { CountUp } from "@empire/ui";

/** A figure that ticks up from zero once on arrival; the real number is in the HTML, so crawlers and reduced motion see it straight away. */
export default function CountUpDemo({
  to = 271,
  ms = 1200,
  label = "เทสต์ฐานข้อมูลที่ผ่าน",
}: {
  to?: number;
  /** milliseconds to reach the number */
  ms?: number;
  label?: string;
}) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6 text-center">
      <p className="grid gap-2">
        <span className="font-heading text-6xl font-black text-(--em-ink-50) sm:text-7xl">
          <CountUp key={`${String(to)}-${String(ms)}`} to={to} ms={ms} />
        </span>
        <span className="text-sm text-(--em-ink-300)">{label}</span>
      </p>
    </div>
  );
}
