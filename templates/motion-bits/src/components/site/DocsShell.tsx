import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import DocsSidebar from "@/components/layout/DocsSidebar";
import { SPONSORS } from "@/data/site";
import { cn } from "@/lib/utils";

/** Three-column docs frame: sidebar, content, optional right rail. */
export default function DocsShell({
  children,
  rail = true,
  sidebar = true,
  wide,
  className,
}: {
  children: ReactNode;
  rail?: boolean;
  sidebar?: boolean;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className="flex">
      {sidebar && <DocsSidebar />}
      <main className={cn("min-w-0 flex-1 px-8 pt-28 pb-24 max-lg:px-4 max-tab:pt-24", !wide && "max-w-[835px]", className)}>
        {children}
      </main>
      {rail && <RightRail />}
    </div>
  );
}

function RightRail() {
  return (
    <aside className="sticky top-0 h-dvh mr-8 w-[300px] shrink-0 overflow-y-auto max-xl:hidden" aria-label="Extras">
      <div className="pt-[76px] pb-10">
      <div className="card-shell">
        <div
          className="h-[150px] rounded-[11px]"
          style={{ background: "radial-gradient(80% 90% at 30% 20%, #6d28d955, transparent 60%), radial-gradient(70% 80% at 80% 90%, #2563eb44, transparent 60%), #0b090e" }}
        />
        <div className="px-3 pt-4 pb-3">
          <h3 className="text-[14px] font-medium text-white">Build the whole product with one library.</h3>
          <p className="mt-2 text-[12.5px] leading-[1.55] text-white/50">Components, page blocks, app UI, templates and agent skills, ready to launch.</p>
          <p className="mt-3 font-mono text-[11px] text-white/40">255 Components · 400 Blocks · 18 Templates</p>
          <Link href="/pro/" className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-violet text-[13px] font-semibold text-white">
            Explore Motion Bits Pro <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-medium text-white">Sponsors</h4>
          <span className="text-[11.5px] text-white/40">500K+ developers monthly</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {SPONSORS.map((s) => (
            <Link key={s.name} href="/sponsors/" className="flex h-12 items-center justify-between rounded-[11px] bg-white/[0.04] px-3 shadow-hair hover:bg-white/[0.07]">
              <span className="text-[13.5px] font-medium text-white/80">{s.name}</span>
              <span className="text-[11px] text-white/35">{s.tier}</span>
            </Link>
          ))}
        </div>
        <Link href="/sponsors/" className="mt-3 block text-[12.5px] text-white/50 hover:text-white">
          Become a sponsor →
        </Link>
      </div>
      </div>
    </aside>
  );
}

/** Typographic helpers for docs pages. */
export function DocTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-[44px] leading-[1.1] font-medium tracking-[-0.035em] text-white max-tab:text-[36px]">{children}</h1>
      {action}
    </div>
  );
}

export function DocH2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-20 mb-4 scroll-mt-24 text-[24px] font-semibold tracking-[-0.025em] text-white">
      {children}
    </h2>
  );
}

export function DocP({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-4 text-[15px] leading-[1.68] text-white/60", className)}>{children}</p>;
}

/** Row card with an icon, title, optional count and description. */
export function RowCard({ href, icon, title, count, desc }: { href: string; icon: ReactNode; title: string; count?: number; desc: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-[14px] bg-[#18151d] px-4 py-4 shadow-hair transition hover:bg-[#1d1a23]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0b090e] text-white/80">{icon}</span>
      <span className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-white">
          {title}
          {count !== undefined && <span className="ml-2 text-[13px] font-normal text-white/45">{count}</span>}
        </h3>
        <span className="mt-0.5 block text-[13.5px] leading-[1.5] text-white/55">{desc}</span>
      </span>
      <span className="text-white/40 transition group-hover:text-white" aria-hidden>
        ↗
      </span>
    </Link>
  );
}
