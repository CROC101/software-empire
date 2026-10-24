"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, GalleryHorizontalEnd, LayoutGrid, List, Sparkle, Star, X } from "lucide-react";
import {
  currentAmbience,
  setAmbience,
  subscribeTheme,
  type Ambience as AmbienceChoice,
} from "@empire/core/theme";
import { cn } from "../lib/cn";
import { ICON, setAmbiencePreview } from "./ambience";

/**
 * "เลือกพื้นหลัง" sheet: pick the shared sky for every app. Tapping a card previews it on the
 * page right away; nothing is saved until ยืนยัน. Bottom sheet on phones, centred card on
 * larger screens. Native <dialog>: Escape, focus trap and focus return come from the browser.
 */

type Option = {
  id: AmbienceChoice;
  title: string;
  body: string;
  /** thumbnail sky */
  sky: string;
  /** dots drawn on the thumbnail (stars, drops, flakes, petals) */
  bits: "stars" | "drops" | "flakes" | "petals" | "none";
};

const SECTIONS: { title: string; note: string; icon: typeof Star; options: Option[] }[] = [
  {
    title: "ตามฤดูกาล",
    note: "ท้องฟ้าเปลี่ยนเองตามฤดูของไทย",
    icon: Sparkle,
    options: [
      {
        id: "auto",
        title: "ตามฤดูกาลจริง",
        body: "หน้าร้อนดอกคูน หน้าฝนฝนตก หน้าหนาวละอองหนาว กลางคืนเป็นอวกาศ",
        sky: "linear-gradient(180deg, oklch(0.32 0.1 285), oklch(0.62 0.12 300) 60%, oklch(0.85 0.08 330))",
        bits: "stars",
      },
    ],
  },
  {
    title: "ท้องฟ้า",
    note: "เลือกเองตายตัว ทุกระบบเห็นเหมือนกัน",
    icon: Star,
    options: [
      {
        id: "space",
        title: "อวกาศ · ดาวตก",
        body: "ฟ้ามืด ดาวตกผ่านเป็นระยะ",
        sky: "linear-gradient(180deg, oklch(0.16 0.06 275), oklch(0.3 0.12 285) 70%, oklch(0.45 0.14 300))",
        bits: "stars",
      },
      {
        id: "rain",
        title: "มีฝนตก",
        body: "สายฝนบาง ๆ ไม่บังเนื้อหา",
        sky: "linear-gradient(180deg, oklch(0.36 0.05 265), oklch(0.6 0.07 280) 70%, oklch(0.78 0.05 290))",
        bits: "drops",
      },
      {
        id: "snow",
        title: "อากาศหนาว",
        body: "ฟ้าใส ละอองหนาวลอยช้า ๆ",
        sky: "linear-gradient(180deg, oklch(0.55 0.12 255), oklch(0.8 0.07 245) 65%, oklch(0.94 0.02 240))",
        bits: "flakes",
      },
      {
        id: "bloom",
        title: "ดอกคูนบาน",
        body: "ฟ้าอุ่น กลีบทองร่วงหน้าร้อน",
        sky: "linear-gradient(180deg, oklch(0.42 0.1 300), oklch(0.75 0.12 60) 70%, oklch(0.9 0.1 85))",
        bits: "petals",
      },
    ],
  },
  {
    title: "ปิดพื้นหลัง",
    note: "ไม่มีเอฟเฟกต์ ประหยัดแบต",
    icon: X,
    options: [
      {
        id: "off",
        title: "ไม่ใช้พื้นหลัง",
        body: "หน้าจอนิ่ง ไม่มีอะไรขยับ",
        sky: "linear-gradient(180deg, oklch(0.24 0.03 275), oklch(0.32 0.04 285))",
        bits: "none",
      },
    ],
  },
];

type View = "grid" | "carousel" | "list";
const VIEWS: { id: View; label: string; icon: typeof List }[] = [
  { id: "grid", label: "ตาราง", icon: LayoutGrid },
  { id: "carousel", label: "เลื่อนข้าง", icon: GalleryHorizontalEnd },
  { id: "list", label: "รายการ", icon: List },
];

const GOLD = "oklch(0.84 0.13 85)";

function Thumb({ option, className }: { option: Option; className?: string }) {
  const Icon = ICON[option.id];
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden", className)}
      style={{ background: option.sky }}
    >
      {/* soft cloud bank along the bottom */}
      <div className="absolute inset-x-[-10%] bottom-[-18%] h-1/2 rounded-[50%] bg-[oklch(0.95_0.03_300/0.55)] blur-md" />
      {option.bits !== "none" &&
        Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "absolute",
              option.bits === "stars" && "size-1 rounded-full bg-white/90",
              option.bits === "drops" && "h-3 w-px rotate-12 bg-white/70",
              option.bits === "flakes" &&
                "size-1.5 rounded-full bg-white/90 shadow-[0_0_4px_white]",
              option.bits === "petals" && "h-1.5 w-2.5 rounded-[80%_10%] bg-[oklch(0.86_0.15_88)]",
            )}
            style={{
              left: `${String(10 + ((i * 37) % 80))}%`,
              top: `${String(10 + ((i * 23) % 50))}%`,
            }}
          />
        ))}
      <Icon className="absolute left-2.5 top-2.5 size-4 text-white/85" />
    </div>
  );
}

