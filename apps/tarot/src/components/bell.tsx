import { TAROT_HOME } from "@empire/core/cms-pages";
import { Bell as BellIcon, Coins, Megaphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCheckins } from "@/lib/api";
import { useCmsContent } from "@/lib/cms";
import { bangkokDay } from "@/lib/reading";
import { useSession } from "@/lib/session";

type Tab = "all" | "coins" | "news";
type Item = { kind: "coins" | "news"; key: string; title: string; body: string; day: string };

const SEEN = "tt-news-seen"; // per device: the announcement the reader already opened
const dayLabel = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const daysAgo = (n: number) => bangkokDay(new Date(Date.now() - n * 86_400_000));

/** The bell in the top bar: coins from check-ins and the owner's announcement, in one sheet. */
export function Bell() {
  const { user } = useSession();
  const cms = useCmsContent(TAROT_HOME);
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [coins, setCoins] = useState<Item[]>([]);
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(SEEN) ?? "";
    } catch {
      return "";
    }
  });

  const title = cms.text("announce.title").trim();
  const body = cms.text("announce.body").trim();
  const newsOn =
    (cms.sections().find((s) => s.key === "announce")?.visible ?? true) && Boolean(title || body);
  const newsKey = `${title}|${body}`;
  const unread = newsOn && seen !== newsKey;

  const open = () => {
    ref.current?.showModal();
    if (!user) return;
    getCheckins(daysAgo(30), bangkokDay())
      .then((rows) =>
        setCoins(
          rows
            .sort((a, b) => b.day.localeCompare(a.day))
            .map((r) => ({
              kind: "coins",
              key: r.day,
              title: `เช็กอินสำเร็จ ได้ ${String(r.coins)} เหรียญ`,
              body: r.coins > 10 ? "ครบ 7 วันติดกัน รับโบนัส" : "แวะมาพรุ่งนี้อีกนะ",
              day: r.day,
            })),
        ),
      )
      .catch((err: unknown) => {
        console.error(err);
      });
  };

  useEffect(() => {
    if (!unread) return;
    const dialog = ref.current;
    const mark = () => {
      if (!dialog?.open) return;
      setSeen(newsKey);
      try {
        localStorage.setItem(SEEN, newsKey);
      } catch {
        // storage blocked: the dot shows again next visit
      }
    };
    dialog?.addEventListener("toggle", mark);
    return () => dialog?.removeEventListener("toggle", mark);
  }, [unread, newsKey]);

  const news: Item[] = newsOn ? [{ kind: "news", key: "news", title, body, day: "" }] : [];
  const items = tab === "coins" ? coins : tab === "news" ? news : [...news, ...coins];

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={unread ? "การแจ้งเตือน (มีประกาศใหม่)" : "การแจ้งเตือน"}
        className="relative grid size-11 place-items-center rounded-full text-[var(--em-ink-0)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
      >
        <BellIcon className="size-5" aria-hidden />
        {unread && (
          <span
            aria-hidden
            className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[var(--em-coral-500)]"
          />
        )}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="bell-title"
        className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-md rounded-t-2xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] p-0 text-[var(--em-ink-50)] backdrop:bg-black/60 sm:mb-auto sm:rounded-2xl"
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 id="bell-title" className="text-lg font-black text-[var(--em-ink-0)]">
            การแจ้งเตือน
          </h2>
          <form method="dialog">
            <button
              aria-label="ปิด"
              className="grid size-11 place-items-center rounded-full hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
            >
              <X className="size-5" aria-hidden />
            </button>
          </form>
        </div>
        <div role="tablist" aria-label="ประเภท" className="flex gap-2 px-4">
          {(
            [
              ["all", "ทั้งหมด"],
              ["coins", "เหรียญ"],
              ["news", "ประกาศ"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="min-h-9 rounded-full border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] px-4 text-sm aria-selected:border-[var(--em-blue-300)] aria-selected:bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]"
            >
              {label}
            </button>
          ))}
        </div>
        <ul
          role="tabpanel"
          className="max-h-[60dvh] divide-y divide-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)] overflow-y-auto p-4"
        >
          {items.length === 0 && (
            <li className="py-6 text-center text-sm text-[var(--em-ink-300)]">
              {!user && tab !== "news"
                ? "เข้าสู่ระบบเพื่อดูเหรียญที่ได้รับ"
                : "ยังไม่มีการแจ้งเตือน"}
            </li>
          )}
          {items.map((it) => (
            <li key={it.key} className="flex gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--em-blue-400)_22%,transparent)]">
                {it.kind === "coins" ? (
                  <Coins className="size-5 text-[var(--em-gold-300)]" aria-hidden />
                ) : (
                  <Megaphone className="size-5 text-[var(--em-blue-200)]" aria-hidden />
                )}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{it.title}</span>
                {it.body && (
                  <span className="block whitespace-pre-line text-sm text-[var(--em-ink-300)]">
                    {it.body}
                  </span>
                )}
                {it.day && (
                  <span className="block text-xs text-[var(--em-ink-400)]">
                    {it.day === bangkokDay()
                      ? "วันนี้"
                      : dayLabel.format(new Date(`${it.day}T00:00:00Z`))}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
