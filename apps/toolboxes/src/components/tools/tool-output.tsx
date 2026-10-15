import { Check, Copy, Download } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Fragment, useRef, useState, type ReactNode } from "react";
import { parseMarkdown, type Block, type Inline } from "@/lib/tools/impl/markdown";
import type { ToolOutput } from "@/lib/tools/types";

const MAX_TABLE_ROWS = 1000;

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CopyButton({ value, label = "คัดลอก" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      disabled={!value}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant px-3 text-sm hover:bg-surface-container disabled:opacity-50"
    >
      {copied ? (
        <Check aria-hidden className="size-4 text-success" />
      ) : (
        <Copy aria-hidden className="size-4" />
      )}
      {copied ? "คัดลอกแล้ว" : label}
    </button>
  );
}

/// ข้อความที่ใช้คัดลอกผลทั้งหมด (ตาราง = TSV วางลง Sheets ได้)
export function outputAsText(output: ToolOutput): string {
  switch (output.kind) {
    case "text":
      return output.text;
    case "rows":
      return output.rows.map((r) => `${r.label}\t${r.value}`).join("\n");
    case "table":
      return [output.columns, ...output.rows].map((r) => r.join("\t")).join("\n");
    case "markdown":
      return output.markdown;
    case "qr":
      return output.value;
    case "swatches":
      return [
        ...output.items.map((i) => i.label),
        ...(output.rows ?? []).map((r) => `${r.label}\t${r.value}`),
      ].join("\n");
    case "diff":
      return output.lines
        .map((l) => `${l.type === "add" ? "+" : l.type === "del" ? "-" : " "} ${l.text}`)
        .join("\n");
    case "highlight":
      return output.rows.map((r) => `${r.label}\t${r.value}`).join("\n");
    case "serp":
      return `${output.title}\n${output.url}\n${output.description}`;
    case "card":
      return `${output.title}\n${output.description}`;
  }
}

function InlineView({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.type) {
          case "text":
            return <Fragment key={i}>{n.text}</Fragment>;
          case "strong":
            return (
              <strong key={i}>
                <InlineView nodes={n.children} />
              </strong>
            );
          case "em":
            return (
              <em key={i}>
                <InlineView nodes={n.children} />
              </em>
            );
          case "del":
            return (
              <del key={i}>
                <InlineView nodes={n.children} />
              </del>
            );
          case "code":
            return (
              <code
                key={i}
                className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-sm"
              >
                {n.text}
              </code>
            );
          case "link":
            return (
              <a
                key={i}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-primary-container underline"
              >
                <InlineView nodes={n.children} />
              </a>
            );
          case "image":
            return (
              <span
                key={i}
                className="rounded border border-dashed border-outline-variant px-1 text-on-surface-variant"
              >
                [รูป: {n.alt || "ไม่มีคำอธิบาย"}]
              </span>
            );
        }
      })}
    </>
  );
}

