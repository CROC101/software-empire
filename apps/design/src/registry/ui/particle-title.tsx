"use client";

import { ParticleTitle } from "@empire/ui";

const GLOW = ["--em-blue-500", "--em-sky-500", "--em-sky-400"] as const;

/** A heading that dissolves into dust under the pointer and gathers back into letters. Follows the site theme. */
export default function ParticleTitleDemo({ text = "ทำคนเดียว ตั้งใจทุกชิ้น" }: { text?: string }) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-background p-6 text-foreground">
      <ParticleTitle key={text} text={text} glow={GLOW} className="w-full" />
    </div>
  );
}
