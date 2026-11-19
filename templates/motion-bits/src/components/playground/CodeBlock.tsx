"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return { copied, copy };
}

export function CopyButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white",
        className,
      )}
      aria-label={label ?? "Copy"}
    >
      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      {label !== undefined && <span>{copied ? "Copied!" : label}</span>}
    </button>
  );
}

const KEYWORDS =
  /\b(import|from|export|default|function|return|const|let|var|if|else|for|of|new|type|interface|extends|true|false|null|undefined|useState|useEffect|useRef|useCallback|useMemo)\b/g;

// Tiny tokenizer: strings, comments, keywords, numbers. Escapes HTML first.
function highlight(line: string) {
  const esc = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts = esc.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*$)/g);
  return parts
    .map((p, i) => {
      if (i % 2 === 1) {
        if (p.startsWith("//")) return `<span class="text-white/35">${p}</span>`;
        return `<span class="text-[#c4b5fd]">${p}</span>`;
      }
      return p
        .replace(KEYWORDS, '<span class="text-[#f0abfc]">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-[#67e8f9]">$1</span>');
    })
    .join("");
}

export default function CodeBlock({
  code,
  title,
  className,
  maxHeight = 560,
}: {
  code: string;
  title?: string;
  className?: string;
  maxHeight?: number;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div className={cn("card-shell", className)}>
      <div className="flex items-center justify-between px-3 pt-1.5 pb-2">
        <span className="text-[13px] text-white/50">{title}</span>
        <CopyButton text={code} label="Copy Code" />
      </div>
      <div className="card-well overflow-auto py-3 font-mono text-[13px] leading-[1.75]" style={{ maxHeight }}>
        <table className="border-collapse">
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="select-none pr-4 pl-4 text-right align-top text-white/25">{i + 1}</td>
                <td className="pr-6 whitespace-pre text-white/80" dangerouslySetInnerHTML={{ __html: highlight(l) || " " }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
