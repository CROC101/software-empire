"use client";

import { useReducedMotionAfterMount } from "@empire/ui";
import { ArrowRight, Users } from "lucide-react";
import { useId, useState } from "react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COLS = 14;
const ROWS = 9;
const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({
  x: (i % COLS) + 0.5,
  y: Math.floor(i / COLS) + 0.5,
}));
const people = ["กน", "ปท", "มร", "ศว"];

/**
 * A waitlist section on a quiet grid. Tap anywhere and a ripple runs out across the cells from that
 * spot (opacity only, staggered by distance); the email box checks the address before it says yes.
 */
export default function RippleWaitlist({
  title = "ขอเข้าใช้ก่อนใคร",
  cta = "ลงชื่อรอ",
}: {
  title?: string;
  cta?: string;
}) {
  const still = useReducedMotionAfterMount();
  const [wave, setWave] = useState({ x: COLS / 2, y: ROWS / 2, n: 0 });
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const id = useId();

  return (
    <section
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setWave((w) => ({
          x: ((e.clientX - r.left) / r.width) * COLS,
          y: ((e.clientY - r.top) / r.height) * ROWS,
          n: w.n + 1,
        }));
      }}
      className="@container relative overflow-clip bg-background text-foreground"
    >
      <style>{`@keyframes rw-pulse{0%{opacity:0}25%{opacity:1}100%{opacity:0}}.rw-cell{animation:rw-pulse 1s ease-out both}@media (prefers-reduced-motion:reduce){.rw-cell{animation:none;opacity:0}}`}</style>
      <div
        aria-hidden
        className="absolute inset-0 grid [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
        style={{
          gridTemplateColumns: `repeat(${String(COLS)},1fr)`,
          gridTemplateRows: `repeat(${String(ROWS)},1fr)`,
        }}
      >
        {cells.map((c, i) => (
          <span key={i} className="relative border-r border-b border-border">
            {!still && (
              <span
                key={wave.n}
                className="rw-cell absolute inset-0 bg-primary/15"
                style={{
                  animationDelay: `${String(Math.round(Math.hypot(c.x - wave.x, c.y - wave.y) * 70))}ms`,
                }}
              />
            )}
          </span>
        ))}
      </div>

      <div className="pointer-events-none relative mx-auto flex min-h-[36rem] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Users aria-hidden className="size-3.5" />
          รอบแรกเปิด 200 ที่
        </p>
        <h2 className="mt-5 font-heading text-4xl font-black @lg:text-5xl">{title}</h2>
        <p className="mt-4 max-w-lg text-muted-foreground">
          เราเปิดรับทีละรอบ ทุกคนที่เข้ามาได้คุยกับทีมที่สร้างจริง
        </p>

        {done ? (
          <p
            role="status"
            className="mt-8 rounded-lg border border-border bg-card px-5 py-3 text-sm"
          >
            ลงชื่อแล้ว ตัวอย่างนี้ไม่ได้ส่งอีเมลจริง
          </p>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!EMAIL.test(email.trim())) {
                setError("กรอกอีเมลให้ถูกรูปแบบ เช่น you@example.com");
                return;
              }
              setDone(true);
            }}
            className="pointer-events-auto mt-8 w-full max-w-md"
          >
            <div className="flex flex-col gap-2 @md:flex-row">
              <label htmlFor={id} className="sr-only">
                อีเมล
              </label>
              <input
                id={id}
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={error !== ""}
                aria-describedby={`${id}-err`}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-lg border border-input bg-background px-4 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {cta}
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </div>
            <p
              id={`${id}-err`}
              aria-live="polite"
              className="mt-2 min-h-5 text-sm text-destructive"
            >
              {error}
            </p>
          </form>
        )}
        <p className="text-xs text-muted-foreground">ส่งอีเมลฉบับเดียวตอนถึงคิวคุณ</p>
      </div>

      <div className="relative flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/60 px-6 py-4 @xl:flex-row">
        <div className="flex items-center gap-3">
          <span className="flex -space-x-2">
            {people.map((p) => (
              <span
                key={p}
                aria-hidden
                className="grid size-8 place-items-center rounded-full border-2 border-background bg-card text-[0.65rem] font-semibold"
              >
                {p}
              </span>
            ))}
          </span>
          <p className="text-sm text-muted-foreground">
            ลงชื่อแล้ว <b className="text-foreground tabular-nums">1,248</b> คน
          </p>
        </div>
        <p className="text-xs text-muted-foreground">แตะตรงไหนก็ได้ ตารางจะกระเพื่อม</p>
      </div>
    </section>
  );
}
