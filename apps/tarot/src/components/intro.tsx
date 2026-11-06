import { MeshMascot } from "@empire/ui";
import { CalendarCheck, History, Layers, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SPLASH_SEEN = "tt-splash"; // per tab session: the splash greets a visit, not every page
const INTRO_SEEN = "tt-intro"; // per device: the tour of the app shows once

function read(store: () => Storage, key: string) {
  try {
    return store().getItem(key) === "1";
  } catch {
    // storage blocked: behave as if seen, never loop the greeting
    return true;
  }
}
function write(store: () => Storage, key: string) {
  try {
    store().setItem(key, "1");
  } catch {
    // storage blocked: the greeting may show again, nothing breaks
  }
}

/** The owl and the name on the first load of a visit; fades by itself, a tap skips it. */
export function Splash() {
  const [shown, setShown] = useState(
    () =>
      !read(() => sessionStorage, SPLASH_SEEN) &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!shown) return;
    write(() => sessionStorage, SPLASH_SEEN);
    const out = window.setTimeout(() => setLeaving(true), 1100);
    const done = window.setTimeout(() => setShown(false), 1500);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, [shown]);

  if (!shown) return null;
  return (
    <button
      type="button"
      onClick={() => setShown(false)}
      aria-label="ข้ามหน้าเปิด"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-[var(--em-ink-975)] transition-opacity duration-400 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <MeshMascot kind="owl" className="size-32" />
      <span className="font-heading text-2xl font-bold text-[var(--em-ink-0)]">crocwork tarot</span>
      <span className="font-heading text-xs text-[var(--em-ink-400)]">v{__APP_VERSION__}</span>
    </button>
  );
}

const FEATURES = [
  { icon: Sun, title: "ไพ่ประจำวัน", body: "วันละหนึ่งใบสำหรับคุณ เปิดดูได้ทุกเช้า" },
  {
    icon: Layers,
    title: "อ่านไพ่หลายแบบ",
    body: "ใบเดียว สามใบ ใช่หรือไม่ ความรัก ไปจนถึงเซลติกครอส",
  },
  {
    icon: CalendarCheck,
    title: "เช็กอินรับเหรียญ",
    body: "แวะมาทุกวันรับเหรียญ ใช้เปิดกระดานไพ่พิเศษ",
  },
  { icon: History, title: "เก็บประวัติ", body: "ทุกครั้งที่เปิดไพ่ ย้อนกลับมาอ่านได้เสมอ" },
];

/** First visit on this device: what the app does, in four lines, as a bottom sheet. */
export function IntroSheet({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [needed] = useState(() => !read(() => localStorage, INTRO_SEEN));

  useEffect(() => {
    if (needed) ref.current?.showModal();
    else onDone();
  }, [needed, onDone]);

  const close = () => {
    write(() => localStorage, INTRO_SEEN);
    ref.current?.close();
    onDone();
  };

  if (!needed) return null;
  return (
    <dialog
      ref={ref}
      aria-labelledby="intro-title"
      onCancel={close}
      className="mx-auto mt-auto mb-0 w-full max-w-md rounded-t-2xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-[var(--em-ink-50)] backdrop:bg-black/60 sm:mb-auto sm:rounded-2xl"
    >
      <div className="flex items-center gap-3">
        <MeshMascot kind="owl" className="size-14" />
        <div>
          <h2 id="intro-title" className="text-xl font-black text-[var(--em-ink-0)]">
            นกฮูกพร้อมเปิดไพ่ให้แล้ว
          </h2>
          <p className="text-sm text-[var(--em-ink-300)]">ทำอะไรได้บ้างในแอปนี้</p>
        </div>
      </div>
      <ul className="my-5 space-y-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)] text-[var(--em-blue-200)]">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-[var(--em-ink-300)]">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={close}
        className="min-h-11 w-full rounded-md bg-primary font-bold text-primary-foreground"
      >
        เริ่มเลย
      </button>
    </dialog>
  );
}
