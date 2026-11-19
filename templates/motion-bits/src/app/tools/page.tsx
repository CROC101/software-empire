import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, AudioLines, Image as ImageIcon, Palette, Shapes, Video } from "lucide-react";
import Footer from "@/components/layout/Footer";
import DocsShell from "@/components/site/DocsShell";
import UpdateModal from "@/components/site/UpdateModal";
import { TOOLS } from "@/data/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Creative Tools" };

const ICONS = [Palette, Video, Shapes, ImageIcon, AudioLines];

export default function ToolsPage() {
  return (
    <>
      <UpdateModal />
      <DocsShell sidebar={false} wide className="px-0 pt-[124px] max-lg:px-0 max-tab:pt-[112px]">
        <div className="pr-[60px] pl-[50px] max-xl:px-10 max-tab:px-4">
        <p className="text-center text-[13px] font-medium text-violet">Creative Tools</p>
        <h1 className="mt-4 text-center text-[52px] leading-[1.1] font-medium tracking-[-0.04em] text-white max-lg:text-[38px]">
          Make your product look and sound its best
        </h1>
        <ul className="mt-14 grid gap-4 tab:grid-cols-2 lg:grid-cols-6">
          {TOOLS.map((t, i) => {
            const Icon = ICONS[i];
            const big = i < 2;
            return (
              <li key={t.name} className={cn("card-shell flex flex-col", big ? "lg:col-span-3" : "lg:col-span-2")}>
                <div
                  className={cn("card-well flex flex-col items-center justify-center gap-5", "h-[240px] max-sm:h-[230px]", !big && "lg:h-[200px]")}
                  style={{ background: `radial-gradient(55% 70% at 50% 55%, ${t.hue[0]}40, transparent 70%), radial-gradient(30% 40% at 70% 30%, ${t.hue[1]}22, transparent), #0b090e` }}
                >
                  <span className="flex items-center gap-2 rounded-[10px] bg-white/[0.06] px-3 py-2 text-[13px] font-medium text-white/80 shadow-hair">
                    <Icon className="size-4" strokeWidth={1.6} /> {t.name}
                  </span>
                  <Link
                    href={`/components/${t.slug}/`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-5 text-[13px] font-semibold text-white shadow-float transition hover:brightness-110"
                    style={{ background: `linear-gradient(${t.hue[0]}, ${t.hue[0]}cc)` }}
                  >
                    Open {t.name} <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
                <div className="px-3 pt-4 pb-3">
                  <h2 className="text-[16px] font-semibold text-white">{t.name}</h2>
                  <p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/55">{t.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
              </div>
      </DocsShell>
      <Footer />
    </>
  );
}
