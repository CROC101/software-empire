/** Placeholder shapes for a post while it loads, with one band of light sweeping across all of them. */
export default function SkeletonShimmer() {
  const block = "rounded-md bg-(--em-ink-800)";
  return (
    <div
      className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6"
      role="status"
      aria-label="กำลังโหลดเนื้อหา"
    >
      <style>{`@keyframes skeleton-shimmer-sweep{to{transform:translateX(250%)}}.skeleton-shimmer-band{animation:skeleton-shimmer-sweep 1.6s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.skeleton-shimmer-band{display:none}}`}</style>
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-(--em-ink-800) bg-(--em-ink-900) p-5">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-(--em-ink-800)" />
          <div className="flex-1 space-y-2">
            <div className={`${block} h-3 w-1/2`} />
            <div className={`${block} h-3 w-1/3`} />
          </div>
        </div>
        <div className={`${block} mt-5 aspect-video w-full`} />
        <div className="mt-4 space-y-2">
          <div className={`${block} h-3 w-full`} />
          <div className={`${block} h-3 w-5/6`} />
        </div>
        <span
          aria-hidden
          className="skeleton-shimmer-band vt-live absolute inset-y-0 -left-1/2 w-1/2 -translate-x-full bg-linear-to-r from-transparent via-(--em-ink-0)/8 to-transparent"
        />
      </div>
    </div>
  );
}
