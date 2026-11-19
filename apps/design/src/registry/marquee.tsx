"use client";

import {
  Clapperboard,
  Home,
  LayoutGrid,
  MessageCircle,
  Palette,
  ShoppingBag,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { CSSProperties } from "react";

const names = [
  { label: "Hub", Icon: Home },
  { label: "Community", Icon: MessageCircle },
  { label: "Commerce", Icon: ShoppingBag },
  { label: "Toolboxes", Icon: Wrench },
  { label: "Tarot", Icon: Sparkles },
  { label: "Design", Icon: LayoutGrid },
  { label: "Canva", Icon: Palette },
  { label: "Stream", Icon: Clapperboard },
];

function Row({
  reverse,
  speed,
  gap,
  pause,
}: {
  reverse: boolean;
  speed: number;
  gap: number;
  pause: boolean;
}) {
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center" style={{ gap }}>
      {names.map(({ label, Icon }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-lg border border-(--em-ink-800) bg-(--em-ink-950) px-4 py-2 text-sm font-semibold whitespace-nowrap text-(--em-ink-100)"
        >
          <Icon aria-hidden className="size-4 text-(--em-sky-400)" />
          {label}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className={`vt-live flex w-max animate-[marquee_linear_infinite] motion-reduce:animate-none ${pause ? "hover:[animation-play-state:paused]" : ""}`}
      style={
        {
          gap,
          animationDuration: `${speed}s`,
          animationDirection: reverse ? "reverse" : "normal",
          "--marquee-gap": `${gap}px`,
        } as CSSProperties
      }
    >
      {list(false)}
      {list(true)}
    </div>
  );
}

/** Names scroll forever; the copy is aria-hidden, both edges fade, hover pauses. */
export function Marquee({
  rows = "2",
  speed = 28,
  gap = 40,
  pause = true,
}: {
  rows?: "1" | "2";
  speed?: number;
  gap?: number;
  pause?: boolean;
}) {
  return (
    <div className="flex size-full min-h-48 flex-col justify-center gap-4 overflow-hidden bg-(--em-ink-975) py-8 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <Row reverse={false} speed={speed} gap={gap} pause={pause} />
      {rows === "2" && <Row reverse speed={speed * 1.2} gap={gap} pause={pause} />}
    </div>
  );
}
