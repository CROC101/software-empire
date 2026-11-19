import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FullPreview } from "@/components/full-preview";
import { entry, registry } from "@/registry/meta";

export const dynamicParams = false;

export function generateStaticParams() {
  return registry.map((e) => ({ slug: e.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = entry((await params).slug);
  return e ? { title: `${e.name} (เต็มจอ)`, robots: { index: false } } : {};
}

/** One part alone on the page, at the real viewport, for testing responsive layout. */
export default async function PreviewPage({ params }: Props) {
  const e = entry((await params).slug);
  if (!e) notFound();
  return <FullPreview slug={e.slug} />;
}
