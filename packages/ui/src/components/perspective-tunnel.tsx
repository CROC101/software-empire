"use client";

import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";

/**
 * Perspective tunnel: a pinned scroll interlude where cards fly out of the distance past the
 * camera, scattered on a golden-angle spiral round a headline, while the camera drifts with the
 * pointer. Native scrolling only: the section is tall, its stage `position: sticky`, progress
 * is read from the scroll position (never wheel-captured). Transforms and opacity only.
 * Reduced motion renders the headline over a plain row of cards.
 *
 * After "Perspective Tunnel Hero" (21st.dev, MIT): motion/react instead of framer-motion,
 * scroll-driven instead of a hijacked wheel, stage-sized, token colours, linkable cards.
 */
export type TunnelItem = { src: string; title: string; caption?: string; href?: string };

const SPRING = { stiffness: 60, damping: 25, mass: 0.5 };

type Stage = { width: number; height: number; mobile: boolean };
type Card = { cos: number; sin: number; rx: number; ry: number; rot: number };

const place = (i: number): Card => {
  const a = i * 137.5 * (Math.PI / 180); // golden angle: no two cards line up
  return {
    cos: Math.cos(a),
    sin: Math.sin(a),
    rx: 0.28 + (i % 3) * 0.08,
    ry: 0.26 + (i % 2) * 0.09,
    rot: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
  };
};

function TunnelCard({
  item,
  index,
  total,
  progress,
  pointer,
  stage,
}: {
  item: TunnelItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  stage: Stage;
}) {
  const card = place(index);
  const span = 0.55;
  const start = (index / total) * (1 - span);
  const local = useTransform(progress, [start, start + span], [0, 1]);
  const z = useTransform(local, [0, 1], stage.mobile ? [-1200, 350] : [-1700, 500]);
  const opacity = useTransform(local, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);
  const width = stage.mobile
    ? Math.max(130, Math.min(180, stage.width * 0.38))
    : Math.max(180, Math.min(270, stage.width * 0.18));
  const bx = card.cos * stage.width * card.rx;
  const by = card.sin * stage.height * card.ry;
  const pan = stage.mobile ? 20 : 45;
  const transform = useTransform([z, pointer.x, pointer.y], (v: number[]) => {
    const [cz = 0, px = 0, py = 0] = v;
    return `translate3d(calc(-50% + ${String(bx - px * pan)}px), calc(-50% + ${String(by - py * pan)}px), ${String(cz)}px) rotateZ(${String(card.rot)}deg)`;
  });
  // off the far end the card is invisible: let clicks through
  const events = useTransform(opacity, (o) => (o > 0.4 ? "auto" : "none"));

  const Tag = item.href ? "a" : "div";
  return (
    <motion.div
      style={{ width, transform, opacity, zIndex: index + 1, pointerEvents: events }}
      className="absolute top-1/2 left-1/2 aspect-[4/5] select-none will-change-transform"
    >
      <Tag
        href={item.href}
        className="group relative block h-full w-full overflow-hidden rounded-xl shadow-2xl ring-1 transition-shadow duration-500 hover:ring-2"
        style={
          {
            background: "var(--muted)",
            "--tw-ring-color": "color-mix(in oklab, var(--foreground) 12%, transparent)",
          } as React.CSSProperties
        }
      >
        <img
          src={item.src}
          alt={item.title}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/10 to-transparent p-4 text-white">
          <span className="font-mono text-xs tracking-[0.2em] uppercase drop-shadow-md">
            {item.title}
          </span>
          {item.caption && <span className="mt-0.5 text-xs opacity-80">{item.caption}</span>}
        </span>
      </Tag>
    </motion.div>
  );
}

export function PerspectiveTunnel({
  items,
  eyebrow,
  title,
  body,
  prompt,
  id,
  className,
}: {
  items: readonly TunnelItem[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Shown at the bottom until the flight starts, e.g. "เลื่อนลงเพื่อบินเข้าไป". */
  prompt?: string;
  id?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionAfterMount();
  const [stage, setStage] = React.useState<Stage>({ width: 1280, height: 800, mobile: false });

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setStage({ width: el.clientWidth, height: el.clientHeight, mobile: el.clientWidth < 768 });
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [reduced]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });

  // the camera drifts with the pointer
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointer = { x: useSpring(rawX, SPRING), y: useSpring(rawY, SPRING) };
  React.useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced, rawX, rawY]);

  const titleScale = useTransform(progress, [0, 0.5, 1], [0.7, 1, 1.35]);
  const titleOpacity = useTransform(progress, [0, 0.12, 0.85, 1], [0.25, 1, 1, 0]);
  const promptOpacity = useTransform(progress, [0, 0.12], [1, 0]);

  const heading = (
    <>
      {eyebrow}
      <h2 className="text-5xl leading-[0.95] font-black tracking-tighter sm:text-7xl md:text-8xl">
        {title}
      </h2>
      {body && (
        <p className="mt-4 max-w-[36ch] text-sm text-muted-foreground sm:text-base">{body}</p>
      )}
    </>
  );

  if (reduced) {
    return (
      <section id={id} ref={ref} className={cn("mx-auto max-w-6xl px-4 py-24 sm:px-6", className)}>
        <div className="flex flex-col items-center text-center">{heading}</div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {items.map((item) => (
            <a
              key={item.src}
              href={item.href}
              className="block aspect-[4/5] w-40 overflow-hidden rounded-xl ring-1 ring-border"
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover object-top"
              />
            </a>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id={id} ref={ref} className={cn("relative h-[320vh]", className)}>
      <div
        ref={stageRef}
        className="sticky top-0 flex h-svh items-center justify-center overflow-hidden"
        style={{ perspective: stage.mobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}
      >
        {/* dot grid and a blue glow, faded out at the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--foreground) 18%, transparent) 1px, transparent 1px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklab, var(--em-blue-500) 16%, transparent) 0%, transparent 70%)",
          }}
        />
        {/* depth rings */}
        <div
          aria-hidden
          className="pointer-events-none absolute size-[48vmin] rounded-full border"
          style={{ borderColor: "color-mix(in oklab, var(--em-blue-500) 22%, transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute size-[76vmin] rounded-full border border-dashed"
          style={{ borderColor: "color-mix(in oklab, var(--foreground) 14%, transparent)" }}
        />

        <motion.div
          style={{ scale: titleScale, opacity: titleOpacity }}
          className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center"
        >
          {heading}
        </motion.div>

        {prompt && (
          <motion.div
            aria-hidden
            style={{ opacity: promptOpacity }}
            className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 text-sm text-muted-foreground"
          >
            <span>{prompt}</span>
            <span className="h-6 w-px bg-gradient-to-b from-[var(--em-blue-500)] to-transparent" />
          </motion.div>
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, i) => (
            <TunnelCard
              key={item.src}
              item={item}
              index={i}
              total={items.length}
              progress={progress}
              pointer={pointer}
              stage={stage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
