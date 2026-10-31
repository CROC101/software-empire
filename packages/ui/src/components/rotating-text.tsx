"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/cn";

type Effect = "slide" | "flip" | "blur" | "scale" | "drop";

const segmenter =
  typeof Intl !== "undefined" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const graphemes = (text: string) =>
  segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);

const FLIP_STYLE = { transformOrigin: "50% 50% -0.45em", backfaceVisibility: "hidden" } as const;

function preset(
  effect: Effect,
  up: boolean,
): {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
  transition: Transition;
  exitTransition?: Transition;
} {
  switch (effect) {
    case "flip":
      return {
        initial: { rotateX: up ? -90 : 90, opacity: 0, transformPerspective: 480 },
        animate: { rotateX: 0, opacity: 1, transformPerspective: 480 },
        exit: { rotateX: up ? 90 : -90, opacity: 0, transformPerspective: 480 },
        transition: { type: "tween", duration: 0.6, ease: [0.34, 1.4, 0.64, 1] },
        exitTransition: { type: "tween", duration: 0.32, ease: [0.5, 0, 0.75, 0] },
      };
    case "blur":
      return {
        initial: { y: up ? "45%" : "-45%", opacity: 0, filter: "blur(10px)" },
        animate: { y: 0, opacity: 1, filter: "blur(0px)" },
        exit: { y: up ? "-45%" : "45%", opacity: 0, filter: "blur(10px)" },
        transition: { type: "tween", duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      };
    case "scale":
      return {
        initial: { scale: up ? 0.35 : 1.7, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: up ? 1.7 : 0.35, opacity: 0 },
        transition: { type: "spring", damping: 17, stiffness: 240 },
      };
    case "drop":
      return {
        initial: { y: "-110%", opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "110%", opacity: 0 },
        transition: { type: "spring", damping: 18, stiffness: 320, mass: 0.9 },
        exitTransition: { type: "tween", duration: 0.3, ease: [0.55, 0, 1, 0.45] },
      };
    default:
      return {
        initial: { y: up ? "100%" : "-100%", opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: up ? "-120%" : "120%", opacity: 0 },
        transition: { type: "spring", damping: 25, stiffness: 300 },
      };
  }
}

/**
 * Cycles through `texts`, swapping them letter by letter (slide, flip, blur, scale or drop).
 * The outgoing text pops out of the layout while the next comes in (AnimatePresence
 * "popLayout"), so the slot is never empty mid-cycle. Splits by grapheme, so Thai clusters stay
 * whole. Reduced motion: motion's own setting (opacity only, no travel).
 *
 * After React Bits' RotatingText (MIT). Left out: the highlight block, the imperative ref API
 * (next / previous / jumpTo / reset), custom initial / animate / exit / transition overrides,
 * splitting by lines or a custom separator, and onNext.
 */
export function RotatingText({
  texts,
  effect = "slide",
  direction = "up",
  rotationInterval = 2000,
  staggerDuration = 0.025,
  staggerFrom = "first",
  splitBy = "characters",
  loop = true,
  auto = true,
  pauseOnHover = false,
  className,
  splitLevelClassName,
  elementLevelClassName,
}: {
  texts: readonly string[];
  effect?: Effect;
  direction?: "up" | "down";
  /** ms each text stays */
  rotationInterval?: number;
  /** s between letters */
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  splitBy?: "characters" | "words";
  loop?: boolean;
  auto?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  /** e.g. overflow-hidden for a masked slide */
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const last = Math.max(texts.length - 1, 0);
  const active = Math.min(index, last);
  const text = texts[active] ?? "";

  const words = useMemo(
    () => text.split(" ").map((w) => (splitBy === "characters" ? graphemes(w) : [w])),
    [text, splitBy],
  );
  const total = words.reduce((n, w) => n + w.length, 0);
  const shuffled = useMemo(
    () => Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5),
    [total],
  );
  const delayOf = (i: number) => {
    const rank =
      staggerFrom === "first"
        ? i
        : staggerFrom === "last"
          ? total - 1 - i
          : staggerFrom === "center"
            ? Math.abs(Math.floor(total / 2) - i)
            : staggerFrom === "random"
              ? (shuffled[i] ?? i)
              : Math.abs(staggerFrom - i);
    return rank * staggerDuration;
  };

  useEffect(() => {
    if (!auto || (pauseOnHover && hovered) || texts.length < 2) return;
    const id = setTimeout(() => {
      setIndex((i) => (i < last ? i + 1 : loop ? 0 : i));
    }, rotationInterval);
    return () => clearTimeout(id);
  }, [auto, pauseOnHover, hovered, texts.length, last, loop, rotationInterval, active]);

  const p = preset(effect, direction !== "down");
  const charStyle = effect === "flip" ? FLIP_STYLE : undefined;
  let offset = 0;

  return (
    <MotionConfig reducedMotion="user">
      <span
        className={cn("text-rotate", className)}
        onMouseEnter={pauseOnHover ? () => setHovered(true) : undefined}
        onMouseLeave={pauseOnHover ? () => setHovered(false) : undefined}
      >
        <span className="sr-only">{text}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={active} className="text-rotate" aria-hidden>
            {words.map((chars, w) => {
              const start = offset;
              offset += chars.length;
              return (
                <span key={w} className={cn("text-rotate-word", splitLevelClassName)}>
                  {chars.map((ch, c) => {
                    const delay = delayOf(start + c);
                    return (
                      <motion.span
                        key={c}
                        initial={p.initial}
                        animate={p.animate}
                        exit={{
                          ...p.exit,
                          transition: { ...(p.exitTransition ?? p.transition), delay },
                        }}
                        transition={{ ...p.transition, delay }}
                        className={cn("text-rotate-element", elementLevelClassName)}
                        style={charStyle}
                      >
                        {ch}
                      </motion.span>
                    );
                  })}
                  {w < words.length - 1 && <span className="text-rotate-space"> </span>}
                </span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </span>
    </MotionConfig>
  );
}
