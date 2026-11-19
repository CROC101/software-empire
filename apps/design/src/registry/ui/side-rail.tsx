"use client";

import {
  BarChart3,
  Folder,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const items = [
  { label: "ภาพรวม", icon: LayoutGrid },
  { label: "โปรเจกต์", icon: Folder },
  { label: "รายงาน", icon: BarChart3 },
  { label: "ตั้งค่า", icon: Settings },
];

/** An app sidebar that folds down to an icon rail; labels fade while the width springs. */
export default function SideRail() {
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState(0);
  return (
    <div className="flex size-full min-h-80 bg-(--em-ink-975)">
      <motion.nav
        aria-label="เมนูข้าง"
        animate={{ width: wide ? 208 : 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="flex shrink-0 flex-col gap-1 overflow-hidden border-r border-(--em-ink-800) bg-(--em-ink-900) p-2"
      >
        <button
          type="button"
          onClick={() => {
            setWide((w) => !w);
          }}
          aria-label={wide ? "ย่อเมนู" : "ขยายเมนู"}
          aria-expanded={wide}
          className="mb-2 grid size-12 place-items-center rounded-lg text-(--em-ink-300) hover:bg-(--em-ink-800)"
        >
          {wide ? (
            <PanelLeftClose aria-hidden className="size-5" />
          ) : (
            <PanelLeftOpen aria-hidden className="size-5" />
          )}
        </button>
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <button
              key={it.label}
              type="button"
              title={wide ? undefined : it.label}
              aria-current={active === i ? "page" : undefined}
              onClick={() => {
                setActive(i);
              }}
              className={`flex h-12 items-center gap-3 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${active === i ? "bg-(--em-blue-600) text-(--em-ink-0)" : "text-(--em-ink-300) hover:bg-(--em-ink-800)"}`}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              <motion.span animate={{ opacity: wide ? 1 : 0 }} className={wide ? "" : "sr-only"}>
                {it.label}
              </motion.span>
            </button>
          );
        })}
      </motion.nav>
      <div className="grid flex-1 place-items-center p-6 text-sm text-(--em-ink-400)">
        {items[active]?.label}
      </div>
    </div>
  );
}