function MarkdownView({ markdown }: { markdown: string }) {
  const blocks: Block[] = parseMarkdown(markdown);
  const heading = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-base"];

  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading": {
            const Tag = `h${b.level}` as "h1";

            return (
              <Tag key={i} className={`${heading[b.level - 1]} font-bold`}>
                <InlineView nodes={b.children} />
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={i}>
                <InlineView nodes={b.children} />
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-primary-container/40 pl-4 text-on-surface-variant"
              >
                <InlineView nodes={b.children} />
              </blockquote>
            );
          case "hr":
            return <hr key={i} className="border-outline-variant" />;
          case "code":
            return (
              <pre
                key={i}
                className="tool-output overflow-auto rounded-xl bg-surface-container p-4"
              >
                {b.text}
              </pre>
            );
          case "list": {
            const List = b.ordered ? "ol" : "ul";

            return (
              <List key={i} className={`pl-6 ${b.ordered ? "list-decimal" : "list-disc"}`}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <InlineView nodes={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {b.head.map((c, j) => (
                        <th
                          key={j}
                          className="border border-outline-variant bg-surface-container px-3 py-2 text-left"
                        >
                          <InlineView nodes={c} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className="border border-outline-variant px-3 py-2">
                            <InlineView nodes={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}

function QrView({ output }: { output: Extract<ToolOutput, { kind: "qr" }> }) {
  const canvasWrap = useRef<HTMLDivElement>(null);
  const svgWrap = useRef<HTMLDivElement>(null);

  const downloadPng = () => {
    const canvas = canvasWrap.current?.querySelector("canvas");

    canvas?.toBlob((blob) => blob && downloadBlob(blob, "qrcode.png"), "image/png");
  };
  const downloadSvg = () => {
    const svg = svgWrap.current?.querySelector("svg");

    if (svg)
      downloadBlob(
        new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }),
        "qrcode.svg",
      );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={canvasWrap}
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4"
      >
        <QRCodeCanvas
          value={output.value}
          size={output.size}
          level={output.level}
          fgColor={output.foreground}
          bgColor={output.background}
          marginSize={2}
          className="h-auto max-w-full"
        />
      </div>
      <div ref={svgWrap} className="hidden" aria-hidden>
        <QRCodeSVG
          value={output.value}
          size={output.size}
          level={output.level}
          fgColor={output.foreground}
          bgColor={output.background}
          marginSize={2}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={downloadPng}
          className="btn-gradient inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold"
        >
          <Download aria-hidden className="size-4" />
          ดาวน์โหลด PNG
        </button>
        <button
          type="button"
          onClick={downloadSvg}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 hover:bg-surface-container"
        >
          <Download aria-hidden className="size-4" />
          ดาวน์โหลด SVG
        </button>
      </div>
      <p className="max-w-full text-center text-sm break-all text-on-surface-variant">
        ข้อมูลใน QR:{" "}
        {output.value.startsWith("WIFI:")
          ? "การตั้งค่า Wi-Fi (มีรหัสผ่านอยู่ใน QR — แชร์อย่างระวัง)"
          : output.value}
      </p>
    </div>
  );
}

function RowsView({ rows }: { rows: Extract<ToolOutput, { kind: "rows" }>["rows"] }) {
  return (
    <dl className="divide-y divide-outline-variant/60 overflow-hidden rounded-xl border border-outline-variant/70">
      {rows.map((r, i) => (
        <div
          key={`${r.label}-${i}`}
          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
        >
          <dt className="text-sm text-on-surface-variant sm:w-48 sm:shrink-0">{r.label}</dt>
          <dd
            className={`min-w-0 flex-1 break-words ${r.mono ? "font-mono text-sm" : "font-medium"}`}
          >
            {r.value}
          </dd>
          <dd className="hidden shrink-0 sm:block">
            <CopyButton value={r.value} label="คัดลอก" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ToolOutputView({ output }: { output: ToolOutput }): ReactNode {
  switch (output.kind) {
    case "text":
      return output.text ? (
        <pre
          className={`max-h-144 overflow-auto rounded-xl bg-surface-container-low p-4 ${output.mono === false ? "leading-relaxed whitespace-pre-wrap" : "tool-output"}`}
        >
          {output.text}
        </pre>
      ) : (
        <p className="text-on-surface-variant">ผลลัพธ์จะแสดงที่นี่</p>
      );
    case "rows":
      return output.rows.length ? (
        <RowsView rows={output.rows} />
      ) : (
        <p className="text-on-surface-variant">ผลลัพธ์จะแสดงที่นี่</p>
      );
    case "table":
      return (
        <div className="max-h-144 overflow-auto rounded-xl border border-outline-variant/70">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-surface-container">
              <tr>
                {output.columns.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {output.rows.slice(0, MAX_TABLE_ROWS).map((r, i) => (
                <tr
                  key={i}
                  className="odd:bg-surface-container-lowest even:bg-surface-container-low"
                >
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2 align-top break-words">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {output.rows.length > MAX_TABLE_ROWS && (
            <p className="p-3 text-sm text-on-surface-variant">
              แสดง {MAX_TABLE_ROWS.toLocaleString("th-TH")} แถวแรก จาก{" "}
              {output.rows.length.toLocaleString("th-TH")} (ปุ่มคัดลอกได้ครบทุกแถว)
            </p>
          )}
        </div>
      );
    case "markdown":
      return <MarkdownView markdown={output.markdown} />;
    case "qr":
      return <QrView output={output} />;
    case "swatches":
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {output.items.map((item) => (
              <div key={item.label} className="w-40">
                <div
                  className="h-24 rounded-xl border border-outline-variant"
                  style={{ backgroundColor: item.color }}
                />
                <p className="mt-1 font-mono text-sm">{item.label}</p>
              </div>
            ))}
          </div>
          {output.rows && <RowsView rows={output.rows} />}
        </div>
      );
    case "diff":
      return (
        <div>
          <p className="mb-2 font-medium">{output.summary}</p>
          <div className="max-h-144 overflow-auto rounded-xl border border-outline-variant/70 font-mono text-sm">
            {output.lines.map((l, i) => (
              <div
                key={i}
                className={`flex gap-3 px-3 py-0.5 whitespace-pre-wrap ${l.type === "add" ? "bg-success/10" : l.type === "del" ? "bg-error-container/60" : ""}`}
              >
                <span
                  aria-label={l.type === "add" ? "เพิ่ม" : l.type === "del" ? "ลบ" : "เหมือนเดิม"}
                  className={`w-4 shrink-0 select-none ${l.type === "add" ? "text-success" : l.type === "del" ? "text-error" : "text-on-surface-variant"}`}
                >
                  {l.type === "add" ? "+" : l.type === "del" ? "−" : " "}
                </span>
                <span className="min-w-0 break-words">{l.text || " "}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "highlight": {
      const parts: ReactNode[] = [];
      let last = 0;

      output.ranges.forEach((r, i) => {
        if (r.start > last) parts.push(output.text.slice(last, r.start));
        parts.push(
          <mark key={i} className="rounded bg-brand-amber/50 text-on-surface">
            {output.text.slice(r.start, r.end) || "∅"}
          </mark>,
        );
        last = Math.max(last, r.end);
      });
      parts.push(output.text.slice(last));

      return (
        <div className="space-y-4">
          <pre className="tool-output max-h-80 overflow-auto rounded-xl bg-surface-container-low p-4">
            {parts}
          </pre>
          {output.rows.length > 0 && <RowsView rows={output.rows} />}
        </div>
      );
    }
    case "serp":
      return (
        <div className="max-w-2xl rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-5">
          <p className="truncate text-sm text-on-surface-variant">{output.url}</p>
          <p className="mt-1 text-xl leading-snug text-primary-container">
            {output.title || "ไม่มี title"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            {output.description || "ไม่มี description — Google จะดึงข้อความจากหน้าเว็บมาแสดงเอง"}
          </p>
        </div>
      );
    case "card":
      return (
        <div className="max-w-lg overflow-hidden rounded-xl border border-outline-variant/70 bg-surface-container-lowest">
          {output.image && (
            <div className="brand-gradient grid aspect-video place-items-center text-primary-foreground/80">
              og:image {output.image}
            </div>
          )}
          <div className="bg-surface-container-low p-4">
            <p className="text-sm text-on-surface-variant uppercase">{output.site}</p>
            <p className="mt-1 font-semibold">{output.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
              {output.description}
            </p>
          </div>
        </div>
      );
  }
}
