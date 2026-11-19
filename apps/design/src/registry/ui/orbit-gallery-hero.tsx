"use client";

import { OrbitGallery } from "@empire/ui";

const shots = [
  "aurora-tide",
  "dither-tide",
  "where-globe",
  "tide-plasma",
  "warp-lanes",
  "particle-title",
  "ripple-mesh",
  "float-particles",
  "ripple-pond",
  "deep-galaxy",
].map((s) => `/orbit/${s}.webp`);

const points = [
  { title: "หมุนด้วย CSS", body: "ขยับแค่ transform ไม่มีสคริปต์คอยคำนวณ" },
  { title: "ตั้งตรงตลอดทาง", body: "แต่ละรูปหมุนกลับเท่ากับวงที่หมุนไป" },
  { title: "หยุดได้", body: "เครื่องที่ตั้งลดการเคลื่อนไหวจะเห็นวงนิ่ง" },
];

/**
 * A landing hero inside a slowly turning ring of screenshots (each one stays upright). The middle
 * stays still: chip, headline, two buttons and three points.
 */
export default function OrbitGalleryHero({
  seconds = 35,
  tiles = 10,
}: {
  seconds?: number;
  tiles?: number;
}) {
  return (
    <OrbitGallery
      images={shots.slice(0, Math.min(10, Math.max(6, tiles)))}
      seconds={seconds}
      className="@container flex size-full min-h-[40rem] items-center justify-center"
    >
      <div className="flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-primary" />
          ผลงานล่าสุด {Math.min(10, Math.max(6, tiles))} ชิ้น
        </p>
        <h1 className="mt-5 font-heading text-4xl leading-tight font-black @2xl:text-6xl">
          ผลงานของเรา
          <span className="block text-primary">หมุนให้ดูครบในวงเดียว</span>
        </h1>
        <p className="mt-5 max-w-md text-muted-foreground">
          รูปผลงานวนรอบข้อความช้า ๆ ทุกรูปตั้งตรงตลอดทาง ข้อความกลางจออ่านง่ายเพราะมีพื้นหลังจาง ๆ
          รองไว้
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="#work"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            ดูผลงาน
          </a>
          <a
            href="#contact"
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-5 font-semibold hover:bg-muted"
          >
            ติดต่อเรา
          </a>
        </div>
        <ul className="mt-12 grid w-full gap-px overflow-clip rounded-lg border border-border bg-border @2xl:grid-cols-3">
          {points.map((p) => (
            <li key={p.title} className="bg-background/90 p-4">
              <p className="font-semibold">{p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </OrbitGallery>
  );
}
