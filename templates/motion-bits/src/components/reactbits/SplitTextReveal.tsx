"use client";

import { motion } from "framer-motion";

export interface SplitTextRevealProps {
  text?: string;
  staggerDelay?: number;
  springStiffness?: number;
  damping?: number;
  color?: string;
  fontSize?: number;
  className?: string;
}

export default function SplitTextReveal({
  text = "Hello, you!",
  staggerDelay = 40,
  springStiffness = 260,
  damping = 14,
  color = "#ffffff",
  fontSize = 56,
  className = "",
}: SplitTextRevealProps) {
  return (
    <p
      className={`m-0 font-semibold tracking-[-0.03em] ${className}`}
      style={{ color, fontSize }}
      aria-label={text}
    >
      {Array.from(text).map((char, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block will-change-transform"
          initial={{ opacity: 0, y: "0.9em", rotateX: -70 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            type: "spring",
            stiffness: springStiffness,
            damping,
            delay: (i * staggerDelay) / 1000,
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </p>
  );
}
