"use client";

import * as React from "react";
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "../lib/cn";

const COUNT_LINE = 0.55;
const DEAD_ZONE = 6;
const CAUGHT_HOLD_MS = 760;
const INSET = 12;
const DEFAULT_TAUNTS = ["จับให้ได้สิ", "ไม่เอา", "ช้าไป", "เกือบแล้ว", "โอเค ยอมแล้ว"];

type Axis = "both" | "x" | "y";
type Wall = "clamp" | "bounce";
export type DodgeState = { dodges: number; gave: boolean; caught: boolean; fleeing: boolean };

const wallIt = (t: number, room: number, wall: Wall) => {
  if (wall === "bounce") {
    if (t > room) return Math.max(-room, 2 * room - t);
    if (t < -room) return Math.min(room, -2 * room - t);
    return t;
  }
  return Math.min(room, Math.max(-room, t));
};

const bearingOf = (dx: number, dy: number, d: number, axis: Axis) => {
  if (axis === "x") return { x: Math.sign(dx) || 1, y: 0 };
  if (axis === "y") return { x: 0, y: Math.sign(dy) || 1 };
  return { x: dx / d, y: dy / d };
};

/**
 * A playful field: its child darts away from a mouse pointer, gives in after `patience` dodges,
 * and flashes when finally caught. Touch devices never dodge (they get `notice` instead), and
 * reduced motion keeps it still. Never wrap a decline or close control in it.
 *
 * After React Bits' DodgeField (MIT): same springs and counting, Thai default taunts, colours
 * from tokens (`.dodge-field` in styles.css). Left out: per-instance colour props.
 */
