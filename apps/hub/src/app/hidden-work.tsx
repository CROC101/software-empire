"use client";

import { FlashlightTextReveal, useTokenColors } from "@empire/ui";
import { PGTAP_TESTS } from "@/lib/facts";

/**
 * After the screens you can see: the work you cannot. A dark wall in ink (one light only, so no
 * coloured blob competes with it); the pointer is a flashlight that reads the sentence, and the
 * facts behind it stay lit below.
 */
export function HiddenWork() {
  const colors = useTokenColors(["--em-ink-975", "--em-ink-800", "--em-ink-0"]);
  const [wall, glow, ink] = colors ?? [];
  if (!wall || !glow || !ink)
    return <div className="bg-[var(--em-ink-975)]" style={{ height: "min(80svh, 720px)" }} />;
  return (
    <FlashlightTextReveal
      text={"ส่วนที่คุณมองไม่เห็น\nคือส่วนที่ผม\nใช้เวลามากที่สุด"}
      textColor={ink}
      colors={[wall, glow]}
      fontFamily='"Noto Sans Thai UI", "Plus Jakarta Sans UI", sans-serif'
      fontWeight={900}
      fontSize="clamp(2.4rem, 8vw, 7rem)"
      lineHeight={1.12}
      ghost={0.04}
      radius={0.32}
      height="min(80svh, 720px)"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex max-w-6xl justify-between px-4 pt-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-blue-500)] sm:px-6">
        <span>behind the screens</span>
        <span className="hidden text-[var(--em-ink-400)] sm:inline">ส่องไฟฉายอ่านได้</span>
      </div>
      <ul className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 pb-8 font-mono text-xs text-[var(--em-ink-300)] sm:px-6">
        <li>RLS ทุกตาราง</li>
        <li>pgTAP {PGTAP_TESTS} ข้อ ผ่านทุกข้อ</li>
        <li>ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ</li>
        <li>ไม่เก็บ token ใน localStorage</li>
      </ul>
    </FlashlightTextReveal>
  );
}
