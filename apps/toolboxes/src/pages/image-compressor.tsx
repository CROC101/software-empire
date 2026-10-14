import { Link } from "react-router";
import { useEffect, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  FileImage,
  ImageDown,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

type OutputFormat = "image/webp" | "image/jpeg";
type CompressedImage = { blob: Blob; previewUrl: string; width: number; height: number };
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_EDGE = 2560;
const prettyBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export default function ImageCompressorPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [result, setResult] = useState<CompressedImage | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [quality, setQuality] = useState(78);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(
    () => () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    },
    [],
  );

  const acceptFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) {
      setError("เลือกไฟล์ JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 25 MB");
      return;
    }
    setError("");
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
    const nextUrl = URL.createObjectURL(nextFile);
    sourceUrlRef.current = nextUrl;
    setSourceUrl(nextUrl);
    setFile(nextFile);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) =>
    acceptFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  };

  const compress = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = "";
    setResult(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("เบราว์เซอร์ไม่สามารถประมวลผลรูปภาพนี้ได้");
      if (format === "image/jpeg") {
        context.fillStyle = getComputedStyle(document.documentElement)
          .getPropertyValue("--color-surface-container")
          .trim();
        context.fillRect(0, 0, width, height);
      }
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("บีบอัดรูปภาพไม่สำเร็จ กรุณาลองอีกครั้ง")),
          format,
          quality / 100,
        );
      });
      const previewUrl = URL.createObjectURL(blob);
      resultUrlRef.current = previewUrl;
      setResult({ blob, previewUrl, width, height });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "บีบอัดรูปภาพไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!file || !result) return;
    const link = document.createElement("a");
    const extension = format === "image/webp" ? "webp" : "jpg";
    link.href = result.previewUrl;
    link.download = `${file.name.replace(/\.[^.]+$/, "")}-compressed.${extension}`;
    link.click();
  };

  const reset = () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    sourceUrlRef.current = "";
    resultUrlRef.current = "";
    setFile(null);
    setResult(null);
    setError("");
    setSourceUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const savings =
    file && result ? Math.max(0, Math.round((1 - result.blob.size / file.size) * 100)) : 0;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 text-sm text-on-surface-variant transition hover:bg-surface-container hover:text-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          กลับไปหน้ารวมเครื่องมือ
        </Link>
        <header className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-container/10 text-primary-container">
              <ImageDown size={24} />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-primary-container">เครื่องมือรูปภาพ</p>
              <h1 className="mb-1 mt-1 text-2xl font-semibold sm:text-3xl">ลดขนาดรูปภาพ</h1>
              <p className="m-0 max-w-2xl text-sm leading-7 text-on-surface-variant">
                บีบอัดรูปภาพและดาวน์โหลดไฟล์ที่เล็กลง ปรับคุณภาพและรูปแบบได้ตามต้องการ
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm text-success">
            <ShieldCheck size={15} />
            ประมวลผลบนอุปกรณ์นี้
          </span>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-surface-variant bg-card p-5 shadow-sm sm:p-7">
            {!file ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-10 text-center transition ${dragging ? "border-primary-container bg-primary-container/10" : "border-surface-variant bg-surface"}`}
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-primary-container/10 text-primary-container">
                  <Upload size={25} />
                </span>
                <h2 className="mb-1 mt-4 text-base font-semibold">วางรูปภาพที่นี่</h2>
                <p className="m-0 text-sm text-on-surface-variant">หรือเลือกไฟล์จากอุปกรณ์ของคุณ</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-5 min-h-11 rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                >
                  เลือกรูปภาพ
                </button>
                <p className="mb-0 mt-4 text-sm text-on-surface-variant">
                  JPG, PNG หรือ WebP · ไม่เกิน 25 MB
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-container/10 text-primary-container">
                      <FileImage size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-medium">{file.name}</p>
                      <p className="m-0 text-sm text-on-surface-variant">
                        {prettyBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="นำรูปออก"
                    className="grid size-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface hover:text-on-error-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <figure className="m-0 overflow-hidden rounded-xl border border-surface-variant bg-surface">
                    <figcaption className="border-b border-surface-variant px-3 py-2 text-sm font-medium">
                      รูปต้นฉบับ
                    </figcaption>
                    <div className="relative grid h-56 place-items-center p-3">
                      <img
                        src={sourceUrl}
                        alt="ตัวอย่างรูปต้นฉบับ"
                        className="absolute inset-0 size-full object-contain p-3"
                      />
                    </div>
                  </figure>
                  <figure className="m-0 overflow-hidden rounded-xl border border-surface-variant bg-surface">
                    <figcaption className="flex items-center justify-between border-b border-surface-variant px-3 py-2 text-sm font-medium">
                      รูปที่บีบอัด
                      {result && (
                        <span className="text-success">
                          {result.blob.size < file.size
                            ? `${savings}% เล็กลง`
                            : "ขนาดใกล้เคียงต้นฉบับ"}
                        </span>
                      )}
                    </figcaption>
                    <div className="relative grid h-56 place-items-center p-3">
                      {result ? (
                        <img
                          src={result.previewUrl}
                          alt="ตัวอย่างรูปหลังบีบอัด"
                          className="absolute inset-0 size-full object-contain p-3"
                        />
                      ) : (
                        <div className="text-center text-sm text-on-surface-variant">
                          ปรับตัวเลือกแล้วกด
                          <br />
                          “บีบอัดรูปภาพ”
                        </div>
                      )}
                    </div>
                  </figure>
                </div>
                {result && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-success/10 px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-success">
                      <Check size={17} aria-hidden="true" /> {prettyBytes(file.size)} →{" "}
                      {prettyBytes(result.blob.size)} · {result.width} × {result.height} px
                    </span>
                    <button
                      type="button"
                      onClick={download}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                    >
                      <ArrowDownToLine size={15} aria-hidden="true" />
                      ดาวน์โหลด
                    </button>
                  </div>
                )}
              </div>
            )}
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
            />
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container"
              >
                {error}
              </p>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-surface-variant bg-card p-5 shadow-sm sm:p-6">
            <h2 className="m-0 text-base font-semibold">ตั้งค่าการบีบอัด</h2>
            <label htmlFor="output-format" className="mb-2 mt-5 block text-sm font-medium">
              รูปแบบไฟล์
            </label>
            <select
              id="output-format"
              value={format}
              onChange={(event) => setFormat(event.target.value as OutputFormat)}
              className="w-full rounded-lg border border-surface-variant bg-card px-3 py-2.5 text-sm outline-none focus:border-primary-container"
            >
              <option value="image/webp">WebP · ไฟล์เล็กและคมชัด</option>
              <option value="image/jpeg">JPG · รองรับอุปกรณ์ทั่วไป</option>
            </select>
            <div className="mb-2 mt-5 flex items-center justify-between">
              <label htmlFor="quality" className="text-sm font-medium">
                คุณภาพรูปภาพ
              </label>
              <span className="text-sm font-semibold text-primary-container">{quality}%</span>
            </div>
            <input
              id="quality"
              type="range"
              min="20"
              max="95"
              step="5"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="w-full accent-primary-container"
            />
            <div className="mt-1 flex justify-between text-sm text-on-surface-variant">
              <span>ไฟล์เล็ก</span>
              <span>คมชัดสูง</span>
            </div>
            <button
              type="button"
              onClick={() => void compress()}
              disabled={!file || busy}
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                  กำลังบีบอัด…
                </>
              ) : (
                <>
                  <ImageDown size={17} aria-hidden="true" />
                  {result ? "บีบอัดอีกครั้ง" : "บีบอัดรูปภาพ"}
                </>
              )}
            </button>
            {result && (
              <button
                type="button"
                onClick={download}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-surface-variant px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <ArrowDownToLine size={16} aria-hidden="true" />
                ดาวน์โหลดไฟล์
              </button>
            )}
            <div className="mt-5 border-t border-surface-variant pt-4">
              <div className="flex items-start gap-2 text-sm leading-relaxed text-on-surface-variant">
                <ShieldCheck className="mt-0.5 shrink-0 text-success" size={16} />
                <p className="m-0">
                  รูปภาพประมวลผลในเบราว์เซอร์ของคุณ ไฟล์ต้นฉบับไม่ถูกส่งไปยังเซิร์ฟเวอร์
                </p>
              </div>
              <p className="mb-0 mt-3 text-sm leading-relaxed text-on-surface-variant">
                ระบบจะย่อด้านที่ยาวที่สุดให้ไม่เกิน {MAX_EDGE.toLocaleString()} px อัตโนมัติ
              </p>
            </div>
            {result && (
              <button
                type="button"
                onClick={reset}
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <RotateCcw size={13} aria-hidden="true" />
                เลือกรูปอื่น
              </button>
            )}
          </aside>
        </section>
        <p className="mb-0 mt-5 text-center text-sm leading-relaxed text-on-surface-variant">
          หมายเหตุ: การบีบอัดอาจไม่ทำให้ไฟล์เล็กลงทุกภาพ ขึ้นอยู่กับรูปแบบและคุณภาพต้นฉบับ
        </p>
      </div>
    </main>
  );
}
