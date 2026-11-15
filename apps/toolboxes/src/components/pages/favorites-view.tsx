import { useMemo } from "react";
import { Clock, Star } from "lucide-react";
import { Link } from "react-router";
import { readLang } from "@empire/core/lang";
import { EntryCard, EntryGrid } from "@/components/pages/entry-card";
import { catalog, findEntry, type Entry } from "@/lib/catalog";
import { useHistory } from "@/lib/use-history";
import { useSession } from "@/lib/session";
import { useFavorites } from "@/lib/tools/prefs";

export function FavoritesView() {
  const lang = readLang(document.cookie);
  const entries = useMemo(() => catalog(lang), [lang]);
  const { favorites } = useFavorites();
  const { user } = useSession();
  const history = useHistory();
  const starred = favorites.map((id) => findEntry(entries, id)).filter((e): e is Entry => !!e);
  const recent = [...new Set(history.map((v) => v.id))]
    .map((id) => findEntry(entries, id))
    .filter((e): e is Entry => !!e)
    .slice(0, 8);

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
          <Star aria-hidden className="size-7 text-brand-amber" />
          รายการโปรด
        </h1>
        <p className="mt-2 text-on-surface-variant">
          {user
            ? `ซิงก์กับบัญชี ${user.email ?? ""} — ใช้ได้ทุกเครื่องที่เข้าสู่ระบบ`
            : "จำไว้ในเบราว์เซอร์นี้เท่านั้น — เข้าสู่ระบบเพื่อซิงก์ข้ามเครื่อง"}
        </p>

        <section aria-labelledby="fav" className="mt-6">
          <h2 id="fav" className="sr-only">
            เครื่องมือและแอปที่กดดาวไว้
          </h2>
          {starred.length ? (
            <EntryGrid>
              {starred.map((e) => (
                <li key={e.id}>
                  <EntryCard entry={e} lang={lang} />
                </li>
              ))}
            </EntryGrid>
          ) : (
            <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center">
              <p className="text-on-surface-variant">
                ยังไม่มีรายการโปรด — กดรูปดาวที่การ์ดเครื่องมือหรือแอปเพื่อเก็บไว้ที่นี่
              </p>
              <Link
                to="/tools"
                className="btn-gradient mt-4 inline-flex min-h-11 items-center rounded-xl px-5 font-semibold"
              >
                ดูเครื่องมือทั้งหมด
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="recent" className="mt-12">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 id="recent" className="flex items-center gap-2 text-xl font-bold">
              <Clock aria-hidden className="size-5 text-primary" />
              ใช้ล่าสุด
            </h2>
            <Link
              to="/history"
              className="inline-flex min-h-10 items-center rounded-xl border border-outline-variant px-3 text-sm hover:bg-surface-container"
            >
              ดูประวัติทั้งหมด
            </Link>
          </div>
          {recent.length ? (
            <EntryGrid>
              {recent.map((e) => (
                <li key={e.id}>
                  <EntryCard entry={e} lang={lang} />
                </li>
              ))}
            </EntryGrid>
          ) : (
            <p className="text-on-surface-variant">ยังไม่ได้เปิดเครื่องมือหรือแอปใด</p>
          )}
        </section>
      </div>
    </main>
  );
}
