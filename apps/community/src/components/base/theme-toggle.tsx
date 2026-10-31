import { useSyncExternalStore } from "react";
import {
  currentChoice as readChoice,
  setThemeChoice,
  subscribeTheme as subscribe,
  type ThemeChoice,
} from "@empire/core/theme";
import { env } from "@/lib/env";
import { Monitor, Moon, Sun } from "lucide-react";

/// สลับธีม สว่าง / มืด / ตามระบบ
///
/// **ก่อนหน้านี้โหมดมืดไม่เคยทำงานเลย** — `globals.css` นิยามสีครบทั้งสองชุด
/// และ `subsystem.yaml` ประกาศว่า `theme: light+dark` แต่ไม่มีโค้ดไหนใส่คลาส
/// `.dark` ให้เลย สีชุดมืดจึงเป็นโค้ดที่ไม่มีวันถูกใช้
///
/// ค่าเริ่มต้นคือ **สว่าง** ให้หน้าตาตรงกับ Core Hub (PL ตัดสิน 8 ต.ค. 2569)
/// ผู้ใช้ที่อยากได้มืดหรือตามเครื่องเลือกเองได้ และระบบจำไว้

export type { ThemeChoice };

/// ธีมเก็บใน cookie กลาง em-theme ของทุกแอปใน hub (@empire/core/theme) ไม่ใช่ localStorage
/// เปลี่ยนที่นี่ แอปอื่นทุกตัวเปลี่ยนตาม

const OPTIONS: ReadonlyArray<{
  value: ThemeChoice;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "light", label: "สว่าง", Icon: Sun },
  { value: "system", label: "ตามระบบ", Icon: Monitor },
  { value: "dark", label: "มืด", Icon: Moon },
];

/// ฝั่งเซิร์ฟเวอร์ไม่มี document.cookie — ใช้ค่าเริ่มต้นเดียวกับเบราว์เซอร์
const serverChoice = (): ThemeChoice => "light";

/// ธีมปัจจุบันสำหรับที่อื่นที่ไม่ใช่ปุ่มสามตัว — เช่นสวิตช์ "โหมดมืด" ในเมนู ≡
/// แบบ Instagram · `dark` คือผลจริงบนหน้าจอ (รวมกรณี "ตามระบบ" ที่ OS เป็นมืด)
export function useThemeChoice() {
  const choice = useSyncExternalStore(subscribe, readChoice, serverChoice);
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

  return { choice, dark, pick: pickTheme };
}

function pickTheme(next: ThemeChoice): void {
  setThemeChoice(next, env.supabase.cookieDomain);
  // cookieStore ไม่ยิงเสมอไปในแท็บที่เป็นคนเขียน — ปลุก store ด้วยมือ
  window.dispatchEvent(new Event("focus"));
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, readChoice, serverChoice);

  const pick = pickTheme;

  return (
    <div
      role="radiogroup"
      aria-label="ธีมของหน้าจอ"
      className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = choice === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => pick(value)}
            className={`grid size-6 place-items-center rounded-md transition-colors ${
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon aria-hidden className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
