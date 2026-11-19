import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Detail } from "@/components/library/detail";
import { Footer } from "@/components/site/footer";
import { BRAND } from "@/components/site/logo";
import { COMPONENTS, getComponent } from "@/data/components-registry";

type Params = Promise<{ handle: string; slug: string }>;

export const dynamicParams = false;
export function generateStaticParams() {
  return COMPONENTS.map((c) => ({ handle: `@${c.author.handle}`, slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = getComponent((await params).slug);
  return { title: c ? `${c.name} by @${c.author.handle} | ${BRAND}` : BRAND, description: c?.description };
}

export default async function DetailPage({ params }: { params: Params }) {
  const { handle, slug } = await params;
  const c = getComponent(slug);
  // Next may hand the segment over percent-encoded ("%40nova").
  if (!c || decodeURIComponent(handle) !== `@${c.author.handle}`) notFound();
  return (
    <>
      <main className="mx-auto max-w-6xl pt-8 pb-24 md:pt-12">
        <Detail slug={slug} />
      </main>
      <Footer />
    </>
  );
}
