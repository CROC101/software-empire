"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import * as React from "react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";
import { MacBookKeyboard } from "./macbook-keyboard";
import { ScreenRail, useAutoplay } from "./screen-rail";

/**
 * Laptop preview: a pinned scroll scene with a notebook in the middle. Scrolling opens the lid;
 * then the screens play on their own (a timer line on the card) and a rail of buttons picks any
 * of them. The scroll length does not grow with the number of screens, so 100 apps scroll as
 * far as 4. Native scrolling only: a tall section with a sticky stage. Transforms and opacity
 * only. Reduced motion shows the laptop open with the rail and no autoplay.
 *
 * After "MacBook Neo" frame-sequence hero (21st.dev, MIT): the 941 product frames are replaced
 * by a CSS laptop showing real 16:10 screenshots; cards, ticks and progress bar kept.
 */
export type LaptopStep = {
  /** A 16:10 screenshot. */
  src: string;
  title: string;
  description: string;
  /** Short label in the card corner, e.g. the app name. */
  label: string;
  icon?: React.ReactNode;
  /** A palette token, e.g. "var(--em-blue-500)". */
  color: string;
  href?: string;
  /** Link text, e.g. "เปิดดู". */
  cta?: string;
};

const OPEN = 0.14; // share of the scroll spent opening the lid

const Screen = ({ step, active }: { step: LaptopStep; active: boolean }) => (
  <img
    src={step.src}
    alt={active ? step.title : ""}
    aria-hidden={!active}
    draggable={false}
    decoding="async"
    className="absolute inset-0 h-full w-full object-cover object-top transition-[opacity,transform] duration-700 ease-out"
    style={{ opacity: active ? 1 : 0, transform: active ? "none" : "scale(1.04)" }}
  />
);

// MacBook Pro 14" proportions, as fractions of the body width (W): the lid is as tall as the
// deck is deep, so it folds flat onto the keys.
const LID = 0.66; // lid height and deck depth, in W
const DECK_TILT = 66; // degrees the deck leans toward the viewer from upright (camera above)
const GRILLE = "radial-gradient(circle, var(--em-ink-500) 0.9px, transparent 1.1px) 0 0 / 5px 5px";

