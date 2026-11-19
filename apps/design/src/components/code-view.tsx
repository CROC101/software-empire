"use client";

import { cn } from "@empire/ui";
import { FileCode2 } from "lucide-react";
import { useMemo, useState } from "react";
import { tokenize, type TokenKind } from "@/lib/highlight";
import { CopyButton } from "./copy-button";

export type CodeFile = { path: string; content: string };

const tone: Record<TokenKind, string> = {
  comment: "text-(--em-ink-500)",
  string: "text-(--em-gold-300)",
  keyword: "text-(--em-blue-300)",
  number: "text-(--em-violet-300)",
  tag: "text-(--em-sky-500)",
  plain: "",
};

/** The files a part installs, as the consumer gets them: path header, dependency badges, copy, colours. */
export function CodeView({ files, deps }: { files: readonly CodeFile[]; deps: readonly string[] }) {
  const [at, setAt] = useState(0);
  const file = files[at] ?? files[0];
  const tokens = useMemo(() => (file ? tokenize(file.content) : []), [file]);
  if (!file) return null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--em-ink-800) px-3 py-2">
        {files.length > 1 ? (
          <div role="tablist" aria-label="ไฟล์" className="flex flex-wrap gap-1">
            {files.map((f, i) => (
              <button
                key={f.path}
                type="button"
                role="tab"
                aria-selected={i === at}
                onClick={() => setAt(i)}
                className={cn(
                  "rounded px-2 py-1 font-mono text-xs transition-colors duration-75",
                  i === at
                    ? "bg-(--em-ink-800) text-(--em-ink-50)"
                    : "text-(--em-ink-400) hover:text-(--em-ink-100)",
                )}
              >
                {f.path}
              </button>
            ))}
          </div>
        ) : (
          <p className="inline-flex items-center gap-1.5 font-mono text-xs text-(--em-ink-300)">
            <FileCode2 aria-hidden className="size-4 text-(--em-ink-500)" />
            {file.path}
          </p>
        )}
        <CopyButton
          text={file.content}
          label="คัดลอกโค้ด"
          className="border-(--em-ink-800) text-(--em-ink-100) hover:bg-(--em-ink-900)"
        />
      </div>
      {deps.length > 0 && (
        <ul
          aria-label="แพ็กเกจที่ใช้"
          className="flex flex-wrap gap-1.5 border-b border-(--em-ink-800) px-3 py-2"
        >
          {deps.map((d) => (
            <li
              key={d}
              className="rounded border border-(--em-ink-800) px-1.5 py-0.5 font-mono text-[11px] text-(--em-ink-300)"
            >
              {d}
            </li>
          ))}
        </ul>
      )}
      <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-(--em-ink-200)">
        <code>
          {tokens.map((t, i) => (
            <span key={i} className={tone[t.kind]}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
