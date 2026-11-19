"use client";

import { CobeGlobe, useTokenColors, type GlobePin } from "@empire/ui";
import { useEffect, useMemo, useState } from "react";

const LIGHT = ["--em-ink-0", "--em-blue-600", "--em-ink-100"] as const;
const DARK = ["--em-ink-600", "--em-sky-500", "--em-blue-700"] as const;

function useLocalTime(zone: string) {
  const fmt = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("th-TH", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null; // unknown time zone: the placeholder shows instead of throwing
    }
  }, [zone]);
  // after mount only, so the server markup never disagrees with the visitor's clock
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    if (!fmt) return;
    const tick = () => {
      setNow(fmt.format(new Date()));
    };
    tick();
    const t = window.setInterval(tick, 20_000);
    return () => {
      window.clearInterval(t);
    };
  }, [fmt]);
  return fmt ? now : null;
}

/** Where the studio works from: a slowly turning globe with one pin, and the time there now. */
export default function WhereGlobe({
  city = "กรุงเทพ",
  lat = 13.75,
  lng = 100.5,
  zone = "Asia/Bangkok",
  pin = "BKK · UTC+7",
}: {
  city?: string;
  lat?: number;
  lng?: number;
  /** IANA time zone for the clock */
  zone?: string;
  pin?: string;
}) {
  const bg = useTokenColors(["--background"])?.[0];
  const dark = bg ? parseInt(bg.slice(1, 3), 16) < 128 : false;
  const light = useTokenColors(LIGHT);
  const night = useTokenColors(DARK);
  const [base, marker, glow] = (dark ? night : light) ?? [];
  const time = useLocalTime(zone);
  const pins: GlobePin[] = [{ id: "home", location: [lat, lng], label: pin }];
  return (
    <section className="@container bg-background px-4 py-16 text-foreground sm:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-10 @3xl:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">where</p>
          <h2 className="mt-3 font-heading text-4xl leading-[1.05] font-black @3xl:text-6xl">
            ทำงานจาก
            <br />
            <span className="text-primary">{city}</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            คุยกันทางอีเมลหรือทักมาได้ ตอบภายใน 1 วันทำการ ภาษาไทยหรือ English
          </p>
          <p className="mt-6 inline-flex items-center gap-3 rounded-full border px-4 py-2 font-mono text-sm">
            ที่{city}ตอนนี้
            <span className="font-bold tabular-nums">{time ?? "--:--"}</span>
          </p>
        </div>
        <div className="mx-auto w-full max-w-md">
          {base && marker && glow && (
            <CobeGlobe
              pins={pins}
              dark={dark}
              colors={{ base, marker, glow }}
              label={`ลูกโลกที่หมุนช้า ๆ มีหมุดที่${city} ลากเพื่อหมุน`}
            />
          )}
        </div>
      </div>
    </section>
  );
}
