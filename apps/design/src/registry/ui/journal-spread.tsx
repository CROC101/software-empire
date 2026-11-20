"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

type Photo = { slug: string; x: number; y: number; w: number; r: number; tape?: boolean };
type Note = { text: string; x: number; y: number; w: number; r: number };
type Spread = { title: string; bg?: string; photos: Photo[]; notes: Note[] };

// x / y / w are percentages of the whole double page, so items may cross the spine
const spreads: Spread[] = [
  {
    title: "ทริปทะเล",
    bg: "aurora-tide",
    photos: [{ slug: "ripple-pond", x: 58, y: 14, w: 22, r: 4 }],
    notes: [{ text: "น้ำใสจนเห็นเงาเมฆ", x: 8, y: 66, w: 30, r: -3 }],
  },
  {
    title: "คืนดูดาว",
    photos: [
      { slug: "deep-galaxy", x: 6, y: 10, w: 26, r: -5 },
      { slug: "float-particles", x: 30, y: 44, w: 22, r: 3, tape: true },
      { slug: "where-globe", x: 62, y: 16, w: 28, r: 2 },
    ],
    notes: [{ text: "นับดาวตกได้ 7 ดวง", x: 60, y: 72, w: 30, r: -2 }],
  },
  {
    title: "ตลาดเช้า",
    bg: "tide-plasma",
    photos: [{ slug: "particle-title", x: 10, y: 18, w: 24, r: -3, tape: true }],
    notes: [{ text: "ข้าวเหนียวหมดก่อนเจ็ดโมง", x: 56, y: 70, w: 34, r: 2 }],
  },
  {
    title: "กลับบ้าน",
    photos: [
      { slug: "warp-lanes", x: 8, y: 14, w: 30, r: 2 },
      { slug: "ripple-mesh", x: 58, y: 30, w: 30, r: -4, tape: true },
    ],
    notes: [{ text: "ไว้มาอีกนะ", x: 14, y: 70, w: 24, r: -4 }],
  },
];
const n = spreads.length;

