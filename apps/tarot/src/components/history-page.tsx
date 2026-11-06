import { EyeOff, History } from "lucide-react";
import { useEffect, useState } from "react";
import { getReadings, hideReading, type StoredReading } from "@/lib/api";
import { cardAt, cardImage, DECK } from "@/lib/deck";
import { SPREADS, TOPICS, type Drawn, type SpreadId } from "@/lib/reading";
import { signInUrl, useSession } from "@/lib/session";
import { Result } from "./read-page";

const when = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function toDrawn(cards: StoredReading["cards"]): Drawn[] {
  return cards.map((c) => ({
    card: DECK.find((d) => d.id === c.id) ?? cardAt(0),
    reversed: c.reversed,
  }));
}

/** Past readings, newest first; open one to read it again, or hide it from the list. */
export function HistoryPage() {
  const { user, ready } = useSession();
  const [items, setItems] = useState<StoredReading[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    getReadings()
      .then((r) => {
        if (active) setItems(r);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (active) setError("โหลดประวัติไม่สำเร็จ");
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!ready) return null;
  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 pb-28 pt-12 text-center text-[var(--em-ink-50)]">
        <History className="size-10 text-[var(--em-blue-300)]" aria-hidden />
        <h1 className="text-2xl font-black text-[var(--em-ink-0)]">ประวัติการอ่านไพ่</h1>
        <p className="text-sm text-[var(--em-ink-200)]">
          เข้าสู่ระบบแล้วทุกครั้งที่เปิดไพ่จะถูกเก็บไว้ที่นี่
        </p>
        <a
          href={signInUrl(window.location.href)}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-6 font-bold text-primary-foreground"
        >
          เข้าสู่ระบบ
        </a>
      </div>
    );
  }

  const hide = async (id: string) => {
    try {
      await hideReading(id);
      setItems((list) => list?.filter((r) => r.id !== id) ?? null);
    } catch (err) {
      console.error(err);
      setError("ซ่อนไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-28 pt-6 text-[var(--em-ink-50)]">
      <h1 className="text-2xl font-black text-[var(--em-ink-0)]">ประวัติการอ่านไพ่</h1>
      {error && (
        <p role="alert" className="text-sm text-[var(--em-danger-dark)]">
          {error}
        </p>
      )}
      {items === null && !error && <p role="status">กำลังโหลด…</p>}
      {items?.length === 0 && (
        <p className="tt-panel p-4 text-sm text-[var(--em-ink-200)]">
          ยังไม่มีประวัติ ลองเปิดไพ่ที่แท็บ “อ่านไพ่”
        </p>
      )}
      <ul className="space-y-3">
        {items?.map((r) => {
          const spread = (r.spread in SPREADS ? r.spread : "one") as SpreadId;
          const drawn = toDrawn(r.cards);
          const isOpen = open === r.id;
          return (
            <li key={r.id} className="tt-panel p-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-11 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex -space-x-4">
                    {drawn.slice(0, 3).map((d) => (
                      <img
                        key={d.card.id}
                        src={cardImage(d.card)}
                        alt=""
                        width={42}
                        height={73}
                        loading="lazy"
                        className={`h-14 w-auto rounded-sm ring-1 ring-[var(--em-ink-975)] ${d.reversed ? "rotate-180" : ""}`}
                      />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{SPREADS[spread].label}</span>
                    <span className="block text-xs text-[var(--em-ink-300)]">
                      {TOPICS.find((t) => t.id === r.topic)?.label} ·{" "}
                      {when.format(new Date(r.created_at))}
                    </span>
                    {r.question && <span className="block truncate text-sm">“{r.question}”</span>}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void hide(r.id)}
                  aria-label="ซ่อนจากประวัติ"
                  className="grid size-11 shrink-0 place-items-center rounded-md text-[var(--em-ink-300)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
                >
                  <EyeOff className="size-4" aria-hidden />
                </button>
              </div>
              {isOpen && (
                <div className="mt-4">
                  <Result
                    cards={drawn}
                    shown={drawn.length}
                    spread={spread}
                    topic={r.topic}
                    question=""
                    onShow={() => {}}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
