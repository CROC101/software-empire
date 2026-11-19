import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Studio } from "@/components/playground/studio";
import { BRAND } from "@/components/site/logo";
import { COMPONENTS, getComponent } from "@/data/components-registry";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = getComponent((await params).slug);
  return { title: c ? `${c.name} studio | ${BRAND}` : BRAND };
}

export default async function StudioPage({ params }: { params: Params }) {
  const { slug } = await params;
  if (!getComponent(slug)) notFound();
  return (
    <main>
      <Studio slug={slug} />
    </main>
  );
}
