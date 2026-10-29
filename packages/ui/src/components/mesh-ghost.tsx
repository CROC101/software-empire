"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Festival } from "@empire/core/theme";
import { FESTIVALS } from "@empire/core/theme";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";
import { useTokenColors } from "../lib/token-colors";
import { useAmbience } from "./ambience";

/**
 * The studio mascots: a little ghost and an owl, each filled with a live mesh-gradient shader,
 * eyes that follow the pointer, a slow float and a blink. During a festival (picked from the sky
 * menu, or by date on "ตามฤดูกาล") they dress for it: witch hat, Loy Krathong float, Santa hat,
 * party hat, Songkran flower.
 *
 * Light by construction: the eyes ride motion values (no React re-render per pointer move),
 * float and blink are CSS transform keyframes, and the shader stops when the mascot is off screen
 * or the visitor prefers reduced motion. The body is a CSS mask, not <foreignObject>, so the
 * WebGL canvas also draws in Safari and scales with the box.
 */

type Kind = "ghost" | "owl";

// both bodies share one 231 x 289 viewBox, so eyes and outfits use the same coordinates
const BODY: Record<Kind, string> = {
  ghost:
    "M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z",
  // an owl: two ear tufts, a round crown between them, an egg-shaped body
  owl: "M36 6C52 22 66 38 80 50C98 43 133 43 151 50C165 38 179 22 195 6C222 58 231 138 222 204C212 262 168 289 115.5 289C63 289 19 262 9 204C0 138 9 58 36 6Z",
};
const mask = (d: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 231 289'><path d='${d}'/></svg>`,
  )}") center / 100% 100% no-repeat`;

// palette tokens (light → deep); the shader cannot read CSS vars, so they are resolved at runtime
const TOKENS: Record<Kind, string[]> = {
  ghost: ["--em-violet-300", "--em-sky-500", "--em-violet-400", "--em-blue-600", "--em-ink-975"],
  owl: ["--em-violet-300", "--em-violet-500", "--em-blue-700", "--em-ink-800", "--em-ink-975"],
};

const MAX_LOOK = 8; // how far the eyes travel, in viewBox units
// where each head starts (y of the crown), so hats sit on either mascot
const CROWN: Record<Kind, number> = { ghost: 8, owl: 50 };

