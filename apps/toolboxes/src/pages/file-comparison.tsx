import { useState, type ChangeEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowLeftRight, FileDiff, FileText, RotateCcw } from "lucide-react";
import { compareLines, type DiffSummary } from "@/lib/file-comparison";

const MAX_FILE_BYTES = 1_000_000;
const MAX_LINES = 2500;
const SUPPORTED_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "js",
  "jsx",
  "ts",
  "tsx",
  "css",
  "html",
  "xml",
  "yml",
  "yaml",
  "sql",
  "log",
]);

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function DiffCell({
  text,
  line,
  type,
}: {
  text: string | null;
  line: number | null;
  type: "same" | "changed" | "added" | "removed";
}) {
  const background =
    type === "added"
      ? "bg-success/10"
      : type === "removed"
        ? "bg-error-container"
        : type === "changed"
          ? "bg-warning/10"
          : "bg-surface-container";
  const marker = type === "added" ? "+" : type === "removed" ? "−" : type === "changed" ? "~" : "";

  return (
    <div className={`grid min-h-8 grid-cols-12 ${background}`}>
      <span className="col-span-1 select-none border-r border-surface-variant px-1 py-1 text-right text-sm text-on-surface-variant">
        {line ?? ""}
      </span>
      <span className="col-span-11 whitespace-pre-wrap break-words px-3 py-1 font-mono text-sm leading-relaxed">
        <span className="mr-2 font-bold">{marker}</span>
        {text || " "}
      </span>
    </div>
  );
}

