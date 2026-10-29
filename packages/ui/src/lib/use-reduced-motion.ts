"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Reduced-motion preference that is false until mounted. The server can't know it, so a
 * component that renders a different tree for reduced motion must not branch on the first
 * client render, or hydration fails.
 */
export function useReducedMotionAfterMount(): boolean {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted && prefers === true;
}