function Card({
  option,
  view,
  selected,
  recommended,
  onPick,
}: {
  option: Option;
  view: View;
  selected: boolean;
  recommended: boolean;
  onPick: () => void;
}) {
  const list = view === "list";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-[oklch(0.2_0.06_285)] text-left text-white outline-none ring-2 ring-transparent transition-[transform,box-shadow] duration-300 active:scale-[0.97] focus-visible:ring-[var(--ring)]",
        list ? "flex w-full items-center gap-4 p-2.5" : "flex flex-col",
        view === "carousel" && "w-52 shrink-0 snap-center",
      )}
      style={selected ? { boxShadow: `0 0 0 2px ${GOLD}` } : undefined}
    >
      <Thumb
        option={option}
        className={list ? "aspect-[4/3] w-28 shrink-0 rounded-xl" : "aspect-[4/3] w-full"}
      />
      <span className={cn("flex min-w-0 flex-col gap-0.5", list ? "py-1" : "p-3.5")}>
        <span
          className="flex items-center gap-2 text-[0.95rem] font-bold"
          style={selected ? { color: GOLD } : undefined}
        >
          {option.title}
          {recommended && (
            <span
              className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-[oklch(0.25_0.05_80)]"
              style={{ background: GOLD }}
            >
              แนะนำ
            </span>
          )}
        </span>
        <span className="line-clamp-2 text-xs text-white/70">{option.body}</span>
      </span>
      {selected && (
        <span
          className={cn(
            "absolute grid size-7 place-items-center rounded-full text-[oklch(0.25_0.05_80)] shadow",
            list ? "left-[6.25rem] top-3.5" : "right-2.5 top-2.5",
          )}
          style={{ background: GOLD }}
        >
          <Check aria-hidden className="size-4" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export function AmbiencePicker({
  cookieDomain,
  onClose,
}: {
  cookieDomain?: string;
  onClose: () => void;
}) {
  const saved = useSyncExternalStore(subscribeTheme, currentAmbience, () => "auto" as const);
  const [pick, setPick] = useState<AmbienceChoice>(saved);
  const [view, setView] = useState<View>("grid");
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
    // leaving without confirming puts the saved sky back
    return () => setAmbiencePreview(null);
  }, []);

  const choose = (id: AmbienceChoice) => {
    setPick(id);
    setAmbiencePreview(id);
  };
  const confirm = () => {
    setAmbience(pick, cookieDomain);
    setAmbiencePreview(null);
    ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="em-amb-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="em-amb-sheet mx-auto mb-0 mt-auto max-h-[88dvh] w-full max-w-xl overflow-hidden rounded-t-[1.75rem] bg-[oklch(0.97_0.015_290)] p-0 text-[oklch(0.2_0.04_285)] backdrop:bg-black/55 backdrop:backdrop-blur-sm sm:mb-auto sm:rounded-[1.75rem]"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="shrink-0 px-5 pb-4 pt-3 text-center">
          <span
            aria-hidden
            className="mx-auto block h-1.5 w-12 rounded-full bg-[oklch(0.8_0.08_290)]"
          />
          <h2 id="em-amb-title" className="mt-4 text-xl font-black">
            เลือกพื้นหลัง
          </h2>
          <p className="mt-1 text-sm opacity-70">
            แตะเพื่อดูตัวอย่าง แล้วกดยืนยันเพื่อใช้กับทุกระบบ
          </p>
          <div
            role="tablist"
            aria-label="มุมมอง"
            className="mx-auto mt-4 flex w-fit gap-1 rounded-full border border-[oklch(0.85_0.06_290)] bg-[oklch(0.93_0.03_290)] p-1"
          >
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300",
                  view === id
                    ? "bg-[var(--em-blue-600)] text-white"
                    : "opacity-75 hover:opacity-100",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          {SECTIONS.map(({ title, note, icon: Icon, options }) => (
            <section key={title} className="mt-2 pb-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px flex-1 bg-gradient-to-r from-transparent to-[oklch(0.7_0.12_290)]"
                />
                <h3 className="flex items-center gap-1.5 font-black">
                  <Icon aria-hidden className="size-4 text-[var(--em-blue-600)]" />
                  {title}
                </h3>
                <span
                  aria-hidden
                  className="h-px flex-1 bg-gradient-to-l from-transparent to-[oklch(0.7_0.12_290)]"
                />
              </div>
              <p className="mb-3 mt-1 text-center text-xs opacity-65">{note}</p>
              <div
                role="radiogroup"
                aria-label={title}
                className={cn(
                  view === "grid" && "grid grid-cols-2 gap-3 sm:grid-cols-3",
                  view === "carousel" &&
                    "-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2",
                  view === "list" && "flex flex-col gap-2.5",
                )}
              >
                {options.map((o) => (
                  <Card
                    key={o.id}
                    option={o}
                    view={view}
                    selected={pick === o.id}
                    recommended={o.id === "auto"}
                    onPick={() => choose(o.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="shrink-0 border-t border-[oklch(0.88_0.04_290)] p-4">
          <button
            type="button"
            onClick={confirm}
            disabled={pick === saved}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--em-blue-600)] py-3.5 font-bold text-white transition-[opacity,transform] active:scale-[0.98] disabled:opacity-45"
          >
            <Check aria-hidden className="size-4" strokeWidth={3} />
            ยืนยัน
          </button>
        </div>
      </div>
    </dialog>
  );
}
