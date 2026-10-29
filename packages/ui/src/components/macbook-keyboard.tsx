import {
  ChevronUp,
  Command,
  FastForward,
  Globe,
  LayoutGrid,
  Mic,
  Moon,
  Option,
  Play,
  Rewind,
  Search,
  Sun,
  SunDim,
  Volume1,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A MacBook-style keyboard, sized by its container's width (container query units), so it fits
 * any laptop body: full ANSI layout with legends, function-row icons, Touch ID and inverted-T
 * arrows. Decorative: aria-hidden, no key handling.
 *
 * After "MacBook Keyboard" by kaif-ui (21st.dev): the hand-written keys become data, F9 fixed
 * (the original printed F8 twice), lucide icons, palette tokens.
 */
type Key = {
  /** Width in letter keys. */
  w?: number;
  /** Upper legend (shifted symbol, or an icon key's icon). */
  top?: React.ReactNode;
  /** Lower legend, or the only one. */
  label?: React.ReactNode;
  /** Word keys sit their label in a corner. */
  corner?: "left" | "right";
  icon?: LucideIcon;
  touchId?: boolean;
};

const fnIcons: [LucideIcon, string][] = [
  [SunDim, "F1"],
  [Sun, "F2"],
  [LayoutGrid, "F3"],
  [Search, "F4"],
  [Mic, "F5"],
  [Moon, "F6"],
  [Rewind, "F7"],
  [Play, "F8"],
  [FastForward, "F9"],
  [VolumeX, "F10"],
  [Volume1, "F11"],
  [Volume2, "F12"],
];
const pair = (s: string): Key => ({ top: s[0], label: s[1] });
const letter = (c: string): Key => ({ label: c });

// each row adds up to 14.67 letter keys, like the real board
const ROWS: Key[][] = [
  [
    { w: 1.67, label: "esc", corner: "left" },
    ...fnIcons.map(([icon, label]): Key => ({ icon, label })),
    { touchId: true },
  ],
  [
    ...["~`", "!1", "@2", "#3", "$4", "%5", "^6", "&7", "*8", "(9", ")0", "_–", "+="].map(pair),
    { w: 1.67, label: "delete", corner: "right" },
  ],
  [
    { w: 1.67, label: "tab", corner: "left" },
    ..."QWERTYUIOP".split("").map(letter),
    ...["{[", "}]", "|\\"].map(pair),
  ],
  [
    { w: 1.835, label: "caps lock", corner: "left" },
    ..."ASDFGHJKL".split("").map(letter),
    ...[":;", "\"'"].map(pair),
    { w: 1.835, label: "return", corner: "right" },
  ],
  [
    { w: 2.335, label: "shift", corner: "left" },
    ..."ZXCVBNM".split("").map(letter),
    ...["<,", ">.", "?/"].map(pair),
    { w: 2.335, label: "shift", corner: "right" },
  ],
  [
    { top: "fn", icon: Globe, corner: "left" },
    { icon: ChevronUp, label: "control", corner: "left" },
    { icon: Option, label: "option", corner: "left" },
    { w: 1.33, icon: Command, label: "command", corner: "left" },
    { w: 5.01 },
    { w: 1.33, icon: Command, label: "command", corner: "left" },
    { icon: Option, label: "option", corner: "left" },
  ],
];

const CAP = "linear-gradient(180deg, var(--em-ink-900), var(--em-ink-975))";
const CAP_SHADOW =
  "inset 0 -0.08cqw 0.25cqw var(--em-ink-950), inset -0.08cqw 0 0.25cqw var(--em-ink-950), 0 0 0 0.08cqw rgb(255 255 255 / 0.18), 0 0.25cqw 0.5cqw rgb(255 255 255 / 0.12)";

function Cap({ k, className }: { k: Key; className?: string }) {
  const Icon = k.icon;
  return (
    <span
      className={cn(
        "flex min-w-0 flex-col rounded-[0.7cqw] p-[0.45cqw] leading-none transition-transform duration-100 hover:scale-[0.97]",
        k.corner === "left" && "items-start justify-between",
        k.corner === "right" && "items-end justify-end",
        !k.corner && "items-center justify-center gap-[0.35cqw]",
        className,
      )}
      style={{
        flex: `${String(k.w ?? 1)} 1 0`,
        background: CAP,
        boxShadow: CAP_SHADOW,
        color: "var(--em-ink-100)",
      }}
    >
      {k.touchId ? (
        <span
          className="block size-[3.6cqw] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--em-ink-975) 55%, var(--em-ink-800))",
          }}
        />
      ) : (
        <>
          {k.top !== undefined && <span>{k.top}</span>}
          {Icon && (
            <Icon className={cn("size-[1.5cqw]", k.corner === "left" && !k.top && "self-end")} />
          )}
          {k.label !== undefined && <span>{k.label}</span>}
        </>
      )}
    </span>
  );
}

export function MacBookKeyboard({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("@container w-full", className)}>
      <div
        className="flex flex-col gap-[0.6cqw] rounded-[1cqw] p-[0.8cqw] font-sans text-[1.35cqw] select-none"
        style={{ background: "var(--em-ink-800)" }}
      >
        {ROWS.map((row, r) => (
          <div key={r} className="flex h-[6.9cqw] gap-[0.6cqw]">
            {row.map((k, i) => (
              <Cap key={i} k={k} />
            ))}
            {r === ROWS.length - 1 && (
              // inverted-T arrows: ↑ over ↓, between ← and →
              <span className="flex gap-[0.6cqw]" style={{ flex: "3 1 0" }}>
                <Cap k={{ label: "◀" }} className="h-1/2 self-end text-[1cqw]" />
                <span className="flex flex-1 flex-col gap-[0.3cqw]">
                  <Cap k={{ label: "▲" }} className="text-[1cqw]" />
                  <Cap k={{ label: "▼" }} className="text-[1cqw]" />
                </span>
                <Cap k={{ label: "▶" }} className="h-1/2 self-end text-[1cqw]" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
