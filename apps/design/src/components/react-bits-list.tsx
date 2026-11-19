"use client";

import { cn } from "@empire/ui";
import { useState } from "react";
import data from "@/lib/react-bits.json";
import { reactBitsUrl } from "@/lib/react-bits-url";
import { CopyButton } from "./copy-button";

type Tool = "shadcn" | "jsrepo";
const slug = (s: string) => s.replace(/\s+/g, "-").toLowerCase();
// the official commands from reactbits.dev; the code comes from their registry, not ours
const command = (tool: Tool, name: string) =>
  tool === "shadcn"
    ? `npx shadcn@latest add @react-bits/${name}`
    : `npx jsrepo@latest add https://reactbits.dev/r/${name}`;

function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
      {items.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-xs transition-colors duration-75",
            value === t
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/**
 * Every React Bits component with its official install command, in the variant picked. "พรีวิว" opens
 * their own page in a frame (one at a time, loaded only on click), so their code stays on their site.
 * `ours` maps a React Bits title to the slug of our own rebuild of it.
 */
export function ReactBitsList({ ours = {} }: { ours?: Readonly<Record<string, string>> }) {
  const [variant, setVariant] = useState("TS-TW");
  const [tool, setTool] = useState<Tool>("shadcn");
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <div className="vt-top sticky top-[3.6rem] z-20 -mx-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Tabs label="ภาษาและสไตล์" items={data.variants} value={variant} onChange={setVariant} />
        <Tabs
          label="เครื่องมือติดตั้ง"
          items={["shadcn", "jsrepo"] as const}
          value={tool}
          onChange={setTool}
        />
      </div>
      {data.categories.map((c) => (
        <section key={c.name} aria-labelledby={slug(c.name)} className="mt-10">
          <h2 id={slug(c.name)} className="font-heading text-2xl font-black">
            {c.name}{" "}
            <span className="font-mono text-sm font-normal text-muted-foreground">
              {c.items.length}
            </span>
          </h2>
          <ul className="mt-4 divide-y border-y">
            {c.items.map((it) => {
              const cmd = command(tool, `${it.component}-${variant}`);
              const url = reactBitsUrl(c.name, it.title);
              const mine = ours[it.title];
              const shown = open === it.component;
              return (
                <li
                  key={it.component}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 font-semibold hover:text-(--em-blue-600) sm:w-44 sm:flex-none dark:hover:text-(--em-sky-400)"
                  >
                    {it.title} <span aria-hidden>↗</span>
                  </a>
                  {/* phones: the command takes its own line under the name, never cut to "npx j…" */}
                  <code className="order-last basis-full font-mono text-xs break-all text-muted-foreground sm:order-none sm:min-w-0 sm:flex-1 sm:basis-0 sm:truncate sm:break-normal">
                    {cmd}
                  </code>
                  {mine && (
                    <a
                      href={`/c/${mine}`}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-(--em-blue-600) hover:bg-muted dark:text-(--em-sky-400)"
                    >
                      ของเรา
                    </a>
                  )}
                  <button
                    type="button"
                    aria-expanded={shown}
                    aria-controls={`rb-${it.component}`}
                    onClick={() => setOpen(shown ? null : it.component)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {shown ? "ปิดพรีวิว" : "พรีวิว"}
                  </button>
                  <CopyButton text={cmd} label="คัดลอก" />
                  {shown && (
                    <iframe
                      id={`rb-${it.component}`}
                      src={url}
                      title={`${it.title} บน reactbits.dev`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      className="order-last mt-2 h-[32rem] w-full basis-full rounded-lg border bg-(--em-ink-975)"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