function Eyes({
  kind,
  lookX,
  lookY,
  blink,
}: {
  kind: Kind;
  lookX: MotionValue<number>;
  lookY: MotionValue<number>;
  blink: boolean;
}) {
  const leftX = useTransform(lookX, (v) => 80 + v);
  const rightX = useTransform(lookX, (v) => 150 + v);
  const pupilY = useTransform(lookY, (v) => (kind === "owl" ? 118 : 120) + v);
  const glintX = useTransform(lookX, (v) => v * 0.6);
  if (kind === "ghost") {
    return (
      <>
        {[leftX, rightX].map((cx, i) => (
          <motion.ellipse
            key={i}
            cx={cx}
            cy={pupilY}
            rx={20}
            ry={30}
            fill="var(--em-ink-975)"
            className={blink ? "em-ghost-blink" : undefined}
          />
        ))}
      </>
    );
  }
  return (
    <>
      {/* facial discs, then big round eyes that track, a glint, the beak, breast feathers */}
      {[80, 150].map((x) => (
        <circle key={x} cx={x} cy={118} r={40} fill="oklch(1 0 0 / 0.16)" />
      ))}
      {[80, 150].map((x) => (
        <circle key={x} cx={x} cy={118} r={29} fill="oklch(0.97 0.02 90)" />
      ))}
      <g className={blink ? "em-ghost-blink" : undefined}>
        {[leftX, rightX].map((cx, i) => (
          <motion.circle key={i} cx={cx} cy={pupilY} r={16} fill="var(--em-ink-975)" />
        ))}
        <motion.g style={{ x: glintX }}>
          {[74, 144].map((x) => (
            <circle key={x} cx={x} cy={110} r={5} fill="oklch(1 0 0 / 0.9)" />
          ))}
        </motion.g>
      </g>
      <path d="M104 150 H127 L115.5 172 Z" fill="var(--em-gold-500)" />
      {[0, 1, 2].map((row) =>
        [-1, 0, 1].map((col) => {
          const x = 115.5 + col * 26 - (row % 2) * 13; // rows offset like scales
          const y = 200 + row * 22;
          return (
            <path
              key={`${String(row)}${String(col)}`}
              d={`M${String(x - 9)} ${String(y)} q9 9 18 0`}
              fill="none"
              stroke="oklch(1 0 0 / 0.38)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          );
        }),
      )}
    </>
  );
}

/** What each mascot wears for a festival; drawn over the body, may reach above the viewBox. */
function Outfit({ festival, crown }: { festival: Festival; crown: number }) {
  const y = crown;
  switch (festival) {
    case "halloween":
      return (
        <g>
          <path
            d={`M66 ${String(y + 4)} L128 ${String(y - 92)} L150 ${String(y - 60)} L166 ${String(y + 4)} Z`}
            fill="oklch(0.2 0.04 290)"
            stroke="var(--em-violet-400)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <rect x="72" y={y - 14} width="88" height="14" rx="3" fill="var(--em-violet-500)" />
          <rect
            x="108"
            y={y - 16}
            width="16"
            height="18"
            rx="2"
            fill="none"
            stroke="var(--em-gold-300)"
            strokeWidth="3"
          />
          <ellipse
            cx="116"
            cy={y + 4}
            rx="92"
            ry="13"
            fill="oklch(0.16 0.04 290)"
            stroke="var(--em-violet-400)"
            strokeWidth="2.5"
          />
        </g>
      );
    case "christmas":
      return (
        <g>
          <path
            d={`M70 ${String(y + 2)} C86 ${String(y - 70)} 150 ${String(y - 92)} 196 ${String(y - 40)} L170 ${String(y + 2)} Z`}
            fill="oklch(0.58 0.2 25)"
          />
          <circle cx="198" cy={y - 38} r="15" fill="oklch(0.98 0.01 90)" />
          <rect x="58" y={y - 8} width="122" height="24" rx="12" fill="oklch(0.98 0.01 90)" />
        </g>
      );
    case "newyear":
      return (
        <g>
          <path
            d={`M88 ${String(y + 4)} L116 ${String(y - 78)} L144 ${String(y + 4)} Z`}
            fill="var(--em-blue-500)"
          />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${String(96 + i * 5)} ${String(y - 16 - i * 22)} L${String(136 - i * 5)} ${String(y - 4 - i * 22)}`}
              stroke="var(--em-gold-300)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
          <circle cx="116" cy={y - 80} r="9" fill="var(--em-gold-300)" />
        </g>
      );
    case "songkran":
      // a jasmine-and-orchid flower over one ear, splashes of water around
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="180"
              cy={y + 18}
              rx="9"
              ry="18"
              fill="oklch(0.72 0.2 330)"
              transform={`rotate(${String(a)} 180 ${String(y + 30)})`}
            />
          ))}
          <circle cx="180" cy={y + 30} r="7" fill="var(--em-gold-300)" />
          {[
            [30, 60],
            [206, 140],
            [24, 190],
          ].map(([x = 0, yy = 0]) => (
            <path
              key={x}
              d={`M${String(x)} ${String(yy)} q-7 10 0 16 q7 -6 0 -16 Z`}
              fill="var(--em-sky-500)"
            />
          ))}
        </g>
      );
    case "loykrathong":
      // a banana-leaf krathong with a lotus and a candle, held at the bottom
      return (
        <g>
          <path d="M44 262 Q115 300 187 262 L176 246 H55 Z" fill="var(--em-croc-600)" />
          {[-2, -1, 0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${String(115 + i * 24)} 248 l-12 -22 l12 -14 l12 14 Z`}
              fill="oklch(0.86 0.09 350)"
            />
          ))}
          <rect x="111" y="196" width="9" height="34" rx="2" fill="oklch(0.95 0.03 90)" />
          <path d="M115.5 176 q-9 12 0 20 q9 -8 0 -20 Z" fill="var(--em-gold-300)" />
        </g>
      );
  }
}

export function MeshMascot({
  kind = "ghost",
  label,
  className,
}: {
  kind?: Kind;
  /** Accessible name, e.g. "มาสคอตนกฮูกของ crocwork.studio". */
  label?: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionAfterMount();
  const colors = useTokenColors(TOKENS[kind]);
  const [visible, setVisible] = useState(true);
  const { season } = useAmbience();
  const festival = FESTIVALS.find((f) => f === season);

  const lookX = useSpring(useMotionValue(0), { stiffness: 150, damping: 15 });
  const lookY = useSpring(useMotionValue(0), { stiffness: 150, damping: 15 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    io.observe(el);
    if (reduced) return () => io.disconnect();
    const follow = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const scale = 231 / rect.width;
      const clamp = (v: number) => Math.max(-MAX_LOOK, Math.min(MAX_LOOK, v));
      lookX.set(clamp((e.clientX - (rect.left + rect.width / 2)) * 0.08 * scale));
      lookY.set(clamp((e.clientY - (rect.top + rect.height / 2)) * 0.08 * scale));
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", follow);
    };
  }, [reduced, lookX, lookY]);

  const m = mask(BODY[kind]);
  return (
    <div
      ref={box}
      role="img"
      aria-label={
        label ??
        (kind === "owl" ? "มาสคอตนกฮูกของ crocwork.studio" : "มาสคอตผีน้อยของ crocwork.studio")
      }
      className={cn("vt-live relative aspect-[231/289]", !reduced && "em-ghost-float", className)}
    >
      <div className="absolute inset-0" style={{ mask: m, WebkitMask: m }}>
        {colors && (
          <MeshGradient
            colors={colors}
            speed={reduced || !visible ? 0 : 1}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
      <svg
        aria-hidden
        viewBox="0 0 231 289"
        overflow="visible"
        className="absolute inset-0 size-full"
      >
        <Eyes kind={kind} lookX={lookX} lookY={lookY} blink={!reduced} />
        {festival && <Outfit festival={festival} crown={CROWN[kind]} />}
      </svg>
    </div>
  );
}

/** The ghost (kept as its own name: the original mascot). */
export function MeshGhost({ className }: { className?: string }) {
  return <MeshMascot kind="ghost" className={className} />;
}
