import { Link, useSearchParams } from "react-router";
import { ToolGrid } from "@/components/tools/tool-card";
import { CATEGORIES, categoryOf } from "@/lib/tools/categories";
import { searchTools, toolsIn, TOOLS } from "@/lib/tools/registry";
import type { CategoryKey } from "@/lib/tools/types";

/// หน้ารวมเครื่องมือทั้งหมด / หน้าหมวด — ค้นและกรองหมวดผ่าน query string (แชร์ลิงก์ได้)
export function DirectoryView({ category }: { category?: CategoryKey }) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const pool = category ? toolsIn(category) : TOOLS;
  const results = searchTools(q, pool);
  const meta = category ? categoryOf(category) : null;

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);

    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true, preventScrollReset: true });
  };

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="เส้นทาง" className="text-sm text-on-surface-variant">
          <Link to="/" className="hover:underline">
            หน้าหลัก
          </Link>
          <span aria-hidden> / </span>
          {meta ? (
            <Link to="/tools" className="hover:underline">
              เครื่องมือทั้งหมด
            </Link>
          ) : (
            <span aria-current="page">เครื่องมือทั้งหมด</span>
          )}
          {meta && (
            <>
              <span aria-hidden> / </span>
              <span aria-current="page">{meta.label}</span>
            </>
          )}
        </nav>

        <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-3xl font-bold">
              {meta && (
                <span className="brand-gradient grid size-11 place-items-center rounded-xl text-primary-foreground">
                  <meta.icon aria-hidden className="size-6" />
                </span>
              )}
              {meta ? meta.label : "เครื่องมือทั้งหมด"}
            </h1>
            <p className="mt-2 text-on-surface-variant">
              {meta
                ? meta.description
                : `${TOOLS.length} เครื่องมือใน ${CATEGORIES.length} หมวด ทำงานในเบราว์เซอร์ของคุณ`}
            </p>
          </div>
        </header>

        <div className="mt-6">
          <label htmlFor="directory-q" className="sr-only">
            ค้นหาในรายการ
          </label>
          <input
            id="directory-q"
            type="search"
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              meta ? `ค้นหาใน${meta.label}…` : "พิมพ์ชื่อเครื่องมือ เช่น base64, ภาษี, cron…"
            }
            className="h-12 w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/15"
          />
        </div>

        <nav
          aria-label="หมวดหมู่"
          className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Link
            to={q ? `/tools?q=${encodeURIComponent(q)}` : "/tools"}
            aria-current={!category ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap ${!category ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"}`}
          >
            ทั้งหมด {TOOLS.length}
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to={`/category/${c.key}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              aria-current={category === c.key ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm whitespace-nowrap ${category === c.key ? "border-primary-container bg-primary-container text-on-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container"}`}
            >
              <c.icon aria-hidden className="size-4" />
              {c.label} {toolsIn(c.key).length}
            </Link>
          ))}
        </nav>

        <p className="mt-6 mb-3 text-sm text-on-surface-variant" aria-live="polite">
          {q ? `พบ ${results.length} เครื่องมือสำหรับ "${q}"` : `${results.length} เครื่องมือ`}
        </p>
        <ToolGrid
          tools={results}
          showCategory={!category}
          empty={`ไม่พบเครื่องมือที่ตรงกับ "${q}" — ลองคำอื่น หรือดูทุกหมวด`}
        />
      </div>
    </main>
  );
}
