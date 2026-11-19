"use client";

import { BarChart3, Bell, FolderKanban, Home, Menu, Settings, Users } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";

const nav = [
  { t: "ภาพรวม", i: Home },
  { t: "โปรเจกต์", i: FolderKanban },
  { t: "ลูกค้า", i: Users },
  { t: "รายงาน", i: BarChart3 },
  { t: "ตั้งค่า", i: Settings },
];
const cards = [
  { l: "รายได้เดือนนี้", v: "฿48,200", d: "+12%" },
  { l: "งานที่เปิดอยู่", v: "7", d: "+2" },
  { l: "ลูกค้าใหม่", v: "5", d: "+1" },
];
const bars = [42, 58, 35, 70, 64, 88, 76];

/** An app shell: sidebar (collapses to a menu button on narrow containers), top bar, stat cards and a chart. */
export default function DashboardShell() {
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="flex min-h-[34rem] bg-muted/40 text-foreground @container">
      <aside
        id={id}
        className={`${open ? "flex" : "hidden"} w-52 shrink-0 flex-col border-r border-border bg-card p-3 @3xl:flex`}
      >
        <p className="px-3 py-2 font-heading text-lg font-black">crocwork</p>
        <nav aria-label="แดชบอร์ด" className="mt-2">
          <ul className="space-y-1">
            {nav.map(({ t, i: Icon }, i) => (
              <li key={t}>
                <button
                  type="button"
                  aria-current={at === i ? "page" : undefined}
                  onClick={() => {
                    setAt(i);
                  }}
                  className="relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm"
                >
                  {at === i && (
                    <motion.span
                      layoutId={`${id}-nav`}
                      className="absolute inset-0 rounded-md bg-primary/10"
                    />
                  )}
                  <Icon
                    aria-hidden
                    className={`relative size-4 ${at === i ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="relative">{t}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              aria-label="เมนู"
              onClick={() => {
                setOpen((o) => !o);
              }}
              className="grid size-9 place-items-center rounded-md border border-border @3xl:hidden"
            >
              <Menu aria-hidden className="size-4" />
            </button>
            <h1 className="font-semibold">{nav[at]?.t}</h1>
          </div>
          <button
            type="button"
            aria-label="การแจ้งเตือน"
            className="relative grid size-9 place-items-center rounded-md border border-border"
          >
            <Bell aria-hidden className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          </button>
        </header>
        <main className="space-y-4 p-5">
          <ul className="grid gap-4 @xl:grid-cols-3">
            {cards.map((c) => (
              <li key={c.l} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">{c.l}</p>
                <p className="mt-1 font-heading text-2xl font-black">{c.v}</p>
                <p className="text-xs font-semibold text-success">{c.d}</p>
              </li>
            ))}
          </ul>
          <figure className="rounded-xl border border-border bg-card p-4">
            <figcaption className="text-sm font-semibold">ผู้เข้าชม 7 วันล่าสุด</figcaption>
            <div className="mt-4 flex h-40 items-end gap-3">
              {bars.map((b, i) => (
                <motion.span
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 140, damping: 18 }}
                  className="flex-1 origin-bottom rounded-t bg-primary/80"
                  style={{ height: `${String(b)}%` }}
                  title={`${String(b * 10)} คน`}
                />
              ))}
            </div>
          </figure>
        </main>
      </div>
    </div>
  );
}
