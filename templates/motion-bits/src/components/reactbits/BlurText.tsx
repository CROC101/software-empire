"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export interface BlurTextProps {
  text?: string;
  delay?: number;
  duration?: number;
  animateBy?: "words" | "chars";
  direction?: "top" | "bottom";
  blur?: number;
  className?: string;
  /** Element to render, e.g. "h1" for a page title. */
  as?: "p" | "h1" | "h2" | "span";
}

export default function BlurText({
  text = "Isn't this so cool?!",
  delay = 120,
  duration = 0.6,
  animateBy = "words",
  direction = "top",
  blur = 10,
  className = "",
  as: Tag = "p",
}: BlurTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const parts = animateBy === "words" ? text.split(" ") : Array.from(text);
  const offset = direction === "top" ? -40 : 40;

  return (
    <Tag ref={ref as React.RefObject<HTMLParagraphElement>} className={`flex flex-wrap ${className}`} aria-label={text}>
      {parts.map((part, i) => (
        <motion.span
          key={`${part}-${i}`}
          aria-hidden
          className="inline-block will-change-[transform,filter,opacity]"
          initial={{ filter: `blur(${blur}px)`, opacity: 0, y: offset }}
          animate={
            inView
              ? {
                  filter: [`blur(${blur}px)`, `blur(${blur / 2}px)`, "blur(0px)"],
                  opacity: [0, 0.5, 1],
                  y: [offset, offset * -0.12, 0],
                }
              : undefined
          }
          transition={{ duration, delay: (i * delay) / 1000, ease: "easeOut" }}
        >
          {part === " " ? " " : part}
          {animateBy === "words" && i < parts.length - 1 && " "}
        </motion.span>
      ))}
    </Tag>
  );
}
