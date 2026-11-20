"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { ChevronLeft, ChevronRight, Pause, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Group = { name: string; shots: string[] };

const groups: Group[] = [
  { name: "พื้นหลัง", shots: ["aurora-tide", "dither-tide", "tide-plasma", "ripple-mesh"] },
  { name: "อนุภาค", shots: ["float-particles", "particle-title", "deep-galaxy"] },
  { name: "ลูกเล่น", shots: ["where-globe", "warp-lanes", "ripple-pond"] },
].map((g) => ({ ...g, shots: g.shots.map((s) => `/orbit/${s}.webp`) }));

const css = `@keyframes em-story{from{transform:scaleX(0)}to{transform:scaleX(1)}}.em-story{animation:em-story linear forwards}@media (prefers-reduced-motion:reduce){.em-story{animation:none}}`;
const R = 46;
const C = 2 * Math.PI * R;

/** The ring round an avatar: one arc per picture, lit until that picture is seen */
function Ring({ shots, seen }: { shots: string[]; seen: Set<string> }) {
  const n = shots.length;
  const gap = n > 1 ? 7 : 0;
  const seg = C / n - gap;
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
      {shots.map((s, i) => (
        <circle
          key={s}
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${String(seg)} ${String(C - seg)}`}
          strokeDashoffset={-(i * C) / n - gap / 2}
          className={cn(
            "transition-colors duration-300",
            seen.has(s) ? "stroke-(--em-ink-600)" : "stroke-(--em-sky-400)",
          )}
        />
      ))}
    </svg>
  );
}

function Viewer({
  group,
  start,
  seconds,
  onSeen,
  onClose,
}: {
  group: Group;
  start: number;
  seconds: number;
  onSeen: (src: string) => void;
  onClose: () => void;
}) {
  const still = useReducedMotionAfterMount();
  const [i, setI] = useState(start);
  const [dir, setDir] = useState(1);
  const [held, setHeld] = useState(false);
  const pressedAt = useRef(0);
  const panned = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const n = group.shots.length;
  const src = group.shots[i] ?? "";

  useEffect(() => {
    onSeen(src);
  }, [src, onSeen]);
  useEffect(() => {
    box.current?.focus();
  }, []);

  const go = (d: 1 | -1) => {
    if (i + d >= n) {
      onClose();
      return;
    }
    if (i + d < 0) return;
    setDir(d);
    setI(i + d);
  };

  return (
    <motion.div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={`สตอรี่ ${group.name}`}
      tabIndex={-1}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: still ? 0 : 0.25 }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
        else if (e.key === "Escape") onClose();
        else if (e.key === " ") {
          e.preventDefault();
          setHeld((h) => !h);
        }
      }}
      className="absolute inset-0 z-10 grid place-items-center bg-(--em-ink-975)/95 p-4 outline-none"
    >
      <div className="relative aspect-[9/16] h-full max-h-[34rem] overflow-clip rounded-xl bg-(--em-ink-950)">
        {/* the picture: tap a half to step, hold to pause, swipe sideways to step or down to close */}
        <motion.div
          className="absolute inset-0 touch-none select-none"
          onPointerDown={() => {
            pressedAt.current = performance.now();
            setHeld(true);
          }}
          onPointerUp={() => {
            setHeld(false);
          }}
          onPointerLeave={() => {
            setHeld(false);
          }}
          onPointerCancel={() => {
            setHeld(false);
          }}
          onPanEnd={(_, { offset }) => {
            panned.current = true;
            if (Math.abs(offset.x) > 50) go(offset.x > 0 ? -1 : 1);
            else if (offset.y > 80) onClose();
          }}
          onClick={(e) => {
            const long = performance.now() - pressedAt.current > 250;
            if (panned.current || long) {
              panned.current = false;
              return;
            }
            const r = e.currentTarget.getBoundingClientRect();
            go(e.clientX - r.left < r.width / 2 ? -1 : 1);
          }}
        >
          <AnimatePresence initial={false} custom={dir}>
            <motion.img
              key={src}
              src={src}
              alt={`${group.name} ภาพที่ ${String(i + 1)} จาก ${String(n)}`}
              draggable={false}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: `${String(d * 100)}%`, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: `${String(d * -100)}%`, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                still ? { duration: 0 } : { x: { type: "spring", stiffness: 300, damping: 32 } }
              }
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-(--em-ink-975)/55 px-3 pt-3 pb-2">
          <div className="flex gap-1">
            {group.shots.map((s, k) => (
              <span key={s} className="h-0.5 flex-1 overflow-clip rounded-full bg-(--em-ink-50)/30">
                {k === i ? (
                  <span
                    key={i}
                    className={cn(
                      "block h-full origin-left bg-(--em-ink-50)",
                      !still && "em-story",
                    )}
                    style={{
                      animationDuration: `${String(seconds)}s`,
                      animationPlayState: held ? "paused" : "running",
                    }}
                    onAnimationEnd={() => {
                      go(1);
                    }}
                  />
                ) : (
                  <span
                    className={cn(
                      "block h-full origin-left bg-(--em-ink-50)",
                      k > i && "scale-x-0",
                    )}
                  />
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <img src={group.shots[0]} alt="" className="size-8 rounded-full object-cover" />
            <span className="text-sm font-semibold text-(--em-ink-50)">{group.name}</span>
            <span className="font-mono text-xs text-(--em-ink-300)">
              {i + 1}/{n}
            </span>
            {held && <Pause aria-label="หยุดอยู่" className="size-4 text-(--em-ink-200)" />}
            <button
              type="button"
              aria-label="ปิด"
              onClick={onClose}
              className="pointer-events-auto ms-auto grid size-11 place-items-center rounded-md text-(--em-ink-50) hover:bg-(--em-ink-50)/15 focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-4 top-1/2 hidden -translate-y-1/2 justify-between @2xl:flex">
        {(
          [
            [-1, "ภาพก่อนหน้า", ChevronLeft],
            [1, i === n - 1 ? "ปิด" : "ภาพถัดไป", ChevronRight],
          ] as const
        ).map(([d, label, Icon]) => (
          <button
            key={d}
            type="button"
            aria-label={label}
            disabled={d === -1 && i === 0}
            onClick={() => {
              go(d);
            }}
            className="pointer-events-auto grid size-11 place-items-center rounded-md bg-(--em-ink-50)/10 text-(--em-ink-50) hover:bg-(--em-ink-50)/20 focus-visible:outline-2 focus-visible:outline-(--em-sky-400) disabled:opacity-40"
          >
            <Icon className="size-6" aria-hidden />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Story rings: each avatar wears a ring cut into one arc per picture, lit until that picture is
 * seen. Open one to watch its pictures in a tall frame with a bar per picture; tap a side or swipe
 * to step, hold or press Space to pause, swipe down or Escape to close.
 */
export default function StoryRings({ seconds = 5 }: { seconds?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const rings = useRef<(HTMLButtonElement | null)[]>([]);

  const onSeen = useCallback((s: string) => {
    setSeen((prev) => (prev.has(s) ? prev : new Set(prev).add(s)));
  }, []);
  const close = useCallback(() => {
    const last = open;
    setOpen(null);
    if (last !== null) rings.current[last]?.focus();
  }, [open]);
  const group = open === null ? undefined : groups[open];

  return (
    <div className="@container relative isolate grid size-full min-h-[36rem] place-items-center overflow-clip bg-(--em-ink-975) text-(--em-ink-50)">
      <style>{css}</style>
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">Stories</p>
        <ul className="flex gap-6">
          {groups.map((g, k) => (
            <li key={g.name}>
              <button
                ref={(el) => {
                  rings.current[k] = el;
                }}
                type="button"
                aria-label={`ดูสตอรี่ ${g.name} (${String(g.shots.length)} ภาพ)`}
                onClick={() => {
                  setOpen(k);
                }}
                className="group flex flex-col items-center gap-2 rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
              >
                <span className="relative block size-20">
                  <Ring shots={g.shots} seen={seen} />
                  <span className="absolute inset-[7px] overflow-clip rounded-full bg-(--em-ink-900)">
                    <img
                      src={g.shots.at(-1)}
                      alt=""
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </span>
                </span>
                <span className="max-w-20 truncate text-xs text-(--em-ink-300)">{g.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {group && (
          <Viewer
            key={open}
            group={group}
            start={Math.max(
              0,
              group.shots.findIndex((s) => !seen.has(s)),
            )}
            seconds={seconds}
            onSeen={onSeen}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
