"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";

/**
 * The studio mascot: a little ghost filled with a live mesh-gradient shader, eyes that follow
 * the pointer, a slow float and a blink.
 *
 * Light by construction: the eyes ride motion values (no React re-render per pointer move),
 * float and blink are CSS transform keyframes, and the shader stops when the ghost is off screen
 * or the visitor prefers reduced motion. The body is a CSS mask, not <foreignObject>, so the
 * WebGL canvas also draws in Safari and scales with the box.
 */

// the ghost outline (viewBox 0 0 231 289), used as the mask for the shader
const BODY =
  "M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z";
const MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 231 289'><path d='${BODY}'/></svg>`,
)}") center / 100% 100% no-repeat`;

// palette tokens (light → deep); the shader cannot read CSS vars, so they are resolved at runtime
const TOKENS = [
  "--em-coral-400",
  "--em-sky-500",
  "--em-violet-400",
  "--em-blue-600",
  "--em-ink-975",
];

const MAX_LOOK = 8; // how far the eyes travel, in viewBox units

export function MeshGhost({ className }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const colors = useTokenColors(TOKENS);
  const [visible, setVisible] = useState(true);

  const lookX = useSpring(useMotionValue(0), { stiffness: 150, damping: 15 });
  const lookY = useSpring(useMotionValue(0), { stiffness: 150, damping: 15 });
  const leftX = useTransform(lookX, (v) => 80 + v);
  const rightX = useTransform(lookX, (v) => 150 + v);
  const eyeY = useTransform(lookY, (v) => 120 + v);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    io.observe(el);
    if (reduced) return () => io.disconnect();
    const follow = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const scale = 231 / rect.width;
      const clamp = (v: number) => Math.max(-MAX_LOOK, Math.min(MAX_LOOK, v));
      lookX.set(clamp((e.clientX - (rect.left + rect.width / 2)) * 0.08 * scale));
      lookY.set(clamp((e.clientY - (rect.top + rect.height / 2)) * 0.08 * scale));
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", follow);
    };
  }, [reduced, lookX, lookY]);

  return (
    <div
      ref={box}
      role="img"
      aria-label="มาสคอตผีน้อยของ crocwork.studio"
      className={cn("vt-live relative aspect-[231/289]", !reduced && "em-ghost-float", className)}
    >
      <div className="absolute inset-0" style={{ mask: MASK, WebkitMask: MASK }}>
        {colors && (
          <MeshGradient
            colors={colors}
            speed={reduced || !visible ? 0 : 1}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
      <svg aria-hidden viewBox="0 0 231 289" className="absolute inset-0 size-full">
        {[leftX, rightX].map((cx, i) => (
          <motion.ellipse
            key={i}
            cx={cx}
            cy={eyeY}
            rx={20}
            ry={30}
            fill="var(--em-ink-975)"
            className={reduced ? undefined : "em-ghost-blink"}
          />
        ))}
      </svg>
    </div>
  );
}
