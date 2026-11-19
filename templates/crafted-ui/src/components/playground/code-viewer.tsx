"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, FileCode2 } from "lucide-react";
import type { PropValues, RegistryComponent } from "@/types/registry";
import { buildPrompt, cliCommand, filePath, installDeps, usageCode, type PackageManager } from "@/lib/prompt-builder";
import { getSource } from "@/data/components-registry";
import { useCopy, useOrigin } from "@/lib/use-copy";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 400, damping: 30 } as const;
const PMS: PackageManager[] = ["pnpm", "npm", "yarn", "bun"];
const TABS = [["cli", "CLI"], ["manual", "Manual"], ["prompt", "AI Prompt"]] as const;
type Tab = (typeof TABS)[number][0];

// shortcut: regex tokenizer (comments, strings, keywords, JSX tags), swap for shiki if exact grammar matters.
const TOKEN = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(import|from|export|default|const|let|function|return|if|else|type|interface|extends|true|false|null|undefined|new|as)\b|(<\/?[A-Za-z][\w.]*)/g;
function highlight(code: string) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = m[1] ? "text-white/35" : m[2] ? "text-[#a5d6ff]" : m[3] ? "text-[#ff7b9c]" : "text-[#7ee787]";
    out.push(<span key={m.index} className={cls}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(code.slice(last));
  return out;
}

function Block({ label, code, copyKey, mono = true }: { label: React.ReactNode; code: string; copyKey: string; mono?: boolean }) {
  const { copied, copy } = useCopy();
  return (
    <div className="overflow-hidden rounded-xl bg-[#0a0a0b] ring-1 ring-white/[0.06]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 text-[12px] text-dim">
        <span className="flex min-w-0 items-center gap-1.5 truncate font-mono">{label}</span>
        <button type="button" onClick={() => copy(code, copyKey)} className="flex shrink-0 items-center gap-1 hover:text-ink">
          {copied === copyKey ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}{copied === copyKey ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={cn("max-h-[420px] overflow-auto p-3 text-[12.5px] leading-5 text-ink-soft", mono ? "font-mono" : "whitespace-pre-wrap font-sans")}>{mono ? highlight(code) : code}</pre>
    </div>
  );
}

/** CLI / Manual source / AI prompt tabs; usage and prompt reflect the live props. */
export function CodeViewer({ component: c, props }: { component: RegistryComponent; props: PropValues }) {
  const [tab, setTab] = useState<Tab>("cli");
  const [pm, setPm] = useState<PackageManager>("pnpm");
  const origin = useOrigin();
  const source = getSource(c.slug);
  return (
    <div>
      <div className="flex gap-1 border-b border-white/[0.06]" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("relative px-3 pb-2.5 text-[13px] font-medium", tab === k ? "text-ink" : "text-dim hover:text-ink-soft")}>
            {label}
            {tab === k && <motion.span layoutId="code-tab" transition={spring} className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--craft-accent)]" />}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {tab === "cli" && (
          <>
            <div className="flex w-fit rounded-lg bg-white/[0.05] p-0.5">
              {PMS.map((p) => (
                <button key={p} type="button" onClick={() => setPm(p)} className="relative h-7 px-3 font-mono text-[12px]">
                  {pm === p && <motion.span layoutId="pm" transition={spring} className="absolute inset-0 rounded-md bg-white/10" />}
                  <span className={cn("relative", pm === p ? "text-ink" : "text-dim")}>{p}</span>
                </button>
              ))}
            </div>
            <Block label="Terminal" code={cliCommand(c, pm, origin)} copyKey="cli" />
            <Block label="Usage.tsx" code={usageCode(c, props)} copyKey="usage" />
          </>
        )}
        {tab === "manual" && (
          <>
            <Block label="Install dependencies" code={installDeps(c, pm)} copyKey="deps" />
            <Block label={<><FileCode2 className="size-3.5" />{filePath(c)}</>} code={source} copyKey="source" />
            <Block label="Usage.tsx" code={usageCode(c, props)} copyKey="usage" />
          </>
        )}
        {tab === "prompt" && <Block label="Prompt for your AI agent" code={buildPrompt(c, source, props, origin)} copyKey="prompt" mono={false} />}
      </div>
    </div>
  );
}
