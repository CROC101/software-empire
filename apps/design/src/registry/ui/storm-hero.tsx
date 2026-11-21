"use client";

import { StormHero } from "@empire/ui";

// the same film cloud-hero-original plays, so the registry ships no copy of it
const FILM =
  "https://cdn.21st.dev/assets/mirror/1a/1ab42316c6f6caf1c5e9a81a343ee8715a2938f4cc4f5e6051c7e9228109ac78.mp4";

/** CloudSky clouds with a night film screened over them, lightning, pointer parallax and a blur-in headline. */
export default function StormHeroPart({
  line1 = "ระบบที่ผมสร้าง",
  line2 = "ทำงานได้จริง",
  lead = "ทีมของผม =",
  seconds = 2.5,
}: {
  line1?: string;
  line2?: string;
  lead?: string;
  seconds?: number;
}) {
  return (
    <StormHero
      className="min-h-[40rem] w-full"
      eyebrow="crocwork studio"
      lines={[line1, line2]}
      lead={lead}
      words={["Developer", "Designer", "DevOps", "QA"]}
      seconds={seconds}
      video={FILM}
      stats={[
        { value: "8", label: "ระบบในพอร์ต" },
        { value: "268", label: "เทสต์ฐานข้อมูล" },
        { value: "1", label: "คนทำทั้งหมด" },
      ]}
    >
      <a href="#" className="bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
        ดูผลงาน
      </a>
    </StormHero>
  );
}
