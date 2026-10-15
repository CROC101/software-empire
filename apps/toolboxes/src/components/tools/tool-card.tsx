import { Star } from "lucide-react";
import { Link } from "react-router";
import { categoryOf } from "@/lib/tools/categories";
import { useFavorites } from "@/lib/tools/prefs";
import { toolHref } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

export function FavoriteButton({ tool, className = "" }: { tool: Tool; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(tool.slug);

  return (
    <button
      type="button"
      onClick={() => toggle(tool.slug)}
      aria-pressed={active}
      aria-label={active ? `เอา ${tool.name} ออกจากรายการโปรด` : `เพิ่ม ${tool.name} ในรายการโปรด`}
      title={active ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
      className={`grid size-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-brand-amber ${className}`}
    >
      <Star aria-hidden className={`size-5 ${active ? "fill-brand-amber text-brand-amber" : ""}`} />
    </button>
  );
}

export function ToolCard({ tool, showCategory = false }: { tool: Tool; showCategory?: boolean }) {
  return (
    <div className="lift relative flex h-full rounded-2xl border border-outline-variant/70 bg-surface-container-lowest">
      <Link to={toolHref(tool)} className="flex min-h-28 flex-1 gap-3 rounded-2xl p-4 pr-12">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
          <tool.icon aria-hidden className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-snug text-on-surface">{tool.name}</span>
          <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-on-surface-variant">
            {tool.description}
          </span>
          {showCategory && (
            <span className="mt-2 inline-block rounded-full bg-surface-container px-2.5 py-0.5 text-sm text-on-surface-variant">
              {categoryOf(tool.category).label}
            </span>
          )}
        </span>
      </Link>
      <FavoriteButton tool={tool} className="absolute top-2 right-2" />
    </div>
  );
}

export function ToolGrid({
  tools,
  showCategory = false,
  empty,
}: {
  tools: Tool[];
  showCategory?: boolean;
  empty?: string;
}) {
  if (!tools.length)
    return (
      <p className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
        {empty ?? "ไม่พบเครื่องมือ"}
      </p>
    );

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {tools.map((tool) => (
        <li key={tool.slug}>
          <ToolCard tool={tool} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}
