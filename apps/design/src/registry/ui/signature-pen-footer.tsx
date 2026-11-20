"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

// a made-up signature as single strokes, in order: the run, the cross, the dot, the swash
const strokes = [
  "M40 110 C20 60 70 30 95 60 C110 80 80 120 70 100 C60 80 120 50 140 90 C150 115 170 70 185 85 C200 100 205 120 220 95 C235 70 250 60 255 95 C258 120 280 70 300 80 C320 90 310 120 330 100 C350 80 370 60 380 95 C385 115 410 80 430 85 C450 90 460 110 480 90",
  "M196 72 L268 63",
  "M318 52 l2 2",
  "M60 136 C200 120 380 126 540 112",
];
const REST = { x: 560, y: 70 };
const SPEED = 520; // viewBox units per second while the nib is down

/** A short, steady document id from the word, like "7F3A-21C9". */
function docId(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

/**
 * A footer that signs itself: a stylus glides in, its shadow closes in as the nib touches down,
 * and it writes the signature stroke by stroke, lifting between strokes, then rests. The line
 * under it becomes a timestamp. After that the pen follows the pointer, pressing writes ink that
 * dries and fades, and "sign again" replays it.
 */
export default function SignaturePenFooter({ name = "crocwork" }: { name?: string }) {
  const still = useReducedMotionAfterMount();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const pen = useRef<SVGGElement>(null);
  const shadow = useRef<SVGEllipseElement>(null);
  const [signed, setSigned] = useState<Date | null>(null);
  const [round, setRound] = useState(0);
  const [ink, setInk] = useState<{ id: number; d: string }[]>([]);
  const drawing = useRef<{ id: number; d: string } | null>(null);

  // everything per frame goes straight to the DOM, so the pen never re-renders React
  const place = (x: number, y: number, lift: number, lean = 0) => {
    pen.current?.setAttribute(
      "transform",
      `translate(${String(x)} ${String(y - lift)}) rotate(${String(-30 + lean)})`,
    );
    shadow.current?.setAttribute("cx", String(x + lift * 0.7));
    shadow.current?.setAttribute("cy", String(y + lift * 0.25));
    shadow.current?.setAttribute("opacity", String(Math.max(0.12, 0.45 - lift / 60)));
  };

  useEffect(() => {
    if (!seen && !still) return;
    let stop = false;
    const stopped = () => stop; // read through a call: the cleanup flips it between awaits
    const els = paths.current.filter((p): p is SVGPathElement => !!p);
    for (const p of els) {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = still ? "0" : String(len);
    }
    if (still) {
      place(REST.x, REST.y, 14);
      const f = requestAnimationFrame(() => {
        setSigned(new Date());
      });
      return () => {
        cancelAnimationFrame(f);
      };
    }
    const run = async () => {
      let at = { x: 660, y: -20, lift: 40 };
      const glide = (to: { x: number; y: number; lift: number }, duration: number) => {
        const from = at;
        at = to;
        return animate(0, 1, {
          duration,
          ease: "easeInOut",
          onUpdate: (v) => {
            place(
              from.x + (to.x - from.x) * v,
              from.y + (to.y - from.y) * v,
              from.lift + (to.lift - from.lift) * v,
            );
          },
        });
      };
      for (const p of els) {
        if (stopped()) return;
        const len = p.getTotalLength();
        const s = p.getPointAtLength(0);
        await glide({ x: s.x, y: s.y, lift: 14 }, 0.35);
        await glide({ x: s.x, y: s.y, lift: 0 }, 0.12);
        if (stopped()) return;
        let last = s;
        await animate(0, 1, {
          duration: Math.max(0.18, len / SPEED),
          ease: [0.3, 0.1, 0.7, 0.9], // eases in and out of a stroke but never stalls
          onUpdate: (v) => {
            const q = p.getPointAtLength(v * len);
            place(q.x, q.y, 0, Math.max(-8, Math.min(8, (q.x - last.x) * 2)));
            last = q;
            p.style.strokeDashoffset = String(len * (1 - v));
          },
        });
        const e = p.getPointAtLength(len);
        at = { x: e.x, y: e.y, lift: 0 };
        await glide({ x: e.x, y: e.y, lift: 14 }, 0.12);
      }
      if (stopped()) return;
      await glide({ ...REST, lift: 14 }, 0.6);
      if (!stopped()) setSigned(new Date());
    };
    void run();
    return () => {
      stop = true;
    };
    // replays on "sign again"; place() only writes to refs
  }, [seen, still, round]);

  const toSvg = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 640, y: ((e.clientY - r.top) / r.height) * 170 };
  };
  const when = signed?.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

  return (
    <footer
      ref={ref}
      className="@container relative isolate grid size-full min-h-[34rem] content-center gap-8 overflow-clip bg-(--em-ink-975) px-6 py-14 text-(--em-ink-50)"
    >
      <div className="mx-auto w-full max-w-4xl">
        <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
          Signed off
        </p>
        <p className="mt-3 max-w-xl font-heading text-3xl leading-tight font-black @2xl:text-4xl">
          {"งานทุกชิ้นของเราเซ็นชื่อกำกับ เพราะเราอยู่กับมันจนจบ".split(" ").map((w, i) => (
            <motion.span
              key={w}
              initial={still ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="inline-block pe-[0.3em]"
            >
              {w}
            </motion.span>
          ))}
        </p>

        <svg
          viewBox="0 0 640 170"
          role="img"
          aria-label={`ลายเซ็นของ ${name}`}
          onPointerMove={(e) => {
            if (!signed || still) return;
            const p = toSvg(e);
            place(p.x, p.y, drawing.current ? 0 : 12);
            if (drawing.current) {
              drawing.current.d += ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
              const cur = drawing.current;
              setInk((all) => all.map((s) => (s.id === cur.id ? { ...cur } : s)));
            }
          }}
          onPointerDown={(e) => {
            if (!signed || still || e.pointerType === "touch") return;
            e.currentTarget.setPointerCapture(e.pointerId);
            const p = toSvg(e);
            drawing.current = { id: Date.now(), d: `M${p.x.toFixed(1)} ${p.y.toFixed(1)}` };
            const cur = drawing.current;
            setInk((all) => [...all.slice(-12), cur]);
          }}
          onPointerUp={() => {
            drawing.current = null;
          }}
          onPointerLeave={() => {
            if (signed && !drawing.current) place(REST.x, REST.y, 14);
          }}
          className="mt-6 w-full touch-pan-y overflow-visible"
        >
          <line
            x1="40"
            y1="150"
            x2="600"
            y2="150"
            className="stroke-(--em-ink-700)"
            strokeDasharray="4 6"
          />
          {strokes.map((d, k) => (
            <path
              key={`${String(round)}-${String(k)}`}
              ref={(el) => {
                paths.current[k] = el;
              }}
              d={d}
              style={{ strokeDasharray: "0 9999" }} // hidden until the pen writes it
              className="fill-none stroke-(--em-sky-400)"
              strokeWidth={k === 2 ? 5 : 3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {ink.map((s) => (
            <motion.path
              key={s.id}
              d={s.d}
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 1, 0] }}
              transition={{ duration: 3.5, times: [0, 0.6, 1] }}
              onAnimationComplete={() => {
                if (drawing.current?.id !== s.id) setInk((all) => all.filter((o) => o.id !== s.id));
              }}
              className="fill-none stroke-(--em-ink-200)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* the stylus: shadow on the paper, then the pen with its nib at the origin */}
          <ellipse
            ref={shadow}
            cx={660}
            cy={0}
            rx="16"
            ry="4"
            className="fill-(--em-ink-0)"
            opacity="0"
          />
          <g ref={pen} transform="translate(660 -60) rotate(-30)" aria-hidden>
            <path d="M0 0 L-4 -14 L4 -14 Z" className="fill-(--em-ink-300)" />
            <rect x="-5" y="-96" width="10" height="82" rx="3" className="fill-(--em-ink-100)" />
            <rect x="-5" y="-96" width="10" height="14" rx="3" className="fill-(--em-sky-500)" />
          </g>
        </svg>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 text-sm text-(--em-ink-400)">
          <p aria-live="polite" className="tabular-nums">
            {signed ? `เซ็นเมื่อ ${when ?? ""} · ID ${docId(name)}` : "กำลังเซ็น"}
          </p>
          <button
            type="button"
            disabled={!signed || still}
            onClick={() => {
              setInk([]);
              setSigned(null);
              setRound((r) => r + 1);
            }}
            className="rounded-md border border-(--em-ink-700) px-4 py-2 text-(--em-ink-100) hover:bg-(--em-ink-850) focus-visible:outline-2 focus-visible:outline-(--em-sky-400) disabled:opacity-40"
          >
            เซ็นอีกครั้ง
          </button>
        </div>
      </div>
    </footer>
  );
}
