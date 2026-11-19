"use client";

import { Bell, Home, Search, User } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState } from "react";

const items = [
  { label: "หน้าแรก", icon: Home },
  { label: "ค้นหา", icon: Search },
  { label: "แจ้งเตือน", icon: Bell },
  { label: "ฉัน", icon: User },
];

/** A phone tab bar: the active tab grows a pill with its label, the others stay as icons. */
export default function BottomBar() {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    <div className="grid size-full min-h-56 place-items-end justify-center bg-(--em-ink-975) p-6">
      <nav
        aria-label="แถบล่าง"
        className="flex gap-1 rounded-xl border border-(--em-ink-800) bg-(--em-ink-900)/90 p-1.5 shadow-2xl"
      >
        {items.map((it, i) => {
          const Icon = it.icon;
          const on = active === i;
          return (
            <button
              key={it.label}
              type="button"
              aria-current={on ? "page" : undefined}
              aria-label={it.label}
              onClick={() => {
                setActive(i);
              }}
              className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold ${on ? "text-(--em-ink-0)" : "text-(--em-ink-400)"}`}
            >
              {on && (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 rounded-lg bg-(--em-blue-600)"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon aria-hidden className="relative size-5" />
              {on && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  {it.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