export default function FileComparisonPage() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftName, setLeftName] = useState("");
  const [rightName, setRightName] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiffSummary | null>(null);

  const loadFile = async (side: "left" | "right", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    if (!SUPPORTED_EXTENSIONS.has(getExtension(file.name))) {
      setError("รองรับไฟล์ข้อความ เช่น TXT, MD, CSV, JSON และไฟล์โค้ดเท่านั้น");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 1 MB ต่อไฟล์");
      event.target.value = "";
      return;
    }

    try {
      const content = await file.text();
      if (content.includes("\u0000")) throw new Error("ไฟล์นี้ไม่ใช่ไฟล์ข้อความที่รองรับ");
      if (side === "left") {
        setLeftName(file.name);
        setLeftText(content);
      } else {
        setRightName(file.name);
        setRightText(content);
      }
      event.target.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่");
      event.target.value = "";
    }
  };

  const compare = () => {
    setError("");
    if (leftText.length + rightText.length > MAX_FILE_BYTES * 2) {
      setError("ข้อความรวมต้องมีขนาดไม่เกิน 2 MB");
      return;
    }
    const totalBytes =
      new TextEncoder().encode(leftText).length + new TextEncoder().encode(rightText).length;
    if (totalBytes > MAX_FILE_BYTES * 2) {
      setError("ข้อความรวมต้องมีขนาดไม่เกิน 2 MB");
      return;
    }
    const leftLines = leftText ? leftText.split(/\r\n|\n|\r/) : [];
    const rightLines = rightText ? rightText.split(/\r\n|\n|\r/) : [];
    if (leftLines.length > MAX_LINES || rightLines.length > MAX_LINES) {
      setError(`รองรับไม่เกิน ${MAX_LINES.toLocaleString("th-TH")} บรรทัดต่อฝั่ง`);
      return;
    }
    setResult(compareLines(leftLines, rightLines));
  };

  const clear = () => {
    setLeftText("");
    setRightText("");
    setLeftName("");
    setRightName("");
    setError("");
    setResult(null);
  };

  const swap = () => {
    setLeftText(rightText);
    setRightText(leftText);
    setLeftName(rightName);
    setRightName(leftName);
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          กลับไปหน้ารวมเครื่องมือ
        </Link>
        <header className="mt-4 rounded-lg border border-surface-variant bg-surface-container p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-primary-container">
              <FileDiff size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">เปรียบเทียบไฟล์</h1>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                เลือกไฟล์หรือวางข้อความสองฝั่ง เพื่อดูบรรทัดที่เพิ่ม ลบ หรือเปลี่ยน
              </p>
            </div>
          </div>
        </header>

        <section
          className="mt-5 grid gap-4 lg:grid-cols-2"
          aria-label="เนื้อหาที่ต้องการเปรียบเทียบ"
        >
          <div className="rounded-lg border border-surface-variant bg-surface-container p-4">
            <label htmlFor="left-file" className="mb-2 block text-sm font-semibold">
              ไฟล์ต้นฉบับ
            </label>
            <input
              id="left-file"
              type="file"
              accept=".txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.css,.html,.xml,.yml,.yaml,.sql,.log"
              onChange={(event) => void loadFile("left", event)}
              className="block min-h-11 w-full rounded-md border border-surface-variant bg-surface px-3 py-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-primary-container file:px-3 file:py-1 file:font-medium file:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            />
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              {leftName || "เลือกไฟล์ข้อความ หรือวางข้อความด้านล่าง"}
            </p>
            <label htmlFor="left-text" className="mt-3 block text-sm font-medium">
              ข้อความต้นฉบับ
            </label>
            <textarea
              id="left-text"
              value={leftText}
              onChange={(event) => {
                setLeftText(event.target.value);
                setLeftName("");
                setResult(null);
              }}
              placeholder="วางหรือพิมพ์ข้อความต้นฉบับที่นี่"
              spellCheck={false}
              className="mt-3 min-h-56 w-full resize-y rounded-md border border-surface-variant bg-surface-container p-3 font-mono text-base leading-relaxed text-on-surface placeholder:font-sans placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            />
          </div>

          <div className="rounded-lg border border-surface-variant bg-surface-container p-4">
            <label htmlFor="right-file" className="mb-2 block text-sm font-semibold">
              ไฟล์ที่ต้องการเปรียบเทียบ
            </label>
            <input
              id="right-file"
              type="file"
              accept=".txt,.md,.csv,.json,.js,.jsx,.ts,.tsx,.css,.html,.xml,.yml,.yaml,.sql,.log"
              onChange={(event) => void loadFile("right", event)}
              className="block min-h-11 w-full rounded-md border border-surface-variant bg-surface px-3 py-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-primary-container file:px-3 file:py-1 file:font-medium file:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            />
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              {rightName || "เลือกไฟล์ข้อความ หรือวางข้อความด้านล่าง"}
            </p>
            <label htmlFor="right-text" className="mt-3 block text-sm font-medium">
              ข้อความที่ต้องการเปรียบเทียบ
            </label>
            <textarea
              id="right-text"
              value={rightText}
              onChange={(event) => {
                setRightText(event.target.value);
                setRightName("");
                setResult(null);
              }}
              placeholder="วางหรือพิมพ์ข้อความอีกชุดที่นี่"
              spellCheck={false}
              className="mt-3 min-h-56 w-full resize-y rounded-md border border-surface-variant bg-surface-container p-3 font-mono text-base leading-relaxed text-on-surface placeholder:font-sans placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            />
          </div>
        </section>

        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          รองรับ TXT, MD, CSV, JSON และไฟล์ข้อความหรือโค้ด ขนาดไม่เกิน 1 MB ต่อไฟล์ ·
          ประมวลผลในเบราว์เซอร์ ไฟล์ไม่ถูกส่งขึ้นเซิร์ฟเวอร์
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-error-container px-4 py-3 text-sm leading-relaxed text-on-error-container"
          >
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={compare}
            disabled={!leftText && !rightText}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-container px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDiff size={17} aria-hidden="true" />
            เปรียบเทียบไฟล์
          </button>
          <button
            type="button"
            onClick={swap}
            disabled={!leftText && !rightText}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-surface-variant bg-surface-container px-4 text-sm hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeftRight size={16} aria-hidden="true" />
            สลับข้อความ
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-surface-variant bg-surface-container px-4 text-sm hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
          >
            <RotateCcw size={16} aria-hidden="true" />
            ล้างข้อมูล
          </button>
          {!leftText && !rightText && (
            <span className="self-center text-sm leading-relaxed text-on-surface-variant">
              เพิ่มข้อความอย่างน้อยหนึ่งฝั่งก่อนเปรียบเทียบ
            </span>
          )}
        </div>

        <section className="mt-6" aria-labelledby="result-title" aria-live="polite">
          <h2 id="result-title" className="text-lg font-semibold">
            ผลการเปรียบเทียบ
          </h2>
          {!result ? (
            <div className="mt-3 rounded-lg border border-surface-variant bg-surface-container px-4 py-8 text-center text-sm leading-relaxed text-on-surface-variant">
              <FileText size={24} className="mx-auto mb-2" aria-hidden="true" />
              เลือกหรือวางข้อความสองฝั่ง แล้วกด “เปรียบเทียบไฟล์”
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 rounded-md border border-surface-variant bg-surface-container px-4 py-3 text-sm leading-relaxed">
                <span>
                  เพิ่ม <strong className="text-success">{result.added}</strong> บรรทัด
                </span>
                <span>
                  ลบ <strong className="text-on-error-container">{result.removed}</strong> บรรทัด
                </span>
                <span>
                  เปลี่ยน <strong className="text-warning">{result.changed}</strong> บรรทัด
                </span>
                {result.added + result.removed + result.changed === 0 && (
                  <span className="font-medium">ข้อความทั้งสองฝั่งเหมือนกัน</span>
                )}
              </div>
              <div className="mt-3 space-y-1" role="list" aria-label="บรรทัดที่เปรียบเทียบ">
                {result.rows.map((row, index) => (
                  <div
                    key={`${row.left?.leftLine ?? "x"}-${row.right?.rightLine ?? "x"}-${index}`}
                    className="grid grid-cols-1 md:grid-cols-2"
                    role="listitem"
                  >
                    <DiffCell
                      text={row.left?.text ?? null}
                      line={row.left?.leftLine ?? null}
                      type={row.left?.type ?? "same"}
                    />
                    <DiffCell
                      text={row.right?.text ?? null}
                      line={row.right?.rightLine ?? null}
                      type={row.right?.type ?? "same"}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
