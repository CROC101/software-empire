"use client";

import { useState } from "react";

const people = [
  { name: "มินตรา", role: "ออกแบบ", tone: "bg-(--em-blue-600)" },
  { name: "ธนา", role: "หลังบ้าน", tone: "bg-(--em-sky-500)" },
  { name: "ปาล์ม", role: "หน้าบ้าน", tone: "bg-(--em-blue-400)" },
  { name: "เจน", role: "ทดสอบ", tone: "bg-(--em-blue-800)" },
  { name: "โอ๊ต", role: "ข้อมูล", tone: "bg-(--em-sky-400)" },
  { name: "ฝน", role: "เขียนคำ", tone: "bg-(--em-blue-500)" },
];

/** Team cards in grey; colour fills back in only around the pointer, like a torch over a wall of photos. */
export default function TintGrid({ reach = 160 }: { reach?: number }) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <div
        className="grid w-full max-w-md grid-cols-3 gap-3"
        onPointerMove={(e) => {
          setP({ x: e.clientX, y: e.clientY });
        }}
        onPointerLeave={() => {
          setP(null);
        }}
      >
        {people.map((m) => (
          <div
            key={m.name}
            className="relative aspect-[3/4] overflow-hidden rounded-lg bg-(--em-ink-800)"
          >
            <Tint tone={m.tone} p={p} reach={reach} />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-sm font-black text-(--em-ink-0)">{m.name}</p>
              <p className="text-xs text-(--em-ink-200)">{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tint({
  tone,
  p,
  reach,
}: {
  tone: string;
  p: { x: number; y: number } | null;
  reach: number;
}) {
  const [box, setBox] = useState<HTMLSpanElement | null>(null);
  let o = 0;
  if (p && box) {
    const r = box.getBoundingClientRect();
    const d = Math.hypot(p.x - (r.left + r.width / 2), p.y - (r.top + r.height / 2));
    o = Math.max(0, 1 - d / reach);
  }
  return (
    <span
      ref={setBox}
      aria-hidden
      className={`absolute inset-0 transition-opacity duration-200 ${tone}`}
      style={{ opacity: o }}
    />
  );
}
