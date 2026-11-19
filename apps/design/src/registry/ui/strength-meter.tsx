"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

const rules = [
  { label: "อย่างน้อย 12 ตัว", test: (s: string) => s.length >= 12 },
  { label: "มีตัวพิมพ์ใหญ่และเล็ก", test: (s: string) => /[a-z]/.test(s) && /[A-Z]/.test(s) },
  { label: "มีตัวเลข", test: (s: string) => /\d/.test(s) },
  { label: "มีสัญลักษณ์", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
];
const levels = [
  { label: "ยังอ่อน", tone: "bg-(--em-coral-500)" },
  { label: "พอใช้", tone: "bg-(--em-gold-500)" },
  { label: "ดี", tone: "bg-(--em-sky-500)" },
  { label: "แข็งแรง", tone: "bg-(--em-teal-400)" },
];

/** A password field with a four-step meter and a live checklist of what is still missing. */
export default function StrengthMeter() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const id = useId();
  const score = rules.filter((r) => r.test(pw)).length;
  const level = levels[Math.max(0, score - 1)];
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="w-full max-w-xs">
        <label htmlFor={id} className="text-sm font-medium text-(--em-ink-100)">
          รหัสผ่าน
        </label>
        <div className="mt-2 flex items-center rounded-lg border border-(--em-ink-700) bg-(--em-ink-900) focus-within:border-(--em-sky-400)">
          <input
            id={id}
            type={show ? "text" : "password"}
            value={pw}
            autoComplete="new-password"
            onChange={(e) => {
              setPw(e.target.value);
            }}
            aria-describedby={`${id}-h`}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-(--em-ink-50) outline-none"
          />
          <button
            type="button"
            aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            onClick={() => {
              setShow((s) => !s);
            }}
            className="grid size-10 place-items-center text-(--em-ink-400)"
          >
            {show ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
        <div className="mt-3 flex gap-1" aria-hidden>
          {levels.map((l, i) => (
            <span
              key={l.label}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--em-ink-800)"
            >
              <span
                className={`block h-full origin-left transition-transform duration-300 motion-reduce:transition-none ${level?.tone ?? ""} ${i < score ? "scale-x-100" : "scale-x-0"}`}
              />
            </span>
          ))}
        </div>
        <p id={`${id}-h`} aria-live="polite" className="mt-2 text-xs text-(--em-ink-300)">
          {pw ? (level?.label ?? "") : "พิมพ์เพื่อวัดความแข็งแรง"}
        </p>
        <ul className="mt-3 space-y-1">
          {rules.map((r) => {
            const ok = r.test(pw);
            return (
              <li
                key={r.label}
                className={`flex items-center gap-2 text-xs ${ok ? "text-(--em-teal-400)" : "text-(--em-ink-400)"}`}
              >
                <Check
                  aria-hidden
                  className={`size-3.5 transition-transform ${ok ? "scale-100" : "scale-0"}`}
                />
                {r.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
