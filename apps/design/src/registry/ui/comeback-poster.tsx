"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const words = [
  "RETURN",
  "BLOOM",
  "AGAIN",
  "RISE",
  "FIELD",
  "ECHO",
  "DAWN",
  "WIND",
  "ROOTS",
  "LIGHT",
  "HOME",
  "SPRING",
];
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
type Poppy = { id: number; x: number; y: number; r: number; d: number };

/** A steady field of poppies; y is depth (bigger is nearer). */
function field(): Poppy[] {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, (_, id) => {
    const y = 250 + rnd() * 150;
    return { id, x: rnd() * 1000, y, r: 5 + ((y - 250) / 150) * 13, d: 2.4 + rnd() * 2 };
  });
}

/**
 * A gig-poster hero: a paper masthead with a giant title and a grid of theme words over a field
 * of poppies where a hooded figure waits. Pointing at a word decodes the title into it, a click
 * keeps it and sends a gust across the field; the poppies sway, part round the pointer and
 * bloom where you click; the hood turns to follow you.
 */
export default function ComebackPoster({ title = "COMEBACK" }: { title?: string }) {
  const still = useReducedMotionAfterMount();
  const [kept, setKept] = useState<string | null>(null);
  const [peek, setPeek] = useState<string | null>(null);
  const target = (peek ?? kept ?? title).toUpperCase();
  const [shown, setShown] = useState(target);
  const [poppies, setPoppies] = useState(field);
  const [ptr, setPtr] = useState<{ x: number; y: number } | null>(null);
  const [gust, setGust] = useState(0);
  const nextId = useRef(1000);

  // decode: letters settle left to right, the rest flicker
  useEffect(() => {
    if (still) return;
    let frame = 0;
    const steps = 14;
    const t = setInterval(() => {
      frame++;
      const done = Math.floor((frame / steps) * target.length);
      setShown(
        target
          .split("")
          .map((c, i) => (i < done ? c : (ABC[Math.floor(Math.random() * 26)] ?? c)))
          .join(""),
      );
      if (frame >= steps) {
        setShown(target);
        clearInterval(t);
      }
    }, 40);
    return () => {
      clearInterval(t);
    };
  }, [target, still]);

  const toSvg = (e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1000,
      y: ((e.clientY - r.top) / r.height) * 400,
    };
  };
  const sorted = [...poppies].sort((a, b) => a.y - b.y);
  const behind = sorted.filter((p) => p.y < 330);
  const front = sorted.filter((p) => p.y >= 330);
  const turn = ptr ? Math.max(-8, Math.min(8, (ptr.x - 500) / 40)) : 0;

  const flower = (p: Poppy) => {
    let dx = 0;
    if (ptr && !still) {
      const d = p.x - ptr.x;
      const near = Math.abs(d) < 90 && Math.abs(p.y - ptr.y) < 90;
      if (near) dx = Math.sign(d || 1) * (90 - Math.abs(d)) * 0.45;
    }
    return (
      <motion.g
        key={p.id}
        initial={p.id >= 1000 && !still ? { scale: 0 } : false}
        animate={{
          x: dx,
          scale: 1,
          // a new peak value per gust, so the same keyframes play again
          rotate: gust && !still ? [0, 16 + (gust % 2) * 0.01, -5, 0] : 0,
        }}
        transition={{
          x: { type: "spring", stiffness: 140, damping: 16 },
          scale: { type: "spring", stiffness: 200, damping: 14 },
          rotate: { duration: 1.4, delay: p.x / 1400, ease: "easeOut" },
        }}
        style={{ transformOrigin: `${String(p.x)}px ${String(p.y + p.r * 3)}px` }}
      >
        <motion.g
          animate={still ? {} : { rotate: [-3, 3] }}
          transition={{ duration: p.d, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          style={{ transformOrigin: `${String(p.x)}px ${String(p.y + p.r * 3)}px` }}
          className="vt-live"
        >
          <path
            d={`M${String(p.x)} ${String(p.y + p.r * 3)} Q${String(p.x - p.r * 0.4)} ${String(p.y + p.r * 1.5)} ${String(p.x)} ${String(p.y)}`}
            className="fill-none stroke-(--em-croc-800)"
            strokeWidth={Math.max(1, p.r / 6)}
          />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx={p.x}
              cy={p.y - p.r * 0.45}
              rx={p.r * 0.55}
              ry={p.r * 0.5}
              transform={`rotate(${String(a)} ${String(p.x)} ${String(p.y)})`}
              className="fill-(--em-coral-500)"
            />
          ))}
          <circle cx={p.x} cy={p.y} r={p.r * 0.28} className="fill-(--em-ink-975)" />
        </motion.g>
      </motion.g>
    );
  };

  return (
    <section className="@container relative isolate flex size-full min-h-[38rem] flex-col overflow-clip bg-(--em-gold-300) text-(--em-ink-975)">
      {/* masthead */}
      <header className="relative z-10 mx-4 mt-4 rounded-sm bg-(--em-ink-25) p-5 shadow-md @2xl:mx-8 @2xl:p-7">
        <div className="flex justify-between gap-4 text-sm">
          <span>ทัวร์ปีนี้ · กลับมาอีกครั้ง</span>
          <span className="font-mono text-xs tracking-[0.2em] uppercase">Vol. 02</span>
        </div>
        <h2 className="mt-2 font-heading text-[clamp(3rem,13cqi,9rem)] leading-[0.85] font-black text-(--em-coral-500) tabular-nums">
          <span aria-hidden>{still ? target : shown}</span>
          <span className="sr-only">{kept ?? title}</span>
        </h2>
        <ul className="mt-4 grid grid-cols-3 gap-px bg-(--em-ink-300) @xl:grid-cols-4 @3xl:grid-cols-6">
          {words.map((w) => (
            <li key={w} className="bg-(--em-ink-25)">
              <button
                type="button"
                aria-pressed={kept === w}
                onPointerEnter={() => {
                  setPeek(w);
                }}
                onPointerLeave={() => {
                  setPeek(null);
                }}
                onFocus={() => {
                  setPeek(w);
                }}
                onBlur={() => {
                  setPeek(null);
                }}
                onClick={() => {
                  setKept(kept === w ? null : w);
                  setGust((g) => g + 1);
                }}
                className={cn(
                  "w-full px-2 py-2 text-start font-mono text-xs tracking-[0.15em]",
                  kept === w
                    ? "bg-(--em-ink-975) text-(--em-ink-0)"
                    : "hover:bg-(--em-ink-100) focus-visible:bg-(--em-ink-100)",
                )}
              >
                {w}
              </button>
            </li>
          ))}
        </ul>
      </header>

      {/* the field */}
      <svg
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMax slice"
        aria-label="ทุ่งดอกป๊อปปี้ แตะเพื่อให้ดอกบาน"
        role="img"
        onPointerMove={(e) => {
          setPtr(toSvg(e));
        }}
        onPointerLeave={() => {
          setPtr(null);
        }}
        onClick={(e) => {
          const c = toSvg(e);
          const born = Array.from({ length: 5 }, (_, k) => {
            const y = Math.max(255, Math.min(395, c.y + (k - 2) * 9));
            return {
              id: nextId.current++,
              x: c.x + Math.cos(k * 1.3) * 30,
              y,
              r: 5 + ((y - 250) / 150) * 13,
              d: 2.4 + k * 0.4,
            };
          });
          setPoppies((ps) => [...ps, ...born].slice(-150));
        }}
        className="absolute inset-x-0 bottom-0 h-[62%] w-full cursor-crosshair"
      >
        <path
          d="M0 230 C160 180 300 220 460 200 C640 176 800 214 1000 190 L1000 400 L0 400 Z"
          className="fill-(--em-croc-600)"
        />
        <path
          d="M0 270 C200 240 380 268 560 250 C740 232 860 262 1000 248 L1000 400 L0 400 Z"
          className="fill-(--em-croc-800)"
        />
        {behind.map(flower)}

        {/* the hooded figure: robe, then a hood that turns toward you */}
        <g>
          <path
            d="M470 352 C474 300 478 262 486 240 L514 240 C522 262 526 300 530 352 Z"
            className="fill-(--em-ink-0)"
          />
          <motion.g
            animate={{ rotate: turn }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            style={{ transformOrigin: "500px 246px" }}
          >
            <path
              d="M482 246 C478 222 486 204 500 202 C514 204 522 222 518 246 Z"
              className="fill-(--em-ink-0)"
            />
            <ellipse cx="500" cy="228" rx="9" ry="13" className="fill-(--em-ink-975)" />
          </motion.g>
        </g>

        {front.map(flower)}
      </svg>
    </section>
  );
}
