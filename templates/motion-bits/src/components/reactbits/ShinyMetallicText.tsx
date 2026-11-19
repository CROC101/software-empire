"use client";

import { motion } from "framer-motion";

export interface ShinyMetallicTextProps {
  text?: string;
  speed?: number;
  shimmerWidth?: number;
  baseColor?: string;
  shineColor?: string;
  fontSize?: number;
  disabled?: boolean;
  className?: string;
}

export default function ShinyMetallicText({
  text = "Polished chrome",
  speed = 2.5,
  shimmerWidth = 18,
  baseColor = "#7c7785",
  shineColor = "#ffffff",
  fontSize = 52,
  disabled = false,
  className = "",
}: ShinyMetallicTextProps) {
  const half = shimmerWidth / 2;
  return (
    <motion.span
      className={`inline-block bg-clip-text font-semibold tracking-[-0.03em] text-transparent ${className}`}
      style={{
        fontSize,
        backgroundImage: `linear-gradient(115deg, ${baseColor} ${50 - half}%, ${shineColor} 50%, ${baseColor} ${50 + half}%)`,
        backgroundSize: "250% 100%",
        WebkitBackgroundClip: "text",
      }}
      initial={{ backgroundPosition: "120% 0" }}
      animate={disabled ? undefined : { backgroundPosition: ["120% 0", "-20% 0"] }}
      transition={{ duration: speed, ease: "linear", repeat: Infinity }}
    >
      {text}
    </motion.span>
  );
}
