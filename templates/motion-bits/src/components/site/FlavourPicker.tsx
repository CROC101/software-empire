"use client";

import { useState } from "react";
import { CopyButton } from "@/components/playground/CodeBlock";
import { cn } from "@/lib/utils";

const LANGS = ["JS", "TS"] as const;
const STYLES = [
  ["CSS", "CSS"],
  ["Tailwind", "TW"],
] as const;

export default function FlavourPicker() {
  const [flavour, setFlavour] = useState("JS-CSS");
  const cmd = `npx shadcn@latest add @motion-bits/SplitTextReveal-${flavour}`;
  return (
    <>
      <div className="mt-6 inline-grid grid-cols-[auto_160px_160px] gap-1.5 rounded-[14px] bg-[#18151d] p-2 text-[13px] max-sm:grid-cols-[auto_1fr_1fr]" role="radiogroup" aria-label="Flavour">
        <span />
        {STYLES.map(([s]) => (
          <span key={s} className="py-1 text-center text-white/55">
            {s}
          </span>
        ))}
        {LANGS.map((l) => (
          <div key={l} className="contents">
            <span className="flex items-center pr-4 pl-2 font-medium text-white">{l === "JS" ? "JavaScript" : "TypeScript"}</span>
            {STYLES.map(([, s]) => {
              const f = `${l}-${s}`;
              return (
                <button
                  key={f}
                  role="radio"
                  aria-checked={flavour === f}
                  onClick={() => setFlavour(f)}
                  className={cn(
                    "h-10 rounded-[10px] font-mono text-[12px] transition",
                    flavour === f ? "bg-white/[0.06] text-white ring-1 ring-white/15" : "bg-[#0b090e] text-white/50 hover:text-white",
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-6 text-[15px] leading-[1.68] text-white/60">
        The end of the install name picks the flavour:{" "}
        {["JS-CSS", "JS-TW", "TS-CSS", "TS-TW"].map((f, i) => (
          <span key={f}>
            <code className="rounded-md bg-violet/10 px-1.5 py-0.5 font-mono text-[12.5px] text-[#c4b5fd]">{f}</code>
            {i < 3 ? (i === 2 ? " or " : ", ") : "."}
          </span>
        ))}{" "}
        With the shadcn CLI it looks like this:
      </p>
      <div className="card-shell mt-5">
        <div className="card-well flex items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-white">shadcn</p>
            <p className="mt-2 overflow-x-auto font-mono text-[13px] whitespace-nowrap text-white/85">{cmd}</p>
          </div>
          <CopyButton text={cmd} />
        </div>
      </div>
    </>
  );
}
