"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type Way = { name: string; upper: string; accent: string; sole: string; soldOut: string[] };

const ways: Way[] = [
  {
    name: "Tide",
    upper: "--em-blue-600",
    accent: "--em-sky-400",
    sole: "--em-ink-0",
    soldOut: ["44"],
  },
  {
    name: "Ink",
    upper: "--em-ink-850",
    accent: "--em-coral-500",
    sole: "--em-ink-100",
    soldOut: ["39", "40"],
  },
  {
    name: "Moss",
    upper: "--em-croc-600",
    accent: "--em-gold-300",
    sole: "--em-ink-50",
    soldOut: [],
  },
  {
    name: "Chalk",
    upper: "--em-ink-100",
    accent: "--em-blue-600",
    sole: "--em-ink-300",
    soldOut: ["42"],
  },
];
const sizes = ["39", "40", "41", "42", "43", "44"];
/** Pairs left for a colourway and size: a fixed, made-up count so the demo has low-stock cases. */
const left = (w: number, s: number) => ((w * 7 + s * 5) % 9) + 1;

/** One side-profile runner, toe left, drawn in three colours. */
function Shoe({ way }: { way: Way }) {
  const c = (t: string) => `var(${t})`;
  return (
    <svg viewBox="0 0 400 190" aria-hidden className="w-full overflow-visible">
      <path d="M22 146 Q20 168 46 170 L358 170 Q384 168 382 146 Z" fill={c(way.sole)} />
      <path
        d="M30 170 L356 170 Q360 178 350 180 L40 180 Q28 178 30 170 Z"
        fill={c("--em-ink-700")}
      />
      <path
        d="M28 146 C26 120 48 108 88 104 C130 100 160 80 190 60 C210 47 235 38 262 38 L300 40 C318 42 330 54 338 72 C350 98 372 114 378 146 Z"
        fill={c(way.upper)}
      />
      <path
        d="M28 146 C27 126 40 112 70 106 C76 120 74 136 66 146 Z"
        fill={c(way.accent)}
        opacity="0.85"
      />
      <path
        d="M118 132 C170 124 226 98 300 116"
        fill="none"
        stroke={c(way.accent)}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M352 80 L374 120 L378 146 L356 146 Z" fill={c(way.accent)} />
      <path
        d="M262 38 C276 50 304 54 326 56"
        fill="none"
        stroke={c("--em-ink-975")}
        strokeOpacity="0.35"
        strokeWidth="4"
      />
      {[0, 1, 2, 3, 4].map((k) => (
        <path
          key={k}
          d={`M${168 + k * 17} ${84 - k * 10} l14 10`}
          stroke={c("--em-ink-0")}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/**
 * A product hero for one sneaker: the shoe floats over its own reflection and swaps with a turn
 * when a colourway is picked; sizes know when they are sold out or running low; the heart bursts
 * when liked and adding to the bag shows a short toast.
 */
export default function SneakerHero({ price = 4290 }: { price?: number }) {
  const still = useReducedMotionAfterMount();
  const [w, setW] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const way = ways[w] ?? ways[0];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      setToast(null);
    }, 2400);
    return () => {
      clearTimeout(t);
    };
  }, [toast]);

  if (!way) return null;
  const si = size ? sizes.indexOf(size) : -1;
  const out = size !== null && way.soldOut.includes(size);
  const pairs = si >= 0 ? left(w, si) : null;

  return (
    <section className="@container relative isolate grid size-full min-h-[36rem] overflow-clip bg-(--em-ink-50) text-(--em-ink-950)">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-6 py-10 @3xl:grid-cols-[1fr_1.1fr]">
        <div className="order-2 @3xl:order-1">
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
            Road running
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none font-black @2xl:text-6xl">
            Tide Runner 3
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-(--em-ink-600)">
            <span className="flex" aria-label="4.6 จาก 5 ดาว">
              {[0, 1, 2, 3, 4].map((k) => (
                <Star
                  key={k}
                  aria-hidden
                  className={cn(
                    "size-4",
                    k < 4 ? "fill-(--em-gold-500) text-(--em-gold-500)" : "text-(--em-ink-300)",
                  )}
                />
              ))}
            </span>
            <span className="tabular-nums">4.6 · 218 รีวิว</span>
          </p>
          <p className="mt-4 max-w-md text-(--em-ink-600)">
            โฟมนุ่มเด้งกับผ้าถักบางเบา วิ่งวันแข่งได้ วิ่งเบา ๆ วันธรรมดาก็ยังสบายเท้า
          </p>
          <p className="mt-4 font-heading text-3xl font-black tabular-nums">
            ฿{price.toLocaleString("th-TH")}
          </p>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold">สี: {way.name}</legend>
            <div className="mt-2 flex gap-2">
              {ways.map((x, k) => (
                <button
                  key={x.name}
                  type="button"
                  aria-label={x.name}
                  aria-pressed={k === w}
                  onClick={() => {
                    setW(k);
                  }}
                  style={{ background: `var(${x.upper})` }}
                  className={cn(
                    "size-9 rounded-full border-2 border-(--em-ink-0) shadow-sm outline-2 outline-offset-2",
                    k === w ? "outline-(--em-blue-600)" : "outline-transparent",
                  )}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-sm font-bold">ไซซ์ (EU)</legend>
            <div className="mt-2 grid max-w-sm grid-cols-6 gap-1.5">
              {sizes.map((s) => {
                const gone = way.soldOut.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    disabled={gone}
                    aria-label={gone ? `${s} หมด` : s}
                    onClick={() => {
                      setSize(s);
                    }}
                    className={cn(
                      "h-10 rounded-md border text-sm tabular-nums",
                      size === s
                        ? "border-(--em-ink-950) bg-(--em-ink-950) text-(--em-ink-0)"
                        : "border-(--em-ink-200) bg-(--em-ink-0) hover:border-(--em-ink-500)",
                      gone && "text-(--em-ink-300) line-through",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 min-h-5 text-sm" aria-live="polite">
              {size === null ? (
                <span className="text-(--em-ink-500)">เลือกไซซ์ก่อน</span>
              ) : out ? (
                <span className="text-(--em-coral-500)">ไซซ์นี้หมดในสีนี้</span>
              ) : pairs !== null && pairs <= 3 ? (
                <span className="text-(--em-coral-500)">เหลือ {pairs} คู่</span>
              ) : (
                <span className="text-(--em-ink-600)">มีของ ส่งภายใน 2 วัน</span>
              )}
            </p>
          </fieldset>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={size === null || out}
              onClick={() => {
                setToast(`ใส่ ${way.name} ไซซ์ ${size ?? ""} ลงถุงแล้ว`);
              }}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-(--em-blue-600) px-5 font-bold text-(--em-ink-0) hover:bg-(--em-blue-700) disabled:opacity-40 @3xl:flex-none"
            >
              <ShoppingBag className="size-5" aria-hidden /> ใส่ถุง
            </button>
            <button
              type="button"
              aria-pressed={liked}
              aria-label="ถูกใจ"
              onClick={() => {
                setLiked(!liked);
              }}
              className="relative grid size-12 place-items-center rounded-md border border-(--em-ink-200) bg-(--em-ink-0)"
            >
              <motion.span
                animate={liked && !still ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <Heart
                  aria-hidden
                  className={cn(
                    "size-5",
                    liked ? "fill-(--em-coral-500) text-(--em-coral-500)" : "",
                  )}
                />
              </motion.span>
              <AnimatePresence>
                {liked && !still && (
                  <motion.span
                    key="burst"
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                  >
                    {Array.from({ length: 8 }, (_, k) => {
                      const a = (k / 8) * Math.PI * 2;
                      return (
                        <motion.span
                          key={k}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(a) * 26,
                            y: Math.sin(a) * 26,
                            opacity: 0,
                            scale: 0.4,
                          }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute top-1/2 left-1/2 -ms-1 -mt-1 size-2 rounded-full bg-(--em-coral-500)"
                        />
                      );
                    })}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* the shoe over its reflection */}
        <div className="relative order-1 grid aspect-[4/3] place-items-center @3xl:order-2">
          <span
            aria-hidden
            style={{ background: `var(${way.upper})` }}
            className="absolute inset-[12%] rounded-full opacity-15 blur-3xl"
          />
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={way.name}
              initial={still ? false : { x: 120, rotate: 8, opacity: 0 }}
              animate={{ x: 0, rotate: 0, opacity: 1 }}
              exit={
                still
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { x: -120, rotate: -8, opacity: 0 }
              }
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg"
            >
              <motion.div
                animate={still ? {} : { y: [0, -14, 0], rotate: [-4, -2, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="vt-live relative z-10"
              >
                <Shoe way={way} />
              </motion.div>
              {/* floor reflection, faded toward the bottom */}
              <div className="-mt-[10%] h-[34%] overflow-clip [mask-image:linear-gradient(to_bottom,black,transparent_75%)]">
                <motion.div
                  animate={still ? {} : { y: [0, 14, 0], rotate: [4, 2, 4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="vt-live -scale-y-100 opacity-20"
                >
                  <Shoe way={way} />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-md bg-(--em-ink-950) px-4 py-2 text-sm text-(--em-ink-0) shadow-lg"
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
