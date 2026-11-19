import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SPONSORS } from "@/data/site";
import { cn } from "@/lib/utils";

export default function SponsorGrid() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {SPONSORS.map((s) => (
        <Link
          key={s.name}
          href="/sponsors/"
          className={cn("card-shell group flex flex-col", s.tier === "Diamond" ? "w-[calc(50%-6px)] max-tab:w-full" : "w-[416px] max-tab:w-full")}
        >
          <div className={cn("card-well flex flex-col items-center justify-center", s.tier === "Diamond" ? "h-[125px]" : "h-[122px]", "max-tab:h-[96px]")}>
            <span className={cn("font-medium tracking-[-0.02em] text-white/85", s.tier === "Diamond" ? "text-[27px]" : "text-[19px]")}>{s.name}</span>
            <span className="mt-1 text-[12.5px] text-white/45">{s.tag}</span>
          </div>
          <div className="flex items-center justify-between px-3 pt-4 pb-3 text-xs2 font-medium text-white/50">
            {s.tier}
            <ArrowUpRight className="size-3.5 transition group-hover:text-white" />
          </div>
        </Link>
      ))}
    </div>
  );
}
