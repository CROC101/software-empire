import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import DocsShell from "@/components/site/DocsShell";
import Playground from "@/components/site/Playground";
import { getComponent, registry } from "@/data/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return registry.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = getComponent((await params).slug);
  return { title: item?.name ?? "Component", description: item?.description };
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getComponent(slug)) notFound();
  return (
    <>
      <DocsShell rail={false} wide>
        <Playground key={slug} slug={slug} />
      </DocsShell>
      <Footer />
    </>
  );
}
