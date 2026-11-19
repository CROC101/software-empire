"use client";

import { useId, useState } from "react";

const cols = [
  { h: "บริการ", l: ["ออกแบบเว็บ", "พัฒนาเว็บ", "ดูแลระบบ"] },
  { h: "บริษัท", l: ["เกี่ยวกับเรา", "ผลงาน", "ร่วมงาน"] },
  { h: "ช่วยเหลือ", l: ["คำถามพบบ่อย", "ติดต่อ", "นโยบายความเป็นส่วนตัว"] },
];

/** A multi-column footer with a newsletter box and a copyright line. */
export default function FooterColumns() {
  const [sent, setSent] = useState(false);
  const id = useId();
  return (
    <footer className="bg-(--em-ink-975) text-(--em-ink-100) @container">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 @3xl:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-heading text-xl font-black text-(--em-ink-0)">crocwork</p>
          <p className="mt-3 max-w-xs text-sm text-(--em-ink-400)">
            สตูดิโอเว็บคนเดียว ทำตั้งแต่ออกแบบจนขึ้นระบบ
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-5 flex max-w-xs gap-2"
          >
            <label htmlFor={id} className="sr-only">
              อีเมลรับข่าว
            </label>
            <input
              id={id}
              type="email"
              required
              autoComplete="email"
              placeholder="อีเมลของคุณ"
              className="min-w-0 flex-1 rounded-md border border-(--em-ink-800) bg-(--em-ink-900) px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-(--em-blue-600) px-3 py-2 text-sm font-semibold text-(--em-ink-0)"
            >
              สมัคร
            </button>
          </form>
          <p aria-live="polite" className="mt-2 h-5 text-sm text-(--em-sky-400)">
            {sent ? "ขอบคุณ (ตัวอย่าง ไม่ได้ส่งจริง)" : ""}
          </p>
        </div>
        {cols.map((c) => (
          <nav key={c.h} aria-label={c.h}>
            <p className="text-sm font-semibold text-(--em-ink-0)">{c.h}</p>
            <ul className="mt-3 space-y-2 text-sm text-(--em-ink-400)">
              {c.l.map((l) => (
                <li key={l}>
                  <a href={`#${l}`} className="hover:text-(--em-ink-0)">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-(--em-ink-800)">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-(--em-ink-500)">
          © 2026 crocwork สงวนลิขสิทธิ์
        </p>
      </div>
    </footer>
  );
}
