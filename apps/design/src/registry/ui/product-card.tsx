import { Headphones, ShoppingBag, Star } from "lucide-react";

/** A product card: on hover the picture zooms a little and the add-to-cart bar rises from the bottom. */
export default function ProductCard({
  title = "หูฟังไร้สาย",
  price = "฿1,290",
}: {
  title?: string;
  price?: string;
}) {
  return (
    <div className="grid size-full min-h-80 place-items-center bg-(--em-ink-975) p-6">
      <article className="group w-60 overflow-hidden rounded-xl border border-(--em-ink-800) bg-(--em-ink-900)">
        <div className="relative aspect-square overflow-hidden bg-linear-to-br from-(--em-blue-700) to-(--em-ink-950)">
          <Headphones
            aria-hidden
            className="absolute inset-0 m-auto size-24 text-(--em-sky-400) transition-transform duration-75 group-hover:-translate-y-1 motion-reduce:transition-none"
          />
          <span className="absolute top-3 left-3 rounded-full bg-(--em-ink-0) px-2 py-0.5 text-xs font-semibold text-(--em-ink-975)">
            -20%
          </span>
          <button
            type="button"
            className="absolute inset-x-3 bottom-3 flex translate-y-[150%] items-center justify-center gap-2 rounded-lg bg-(--em-ink-50) py-2.5 text-sm font-semibold text-(--em-ink-950) transition-transform duration-300 group-focus-within:translate-y-0 group-hover:translate-y-0 focus-visible:translate-y-0 motion-reduce:transition-none"
          >
            <ShoppingBag aria-hidden className="size-4" />
            ใส่ตะกร้า
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1 text-xs text-(--em-gold-300)">
            <Star aria-hidden className="size-3.5 fill-current" />
            4.9 <span className="text-(--em-ink-400)">(128)</span>
          </div>
          <h3 className="mt-1 font-semibold text-(--em-ink-50)">{title}</h3>
          <p className="mt-1 font-heading text-lg font-black text-(--em-sky-400)">{price}</p>
        </div>
      </article>
    </div>
  );
}
