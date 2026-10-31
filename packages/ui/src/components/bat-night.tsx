"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Halloween over the whole page: bats with volume, not paper cut-outs. Each wing is a membrane
 * stretched between finger bones with a scalloped trailing edge; it beats round the body's axis,
 * so on the upstroke the span foreshortens and the tips lift, and the body bobs with each
 * downstroke. Three depths (far: small, slow, faint; near: big, quick, solid), a lit rim on the
 * side facing the light, and now and then one flutters right past the camera. They swerve away
 * from the pointer. A soft festival glow hangs at the top of the screen.
 *
 * Canvas 2D with every wing position drawn once into a sprite strip (FRAMES poses), so a frame is
 * ~25 drawImage calls. Pixel ratio ≤ 1.5, stops in hidden tabs, nothing under reduced motion.
 */

const FRAMES = 16;
// sprite span in CSS px (wing tip to wing tip at full spread); flybys upscale it
const SPAN = 150;

type Bat = {
  x: number;
  y: number;
  z: number; // depth: 0.35 far … 1 near, > 1 a flyby
  heading: number; // radians, 0 = right
  speed: number;
  phase: number; // wingbeat 0..1
  rate: number; // beats per second
  wander: number; // seed for the swoop
  flee: number;
};

const TAU = Math.PI * 2;

/** Points of the right wing in its own plane: u out along the span, v back along the body. */
// shoulder, wrist (leading edge), wingtip, then the finger tips the membrane hangs between
const WING: [number, number][] = [
  [0.06, -0.12],
  [0.46, -0.36],
  [1, -0.14],
  [0.8, 0.22],
  [0.56, 0.3],
  [0.3, 0.26],
  [0.07, 0.22],
];

