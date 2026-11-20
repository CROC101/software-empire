"use client";

import { MurmurationWordmark } from "@empire/ui";

const presets = ["dusk", "dawn", "paper", "night"] as const;

/** A flock of starlings wheels across the sky, then settles into a word. The pointer is a hawk. */
export default function MurmurationWord({
  word = "croc",
  preset = "dusk",
}: {
  word?: string;
  preset?: string;
}) {
  return (
    <div className="size-full min-h-[36rem]">
      <MurmurationWordmark
        key={`${word}-${preset}`}
        word={word}
        preset={presets.find((p) => p === preset) ?? "dusk"}
        height="36rem"
      />
    </div>
  );
}
