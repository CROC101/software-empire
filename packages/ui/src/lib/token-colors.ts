"use client";

import { useEffect, useState } from "react";

/**
 * Palette tokens as concrete "#rrggbb" for code that cannot read CSS variables (WebGL shaders,
 * colour maths). A 1px canvas does the conversion, so oklch tokens work too. Re-read when the
 * shared theme switch flips the class on <html>. `null` until mounted (SSR has no styles).
 */
export function useTokenColors(tokens: readonly string[]): string[] | null {
  const [colors, setColors] = useState<string[] | null>(null);
  const key = tokens.join(",");
  useEffect(() => {
    // same colours keep the same array, so canvases do not rebuild for nothing
    const read = () =>
      setColors((prev) => {
        const next = resolveTokens(key.split(","));
        return prev?.join() === next.join() ? prev : next;
      });
    read();
    return watchTheme(read);
  }, [key]);
  return colors;
}

/**
 * Calls `onFlip` when <html> turns dark or light, and only then: other classes and styles on it
 * (the theme reveal's vt-flat, --vt-origin) come and go mid-switch, and a colour read on each
 * forces a style pass over the whole page. Returns a stop function.
 */
export function watchTheme(onFlip: () => void): () => void {
  const html = document.documentElement;
  let dark = html.classList.contains("dark");
  const watch = new MutationObserver(() => {
    if (html.classList.contains("dark") === dark) return;
    dark = !dark;
    onFlip();
  });
  watch.observe(html, { attributes: true, attributeFilter: ["class"] });
  return () => {
    watch.disconnect();
  };
}

function resolveTokens(tokens: string[]): string[] {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const root = getComputedStyle(document.documentElement);
  return tokens.map((token) => {
    const value = root.getPropertyValue(token).trim() || "#2563eb";
    if (!ctx) return value;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  });
}
