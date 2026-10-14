import { Link } from "react-router";
import { useEffect } from "react";
import { FavoriteButton, ToolCard } from "@/components/tools/tool-card";
import { SpecToolView } from "@/components/tools/spec-tool";
import { categoryOf } from "@/lib/tools/categories";
import { rememberRecent } from "@/lib/tools/prefs";
import { findTool, toolsIn } from "@/lib/tools/registry";

/// หน้าเครื่องมือแบบสเปก — หัวเรื่อง + ฟอร์ม/ผลลัพธ์ + เครื่องมือในหมวดเดียวกัน
export function ToolView({ slug }: { slug: string }) {
  const tool = findTool(slug);

  useEffect(() => {
    if (tool) rememberRecent(tool.slug);
  }, [tool]);

  if (!tool || tool.kind !== "spec") return null;

  const category = categoryOf(tool.category);
  const related = toolsIn(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 4);

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="เส้นทาง" className="text-sm text-on-surface-variant">
          <Link to="/" className="hover:underline">
            หน้าหลัก
          </Link>
          <span aria-hidden> / </span>
          <Link to={`/category/${category.key}`} className="hover:underline">
            {category.label}
          </Link>
          <span aria-hidden> / </span>
          <span aria-current="page">{tool.name}</span>
        </nav>

        <header className="mt-3 mb-6 flex items-start gap-4">
          <span className="brand-gradient grid size-14 shrink-0 place-items-center rounded-2xl text-primary-foreground">
            <tool.icon aria-hidden className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{tool.name}</h1>
            <p className="mt-1 text-on-surface-variant">{tool.description}</p>
          </div>
          <FavoriteButton tool={tool} className="shrink-0" />
        </header>

        <SpecToolView key={tool.slug} tool={tool} />

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-12">
            <h2 id="related" className="mb-4 text-xl font-bold">
              เครื่องมืออื่นใน{category.label}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((t) => (
                <li key={t.slug}>
                  <ToolCard tool={t} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
