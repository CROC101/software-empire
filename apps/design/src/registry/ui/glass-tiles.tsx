"use client";

import { Calendar, FileText, Mail, Music, Settings, Wallet } from "lucide-react";

const tiles = [
  { icon: Mail, label: "อีเมล", tone: "bg-(--em-blue-500)" },
  { icon: Calendar, label: "ปฏิทิน", tone: "bg-(--em-sky-500)" },
  { icon: FileText, label: "เอกสาร", tone: "bg-(--em-blue-700)" },
  { icon: Wallet, label: "กระเป๋า", tone: "bg-(--em-blue-400)" },
  { icon: Music, label: "เพลง", tone: "bg-(--em-sky-400)" },
  { icon: Settings, label: "ตั้งค่า", tone: "bg-(--em-ink-600)" },
];

/** App icons made of two layers: a coloured plate behind and a frosted pane in front; on hover the plate swings out. */
export default function GlassTiles() {
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <ul className="grid grid-cols-3 gap-8">
        {tiles.map(({ icon: Icon, label, tone }) => (
          <li key={label}>
            <a
              href="#"
              aria-label={label}
              className="group flex flex-col items-center gap-2 focus-visible:outline-none"
            >
              <span className="relative size-16" style={{ perspective: 300 }}>
                <span
                  aria-hidden
                  className={`absolute inset-0 rotate-[15deg] rounded-xl transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-[25deg] group-focus-visible:rotate-[25deg] ${tone}`}
                />
                <span className="absolute inset-0 grid place-items-center rounded-xl border border-(--em-ink-0)/30 bg-(--em-ink-0)/15 backdrop-blur-md transition-transform duration-300 group-hover:translate-z-4 group-focus-visible:outline-2 group-focus-visible:outline-(--em-sky-400)">
                  <Icon aria-hidden className="size-6 text-(--em-ink-0)" />
                </span>
              </span>
              <span className="text-xs text-(--em-ink-300) opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {label}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
