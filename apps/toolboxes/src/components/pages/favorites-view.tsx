import { Clock, Star, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { ToolGrid } from "@/components/tools/tool-card";
import { useSession } from "@/lib/session";
import { useFavorites, useRecent } from "@/lib/tools/prefs";
import { findTool } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

const resolve = (slugs: readonly string[]) =>
  slugs.map((s) => findTool(s)).filter((t): t is Tool => Boolean(t));

export function FavoritesView() {
  const { favorites } = useFavorites();
  const { user } = useSession();
  const { recent, clear } = useRecent();
  const favoriteTools = resolve(favorites);
  const recentTools = resolve(recent);

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
            เครื่องมือที่กดดาวไว้
          </h2>
          {favoriteTools.length ? (
            <ToolGrid tools={favoriteTools} showCategory />
          ) : (
            <div className="rounded-2xl border border-dashed border-outline-variant p-8 text-center">
              <p className="text-on-surface-variant">
                ยังไม่มีรายการโปรด — กดรูปดาวที่การ์ดเครื่องมือเพื่อเก็บไว้ที่นี่
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
            {recentTools.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant px-3 text-sm hover:bg-surface-container"
              >
                <Trash2 aria-hidden className="size-4" />
                ล้างประวัติ
              </button>
            )}
          </div>
          <ToolGrid tools={recentTools} showCategory empty="ยังไม่ได้เปิดเครื่องมือใด" />
        </section>
      </div>
    </main>
  );
}
