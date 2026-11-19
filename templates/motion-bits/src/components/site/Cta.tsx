import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BTN } from "@/components/site/Section";
import { cn } from "@/lib/utils";

/** Closing call-to-action that sits inside the footer card. */
export default function Cta({ title = "Build something people remember.", className }: { title?: string; className?: string }) {
  return (
    <div className={cn("rounded-[13px] bg-[#0b090e] px-6 py-[100px] text-center tab:max-lg:py-[82px] max-tab:py-16", className)}>
      <div className="mx-auto flex max-w-[483px] flex-col items-center">
      <h2 className="text-[37.44px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-tab:text-[28px]">{title}</h2>
      <p className="mt-4 max-w-[400px] text-[14px] leading-[1.6] text-white/60">
        Start with the free library. When you need full pages, product UI and tools, Pro is ready.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-2.5">
        <Link href="/pro/" className={cn(BTN, "btn-light h-[42px] text-[13.5px]")}>
          Get Motion Bits Pro <ArrowRight className="size-4" />
        </Link>
        <Link href="/components/" className={cn(BTN, "btn-dark h-[42px] text-[13.5px]")}>
          Browse free components
        </Link>
      </div>
      </div>
    </div>
  );
}