function Laptop({
  steps,
  active,
  lid,
  shade,
  logo,
}: {
  steps: readonly LaptopStep[];
  active: number;
  lid?: MotionValue<number>;
  shade?: MotionValue<number>;
  logo?: React.ReactNode;
}) {
  const aluminium =
    "linear-gradient(180deg, var(--em-ink-50), var(--em-ink-200) 55%, var(--em-ink-300))";
  return (
    // one 3D scene, so the lid really folds down onto the keyboard; real perspective, so the
    // deck widens toward us like a photo taken from above
    <div
      className="relative mb-[10%] w-[min(640px,88vw,calc((100svh-26rem)/1.05))] lg:mb-0 lg:w-[min(680px,48vw,calc((100svh-18rem)/1.05))]"
      style={{ perspective: "2600px", perspectiveOrigin: "50% 15%", transformStyle: "preserve-3d" }}
    >
      {/* lid: upright when open (0deg, no 3D on the screen, so it stays sharp) */}
      <motion.div
        className="relative mx-auto w-full origin-bottom"
        style={{ rotateX: lid ?? 0, transformStyle: "preserve-3d" }}
      >
        <div
          className="relative rounded-t-[3.2%_4.8%] p-[1.4%] pb-[2%]"
          style={{
            backfaceVisibility: "hidden",
            background: "var(--em-ink-975)",
            // the aluminium rim around the black bezel
            boxShadow:
              "0 0 0 1.5px var(--em-ink-300), 0 0 0 2.5px var(--em-ink-400), 0 18px 40px -18px oklch(0 0 0 / 0.5)",
          }}
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-t-[1.6%_2.5%] bg-black">
            {steps.map((s, i) => {
              // only the current screen and its neighbours are in the DOM, so 100 apps load 3 images
              const d = Math.abs(i - Math.max(0, active));
              if (d > 1 && d < steps.length - 1) return null;
              return <Screen key={s.src} step={s} active={i === Math.max(0, active)} />;
            })}
            {/* glass glare, and the dark of a screen still waking up */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(115deg, rgb(255 255 255 / 0.09) 0%, transparent 34%)",
              }}
            />
            {shade && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-black"
                style={{ opacity: shade }}
              />
            )}
          </div>
          {/* the notch, with its camera */}
          <span
            aria-hidden
            className="absolute top-[1.4%] left-1/2 grid h-[3.4%] w-[9%] -translate-x-1/2 place-items-center rounded-b-[30%_60%]"
            style={{ background: "var(--em-ink-975)" }}
          >
            <span
              className="size-[18%] min-h-[3px] min-w-[3px] rounded-full"
              style={{
                background: "radial-gradient(circle, var(--em-ink-600), var(--em-ink-900))",
              }}
            />
          </span>
        </div>
        {/* the back of the lid, seen while it is shut */}
        <div
          aria-hidden
          className="absolute inset-0 grid place-items-center rounded-t-[3.2%_4.8%]"
          style={{
            transform: "rotateX(180deg)",
            backfaceVisibility: "hidden",
            background: aluminium,
          }}
        >
          <span className="grid h-[16%] place-items-center opacity-80 [&>*]:h-full [&>*]:w-auto">
            {logo}
          </span>
        </div>
      </motion.div>

      {/* hinge: the dark band where the lid meets the body */}
      <div
        aria-hidden
        className="relative mx-auto aspect-[100/1.3] w-[96%] rounded-b-sm"
        style={{ background: "linear-gradient(180deg, var(--em-ink-800), var(--em-ink-600))" }}
      />

      {/* deck: tilted toward us; keyboard, speaker grilles and trackpad sized like the real one */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: `100 / ${String(Math.round(LID * 100 * Math.cos((DECK_TILT * Math.PI) / 180) + 3))}`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 origin-top rounded-b-[4%_10%]"
          style={{
            aspectRatio: `100 / ${String(LID * 100)}`,
            transform: `rotateX(${String(DECK_TILT)}deg)`,
            transformStyle: "preserve-3d",
            background: aluminium,
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.8), inset 0 -2px 0 var(--em-ink-400)",
          }}
        >
          {[3, 89].map((left) => (
            <span
              key={left}
              aria-hidden
              className="absolute top-[5%] h-[58%] w-[8%]"
              style={{ left: `${String(left)}%`, background: GRILLE, opacity: 0.7 }}
            />
          ))}
          <div
            className="absolute top-[4%] left-[12%] w-[76%] rounded-[1.2%] p-[0.5%]"
            style={{
              background: "var(--em-ink-300)",
              boxShadow: "inset 0 1px 3px oklch(0 0 0 / 0.35)",
            }}
          >
            <MacBookKeyboard className="w-full" />
          </div>
          <span
            aria-hidden
            className="absolute bottom-[5%] left-1/2 h-[27%] w-[38%] -translate-x-1/2 rounded-[3%_5%]"
            style={{
              background: "linear-gradient(180deg, var(--em-ink-100), var(--em-ink-200))",
              boxShadow: "inset 0 0 0 1px var(--em-ink-300), inset 0 1px 2px oklch(0 0 0 / 0.12)",
            }}
          />
          {/* front edge, with the thumb notch for lifting the lid */}
          <div
            aria-hidden
            className="absolute inset-x-[0.5%] top-full h-[5%] origin-top rounded-b-[40%_100%]"
            style={{
              transform: `rotateX(${String(-DECK_TILT - 18)}deg)`,
              background: "linear-gradient(180deg, var(--em-ink-200), var(--em-ink-500))",
            }}
          >
            <span
              className="absolute top-0 left-1/2 h-[55%] w-[12%] -translate-x-1/2 rounded-b-[50%]"
              style={{ background: "var(--em-ink-400)" }}
            />
          </div>
        </div>
      </div>
      {/* contact shadow on the table */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[2%] -bottom-4 h-8 rounded-[50%] blur-2xl"
        style={{ background: "oklch(0 0 0 / 0.4)" }}
      />
    </div>
  );
}

function StepCard({
  step,
  index,
  total,
  state,
  ticks,
}: {
  step: LaptopStep;
  index: number;
  total: number;
  state: "prev" | "active" | "next" | "static";
  ticks: React.ReactNode;
}) {
  const live = state === "active" || state === "static";
  return (
    <article
      aria-hidden={!live}
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-xl border p-5 shadow-xl backdrop-blur-md transition-[opacity,transform] duration-500 ease-out",
        state !== "static" && "absolute right-0 bottom-0",
        !live && "pointer-events-none",
      )}
      style={{
        background: "color-mix(in oklab, var(--background) 82%, transparent)",
        opacity: live ? 1 : 0,
        transform:
          state === "prev" ? "translateY(-18px)" : state === "next" ? "translateY(18px)" : "none",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full blur-3xl"
        style={{ background: `color-mix(in oklab, ${step.color} 35%, transparent)` }}
      />
      <div className="relative flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          <strong className="text-foreground">{String(index + 1).padStart(2, "0")}</strong> /{" "}
          {String(total).padStart(2, "0")}
        </span>
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-md text-white [&_svg]:size-4"
          style={{ background: step.color }}
        >
          {step.icon}
        </span>
      </div>
      <h3 className="relative mt-4 text-xl font-black tracking-tight">{step.title}</h3>
      <p className="relative mt-1.5 text-sm text-muted-foreground">{step.description}</p>
      <div className="relative mt-5 flex items-center justify-between gap-4">
        {ticks}
        <span className="shrink-0 text-xs font-semibold" style={{ color: step.color }}>
          {step.href ? (
            <a href={step.href} tabIndex={live ? undefined : -1} className="hover:underline">
              {step.cta ?? step.label} →
            </a>
          ) : (
            step.label
          )}
        </span>
      </div>
    </article>
  );
}

