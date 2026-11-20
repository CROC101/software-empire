"use client";

import { PolaroidLineCarousel } from "@empire/ui";

const shots = [
  ["aurora-tide", "Aurora Tide", "พื้นหลัง"],
  ["deep-galaxy", "Deep Galaxy", "อนุภาค"],
  ["where-globe", "Where Globe", "แผนที่"],
  ["warp-lanes", "Warp Lanes", "ลูกเล่น"],
  ["ripple-pond", "Ripple Pond", "น้ำ"],
  ["tide-plasma", "Tide Plasma", "พื้นหลัง"],
] as const;

/** Prints pegged to a sagging string: drag or step and they swing as they slide past. */
export default function PolaroidLine({ seconds = 5 }: { seconds?: number }) {
  return (
    <div className="size-full min-h-[36rem] bg-background text-foreground">
      <PolaroidLineCarousel
        height="36rem"
        cardWidth={240}
        autoplay={seconds * 1000}
        string="var(--em-ink-400)"
        ariaLabel="ภาพชิ้นงานบนเชือก"
        labels={{ prev: "รูปก่อนหน้า", next: "รูปถัดไป", print: "รูปที่ {n} จาก {total}" }}
        slides={shots.map(([slug, title, caption]) => ({
          image: `/orbit/${slug}.webp`,
          title,
          caption,
          alt: title,
        }))}
      />
    </div>
  );
}