export function DodgeField({
  children,
  taunts = DEFAULT_TAUNTS,
  notice = "",
  fieldHeight = 240,
  reach = 72,
  radius = 120,
  falloff = 2,
  fleeDuration = 130,
  returnDuration = 620,
  returnBounce = 0.1,
  axis = "both",
  wall = "clamp",
  patience = 4,
  disabled = false,
  onDodge,
  onRelent,
  onCatch,
  className,
  style,
}: {
  children?: React.ReactNode | ((state: DodgeState) => React.ReactNode);
  /** built-in pill labels: first at rest, one per dodge, the last once it relents */
  taunts?: string[];
  /** shown under the child on touch devices, where nothing dodges */
  notice?: string;
  fieldHeight?: number;
  reach?: number;
  radius?: number;
  falloff?: number;
  fleeDuration?: number;
  returnDuration?: number;
  returnBounce?: number;
  axis?: Axis;
  wall?: Wall;
  patience?: number;
  disabled?: boolean;
  onDodge?: (count: number) => void;
  onRelent?: () => void;
  onCatch?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const moverRef = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const transform = useMotionTemplate`translate(${x}px, ${y}px)`;
  const reduce = useReducedMotion() ?? false;
  const [fine, setFine] = React.useState(true);
  const [inside, setInside] = React.useState(false);
  const [dodges, setDodges] = React.useState(0);
  const [caught, setCaught] = React.useState(false);
  const gave = dodges >= Math.max(1, patience);
  const still = gave || caught || disabled || reduce;

  const pointer = React.useRef<{ x: number; y: number } | null>(null);
  const bearing = React.useRef({ x: 1, y: 0 });
  const armed = React.useRef(true);
  const room = React.useRef({ x: 0, y: 0 });
  const raf = React.useRef(0);
  const hold = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const live = React.useRef({
    reach,
    radius,
    falloff,
    fleeDuration,
    returnDuration,
    returnBounce,
    axis,
    wall,
    still,
    inside,
    reduce,
  });
  live.current = {
    reach,
    radius,
    falloff,
    fleeDuration,
    returnDuration,
    returnBounce,
    axis,
    wall,
    still,
    inside,
    reduce,
  };
  const calls = React.useRef({ onDodge, onRelent });
  calls.current = { onDodge, onRelent };

  React.useEffect(() => {
    const field = fieldRef.current;
    const mover = moverRef.current;
    if (!field || !mover) return;
    const measure = () => {
      room.current = {
        x: Math.max(0, (field.clientWidth - mover.offsetWidth) / 2 - INSET),
        y: Math.max(0, (field.clientHeight - mover.offsetHeight) / 2 - INSET),
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    observer.observe(mover);
    return () => observer.disconnect();
  }, []);

  const frame = React.useCallback(() => {
    raf.current = 0;
    const field = fieldRef.current;
    const p = pointer.current;
    const L = live.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const zoom = rect.width / (field.offsetWidth || rect.width) || 1;
    const dx = p ? (p.x - (rect.left + rect.width / 2)) / zoom : Infinity;
    const dy = p ? (p.y - (rect.top + rect.height / 2)) / zoom : Infinity;
    const d = Math.hypot(dx, dy);
    const isInside = d <= L.radius;
    if (!isInside && !L.inside) return;
    if (!L.still) {
      if (d < L.radius * COUNT_LINE) {
        if (armed.current) {
          armed.current = false;
          setDodges((n) => n + 1);
        }
      } else if (d > L.radius) {
        armed.current = true;
      }
    }
    if (Number.isFinite(d) && d > DEAD_ZONE) bearing.current = bearingOf(dx, dy, d, L.axis);
    const flee = isInside && !L.still ? (1 - d / L.radius) ** L.falloff : 0;
    const tx = wallIt(-bearing.current.x * flee * L.reach, room.current.x, L.wall);
    const ty = wallIt(-bearing.current.y * flee * L.reach, room.current.y, L.wall);
    if (L.reduce) {
      x.jump(0);
      y.jump(0);
    } else {
      const cfg =
        flee > 0
          ? { type: "spring" as const, duration: L.fleeDuration / 1000, bounce: 0 }
          : { type: "spring" as const, duration: L.returnDuration / 1000, bounce: L.returnBounce };
      void animate(x, tx, cfg);
      void animate(y, ty, cfg);
    }
    if (isInside !== L.inside) setInside(isInside);
  }, [x, y]);

  React.useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    if (!query.matches || disabled) return () => query.removeEventListener("change", sync);
    const tick = () => {
      if (!raf.current) raf.current = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.current = { x: e.clientX, y: e.clientY };
      tick();
    };
    const onLeave = () => {
      pointer.current = null;
      tick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", tick, { passive: true, capture: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      query.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", tick, { capture: true });
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [disabled, frame]);

  React.useEffect(() => {
    if (!raf.current) raf.current = requestAnimationFrame(frame);
  }, [still, frame]);
  React.useEffect(() => {
    if (dodges) calls.current.onDodge?.(dodges);
  }, [dodges]);
  React.useEffect(() => {
    if (gave) calls.current.onRelent?.();
  }, [gave]);
  React.useEffect(() => () => clearTimeout(hold.current), []);

  const handleClick = () => {
    setCaught(true);
    onCatch?.();
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      setCaught(false);
      setDodges(0);
      armed.current = false;
    }, CAUGHT_HOLD_MS);
  };

  const state: DodgeState = { dodges, gave, caught, fleeing: inside && !still };
  const index =
    gave || caught ? taunts.length - 1 : Math.min(dodges, Math.max(0, taunts.length - 2));
  const content =
    typeof children === "function"
      ? children(state)
      : (children ?? (
          <button type="button" className="dodge-field__pill" aria-label={taunts[0]}>
            <span className="dodge-field__labels">
              {taunts.map((taunt, i) => (
                <span
                  key={`${taunt}-${String(i)}`}
                  className="dodge-field__label"
                  data-active={i === index ? "true" : "false"}
                  aria-hidden
                >
                  {taunt}
                </span>
              ))}
            </span>
          </button>
        ));

  return (
    <div
      ref={fieldRef}
      className={cn("dodge-field", className)}
      data-coarse={fine ? undefined : ""}
      style={{ "--df-height": `${String(fieldHeight)}px`, ...style } as React.CSSProperties}
    >
      <motion.div
        ref={moverRef}
        className="dodge-field__mover"
        style={{ transform }}
        data-fled={inside && !still ? "true" : "false"}
        data-relented={gave ? "true" : "false"}
        data-caught={caught ? "true" : "false"}
        onClick={handleClick}
      >
        {content}
      </motion.div>
      {!fine && notice ? <p className="dodge-field__notice">{notice}</p> : null}
    </div>
  );
}