export function LaptopPreview({
  steps,
  eyebrow,
  title,
  subtitle,
  logo,
  pickLabel,
  interval = 4500,
  id,
  className,
}: {
  steps: readonly LaptopStep[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Fades once the lid starts opening, e.g. "เลื่อนลงเพื่อเปิดฝา". */
  subtitle?: string;
  /** Small mark on the back of the lid. */
  logo?: React.ReactNode;
  /** Accessible name of the row of screen buttons, e.g. "เลือกหน้าจอ". */
  pickLabel: string;
  /** ms each screen stays up while it plays on its own */
  interval?: number;
  id?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotionAfterMount();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const n = steps.length;

  // the scroll only opens the lid (so the section is as long for 4 screens as for 100);
  // the screens then play on their own, or the visitor picks one from the rail
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = p >= OPEN && p < 0.995;
    setOpen((cur) => (cur === next ? cur : next));
  });
  useAutoplay(n, active, setActive, open && !paused && !reduced, interval);
  const pick = (i: number) => {
    setActive(i);
    setPaused(true);
  };

  // a spring between scroll and the scene: smoother, and keeps motion off its scroll-timeline path
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.0001 });
  const lid = useTransform(smooth, [0, OPEN], [-117, 0]); // shut on the keys, then upright (flat = sharp)
  const shade = useTransform(smooth, [OPEN * 0.4, OPEN], [1, 0]);
  const subOpacity = useTransform(smooth, [0, OPEN * 0.5], [1, 0]);

  const step = steps[active];
  const head = (
    <div className="flex flex-col items-center text-center">
      {eyebrow}
      <h2 className="text-4xl font-black tracking-tight sm:text-6xl">{title}</h2>
    </div>
  );
  const rail = (
    <ScreenRail
      label={pickLabel}
      active={active}
      onPick={pick}
      items={steps.map((s) => ({ key: s.src, label: s.title, icon: s.icon, color: s.color }))}
    />
  );

  if (reduced) {
    return (
      <section id={id} ref={ref} className={cn("mx-auto max-w-6xl px-4 py-24 sm:px-6", className)}>
        {head}
        <div className="mt-10 flex justify-center">
          <Laptop steps={steps} active={active} logo={logo} />
        </div>
        <div className="mx-auto mt-6 flex max-w-3xl justify-center">{rail}</div>
        {step && (
          <div className="mt-6 flex justify-center">
            <StepCard step={step} index={active} total={n} state="static" ticks={<span />} />
          </div>
        )}
      </section>
    );
  }

  return (
    <section id={id} ref={ref} className={cn("relative h-[220vh]", className)}>
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-5 overflow-hidden px-4 pt-14 pb-6 lg:gap-8">
        {/* soft glow under the laptop, in the current screen's colour */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-[50vh] max-w-4xl rounded-full blur-3xl transition-[background] duration-700"
          style={{
            background: `radial-gradient(closest-side, color-mix(in oklab, ${step?.color ?? "var(--em-blue-500)"} 22%, transparent), transparent)`,
          }}
        />
        <div className="relative">
          {head}
          {subtitle && (
            <motion.p
              style={{ opacity: subOpacity }}
              className="mt-3 text-center text-sm text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        <div
          className="relative grid w-full max-w-6xl justify-items-center gap-5 lg:grid-cols-[1fr_24rem] lg:items-end lg:gap-10"
          onPointerEnter={() => {
            setPaused(true);
          }}
          onPointerLeave={() => {
            setPaused(false);
          }}
        >
          <div className="flex justify-center">
            <Laptop steps={steps} active={active} lid={lid} shade={shade} logo={logo} />
          </div>
          <div className="flex w-full max-w-sm flex-col gap-3">
            {step && (
              <StepCard
                key={active}
                step={step}
                index={active}
                total={n}
                state="static"
                ticks={
                  // time left on this screen while it plays on its own
                  <span className="block h-[3px] flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]">
                    <span
                      key={`${String(active)}-${String(open && !paused)}`}
                      className="lp-timer block h-full origin-left rounded-full"
                      style={
                        {
                          background: step.color,
                          "--lp-time": `${String(interval)}ms`,
                          animationPlayState: open && !paused ? "running" : "paused",
                        } as React.CSSProperties
                      }
                    />
                  </span>
                }
              />
            )}
            {rail}
          </div>
        </div>
      </div>
    </section>
  );
}
