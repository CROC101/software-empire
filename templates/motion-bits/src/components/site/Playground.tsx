"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import CodeBlock, { CopyButton } from "@/components/playground/CodeBlock";
import PropsCustomizer from "@/components/playground/PropsCustomizer";
import StageCanvas, { type StageBackground } from "@/components/playground/StageCanvas";
import { FavButton } from "@/components/site/ComponentCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categorySlug, getComponent, installCommand, registry, usageSnippet } from "@/data/registry";
import type { PropValue } from "@/types/component-registry";
import { cn } from "@/lib/utils";

export default function Playground({ slug }: { slug: string }) {
  const item = getComponent(slug)!;
  const idx = registry.indexOf(item);
  const prev = registry[idx - 1];
  const next = registry[idx + 1];

  const [values, setValues] = useState<Record<string, PropValue>>(item.defaultProps);
  const [replay, setReplay] = useState(0);
  const [bg, setBg] = useState<StageBackground>("dark");
  const [lang, setLang] = useState<"ts" | "js">("ts");
  const [tab, setTab] = useState("preview");

  // R replays the animation, unless the person is typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key.toLowerCase() !== "r" || e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, select, [contenteditable]")) return;
      setReplay((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const C = item.component;
  const tabCls =
    "h-8 flex-none rounded-lg px-3.5 text-[13px] text-white/55 data-active:bg-white/[0.08] data-active:text-white dark:data-active:border-transparent dark:data-active:bg-white/[0.08]";

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-white/45">
        <Link href="/components/" className="hover:text-white">
          Components
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/components/?category=${categorySlug(item.category)}`} className="hover:text-white">
          {item.category}
        </Link>
        <ChevronRight className="size-3.5" />
        <span aria-current="page" className="text-white/80">
          {item.name}
        </span>
      </nav>

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[37.44px] leading-[1.15] font-medium tracking-[-0.035em] text-white max-tab:text-[30px]">{item.name}</h1>
          <p className="mt-3 max-w-[620px] text-[14.5px] leading-[1.6] text-white/55">{item.description}</p>
        </div>
        <FavButton slug={item.slug} name={item.name} className="mt-2 size-10 bg-raise shadow-hair" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="mt-8 gap-4">
        <TabsList className="h-10 gap-1 rounded-[10px] bg-raise p-1 shadow-hair">
          <TabsTrigger value="preview" className={tabCls}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className={tabCls}>
            Code
          </TabsTrigger>
          <TabsTrigger value="usage" className={tabCls}>
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex flex-col gap-4">
          <StageCanvas fill={item.fill} background={bg} onBackgroundChange={setBg} onReplay={() => setReplay((n) => n + 1)}>
            <C key={replay} {...values} />
          </StageCanvas>
          <PropsCustomizer
            controls={item.propControls}
            values={values}
            onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
            onReset={() => {
              setValues(item.defaultProps);
              setReplay((n) => n + 1);
            }}
          />
          <CodeBlock title="Your configuration" code={usageSnippet(item, values)} maxHeight={320} />
        </TabsContent>

        <TabsContent value="code" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Language" className="flex gap-1 rounded-[10px] bg-raise p-1 shadow-hair">
              {(["ts", "js"] as const).map((l) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={lang === l}
                  onClick={() => setLang(l)}
                  className={cn("h-7 rounded-md px-3 text-xs font-medium", lang === l ? "bg-white/10 text-white" : "text-white/50 hover:text-white")}
                >
                  {l === "ts" ? "TypeScript" : "JavaScript"}
                </button>
              ))}
            </div>
          </div>
          <div className="card-shell">
            <p className="px-2 pt-1 pb-2 text-[13px] font-medium text-white">Install with the CLI</p>
            <div className="card-well flex items-center gap-3 px-4 py-3">
              <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-white/80">{installCommand(item, lang)}</code>
              <CopyButton text={installCommand(item, lang)} label="Copy" />
            </div>
          </div>
          <CodeBlock title={`${item.exportName}.${lang === "ts" ? "tsx" : "jsx"}`} code={item.source[lang]} maxHeight={640} />
        </TabsContent>

        <TabsContent value="usage" className="flex flex-col gap-6">
          <CodeBlock title="Example" code={usageSnippet(item, values)} />
          <div className="overflow-x-auto rounded-card shadow-hair">
            <table className="w-full min-w-[620px] border-collapse text-left text-[13.5px]">
              <caption className="sr-only">Props of {item.name}</caption>
              <thead className="bg-raise text-white/70">
                <tr>
                  {["Prop Name", "Type", "Default", "Description"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.propDocs.map((p) => (
                  <tr key={p.name} className="border-t border-white/[0.07]">
                    <th scope="row" className="px-4 py-3 font-mono text-[12.5px] font-normal text-[#d8b4fe]">
                      {p.name}
                    </th>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-cyan">{p.type}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-white/70">{p.default}</td>
                    <td className="px-4 py-3 text-white/60">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <nav aria-label="More components" className="mt-14 grid gap-3 border-t border-white/[0.07] pt-8 sm:grid-cols-2">
        {prev ? (
          <Link href={`/components/${prev.slug}/`} className="card-shell flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
            <ArrowLeft className="size-4 text-white/50" />
            <span>
              <span className="block text-xs text-white/45">Previous</span>
              <span className="text-[14px] font-medium text-white">{prev.name}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/components/${next.slug}/`} className="card-shell flex items-center justify-end gap-3 px-4 py-3 text-right hover:bg-white/[0.03]">
            <span>
              <span className="block text-xs text-white/45">Next</span>
              <span className="text-[14px] font-medium text-white">{next.name}</span>
            </span>
            <ArrowRight className="size-4 text-white/50" />
          </Link>
        )}
      </nav>
    </>
  );
}
