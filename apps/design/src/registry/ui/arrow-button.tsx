import { ArrowRight } from "lucide-react";

/** On hover the arrow runs out to the right while a twin comes in from the left. */
export default function ArrowButton({ label = "ดูผลงาน" }: { label?: string }) {
  return (
    <div className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6">
      <button
        type="button"
        className="group inline-flex items-center gap-3 rounded-lg bg-(--em-ink-50) py-3 pr-3 pl-6 font-semibold text-(--em-ink-950) transition-transform active:scale-95"
      >
        {label}
        <span className="relative grid size-8 place-items-center overflow-hidden rounded-md bg-(--em-blue-600) text-(--em-ink-0)">
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-300 group-hover:translate-x-8 motion-reduce:transition-none"
          />
          <ArrowRight
            aria-hidden
            className="absolute size-4 -translate-x-8 transition-transform duration-300 group-hover:translate-x-0 motion-reduce:transition-none"
          />
        </span>
      </button>
    </div>
  );
}
