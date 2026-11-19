"use client";

import { motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";

const tabs = [
  { key: "all", label: "ทั้งหมด", body: "ทุกชิ้นในคลัง เรียงตามยอดนิยม" },
  { key: "new", label: "มาใหม่", body: "ชิ้นที่เพิ่งเพิ่มในรอบนี้" },
  { key: "fav", label: "โปรด", body: "ชิ้นที่คุณกดดาวไว้" },
  { key: "tpl", label: "เทมเพลต", body: "หน้าเว็บครบชุด พร้อมแก้" },
];

/** Tabs whose highlight slides to the chosen tab (shared layout). Arrow keys move between tabs. */
export default function TabsSlide() {
  const [active, setActive] = useState(0);
  const id = useId();

  const keys = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (active + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    setActive(next);
    document.getElementById(`${id}-t${String(next)}`)?.focus();
  };

  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-md">
        <div
          role="tablist"
          onKeyDown={keys}
          className="flex gap-1 rounded-lg border border-(--em-ink-800) bg-(--em-ink-900) p-1"
        >
          {tabs.map((t, i) => (
            <button
              key={t.key}
              id={`${id}-t${String(i)}`}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls={`${id}-p`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => {
                setActive(i);
              }}
              className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active === i ? "text-(--em-ink-0)" : "text-(--em-ink-300) hover:text-(--em-ink-100)"}`}
            >
              {active === i && (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-md bg-(--em-blue-600)"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <p id={`${id}-p`} role="tabpanel" className="mt-4 text-center text-sm text-(--em-ink-300)">
          {tabs[active]?.body}
        </p>
      </div>
    </div>
  );
}
