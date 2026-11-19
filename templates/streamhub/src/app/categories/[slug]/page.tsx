import { categories } from "@/data/seed-media";
import { CategoryView } from "./CategoryView";

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryView slug={slug} />;
}
