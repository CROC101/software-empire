import Link from "next/link";
import { CATEGORIES, formatBaht, isCategory } from "@/lib/market";

export type ServiceCardRow = {
  id: string | null;
  title: string | null;
  category: string | null;
  price_satang: number | null;
  delivery_days: number | null;
  seller_name: string | null;
  rating: number | null;
  review_count: number | null;
};

export function ServiceCard({ service }: { service: ServiceCardRow }) {
  const category = isCategory(service.category) ? CATEGORIES[service.category] : "อื่น ๆ";
  return (
    <Link
      href={`/services/${service.id ?? ""}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-primary hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
        {category}
      </span>
      <h3 className="font-heading text-base font-semibold leading-snug group-hover:text-primary">
        {service.title}
      </h3>
      <p className="text-sm text-muted-foreground">
        โดย {service.seller_name} ·{" "}
        {service.review_count
          ? `★ ${String(service.rating)} (${String(service.review_count)})`
          : "ยังไม่มีรีวิว"}
      </p>
      <div className="mt-auto flex items-end justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">ส่งงานใน {service.delivery_days} วัน</span>
        <span className="font-heading text-lg font-bold">
          {formatBaht(service.price_satang ?? 0)}
        </span>
      </div>
    </Link>
  );
}
