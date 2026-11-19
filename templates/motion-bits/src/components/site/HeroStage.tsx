"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AuroraWavesBg from "@/components/reactbits/AuroraWavesBg";
import { cn } from "@/lib/utils";

const PRESETS = [
  { name: "Ocean", amp: 1.8, swell: 25, c: ["#1e3a8a", "#0ea5e9", "#a5f3fc"], base: "#0b1020" },
  { name: "Dune", amp: 3.2, swell: 40, c: ["#7c2d12", "#f97316", "#fde68a"], base: "#140c08" },
  { name: "Dusk", amp: 2.5, swell: 35, c: ["#4c1d95", "#a855f7", "#e9d5ff"], base: "#120f17" },
  { name: "Silk", amp: 2.2, swell: 30, c: ["#3f3f46", "#a1a1aa", "#f4f4f5"], base: "#0f0f12" },
  { name: "Aurora", amp: 2.6, swell: 38, c: ["#065f46", "#34d399", "#a7f3d0"], base: "#06120e" },
];
const SWATCHES = ["#f97316", "#f472b6", "#a5b4fc", "#38bdf8", "#34d399", "#facc15", "#d4d4d8"];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-[3px]" style={{ background: value }} aria-hidden />
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="border-b border-dotted border-white/40 text-white hover:border-white"
      >
        &quot;{value}&quot;
      </button>
      {open && (
        <span role="group" aria-label="Wave colour" className="absolute top-[calc(100%+6px)] left-0 z-10 flex gap-1.5 rounded-full bg-[#1d1924] p-1.5 shadow-float">
          {SWATCHES.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={s}
              aria-pressed={s === value}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={cn("size-[22px] rounded-full transition hover:scale-110", s === value && "ring-2 ring-white/80 ring-offset-2 ring-offset-[#1d1924]")}
              style={{ background: s }}
            />
          ))}
        </span>
      )}
    </span>
  );
}

export default function HeroStage() {
  const [active, setActive] = useState(4);
  const p = PRESETS[active];
  const [wave, setWave] = useState(p.c[1]);
  const pick = (i: number) => {
    setActive(i);
    setWave(PRESETS[i].c[1]);
  };
  const tok = "text-[#c4b5fd]";
  return (
    <div className="relative h-[849px] overflow-hidden rounded-[14px] border border-white/[0.05] tab:max-lg:h-[881px] max-tab:h-[620px] max-sm:h-[520px]">
      <AuroraWavesBg colorA={p.c[0]} colorB={wave} colorC={p.c[2]} baseColor={p.base} amplitude={p.amp / 2} blur={p.swell * 2} />

      <div className="absolute top-[38px] left-[82px] w-[698px] rounded-2xl bg-[#18141f]/80 p-[5px] shadow-float backdrop-blur-xl max-lg:hidden">
        <p className="py-2 text-center text-xs2 font-medium text-white/45">Hero.jsx</p>
        <pre className="card-well overflow-visible py-4 font-mono text-[13.5px] leading-[24.2px] text-white/60">
          {[
            <>
              <span className={tok}>import</span> AuroraWavesBg <span className={tok}>from</span> <span className="text-white/80">&apos;./AuroraWavesBg&apos;</span>;
            </>,
            "",
            <>
              <span className={tok}>export default function</span> <span className="text-white">Hero</span>() {"{"}
            </>,
            "  return (",
            <span key="tag" className="text-white">
              {"    <AuroraWavesBg"}
            </span>,
            <>
              {"      colorB="}
              <ColorPicker value={wave} onChange={setWave} />
            </>,
            <>
              {"      amplitude={"}
              <span className="text-white">{p.amp / 2}</span>
              {"}"}
            </>,
            <>
              {"      blur={"}
              <span className="text-white">{p.swell * 2}</span>
              {"}"}
            </>,
            "    />",
            "  );",
            "}",
          ].map((line, i) => (
            <span key={i} className="flex">
              <span className="w-12 shrink-0 pr-5 text-right text-white/25 select-none">{i + 1}</span>
              <span className="whitespace-pre">{line}</span>
            </span>
          ))}
        </pre>
      </div>

      <div className="absolute top-[205px] left-1/2 w-[420px] rounded-2xl bg-[#18141f]/80 p-[5px] shadow-float backdrop-blur-xl max-lg:inset-x-3 max-lg:top-auto max-lg:bottom-3 max-lg:w-auto">
        <p className="py-2 text-center text-xs2 font-medium text-white/50">Presets</p>
        <ul className="card-well p-1 max-lg:flex" role="radiogroup" aria-label="Background presets">
          {PRESETS.map((x, i) => (
            <li key={x.name} className="max-lg:flex-1">
              <button
                role="radio"
                aria-checked={i === active}
                onClick={() => pick(i)}
                className={cn(
                  "flex h-[46px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] font-medium transition max-lg:h-10 max-lg:justify-center max-lg:px-1 max-lg:text-[12.5px]",
                  i === active ? "bg-white/[0.07] text-white shadow-hair" : "text-white/75 hover:bg-white/[0.03]",
                )}
              >
                <span className="flex -space-x-1.5 max-lg:hidden" aria-hidden>
                  {x.c.map((c) => (
                    <span key={c} className="size-3.5 rounded-full ring-2 ring-[#16121c]" style={{ background: c }} />
                  ))}
                </span>
                {x.name}
                <span className="ml-auto font-mono text-[11px] text-white/45 max-lg:hidden">
                  amplitude {x.amp} · swell {x.swell}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <Link href="/tools/" className="flex items-center gap-1.5 px-3 py-3 text-[13px] font-medium text-white/70 hover:text-white max-lg:hidden">
          Open in Background Studio <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
