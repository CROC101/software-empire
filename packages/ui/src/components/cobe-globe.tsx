"use client";

import createGlobe from "cobe";
import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A slowly turning dotted globe (cobe, MIT) with labelled pins. Drag to spin it. It starts with
 * the first pin facing you, follows the page theme (colours are passed in as hex), and stops
 * drawing while it is off screen. Labels ride CSS anchor positioning where the browser has it.
 *
 * After 21st.dev "cobe-globe-cdn": the made-up CDN regions, arcs and random traffic numbers are
 * gone; pins are passed in, palette from tokens, paused off screen, reduced motion holds still.
 */

export interface GlobePin {
  id: string;
  /** [latitude, longitude] */
  location: [number, number];
  label: string;
}

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16) || 0;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// cobe's own "focus" maths: the phi / theta that put a place in front of the camera
const facing = ([lat, lng]: [number, number]): [number, number] => [
  Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2),
  (lat * Math.PI) / 180,
];

export function CobeGlobe({
  pins,
  dark = false,
  colors,
  speed = 0.0025,
  label,
  className,
}: {
  pins: readonly GlobePin[];
  dark?: boolean;
  /** Hex colours: the land dots, the pins, the glow round the edge. */
  colors: { base: string; marker: string; glow: string };
  /** radians per frame while idle */
  speed?: number;
  /** Accessible description of the globe. */
  label: string;
  className?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drag = React.useRef<{ x: number; y: number } | null>(null);
  const offset = React.useRef({ phi: 0, theta: 0, dphi: 0, dtheta: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const first = pins[0];
    const [phi0, theta0] = first ? facing(first.location) : [0, 0.2];
    let globe: ReturnType<typeof createGlobe> | null = null;
    let raf = 0;
    let phi = phi0;
    let onScreen = true;

    const frame = () => {
      raf = 0;
      if (!globe || !onScreen) return;
      if (!drag.current && !reduce) phi += speed;
      const o = offset.current;
      globe.update({
        phi: phi + o.phi + o.dphi,
        theta: Math.max(-0.6, Math.min(0.9, theta0 * 0.6 + o.theta + o.dtheta)),
      });
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const init = () => {
      const width = canvas.offsetWidth;
      if (!width || globe) return;
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi,
        theta: theta0 * 0.6,
        dark: dark ? 1 : 0,
        diffuse: dark ? 1.2 : 1.5,
        mapSamples: 16000,
        mapBrightness: dark ? 6 : 10,
        baseColor: rgb(colors.base),
        markerColor: rgb(colors.marker),
        glowColor: rgb(colors.glow),
        markerElevation: 0.02,
        markers: pins.map((p) => ({ location: p.location, size: 0.05, id: p.id })),
        opacity: dark ? 0.85 : 0.75,
      });
      start();
      canvas.style.opacity = "1";
    };

    const ro = new ResizeObserver(() => {
      init();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e?.isIntersecting ?? true;
      if (onScreen) start();
    });
    io.observe(canvas);
    init();

    return () => {
      ro.disconnect();
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      globe?.destroy();
    };
  }, [pins, dark, colors.base, colors.marker, colors.glow, speed]);

  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      offset.current.dphi = (e.clientX - d.x) / 300;
      offset.current.dtheta = (e.clientY - d.y) / 1000;
    };
    const up = () => {
      if (!drag.current) return;
      const o = offset.current;
      o.phi += o.dphi;
      o.theta += o.dtheta;
      o.dphi = 0;
      o.dtheta = 0;
      drag.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div className={cn("relative aspect-square select-none", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.style.cursor = "grabbing";
        }}
        className="size-full rounded-full opacity-0 transition-opacity duration-1000"
        style={{ cursor: "grab", touchAction: "pan-y" }}
      />
      {pins.map((p) => (
        <span
          key={p.id}
          aria-hidden
          className="cobe-pin"
          style={{
            positionAnchor: `--cobe-${p.id}`,
            opacity: `var(--cobe-visible-${p.id}, 0)`,
          }}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
