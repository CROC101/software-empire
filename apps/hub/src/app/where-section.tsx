"use client";

import { CobeGlobe, useAmbience, useTokenColors, type GlobePin } from "@empire/ui";
import { useEffect, useState } from "react";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";
// only what is true: the studio works from Bangkok
const PINS: GlobePin[] = [{ id: "bkk", location: [13.75, 100.5], label: "BKK · UTC+7" }];
const LIGHT = ["--em-ink-0", "--em-blue-600", "--em-ink-100"] as const;
const DARK = ["--em-ink-600", "--em-sky-500", "--em-blue-700"] as const;

function useBangkokTime() {
  // after mount only: the server and the visitor's clock never disagree in the markup
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
    });
    const tick = () => {
      setNow(fmt.format(new Date()));
    };
    tick();
    const t = window.setInterval(tick, 20_000);
    return () => {
      window.clearInterval(t);
    };
  }, []);
  return now;
}

/** Where the studio is: a turning globe with one pin on Bangkok, and the time there now. */
export function WhereSection() {
  const { dark } = useAmbience();
  const c = useTokenColors(dark ? DARK : LIGHT);
  const time = useBangkokTime();
  const [base = "", marker = "", glow = ""] = c ?? [];
  return (
    <section data-tide id="where" className="mx-auto max-w-6xl scroll-mt-16 px-4 pb-24 sm:px-6">
      <div className="grid items-center gap-10 border-t pt-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className={`${EYEBROW} cw-blue`}>where</p>
          <h2 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            ทำงานจาก
            <br />
            <span className="cw-blue">กรุงเทพ</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            เวลาไทย UTC+7 คุยกันทางอีเมลหรือทักมาได้ ตอบภายใน 1 วันทำการ ภาษาไทยหรือ English
          </p>
          <p className="cw-glass mt-6 inline-flex items-center gap-3 rounded-full px-4 py-2 font-mono text-sm">
            <span className="st-live" aria-hidden />
            ที่กรุงเทพตอนนี้
            <span className="font-bold tabular-nums">{time ?? "--:--"}</span>
          </p>
        </div>
        <div className="mx-auto w-full max-w-md">
          {c && (
            <CobeGlobe
              pins={PINS}
              dark={dark}
              colors={{ base, marker, glow }}
              label="ลูกโลกที่หมุนช้า ๆ มีหมุดที่กรุงเทพ ลากเพื่อหมุน"
            />
          )}
        </div>
      </div>
    </section>
  );
}