/** The whole spread drawn at double width; each page shows its own half. */
function Half({ s, side }: { s: Spread | undefined; side: "left" | "right" }) {
  if (!s) return <div className="size-full bg-(--em-ink-50)" />;
  return (
    <div className="relative size-full overflow-clip bg-(--em-ink-25)">
      <div className={cn("absolute inset-y-0 w-[200%]", side === "left" ? "left-0" : "-left-full")}>
        {s.bg && (
          <img
            src={`/orbit/${s.bg}.webp`}
            alt=""
            draggable={false}
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {s.photos.map((p) => (
          <span
            key={p.slug}
            style={{
              left: `${String(p.x)}%`,
              top: `${String(p.y)}%`,
              width: `${String(p.w)}%`,
              rotate: `${String(p.r)}deg`,
            }}
            className={cn(
              "absolute block shadow-md",
              p.tape ? "" : "bg-(--em-ink-0) p-[2%] pb-[6%]",
            )}
          >
            {p.tape && (
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 h-4 w-1/2 -translate-x-1/2 -rotate-2 bg-(--em-sky-400)/60"
              />
            )}
            <img
              src={`/orbit/${p.slug}.webp`}
              alt=""
              draggable={false}
              className="aspect-square w-full object-cover"
            />
          </span>
        ))}
        {s.notes.map((t) => (
          <span
            key={t.text}
            style={{
              left: `${String(t.x)}%`,
              top: `${String(t.y)}%`,
              width: `${String(t.w)}%`,
              rotate: `${String(t.r)}deg`,
            }}
            className="absolute rounded-sm bg-(--em-ink-0)/90 px-2 py-1 font-heading text-[clamp(0.7rem,2cqi,1.1rem)] font-bold text-(--em-ink-850) shadow-sm"
          >
            {t.text}
          </span>
        ))}
      </div>
      {/* shade toward the spine */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 w-1/6 from-(--em-ink-975)/25 to-transparent",
          side === "left" ? "right-0 bg-linear-to-l" : "left-0 bg-linear-to-r",
        )}
      />
    </div>
  );
}

/**
 * A travel journal open on a double page: photos pinned with a white border or a strip of tape,
 * notes on torn slips, a picture that runs across both pages and folds at the spine. Pages turn
 * on their own until someone touches it; buttons, arrow keys or a sideways swipe turn by hand.
 */
export default function JournalSpread({ seconds = 4 }: { seconds?: number }) {
  const still = useReducedMotionAfterMount();
  const [at, setAt] = useState(0);
  const [turn, setTurn] = useState<1 | -1 | null>(null);
  const [auto, setAuto] = useState(true);

  const flip = (by: 1 | -1) => {
    if (turn || at + by < 0 || at + by >= n) return;
    if (still) setAt(at + by);
    else setTurn(by);
  };
  const byHand = (by: 1 | -1) => {
    setAuto(false);
    flip(by);
  };

  useEffect(() => {
    if (!auto || still) return;
    const t = setInterval(() => {
      if (turn) return;
      if (at >= n - 1) setAt(0);
      else setTurn(1);
    }, seconds * 1000);
    return () => {
      clearInterval(t);
    };
  }, [auto, still, seconds, at, turn]);

  // what lies under the turning leaf
  const left = turn === -1 ? spreads[at - 1] : spreads[at];
  const right = turn === 1 ? spreads[at + 1] : spreads[at];
  // the leaf: forward shows this right page then the next left; back is the reverse
  const front = turn === 1 ? spreads[at] : spreads[at - 1];
  const back = turn === 1 ? spreads[at + 1] : spreads[at];
  const shown = spreads[turn ? at + turn : at];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="สมุดบันทึกการเดินทาง"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") byHand(1);
        else if (e.key === "ArrowLeft") byHand(-1);
      }}
      className="@container relative isolate flex size-full min-h-[36rem] flex-col items-center justify-center gap-5 overflow-clip bg-(--em-ink-850) px-4 py-10 text-(--em-ink-50) outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--em-sky-400)"
    >
      <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">Journal</p>

      <motion.div
        onPanEnd={(_, { offset }) => {
          if (Math.abs(offset.x) > 40) byHand(offset.x < 0 ? 1 : -1);
        }}
        className="relative grid aspect-[3/2] w-full max-w-4xl touch-pan-y grid-cols-2 rounded-md bg-(--em-ink-700) p-[1.2%] shadow-2xl [perspective:2200px]"
      >
        <Half s={left} side="left" />
        <Half s={right} side="right" />
        {turn && (
          <motion.div
            key={`${String(at)}${String(turn)}`}
            initial={{ rotateY: turn === 1 ? 0 : -180 }}
            animate={{ rotateY: turn === 1 ? -180 : 0 }}
            transition={{ duration: 1.1, ease: [0.45, 0, 0.2, 1] }}
            onAnimationComplete={() => {
              setAt(at + turn);
              setTurn(null);
            }}
            className="absolute inset-y-[1.2%] right-[1.2%] w-[48.8%] origin-left [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <Half s={front} side="right" />
            </div>
            <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <Half s={back} side="left" />
            </div>
          </motion.div>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-[1.2%] left-1/2 w-px -translate-x-1/2 bg-(--em-ink-975)/30"
        />
      </motion.div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="หน้าก่อน"
          disabled={at === 0}
          onClick={() => {
            byHand(-1);
          }}
          className="grid size-11 place-items-center rounded-md border border-(--em-ink-600) hover:bg-(--em-ink-800) focus-visible:outline-2 focus-visible:outline-(--em-sky-400) disabled:opacity-40"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <p aria-live="polite" className="min-w-40 text-center">
          <span className="font-heading text-xl font-black">{shown?.title}</span>
          <span className="ms-2 font-mono text-xs text-(--em-ink-400) tabular-nums">
            {String((turn ? at + turn : at) + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </p>
        <button
          type="button"
          aria-label="หน้าถัดไป"
          disabled={at === n - 1}
          onClick={() => {
            byHand(1);
          }}
          className="grid size-11 place-items-center rounded-md border border-(--em-ink-600) hover:bg-(--em-ink-800) focus-visible:outline-2 focus-visible:outline-(--em-sky-400) disabled:opacity-40"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
    </section>
  );
}
