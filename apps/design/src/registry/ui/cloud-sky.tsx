"use client";

import { CloudSky } from "@empire/ui";

/** Drifting clouds over a day sky, a moonlit night in the dark theme, with a line of text on top. */
export default function CloudSkyPart({ speed = 1, count = 6 }: { speed?: number; count?: number }) {
  return (
    <CloudSky
      speed={speed}
      count={count}
      className="flex min-h-[28rem] w-full items-center justify-center"
    >
      <p className="relative font-sans text-4xl font-black text-(--em-ink-0)">ฟ้าวันนี้</p>
    </CloudSky>
  );
}
