"use client";

import { WaterRippleCarousel } from "@empire/ui";

const shots = [
  ["aurora-tide", "Aurora Tide", "แสงเหนือไหลเป็นคลื่นช้า ๆ"],
  ["deep-galaxy", "Deep Galaxy", "ดาวนับพันหมุนเป็นแขนกาแล็กซี"],
  ["where-globe", "Where Globe", "ลูกโลกจุดหมุนช้า ๆ"],
  ["ripple-pond", "Ripple Pond", "แตะผิวน้ำแล้วระลอกกระจาย"],
] as const;

/** Tap a picture and a ring of water spreads from the touch, bending the next picture in. */
export default function WaterRipple({ strength = 1 }: { strength?: number }) {
  return (
    <div className="size-full min-h-[36rem] bg-background text-foreground">
      <WaterRippleCarousel
        key={strength}
        height="36rem"
        strength={strength}
        autoplay={7000}
        ariaLabel="ภาพชิ้นงาน"
        labels={{ prev: "ภาพก่อนหน้า", next: "ภาพถัดไป", slide: "ภาพที่ {n} จาก {total}" }}
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
