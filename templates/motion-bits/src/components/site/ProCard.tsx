import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PRO_ITEMS } from "@/data/site";
import { cn } from "@/lib/utils";

export default function ProCard({ count, title, desc, hue, tall }: (typeof PRO_ITEMS)[number] & { tall?: boolean }) {
  return (
    <Link href="/pro/" className="card-shell group flex flex-col p-[7px]">
      <div
        className={cn("relative overflow-hidden rounded-[11px]", tall ? "h-[268px] tab:max-lg:h-[238px]" : "h-[200px] tab:max-lg:h-[185px]", "max-tab:h-[165px]")}
        style={{ background: `radial-gradient(120% 90% at 50% 110%, ${hue[1]}55, transparent 60%), linear-gradient(160deg, ${hue[0]}40, #0b090e 70%)` }}
      >
        <div className="absolute inset-x-[12%] top-[18%] bottom-0 rounded-t-lg border border-white/10 bg-[#0b090e]/80 p-4 shadow-float">
          <div className="h-2 w-1/3 rounded bg-white/15" />
          <div className="mt-3 h-2 w-2/3 rounded bg-white/10" />
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-md" style={{ background: `linear-gradient(135deg, ${hue[0]}66, ${hue[1]}33)` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 px-4 pt-5 pb-4">
        <div className="flex-1">
          <h3 className="text-[17px] font-medium text-white">
            {count} {title}
          </h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-white/55">{desc}</p>
        </div>
        <ArrowUpRight className="size-4 text-white/40 transition group-hover:text-white" />
      </div>
    </Link>
  );
}
