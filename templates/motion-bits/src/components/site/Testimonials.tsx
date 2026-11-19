import { QUOTES } from "@/data/site";
import { cn } from "@/lib/utils";

/** Three auto-scrolling columns of short quotes. */
export default function Testimonials() {
  return (
    <div className="grid h-[540px] gap-4 overflow-hidden [mask-image:linear-gradient(transparent,black_12%,black_88%,transparent)] tab:grid-cols-2 lg:grid-cols-3 tab:max-lg:h-[440px] max-tab:h-[380px]">
      {[0, 1, 2].map((col) => (
        <div key={col} className={cn("flex flex-col gap-4", col === 1 && "max-tab:hidden", col === 2 && "max-lg:hidden")} style={{ animation: `marquee-up ${38 + col * 8}s linear infinite` }}>
          {[...QUOTES.slice(col * 3, col * 3 + 3), ...QUOTES.slice(col * 3, col * 3 + 3), ...QUOTES.slice(col * 3, col * 3 + 3), ...QUOTES.slice(col * 3, col * 3 + 3)].map((q, i) => (
            <figure key={i} className="rounded-[14px] bg-[#16131b] p-5 shadow-hair">
              <blockquote className="text-[14px] leading-[1.6] font-medium text-white/85">{q.text}</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5 text-[13px] text-white/50">
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
                  {q.handle.slice(1, 3).toUpperCase()}
                </span>
                {q.handle}
              </figcaption>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}
