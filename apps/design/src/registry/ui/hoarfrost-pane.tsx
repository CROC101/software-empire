"use client";

import { HoarfrostPane } from "@empire/ui";

/** Frost grows in from the frame of a window; wipe it with the pointer to see the street behind. */
export default function HoarfrostPaneDemo({ coverage = 0.6 }: { coverage?: number }) {
  return (
    <div className="size-full min-h-[36rem]">
      <HoarfrostPane
        key={coverage}
        coverage={coverage}
        height="36rem"
        label="กระจกฝ้าน้ำแข็ง ลากเพื่อเช็ด"
      />
    </div>
  );
}