/** Draws one pose. `a` is the wing angle (radians, + = tips up), lit from the top. */
function drawBat(
  ctx: CanvasRenderingContext2D,
  a: number,
  body: string,
  wing: string,
  rim: string,
) {
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  // a point on the wing seen from the front: span foreshortens by cos, height lifts by sin
  const p = (side: number, [u, v]: [number, number]): [number, number] => [
    side * u * cos,
    v * (0.85 + 0.15 * cos) - u * sin * 0.62,
  ];
  for (const side of [-1, 1]) {
    const pts = WING.map((w) => p(side, w));
    ctx.beginPath();
    const [s0, s1] = pts[0] ?? [0, 0];
    ctx.moveTo(s0, s1);
    // leading edge: shoulder, wrist, tip
    for (const i of [1, 2]) {
      const [x, y] = pts[i] ?? [0, 0];
      ctx.lineTo(x, y);
    }
    // trailing edge: each span of membrane sags inward between two finger tips (the scallops)
    for (let i = 3; i < pts.length; i++) {
      const [px, py] = pts[i - 1] ?? [0, 0];
      const [x, y] = pts[i] ?? [0, 0];
      const [wx, wy] = pts[1] ?? [0, 0];
      const mx = (px + x) / 2;
      const my = (py + y) / 2;
      ctx.quadraticCurveTo(mx + (wx - mx) * 0.28, my + (wy - my) * 0.28, x, y);
    }
    ctx.closePath();
    // the membrane turns toward the light on the upstroke: brighter, then shadowed underneath
    ctx.globalAlpha = 1;
    ctx.fillStyle = wing;
    ctx.fill();
    ctx.globalAlpha = Math.max(0, sin) * 0.55 + 0.15;
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.022;
    ctx.stroke();
    // finger bones fanning from the wrist
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = body;
    ctx.lineWidth = 0.018;
    ctx.beginPath();
    const [wx, wy] = pts[1] ?? [0, 0];
    for (const i of [2, 3, 4, 5]) {
      const [x, y] = pts[i] ?? [0, 0];
      ctx.moveTo(wx, wy);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = body;
  // body, head, ears, a hint of feet
  ctx.beginPath();
  ctx.ellipse(0, 0.06, 0.085, 0.2, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -0.16, 0.075, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.07, -0.18);
  ctx.lineTo(-0.06, -0.31);
  ctx.lineTo(-0.02, -0.2);
  ctx.moveTo(0.07, -0.18);
  ctx.lineTo(0.06, -0.31);
  ctx.lineTo(0.02, -0.2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.03, 0.24);
  ctx.lineTo(-0.05, 0.3);
  ctx.moveTo(0.03, 0.24);
  ctx.lineTo(0.05, 0.3);
  ctx.strokeStyle = body;
  ctx.lineWidth = 0.02;
  ctx.stroke();
  // rim light on the head and back, from above
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.016;
  ctx.beginPath();
  ctx.arc(0, -0.16, 0.075, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Wing angle over one beat: a quick powerful downstroke, a slower recovery. */
export const wingAngle = (phase: number) => {
  const t = ((phase % 1) + 1) % 1;
  // 0..0.4 down (from +1.1 to -0.75 rad), 0.4..1 back up
  return t < 0.4
    ? 1.1 - 1.85 * (0.5 - 0.5 * Math.cos((t / 0.4) * Math.PI))
    : -0.75 + 1.85 * (0.5 - 0.5 * Math.cos(((t - 0.4) / 0.6) * Math.PI));
};

export function BatNight({
  body,
  wing,
  rim,
  glow,
  className,
}: {
  /** colour of the body and bones */
  body: string;
  /** colour of the wing membrane */
  wing: string;
  /** light catching the edges */
  rim: string;
  /** the haze at the top of the screen; omit for none */
  glow?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    // the sprite strip: one cell per wing pose
    const cell = Math.ceil(SPAN * dpr);
    const cellH = Math.ceil(cell * 0.62);
    const strip = document.createElement("canvas");
    strip.width = cell * FRAMES;
    strip.height = cellH;
    const sctx = strip.getContext("2d");
    if (!sctx) return;
    for (let f = 0; f < FRAMES; f++) {
      sctx.setTransform(cell / 2, 0, 0, cell / 2, cell * f + cell / 2, cellH * 0.42);
      drawBat(sctx, wingAngle(f / FRAMES), body, wing, rim);
    }

    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();

    const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    const spawn = (b: Bat, fromEdge: boolean) => {
      const right = Math.random() < 0.5;
      b.heading = (right ? 0 : Math.PI) + rand(-0.35, 0.35);
      b.x = fromEdge ? (right ? -80 : w + 80) : rand(0, w);
      b.y = rand(h * 0.04, h * 0.7);
      b.speed = (40 + 60 * b.z) * rand(0.8, 1.2);
      b.rate = (b.z > 1 ? 2.6 : 5.5 - 2.4 * b.z) * rand(0.9, 1.1);
      b.wander = rand(0, 100);
      b.flee = 0;
    };
    // fewer on a phone; always under 30
    const count = Math.round(Math.min(26, Math.max(9, (w * h) / 60000)));
    const bats: Bat[] = Array.from({ length: count }, (_, i) => {
      const b: Bat = {
        x: 0,
        y: 0,
        z: [0.35, 0.6, 0.95][i % 3] ?? 0.6,
        heading: 0,
        speed: 0,
        phase: Math.random(),
        rate: 4,
        wander: 0,
        flee: 0,
      };
      b.z *= rand(0.85, 1.1);
      spawn(b, false);
      return b;
    });
    // the one that brushes past the camera, now and then
    const flyby: Bat = {
      x: -9999,
      y: 0,
      z: 2.2,
      heading: 0,
      speed: 0,
      phase: 0,
      rate: 2.6,
      wander: 0,
      flee: 0,
    };
    let nextFlyby = performance.now() + rand(4000, 9000);

    const pointer = { x: -9999, y: -9999 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };

    let raf = 0;
    let last = performance.now();
    const step = (b: Bat, dt: number, t: number) => {
      // a swooping path: the heading drifts on two slow waves, the bat dips with each downstroke
      const turn = Math.sin(t * 0.37 + b.wander) * 0.5 + Math.sin(t * 0.91 + b.wander * 1.7) * 0.3;
      b.heading += turn * dt * 0.9;
      const dx = b.x - pointer.x;
      const dy = b.y - pointer.y;
      const d = Math.hypot(dx, dy);
      const reach = 170 * Math.min(b.z, 1.2);
      if (d < reach && d > 1) {
        // swerve away and beat harder
        const away = Math.atan2(dy, dx);
        const diff = Math.atan2(Math.sin(away - b.heading), Math.cos(away - b.heading));
        b.heading += diff * dt * 6 * (1 - d / reach);
        b.flee = Math.min(1, b.flee + dt * 4);
      } else b.flee = Math.max(0, b.flee - dt * 1.5);
      // keep most of them in the upper two thirds
      if (b.y > h * 0.75) b.heading -= Math.sign(Math.cos(b.heading)) * dt * 0.8;
      if (b.y < h * 0.03) b.heading += Math.sign(Math.cos(b.heading)) * dt * 0.8;
      const v = b.speed * (1 + b.flee * 1.4);
      b.phase += dt * b.rate * (1 + b.flee * 0.8);
      const lift = -Math.sin(wingAngle(b.phase)) * 9 * b.z;
      b.x += Math.cos(b.heading) * v * dt;
      b.y += Math.sin(b.heading) * v * dt * 0.6 + lift * dt;
    };
    const draw = (b: Bat) => {
      const span = SPAN * b.z * (b.z > 1 ? 1 : 0.55);
      const f = Math.floor((((b.phase % 1) + 1) % 1) * FRAMES) % FRAMES;
      ctx.globalAlpha = b.z > 1 ? 0.9 : 0.35 + 0.6 * b.z;
      ctx.save();
      ctx.translate(b.x * dpr, b.y * dpr);
      // bank into the turn a little
      ctx.rotate(Math.sin(b.heading) * 0.35 * Math.sign(Math.cos(b.heading)));
      const sw = span * dpr;
      const sh = sw * 0.62;
      ctx.drawImage(strip, f * cell, 0, cell, cellH, -sw / 2, -sh * 0.42, sw, sh);
      ctx.restore();
    };

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bats.sort((a, b) => a.z - b.z);
      for (const b of bats) {
        step(b, dt, t);
        if (b.x < -160 || b.x > w + 160 || b.y < -160 || b.y > h + 160) spawn(b, true);
        draw(b);
      }
      if (flyby.x === -9999 && now > nextFlyby) {
        spawn(flyby, true);
        flyby.z = rand(1.8, 2.6);
        flyby.speed = rand(380, 520);
        flyby.rate = 2.4;
        flyby.y = rand(h * 0.15, h * 0.6);
      }
      if (flyby.x !== -9999) {
        flyby.phase += dt * flyby.rate;
        flyby.x += Math.cos(flyby.heading) * flyby.speed * dt;
        flyby.y += Math.sin(flyby.heading) * flyby.speed * dt * 0.4;
        draw(flyby);
        if (flyby.x < -400 || flyby.x > w + 400) {
          flyby.x = -9999;
          nextFlyby = now + rand(8000, 15000);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", wake);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [body, wing, rim]);

  return (
    <div
      aria-hidden
      className={cn("vt-live pointer-events-none fixed inset-0 z-[60]", className)}
      style={
        glow
          ? {
              background: `radial-gradient(ellipse 75% 38% at 50% -6%, color-mix(in oklab, ${glow} 26%, transparent), transparent 72%)`,
            }
          : undefined
      }
    >
      <canvas ref={ref} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
