import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  FileUp,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { createWordDocument, extractPdfText, getWordFilename } from "@/lib/pdf-to-word";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function formatBytes(value: number) {
  return value < 1024 * 1024
    ? `${(value / 1024).toFixed(0)} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfToWordPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [downloaded, setDownloaded] = useState(false);

  const reset = () => {
    setFile(null);
    setText("");
    setPageCount(0);
    setBusy(false);
    setError("");
    setDownloaded(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const loadPdf = async (selected: File | undefined) => {
    if (!selected) return;
    reset();
    if (
      !selected.name.toLowerCase().endsWith(".pdf") ||
      (selected.type && selected.type !== "application/pdf")
    ) {
      setError("เลือกไฟล์ PDF เท่านั้น");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError("รองรับไฟล์ PDF ขนาดไม่เกิน 25 MB");
      return;
    }
    setFile(selected);
    setBusy(true);
    try {
      const result = await extractPdfText(selected);
      setText(result.text);
      setPageCount(result.pages);
    } catch (cause) {
      setFile(null);
      setError(cause instanceof Error ? cause.message : "แปลงไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => void loadPdf(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void loadPdf(event.dataTransfer.files?.[0]);
  };

  const downloadWord = () => {
    if (!file || !text) return;
    const blob = createWordDocument(text, file.name.replace(/\.pdf$/i, ""));
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getWordFilename(file.name);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary-container hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          กลับหน้าเครื่องมือ
        </Link>
        <header className="mb-6 border-b border-surface-variant pb-5">
          <div className="flex items-start gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-container text-primary-foreground">
              <FileText size={24} aria-hidden="true" />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-primary-container">เครื่องมือเอกสาร</p>
              <h1 className="mb-1 mt-1 text-2xl font-semibold sm:text-3xl">แปลง PDF เป็น Word</h1>
              <p className="m-0 max-w-2xl text-sm leading-7 text-on-surface-variant">
                ดึงข้อความจาก PDF แล้วดาวน์โหลดเป็นไฟล์ Word (.docx) เพื่อแก้ไขต่อ
              </p>
            </div>
          </div>
        </header>

        <section
          className="rounded-xl border border-surface-variant bg-surface-container p-4 sm:p-6"
          aria-labelledby="upload-title"
        >
          <h2 id="upload-title" className="m-0 text-lg font-semibold">
            เลือกไฟล์ PDF
          </h2>
          <p className="mb-4 mt-1 text-sm leading-relaxed text-on-surface-variant">
            รองรับ PDF ที่มีข้อความเลือกคัดลอกได้ ขนาดไม่เกิน 25 MB และไม่เกิน 200 หน้า
          </p>

          {!file ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex min-h-52 flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center ${dragging ? "border-primary-container bg-surface" : "border-surface-variant bg-surface"}`}
            >
              <span className="grid size-12 place-items-center rounded-full bg-surface-container text-primary-container">
                <FileUp size={24} aria-hidden="true" />
              </span>
              <p className="mb-1 mt-3 font-semibold">ลากไฟล์ PDF มาวางที่นี่</p>
              <p className="m-0 text-sm text-on-surface-variant">หรือเลือกไฟล์จากอุปกรณ์ของคุณ</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-container px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <FileUp size={16} aria-hidden="true" />
                เลือกไฟล์ PDF
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={onChange}
                className="sr-only"
                aria-label="เลือกไฟล์ PDF"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-surface-variant bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-container text-primary-container">
                    <FileText size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-medium">{file.name}</p>
                    <p className="m-0 text-sm text-on-surface-variant">
                      {formatBytes(file.size)}
                      {pageCount ? ` · ${pageCount} หน้า` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  aria-label="นำ PDF ออก"
                  className="grid size-10 shrink-0 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:opacity-50"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              {busy ? (
                <p className="mb-0 mt-4 text-sm text-on-surface-variant" role="status">
                  กำลังอ่านข้อความจาก PDF…
                </p>
              ) : (
                text && (
                  <p
                    className="mb-0 mt-4 inline-flex items-center gap-2 text-sm text-success"
                    role="status"
                  >
                    <Check size={16} aria-hidden="true" />
                    อ่านข้อความได้ พร้อมสร้างไฟล์ Word
                  </p>
                )
              )}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mb-0 mt-4 rounded-md bg-error-container px-4 py-3 text-sm leading-relaxed text-on-error-container"
            >
              {error}
            </p>
          )}

          {text && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={downloadWord}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary-container px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <Download size={16} aria-hidden="true" />
                ดาวน์โหลดไฟล์ Word (.docx)
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-surface-variant bg-surface px-4 text-sm hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <RotateCcw size={16} aria-hidden="true" />
                แปลงไฟล์อื่น
              </button>
              {downloaded && (
                <span className="text-sm text-success" role="status">
                  สร้างไฟล์ Word แล้ว
                </span>
              )}
            </div>
          )}
        </section>

        <aside
          className="mt-4 rounded-lg border border-surface-variant bg-surface-container p-4"
          aria-label="ข้อจำกัดและความเป็นส่วนตัว"
        >
          <h2 className="m-0 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={17} aria-hidden="true" />
            ข้อควรรู้ก่อนแปลง
          </h2>
          <ul className="mb-0 mt-2 space-y-1 pl-5 text-sm leading-relaxed text-on-surface-variant">
            <li>ไฟล์ถูกประมวลผลในเบราว์เซอร์และไม่ถูกอัปโหลดไป backend</li>
            <li>
              แปลงข้อความและลำดับบรรทัดเป็น Word; รูปภาพ ตาราง และการจัดหน้าอาจไม่เหมือน PDF ต้นฉบับ
            </li>
            <li>PDF ที่เป็นภาพสแกนหรือมีการเข้ารหัสยังไม่รองรับ และยังไม่มี OCR</li>
            <li>ตรวจทานเอกสาร Word หลังแปลง โดยเฉพาะเอกสารภาษาไทยหรือเอกสารสำคัญ</li>
          </ul>
        </aside>

        {text && (
          <section
            className="mt-4 rounded-xl border border-surface-variant bg-surface-container p-4 sm:p-6"
            aria-labelledby="preview-title"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="preview-title" className="m-0 text-lg font-semibold">
                ตัวอย่างข้อความที่อ่านได้
              </h2>
              <span className="text-sm text-on-surface-variant">
                {text.length.toLocaleString("th-TH")} ตัวอักษร
              </span>
            </div>
            <pre className="m-0 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-surface-variant bg-surface p-4 font-sans text-sm leading-relaxed">
              {text.slice(0, 20_000)}
              {text.length > 20_000 ? "\n…แสดงตัวอย่างบางส่วน" : ""}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}
