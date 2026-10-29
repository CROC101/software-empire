"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { cn } from "../lib/cn";
import { useReducedMotionAfterMount } from "../lib/use-reduced-motion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Signal bars, Wi-Fi and battery, drawn at the size of the status bar text. */
function StatusIcons() {
  return (
    <span aria-hidden className="flex items-center gap-[0.35em]">
      <svg viewBox="0 0 18 12" className="h-[0.75em]" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="0.8" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
        <rect x="10" y="3" width="3" height="9" rx="0.8" />
        <rect x="15" y="0" width="3" height="12" rx="0.8" />
      </svg>
      <svg viewBox="0 0 16 12" className="h-[0.75em]" fill="currentColor">
        <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6-1.9 2L8 12l1.9-2.6L8 9.4Z" />
      </svg>
      <svg viewBox="0 0 27 13" className="h-[0.8em]" fill="none">
        <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
        <rect x="2" y="2" width="19" height="9" rx="2" fill="currentColor" />
        <path d="M24.5 4.5v4a2 2 0 0 0 0-4Z" fill="currentColor" opacity="0.45" />
      </svg>
    </span>
  );
}

/**
 * Realistic iPhone: brushed titanium edge, black bezel, Dynamic Island, side buttons and a
 * live-looking status bar. Size it with `className` (width); everything inside scales in %.
 *  - statusBar "solid": a light strip above the screen content (for app screenshots)
 *  - statusBar "overlay": white status text floating over full-bleed content
 *  - statusBar "none": just the glass
 */
export function PhoneFrame({
  children,
  className,
  screenClassName,
  statusBar = "solid",
}: {
  children?: ReactNode;
  className?: string;
  screenClassName?: string;
  statusBar?: "solid" | "overlay" | "none";
}) {
  const status =
    statusBar === "none" ? null : (
      <div
        aria-hidden
        className={cn(
          "relative z-10 flex h-[6.2%] shrink-0 items-center justify-between px-[9%] pt-[1.5%] text-[clamp(6px,2.6cqw,13px)] font-semibold",
          statusBar === "solid"
            ? "bg-[var(--em-ink-0)] text-[var(--em-ink-975)]"
            : "absolute inset-x-0 top-0 text-[var(--em-ink-0)]",
        )}
      >
        <span>9:41</span>
        <StatusIcons />
      </div>
    );
  return (
    <div
      className={cn(
        "relative mx-auto w-[13rem] [container-type:inline-size] sm:w-[15rem] md:w-[17rem]",
        className,
      )}
    >
      {/* side buttons: action + volume on the left, power on the right */}
      {[
        "-left-[1.2%] top-[15%] h-[4%]",
        "-left-[1.2%] top-[22%] h-[7.5%]",
        "-left-[1.2%] top-[31%] h-[7.5%]",
        "-right-[1.2%] top-[24%] h-[11%]",
      ].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={cn(
            "absolute w-[1.6%] rounded-sm bg-[linear-gradient(90deg,oklch(0.38_0.005_260),oklch(0.62_0.005_260),oklch(0.38_0.005_260))]",
            pos,
          )}
        />
      ))}
      {/* titanium band → black bezel → glass */}
      <div className="aspect-[9/19.5] rounded-[16%/7.4%] bg-[linear-gradient(145deg,oklch(0.62_0.005_260),oklch(0.32_0.006_260)_45%,oklch(0.55_0.005_260))] p-[1.1%] shadow-[0_2px_4px_oklch(0_0_0/0.25),0_30px_50px_-18px_oklch(0_0_0/0.45)]">
        <div className="size-full rounded-[15%/7%] bg-[oklch(0.13_0.005_260)] p-[2.6%]">
          <div
            className={cn(
              "relative flex size-full flex-col overflow-hidden rounded-[12.5%/5.8%] bg-background",
              screenClassName,
            )}
          >
            <div
              aria-hidden
              className="absolute left-1/2 top-[1.7%] z-20 h-[3.3%] w-[32%] -translate-x-1/2 rounded-full bg-black"
            />
            {status}
            <div className="relative min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero whose phone starts tilted back, straightens as the section scrolls through, and climbs
 * over the headline (`titleComponent` renders behind it). Tune duration with `className="h-[…]"`.
 * Reduced motion: flat, static, no scroll listener (so a progress-driven screen stays at 0).
 */
export function PhoneScrollHero({
  titleComponent,
  children,
  overlap = 20,
  tilt = 22,
  pinned = false,
  phoneClassName,
  className,
}: {
  /** The headline, behind the phone; a function gets the scroll progress like `children`. */
  titleComponent: ReactNode | ((progress: MotionValue<number>) => ReactNode);
  /** The screen; a function gets the scroll progress (0 to 1) to drive what is on it. */
  children?: ReactNode | ((progress: MotionValue<number>) => ReactNode);
  /** how far the phone climbs into the title, % of its own height */
  overlap?: number;
  /** starting backward tilt, deg */
  tilt?: number;
  /** Pin the scene to the screen (sticky) for the whole scroll, instead of letting it pass by. */
  pinned?: boolean;
  /** Extra classes for the phone, e.g. its width. */
  phoneClassName?: string;
  className?: string;
}) {
  const reduced = useReducedMotionAfterMount();
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useMotionValue(0);

  useIsomorphicLayoutEffect(() => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    // read the section's own window: useScroll binds to the top window and dies inside iframes
    const win = el.ownerDocument.defaultView ?? window;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - win.innerHeight);
      progress.set(Math.min(1, Math.max(0, -rect.top / travel)));
    };
    const onScroll = () => {
      if (!raf) raf = win.requestAnimationFrame(update);
    };
    update();
    win.addEventListener("scroll", onScroll, { passive: true });
    win.addEventListener("resize", onScroll);
    return () => {
      win.removeEventListener("scroll", onScroll);
      win.removeEventListener("resize", onScroll);
      if (raf) win.cancelAnimationFrame(raf);
    };
  }, [reduced, progress]);

  const rotateX = useTransform(progress, [0, 1], [tilt, 0]);
  const scale = useTransform(progress, [0, 1], [0.94, 1]);
  const titleY = useTransform(progress, [0, 1], [0, -24]);
  const phoneY = useTransform(progress, [0, 1], ["0%", `-${String(overlap)}%`]);
  const still = reduced;

  const pin = pinned && !still;
  return (
    <section
      ref={sectionRef}
      className={cn(
        pin
          ? "relative h-[280vh] w-full"
          : "relative flex h-[60rem] w-full items-center justify-center overflow-hidden p-2 md:h-[80rem] md:p-8",
        className,
      )}
    >
      <div
        className={
          pin
            ? "sticky top-0 flex h-svh items-center justify-center overflow-hidden px-2 pt-14"
            : "contents"
        }
      >
        <div className="w-full" style={{ perspective: "1200px" }}>
          <motion.div
            style={{ y: still ? 0 : titleY }}
            className="relative z-0 mx-auto max-w-5xl px-4 text-center"
          >
            {typeof titleComponent === "function" ? titleComponent(progress) : titleComponent}
          </motion.div>
          <motion.div
            style={{
              y: still ? 0 : phoneY,
              rotateX: still ? 0 : rotateX,
              scale: still ? 1 : scale,
            }}
            className="relative z-10 -mt-6 md:-mt-12"
          >
            <PhoneFrame className={phoneClassName}>
              {typeof children === "function" ? children(progress) : children}
            </PhoneFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
