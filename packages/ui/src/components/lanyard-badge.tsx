"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { useTokenColors } from "../lib/token-colors";

/**
 * Lanyard badge: an ID card hanging from a strap. Two straps come down from above in a V, meet
 * at a buckle, and a short strap holds the card by a clip. Drag the card and the straps pull
 * taut; let go and it swings; flick sideways to spin it; tap (or the button) to flip it over.
 *
 * Our own build after "Lanyard Badge" (21st.dev, MIT): Verlet rope on a canvas, the card is a
 * CSS 3D element whose faces take any content. Transforms are written straight to the DOM each
 * frame (no React renders), and the loop sleeps once everything is still or off screen.
 */

type P = { x: number; y: number; px: number; py: number; pinned?: boolean };
type Link = { a: number; b: number; len: number; rigid?: boolean };

const SEGMENTS = 9; // per strap
const STRAP_W = 18;
const GRAVITY = 2200; // px/s²
const STEP = 1 / 120;

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

export function LanyardBadge({
  front,
  back,
  strapText = "",
  flipLabel = "Show back",
  frontLabel = "Show front",
  cardLabel = "Badge",
  cardWidth = 230,
  cardHeight = 320,
  className,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  /** Printed along the strap. */
  strapText?: string;
  flipLabel?: string;
  frontLabel?: string;
  /** Accessible name of the card (it is a button that flips). */
  cardLabel?: string;
  cardWidth?: number;
  cardHeight?: number;
  className?: string;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const flipRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const colors = useTokenColors([
    "--em-blue-600",
    "--em-blue-700",
    "--em-ink-0",
    "--em-ink-200",
    "--em-ink-500",
  ]);
  const [showingBack, setShowingBack] = React.useState(false);

  // everything the loop touches lives in one mutable object
  const [sim] = React.useState(() => ({
    pts: [] as P[],
    links: [] as Link[],
    junction: 0,
    pin: 0,
    center: 0,
    W: 0,
    H: 0,
    raf: 0,
    last: 0,
    acc: 0,
    visible: false,
    drag: null as null | { x: number; y: number; vx: number; t: number; moved: number; at: number },
    spin: 0, // degrees around Y
    spinVel: 0,
    face: 0, // the face the spin settles on: 0 front, 180 back (mod 360)
    reduced: false,
    colors: null as string[] | null,
    strapText,
    wake: () => {},
  }));
  sim.reduced = reduced;
  sim.colors = colors;
  sim.strapText = strapText;

  const build = React.useCallback(() => {
    const { W } = sim;
    const cx = W / 2;
    const top = -40;
    const junction = { x: cx, y: 150 };
    const pts: P[] = [];
    const links: Link[] = [];
    const add = (x: number, y: number, pinned = false) => {
      pts.push({ x, y, px: x, py: y, pinned });
      return pts.length - 1;
    };
    const j = add(junction.x, junction.y);
    for (const side of [-1, 1]) {
      const ax = cx + side * 74;
      let prev = add(ax, top, true);
      const segLen = Math.hypot(junction.x - ax, junction.y - top) / SEGMENTS;
      for (let i = 1; i < SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const k = add(ax + (junction.x - ax) * t, top + (junction.y - top) * t);
        links.push({ a: prev, b: k, len: segLen });
        prev = k;
      }
      links.push({ a: prev, b: j, len: segLen });
    }
    const pin = add(cx, junction.y + 48);
    links.push({ a: j, b: pin, len: 48 });
    const center = add(cx + 40, junction.y + 48 + cardHeight / 2); // a little off, so it swings in
    links.push({ a: pin, b: center, len: cardHeight / 2, rigid: true });
    Object.assign(sim, { pts, links, junction: j, pin, center });
  }, [sim, cardHeight]);

  const integrate = React.useCallback(
    (dt: number) => {
      const damp = 0.992;
      for (const [i, p] of sim.pts.entries()) {
        if (p.pinned) continue;
        const vx = (p.x - p.px) * damp;
        const vy = (p.y - p.py) * damp;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * dt * dt;
        if (sim.drag && i === sim.center) {
          // the card follows the pointer on a spring, so the strap can still win and go taut
          p.x += (sim.drag.x - p.x) * 0.35;
          p.y += (sim.drag.y - p.y) * 0.35;
        }
      }
      for (let it = 0; it < 14; it++) {
        for (const l of sim.links) {
          const a = sim.pts[l.a];
          const b = sim.pts[l.b];
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1e-6;
          if (!l.rigid && dist <= l.len) continue; // a strap goes slack, it never pushes
          const diff = (dist - l.len) / dist;
          const wa = a.pinned ? 0 : 1;
          const wb = b.pinned ? 0 : 1;
          const w = wa + wb || 1;
          a.x += dx * diff * (wa / w);
          a.y += dy * diff * (wa / w);
          b.x -= dx * diff * (wb / w);
          b.y -= dy * diff * (wb / w);
        }
      }
      // spin: momentum from a flick, then settle on the nearest face
      if (Math.abs(sim.spinVel) > 0.05) {
        sim.spin += sim.spinVel * dt * 60;
        sim.spinVel *= 0.965;
        if (Math.abs(sim.spinVel) < 3) sim.face = Math.round(sim.spin / 180) * 180;
      } else {
        sim.spinVel = 0;
        sim.spin += (sim.face - sim.spin) * 0.12;
      }
    },
    [sim],
  );

  const draw = React.useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const pin = sim.pts[sim.pin];
    const center = sim.pts[sim.center];
    const junction = sim.pts[sim.junction];
    if (!canvas || !ctx || !pin || !center || !junction) return;
    const [
      strap = "#2563eb",
      strapDark = "#1d4ed8",
      ink = "#fff",
      metalHi = "#e5e7eb",
      metalLo = "#6b7280",
    ] = sim.colors ?? [];
    const dpr = canvas.width / sim.W || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sim.W, sim.H);

    // the two long straps: each a chain from its anchor to the junction
    const chains: { x: number; y: number }[][] = [[], []];
    let c = 0;
    for (const [i, p] of sim.pts.entries()) {
      if (i === sim.junction || i === sim.pin || i === sim.center) continue;
      if (p.pinned && chains[0]?.length) c = 1;
      chains[c]?.push(p);
    }
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    for (const chain of chains) {
      chain.push(junction);
      ctx.beginPath();
      chain.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = strap;
      ctx.lineWidth = STRAP_W;
      ctx.stroke();
      // woven edges
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (const off of [-6.5, 6.5]) {
        ctx.beginPath();
        chain.forEach((p, i) => {
          const q = chain[Math.min(chain.length - 1, i + 1)] ?? p;
          const o = chain[Math.max(0, i - 1)] ?? p;
          const a = Math.atan2(q.y - o.y, q.x - o.x);
          const x = p.x - Math.sin(a) * off;
          const y = p.y + Math.cos(a) * off;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // the print, spread over three links at a time (one link is shorter than the text)
      if (sim.strapText) {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = ink;
        ctx.font = "600 8px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const w = ctx.measureText(sim.strapText).width;
        for (let i = 1; i + 3 < chain.length; i += 4) {
          const a = chain[i];
          const b = chain[i + 3];
          if (!a || !b || Math.hypot(b.x - a.x, b.y - a.y) < w * 0.6) continue;
          ctx.save();
          ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
          let ang = Math.atan2(b.y - a.y, b.x - a.x);
          if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
          ctx.rotate(ang);
          ctx.fillText(sim.strapText, 0, 0);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }

    // short strap from the buckle to the clip
    ctx.beginPath();
    ctx.moveTo(junction.x, junction.y);
    ctx.lineTo(pin.x, pin.y);
    ctx.strokeStyle = strapDark;
    ctx.lineWidth = 12;
    ctx.stroke();

    const metal = (x: number, y: number, w: number, h: number, ang: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      g.addColorStop(0, metalLo);
      g.addColorStop(0.45, metalHi);
      g.addColorStop(1, metalLo);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 4);
      ctx.fill();
      ctx.fillStyle = metalLo;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(-w / 4, -1.5, w / 2, 3);
      ctx.globalAlpha = 1;
      ctx.restore();
    };
    const down = Math.atan2(pin.y - junction.y, pin.x - junction.x) - Math.PI / 2;
    metal(junction.x, junction.y, 26, 22, down);
    metal(pin.x, pin.y - 6, 14, 24, Math.atan2(center.y - pin.y, center.x - pin.x) - Math.PI / 2);

    // the card hangs from the clip, turned along pin → center, spun around its own axis
    const tilt = Math.atan2(center.y - pin.y, center.x - pin.x) - Math.PI / 2;
    const sway = Math.max(-25, Math.min(25, (center.x - center.px) * 1.5));
    if (cardRef.current)
      cardRef.current.style.transform = `translate3d(${(pin.x - cardWidth / 2).toFixed(2)}px, ${pin.y.toFixed(2)}px, 0) rotate(${tilt.toFixed(4)}rad)`;
    if (flipRef.current)
      flipRef.current.style.transform = `rotateY(${(sim.spin + sway).toFixed(2)}deg)`;
  }, [sim, cardWidth]);

  // size, build, loop
  React.useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;

    const frame = (now: number) => {
      sim.raf = 0;
      if (!sim.visible) return;
      const elapsed = Math.min(0.05, (now - (sim.last || now)) / 1000);
      sim.last = now;
      sim.acc += elapsed;
      while (sim.acc >= STEP) {
        integrate(STEP);
        sim.acc -= STEP;
      }
      draw();
      const moving =
        sim.drag ||
        Math.abs(sim.spinVel) > 0.05 ||
        Math.abs(sim.face - sim.spin) > 0.2 ||
        sim.pts.some((p) => Math.abs(p.x - p.px) + Math.abs(p.y - p.py) > 0.02);
      if (moving) sim.raf = requestAnimationFrame(frame);
      else sim.last = 0;
    };
    sim.wake = () => {
      if (sim.reduced) {
        // no motion: jump straight to rest
        for (let i = 0; i < 600; i++) integrate(STEP);
        for (const p of sim.pts) {
          p.px = p.x;
          p.py = p.y;
        }
        sim.spin = sim.face;
        sim.spinVel = 0;
        draw();
        return;
      }
      if (!sim.raf && sim.visible) {
        // start one frame back: a zero first step would read as "at rest" and end the loop
        sim.last = performance.now() - 1000 / 60;
        sim.raf = requestAnimationFrame(frame);
      }
    };

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sim.W = r.width;
      sim.H = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      build();
      sim.wake();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => {
      sim.visible = Boolean(e?.isIntersecting);
      sim.wake();
    });
    io.observe(box);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(sim.raf);
      sim.raf = 0;
    };
  }, [sim, build, integrate, draw]);

  // repaint the strap when the theme (and so the colours) change
  React.useEffect(() => {
    draw();
  }, [colors, draw]);

  const flip = () => {
    sim.face = (Math.round(sim.spin / 180) + 1) * 180;
    sim.spinVel = 0;
    sim.wake();
  };
  const syncFace = () => setShowingBack(Math.round(sim.face / 180) % 2 !== 0);

  const local = (e: React.PointerEvent) => {
    const r = boxRef.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    sim.drag = { ...p, vx: 0, t: performance.now(), moved: 0, at: performance.now() };
    sim.wake();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!sim.drag) return;
    const p = local(e);
    const now = performance.now();
    const dt = Math.max(1, now - sim.drag.t);
    sim.drag.vx = sim.drag.vx * 0.6 + ((p.x - sim.drag.x) / dt) * 0.4;
    sim.drag.moved += Math.hypot(p.x - sim.drag.x, p.y - sim.drag.y);
    sim.drag.x = p.x;
    sim.drag.y = p.y;
    sim.drag.t = now;
    sim.wake();
  };
  const onUp = () => {
    const d = sim.drag;
    sim.drag = null;
    if (!d) return;
    if (d.moved < 6 && performance.now() - d.at < 350) flip();
    else if (Math.abs(d.vx) > 0.6 && !sim.reduced)
      sim.spinVel = Math.max(-40, Math.min(40, d.vx * 14));
    sim.wake();
    window.setTimeout(syncFace, 900);
  };

  return (
    <div ref={boxRef} className={cn("relative h-[560px] w-full select-none", className)}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
      <div
        ref={cardRef}
        className="absolute left-0 top-0 origin-top"
        style={{ width: cardWidth, height: cardHeight, perspective: 900 }}
      >
        <div
          ref={flipRef}
          role="button"
          tabIndex={0}
          aria-label={cardLabel}
          aria-pressed={showingBack}
          // pan-y: a vertical swipe on the card scrolls the page, sideways swings the badge
          className="relative size-full cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ transformStyle: "preserve-3d" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              flip();
              window.setTimeout(syncFace, 600);
            }
          }}
        >
          {[front, back].map((face, i) => (
            <div
              key={i}
              className="lnb-face absolute inset-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl"
              style={{ backfaceVisibility: "hidden", transform: i ? "rotateY(180deg)" : undefined }}
            >
              {/* the punched slot the clip goes through */}
              <span
                aria-hidden
                className="absolute left-1/2 top-3 h-2.5 w-14 -translate-x-1/2 rounded-full bg-[var(--em-ink-500)]/40"
              />
              {face}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          flip();
          window.setTimeout(syncFace, 600);
        }}
        className="absolute right-0 top-0 inline-flex items-center gap-2 border bg-background px-3 py-1.5 text-xs font-medium shadow-sm"
      >
        <span aria-hidden>↻</span>
        {showingBack ? frontLabel : flipLabel}
      </button>
    </div>
  );
}
