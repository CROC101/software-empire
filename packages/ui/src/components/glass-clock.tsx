"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Glass clock: a Braun-style analog wall clock under a domed glass, showing the time in one
 * IANA zone. Quartz-style: once a second the hand angles are written to CSS variables (no
 * React render, nothing per frame) and the hands tick to them. Angles keep counting up from
 * load, so the second hand never sweeps backwards at :59 → :00. The reflection follows the pointer.
 *
 * Our own build after "glass-clock" (21st.dev). Styles: `.gc` in styles.css.
 */
export function GlassClock({
  timeZone = "Asia/Bangkok",
  place,
  brand,
  locale = "th-TH",
  className,
}: {
  timeZone?: string;
  /** Printed under the date, e.g. "Bangkok". */
  place: string;
  /** Printed above the centre, e.g. the studio name. */
  brand: string;
  locale?: string;
  className?: string;
}) {
  const faceRef = React.useRef<HTMLDivElement>(null);
  const [now, setNow] = React.useState<{ date: string } | null>(null);

  React.useEffect(() => {
    const el = faceRef.current;
    if (!el) return;
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    // wall-clock seconds since midnight in the zone at load, then counted up from there: small
    // numbers on purpose, the browser loses precision on very large rotate angles
    const p = fmt.formatToParts(new Date());
    const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
    const wallAtLoad = get("hour") * 3600 + get("minute") * 60 + get("second");
    const loadSec = Math.floor(Date.now() / 1000);
    const tick = () => {
      const t = wallAtLoad + Math.floor(Date.now() / 1000) - loadSec;
      el.style.setProperty("--gc-sr", `${String(t * 6)}deg`);
      el.style.setProperty("--gc-mr", `${String(t * 0.1)}deg`);
      el.style.setProperty("--gc-hr", `${String(t / 120)}deg`);
    };
    tick();
    setNow({
      date: new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "short" }).format(
        new Date(),
      ),
    });
    // align to the next whole second, then tick once a second
    let id = 0;
    const first = window.setTimeout(
      () => {
        tick();
        id = window.setInterval(tick, 1000);
      },
      1000 - (Date.now() % 1000),
    );
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [timeZone, locale]);

  const label = now
    ? new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit" }).format(
        new Date(),
      )
    : "";

  return (
    <div
      ref={faceRef}
      role="img"
      aria-label={now ? `${label} · ${place}` : place}
      data-ready={now ? true : undefined}
      className={cn("gc w-full", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--gc-lx",
          `${String(((e.clientX - r.left) / r.width) * 100)}%`,
        );
        e.currentTarget.style.setProperty(
          "--gc-ly",
          `${String(((e.clientY - r.top) / r.height) * 100)}%`,
        );
      }}
    >
      <svg viewBox="0 0 200 200" className="gc__dial" aria-hidden>
        {Array.from({ length: 60 }, (_, i) => (
          <line
            key={i}
            x1="100"
            y1={i % 5 ? 12 : 10}
            x2="100"
            y2={i % 5 ? 16 : 20}
            className={i % 5 ? "gc__tick" : "gc__tick gc__tick--hour"}
            transform={`rotate(${String(i * 6)} 100 100)`}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const a = (n / 12) * Math.PI * 2;
          return (
            <text key={n} x={100 + Math.sin(a) * 70} y={100 - Math.cos(a) * 70} className="gc__num">
              {n}
            </text>
          );
        })}
        <text x="100" y="66" className="gc__brand">
          {brand}
        </text>
        {now && (
          <>
            <text x="100" y="136" className="gc__date">
              {now.date}
            </text>
            <text x="100" y="146" className="gc__date">
              {place}
            </text>
          </>
        )}
      </svg>
      <span aria-hidden className="gc__hand gc__hand--h" />
      <span aria-hidden className="gc__hand gc__hand--m" />
      <span aria-hidden className="gc__hand gc__hand--s" />
      <span aria-hidden className="gc__pin" />
      <span aria-hidden className="gc__glass" />
    </div>
  );
}
