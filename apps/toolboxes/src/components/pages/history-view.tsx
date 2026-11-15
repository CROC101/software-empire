import { useMemo, useState } from "react";
import { Clock, Download, Trash2 } from "lucide-react";
import { readLang } from "@empire/core/lang";
import { EntryCard, EntryGrid } from "@/components/pages/entry-card";
import { catalog, findEntry } from "@/lib/catalog";
import { clearHistory, type Visit } from "@/lib/history";
import { useHistory } from "@/lib/use-history";

type Filter = "all" | Visit["act"];
const FILTERS: [Filter, string][] = [
  ["all", "ทั้งหมด"],
  ["open", "เปิดใช้"],
  ["download", "ดาวน์โหลด"],
];

const chip = (on: boolean) =>
  `inline-flex min-h-10 items-center rounded-full border px-4 text-sm ${on ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"}`;

/** Everything this browser opened or downloaded in Toolboxes, newest first, grouped by day. */
export function HistoryView() {
  const lang = readLang(document.cookie);
  const entries = useMemo(() => catalog(lang), [lang]);
  const history = useHistory();
  const [filter, setFilter] = useState<Filter>("all");
  const [confirm, setConfirm] = useState(false);
  const locale = lang === "en" ? "en-GB" : "th-TH";
  const day = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  const days = new Map<
    string,
    { visit: Visit; entry: NonNullable<ReturnType<typeof findEntry>> }[]
  >();
  for (const visit of history) {
    if (filter !== "all" && visit.act !== filter) continue;
    const entry = findEntry(entries, visit.id);
    if (!entry) continue;
    const key = day.format(visit.at);
    days.set(key, [...(days.get(key) ?? []), { visit, entry }]);
  }

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
              <Clock aria-hidden className="size-7 text-primary" />
              ประวัติการใช้งาน
            </h1>
            <p className="mt-2 text-on-surface-variant">
              เครื่องมือ แอป และไฟล์ที่ดาวน์โหลด เก็บไว้ในเบราว์เซอร์นี้เท่านั้น
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!confirm) {
                  setConfirm(true);
                  return;
                }
                clearHistory();
                setConfirm(false);
              }}
              onBlur={() => setConfirm(false)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant px-3 text-sm hover:bg-surface-container"
            >
              <Trash2 aria-hidden className="size-4" />
              {confirm ? "กดอีกครั้งเพื่อล้าง" : "ล้างประวัติ"}
            </button>
          )}
        </div>

        <div role="group" aria-label="กรองประวัติ" className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={chip(filter === key)}
            >
              {label}
            </button>
          ))}
        </div>

        {days.size === 0 ? (
          <p className="mt-10 text-on-surface-variant">ยังไม่มีประวัติ</p>
        ) : (
          [...days].map(([label, items]) => (
            <section key={label} className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-on-surface-variant">{label}</h2>
              <EntryGrid>
                {items.map(({ visit, entry }) => (
                  <li key={`${visit.id}-${visit.act}-${visit.at}`}>
                    <EntryCard
                      entry={entry}
                      lang={lang}
                      note={
                        <span className="inline-flex items-center gap-1">
                          {visit.act === "download" && <Download aria-hidden className="size-3" />}
                          {time.format(visit.at)}
                        </span>
                      }
                    />
                  </li>
                ))}
              </EntryGrid>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
