import { COMPONENTS, getComponent, getSource } from "@/data/components-registry";
import { registryItem } from "@/lib/prompt-builder";

// Static export: every registry item is pre-rendered as /api/r/<slug>.json (and /api/r/<slug>).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENTS.flatMap((c) => [{ slug: c.slug }, { slug: `${c.slug}.json` }]);
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComponent(slug.replace(/\.json$/, ""));
  if (!c) return Response.json({ error: "Component not found" }, { status: 404 });
  return Response.json(registryItem(c, getSource(c.slug)));
}
