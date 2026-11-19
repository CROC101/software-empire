"use client";

import { CornerDownLeft, FileText, Moon, Palette, Search, Settings, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";

const commands = [
  { label: "สร้างหน้าใหม่", group: "ทำงาน", icon: FileText },
  { label: "เพิ่มเอฟเฟกต์", group: "ทำงาน", icon: Sparkles },
  { label: "เปลี่ยนธีมมืด", group: "หน้าตา", icon: Moon },
  { label: "เปิดคลังสี", group: "หน้าตา", icon: Palette },
  { label: "ตั้งค่าบัญชี", group: "ระบบ", icon: Settings },
];

/** A command box: filters as you type, arrows move the highlight, Enter runs. A combobox in ARIA terms. */
export default function CommandMenu() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [ran, setRan] = useState<string | null>(null);
  const id = useId();
  const list = commands.filter((c) => c.label.includes(q.trim()));
  const cur = Math.min(active, Math.max(0, list.length - 1));

  const keys = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((cur + 1) % Math.max(1, list.length));
    else if (e.key === "ArrowUp") setActive((cur - 1 + list.length) % Math.max(1, list.length));
    else if (e.key === "Enter") setRan(list[cur]?.label ?? null);
    else return;
    e.preventDefault();
  };

  return (
    <div className="grid size-full min-h-96 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-(--em-ink-700) bg-(--em-ink-900) shadow-2xl">
        <div className="flex items-center gap-3 border-b border-(--em-ink-800) px-4">
          <Search aria-hidden className="size-4 text-(--em-ink-400)" />
          <input
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-l`}
            aria-activedescendant={list.length ? `${id}-${String(cur)}` : undefined}
            aria-label="ค้นหาคำสั่ง"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={keys}
            placeholder="พิมพ์คำสั่ง..."
            className="h-12 flex-1 bg-transparent text-sm text-(--em-ink-50) outline-none placeholder:text-(--em-ink-500)"
          />
          <kbd className="rounded border border-(--em-ink-700) px-1.5 font-mono text-[10px] text-(--em-ink-400)">
            ESC
          </kbd>
        </div>
        <ul
          id={`${id}-l`}
          role="listbox"
          aria-label="คำสั่ง"
          className="max-h-64 overflow-y-auto p-1.5"
        >
          {list.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-(--em-ink-400)">ไม่พบคำสั่ง</li>
          )}
          {list.map((c, i) => {
            const Icon = c.icon;
            const showGroup = i === 0 || list[i - 1]?.group !== c.group;
            return (
              <li key={c.label} role="presentation">
                {showGroup && (
                  <p className="px-3 pt-2 pb-1 text-xs text-(--em-ink-500)">{c.group}</p>
                )}
                <div
                  id={`${id}-${String(i)}`}
                  role="option"
                  aria-selected={i === cur}
                  onPointerMove={() => {
                    setActive(i);
                  }}
                  onClick={() => {
                    setRan(c.label);
                  }}
                  className="relative flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-(--em-ink-100)"
                >
                  {i === cur && (
                    <motion.span
                      layoutId={`${id}-hl`}
                      className="absolute inset-0 rounded-md bg-(--em-blue-600)/25"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon aria-hidden className="relative size-4 text-(--em-sky-400)" />
                  <span className="relative flex-1">{c.label}</span>
                  {i === cur && (
                    <CornerDownLeft aria-hidden className="relative size-3.5 text-(--em-ink-400)" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p
          aria-live="polite"
          className="border-t border-(--em-ink-800) px-4 py-2 text-xs text-(--em-ink-400)"
        >
          {ran ? `สั่งแล้ว: ${ran}` : "↑ ↓ เลือก · Enter สั่ง"}
        </p>
      </div>
    </div>
  );
}
