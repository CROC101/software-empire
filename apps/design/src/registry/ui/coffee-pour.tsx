"use client";

import { cn, useReducedMotionAfterMount } from "@empire/ui";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

// brews are mixed from palette tokens, so the menu follows the theme
const brew = {
  espresso: "color-mix(in oklch, var(--em-gold-500) 22%, var(--em-ink-975))",
  coffee: "color-mix(in oklch, var(--em-gold-500) 32%, var(--em-ink-850))",
  water: "color-mix(in oklch, var(--em-gold-500) 18%, var(--em-ink-700))",
  milk: "color-mix(in oklch, var(--em-gold-300) 22%, var(--em-ink-50))",
  foam: "var(--em-ink-0)",
  cocoa: "color-mix(in oklch, var(--em-coral-500) 18%, var(--em-ink-900))",
};
type Layer = { c: string; h: number; name: string };

const menu: { name: string; th: string; price: number; layers: Layer[] }[] = [
  {
    name: "Espresso",
    th: "ช็อตเข้ม ๆ หนึ่งช็อต",
    price: 60,
    layers: [{ c: brew.espresso, h: 30, name: "เอสเปรสโซ" }],
  },
  {
    name: "Americano",
    th: "เอสเปรสโซกับน้ำร้อน",
    price: 70,
    layers: [
      { c: brew.espresso, h: 25, name: "เอสเปรสโซ" },
      { c: brew.water, h: 55, name: "น้ำร้อน" },
    ],
  },
  {
    name: "Latte",
    th: "นมเยอะ ฟองบาง",
    price: 85,
    layers: [
      { c: brew.espresso, h: 22, name: "เอสเปรสโซ" },
      { c: brew.milk, h: 50, name: "นมร้อน" },
      { c: brew.foam, h: 10, name: "ฟองนม" },
    ],
  },
  {
    name: "Cappuccino",
    th: "นมกับฟองอย่างละเท่ากัน",
    price: 85,
    layers: [
      { c: brew.espresso, h: 25, name: "เอสเปรสโซ" },
      { c: brew.milk, h: 30, name: "นมร้อน" },
      { c: brew.foam, h: 28, name: "ฟองนม" },
    ],
  },
  {
    name: "Mocha",
    th: "ช็อกโกแลตใต้กาแฟ",
    price: 95,
    layers: [
      { c: brew.cocoa, h: 20, name: "ช็อกโกแลต" },
      { c: brew.coffee, h: 30, name: "เอสเปรสโซ" },
      { c: brew.milk, h: 25, name: "นมร้อน" },
      { c: brew.foam, h: 8, name: "ฟองนม" },
    ],
  },
];

/**
 * A café menu where picking a drink builds it: the old cup slides off the bar, a clean glass
 * drops in, and each layer pours from above in order (stream, then the layer rising from the
 * bottom), with steam once it is full. The glass shows the recipe; the newest choice always wins.
 */
export default function CoffeePour({ pour = 0.9 }: { pour?: number }) {
  const still = useReducedMotionAfterMount();
  const [pick, setPick] = useState(2);
  const [round, setRound] = useState(0);
  const d = menu[pick] ?? menu[0];
  if (!d) return null;
  const done = d.layers.length * pour + 0.4;

  return (
    <section className="@container relative isolate grid size-full min-h-[36rem] overflow-clip bg-(--em-ink-100) text-(--em-ink-950)">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-6 py-10 @3xl:grid-cols-[1fr_1fr]">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
            Coffee bar
          </p>
          <h2 className="mt-2 font-heading text-4xl leading-none font-black @2xl:text-5xl">
            วันนี้ดื่มอะไรดี
          </h2>
          <ul className="mt-6 grid gap-1.5" aria-label="เมนู">
            {menu.map((m, k) => (
              <li key={m.name}>
                <button
                  type="button"
                  aria-pressed={k === pick}
                  onClick={() => {
                    setPick(k);
                    setRound((r) => r + 1);
                  }}
                  className={cn(
                    "flex w-full items-baseline gap-3 rounded-md border px-4 py-3 text-start",
                    k === pick
                      ? "border-(--em-ink-950) bg-(--em-ink-0)"
                      : "border-transparent hover:border-(--em-ink-300)",
                  )}
                >
                  <span className="font-bold">{m.name}</span>
                  <span className="text-sm text-(--em-ink-600)">{m.th}</span>
                  <span className="ms-auto font-mono text-sm tabular-nums">฿{m.price}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* the bar */}
        <div className="relative grid h-96 place-items-end justify-center overflow-clip">
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3 rounded-sm bg-(--em-ink-800)"
          />
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={`${d.name}-${round}`}
              initial={still ? false : { y: -260, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={
                still
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { x: 260, rotate: 10, opacity: 0 }
              }
              transition={{ type: "spring", stiffness: 180, damping: 22 }}
              className="relative mb-3 h-56 w-40"
            >
              {/* steam once the glass is full */}
              {!still &&
                [0, 1, 2].map((k) => (
                  <motion.span
                    key={k}
                    aria-hidden
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 0.5, 0], y: [-4, -40], scaleX: [1, 1.6] }}
                    transition={{
                      delay: done + k * 0.5,
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    style={{ left: `${30 + k * 20}%` }}
                    className="vt-live absolute -top-2 h-10 w-2 rounded-full bg-(--em-ink-0) blur-sm"
                  />
                ))}

              {/* pour streams from above, one per layer */}
              {d.layers.map((l, k) => (
                <motion.span
                  key={`s${String(k)}`}
                  aria-hidden
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={still ? { opacity: 0 } : { scaleY: [0, 1, 1, 0], opacity: [1, 1, 1, 0] }}
                  transition={{ delay: 0.35 + k * pour, duration: pour, times: [0, 0.2, 0.8, 1] }}
                  style={{ background: l.c }}
                  className="absolute -top-40 left-1/2 h-[calc(100%+10rem)] w-1.5 origin-top -translate-x-1/2 rounded-full"
                />
              ))}

              {/* the glass */}
              <div className="absolute inset-0 overflow-clip rounded-b-xl border-4 border-t-0 border-(--em-ink-0)/80 bg-(--em-ink-0)/25 shadow-[inset_8px_0_12px_-8px] shadow-(--em-ink-0)">
                <div className="absolute inset-x-0 bottom-0 flex flex-col-reverse">
                  {d.layers.map((l, k) => (
                    <motion.div
                      key={l.name + String(k)}
                      initial={still ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.45 + k * pour, duration: pour * 0.8, ease: "easeOut" }}
                      style={{ height: `${String(l.h * 2.08)}px`, background: l.c }}
                      className="origin-bottom"
                    />
                  ))}
                </div>
              </div>
              <span
                aria-hidden
                className="absolute top-1/4 -right-7 h-20 w-8 rounded-e-xl border-4 border-s-0 border-(--em-ink-0)/80"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <ol
          aria-live="polite"
          className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-(--em-ink-600) @3xl:col-start-2"
        >
          {d.layers.map((l, k) => (
            <li key={l.name + String(k)} className="flex items-center gap-2">
              <span
                aria-hidden
                style={{ background: l.c }}
                className="size-3 rounded-sm border border-(--em-ink-300)"
              />
              {l.name}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
