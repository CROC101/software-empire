import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared button sizing; pair with btn-light / btn-dark. */
export const BTN = "inline-flex h-[46px] items-center justify-center gap-2 px-[21px] text-[14.5px] font-medium whitespace-nowrap transition hover:brightness-110";

export function Section({ children, className, dark, id }: { children: ReactNode; className?: string; dark?: boolean; id?: string }) {
  return (
    <section id={id} className={cn("pt-20 pb-[100px] max-tab:pt-[60px] max-tab:pb-20", dark ? "bg-ink-deep" : "bg-ink", className)}>
      <div className="container-site max-tab:px-4">{children}</div>
    </section>
  );
}

export function SectionHead({ title, sub, action, className }: { title: string; sub?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-10 flex flex-wrap items-end justify-between gap-6 max-tab:mb-7", className)}>
      <div className="max-w-[680px]">
        <h2 className="text-[37.44px] leading-[1.15] font-medium tracking-[-0.035em] text-white tab:max-lg:text-[34px] max-tab:text-[30px] max-sm:text-[27px]">{title}</h2>
        {sub && <p className="mt-4 text-[14.5px] leading-[1.6] text-white/55">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Card with a visual "well" on top and a title/description underneath. */
export function BentoCard({ visual, title, desc, className, wellClass }: { visual: ReactNode; title: ReactNode; desc?: ReactNode; className?: string; wellClass?: string }) {
  return (
    <article className={cn("card-shell flex flex-col", className)}>
      <div className={cn("card-well relative h-[150px] overflow-hidden", wellClass)}>{visual}</div>
      <div className="px-[17px] pt-[22px] pb-[18px]">
        <h3 className="text-[15px] font-semibold text-white">{title}</h3>
        {desc && <p className="mt-2 text-[13px] leading-[1.6] text-white/55">{desc}</p>}
      </div>
    </article>
  );
}
