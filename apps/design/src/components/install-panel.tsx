"use client";

import { cn } from "@empire/ui";
import { useState } from "react";
import { installCommand, pms, type Pm } from "@/lib/stage";
import { CopyButton } from "./copy-button";

const tabs: readonly Pm[] = [...pms, "croc-ui"];

/** shadcn CLI per package manager, or croc-ui for projects without shadcn. */
export function InstallPanel({ base, slug }: { base: string; slug: string }) {
  const [pm, setPm] = useState<Pm>("pnpm");
  const command = installCommand(pm, base, slug);
  return (
    <div className="overflow-hidden rounded-xl border border-(--em-ink-800) bg-(--em-ink-975)">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--em-ink-800) px-2 py-1.5">
        <div role="tablist" aria-label="ตัวจัดการแพ็กเกจ" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={pm === t}
              onClick={() => setPm(t)}
              className={cn(
                "rounded px-2.5 py-1 font-mono text-xs transition-colors duration-75",
                pm === t
                  ? "bg-(--em-ink-800) text-(--em-ink-50)"
                  : "text-(--em-ink-400) hover:text-(--em-ink-100)",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <CopyButton
          text={command}
          label="คัดลอกคำสั่ง"
          className="border-(--em-ink-800) text-(--em-ink-100) hover:bg-(--em-ink-900)"
        />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs text-(--em-ink-100)">
        <code>
          <span aria-hidden className="text-(--em-ink-500)">
            ${" "}
          </span>
          {command}
        </code>
      </pre>
    </div>
  );
}
