import { Link } from "react-router";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Check,
  FileImage,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { proxy, transfer, wrap, type Remote } from "@empire/core/worker";
import { maxScale } from "@/lib/upscale/model";
import type { UpscaleApi } from "@/lib/upscale/worker";

type Scale = 2 | 3 | 4;
// preview is drawn on a canvas from the decoded bitmap, so the user's file never becomes an <img src>
type Source = { file: File; preview: ImageBitmap; width: number; height: number };
const drawPreview = (bitmap: ImageBitmap) => (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
};
type Result = { blob: Blob; url: string; width: number; height: number };
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const SCALES: Scale[] = [2, 3, 4];
const prettyBytes = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export default function ImageUpscalerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Remote<UpscaleApi> | null>(null);
  const urls = useRef<string[]>([]);
  const [gpu, setGpu] = useState<"checking" | "yes" | "no">("checking");
  const [source, setSource] = useState<Source | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scale, setScale] = useState<Scale>(4);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL("../lib/upscale/worker.ts", import.meta.url), {
      type: "module",
    });
    const api = wrap<UpscaleApi>(worker);
    workerRef.current = api;
    void api.ready().then((ok) => setGpu(ok ? "yes" : "no"));
    const owned = urls.current;
    return () => {
      worker.terminate();
      for (const url of owned) URL.revokeObjectURL(url);
    };
  }, []);

  const track = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  };

  const acceptFile = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("เลือกไฟล์ JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 25 MB");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      const top = maxScale(width, height);
      if (!top) {
        bitmap.close();
        setError("รูปใหญ่เกิน 3840 × 2160 แล้ว ขยายอีกจะเกิน 8K");
        return;
      }
      setError("");
      setResult(null);
      setScale(top as Scale);
      setSource((old) => {
        old?.preview.close();
        return { file, preview: bitmap, width, height };
      });
    } catch {
      setError("เปิดรูปนี้ไม่ได้ ลองไฟล์อื่น");
    }
  };

  const upscale = async () => {
    const api = workerRef.current;
    if (!source || !api) return;
    setError("");
    setResult(null);
    setProgress(0);
    try {
      const bitmap = await createImageBitmap(source.file);
      const out = await api.upscale(
        transfer({ bitmap, scale }, [bitmap]),
        proxy((done: number, total: number) => setProgress(done / total)),
      );
      setResult({ ...out, url: track(out.blob) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ขยายรูปไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      setProgress(null);
    }
  };

  const download = () => {
    if (!source || !result) return;
    const link = document.createElement("a");
    link.href = result.url;
    const extension = result.blob.type === "image/png" ? "png" : "jpg";
    link.download = `${source.file.name.replace(/\.[^.]+$/, "")}-x${scale}.${extension}`;
    link.click();
  };

  const reset = () => {
    setSource((old) => {
      old?.preview.close();
      return null;
    });
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = progress !== null;
  const top = source ? maxScale(source.width, source.height) : 4;

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
              <Sparkles size={24} />
            </span>
            <div>
              <p className="m-0 text-sm font-semibold text-primary-container">เครื่องมือรูปภาพ</p>
              <h1 className="mb-1 mt-1 text-2xl font-semibold sm:text-3xl">ขยายรูปด้วย AI</h1>
              <p className="m-0 max-w-2xl text-sm leading-7 text-on-surface-variant">
                ขยายรูป 2 ถึง 4 เท่าให้คมชัดขึ้น สูงสุด 8K โมเดล AI ทำงานบนการ์ดจอของเครื่องนี้
                รูปไม่ถูกส่งไปที่ไหน
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm text-success">
            <ShieldCheck size={15} />
            ประมวลผลบนอุปกรณ์นี้
          </span>
        </header>

        {gpu === "no" && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            เบราว์เซอร์หรือการ์ดจอนี้ยังไม่รองรับ WebGPU ลองใช้ Chrome หรือ Edge รุ่นล่าสุด หรือใช้{" "}
            <Link to="/tools/image-resizer" className="font-semibold underline">
              ปรับขนาดรูปภาพ
            </Link>{" "}
            แบบธรรมดาแทน
          </p>
        )}

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-surface-variant bg-card p-5 shadow-sm sm:p-7">
            {!source ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  setDragging(false);
                  void acceptFile(event.dataTransfer.files[0]);
                }}
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
                  JPG, PNG หรือ WebP · ไม่เกิน 25 MB · ไม่เกิน 3840 × 2160
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
                      <p className="m-0 truncate text-sm font-medium">{source.file.name}</p>
                      <p className="m-0 text-sm text-on-surface-variant">
                        {source.width} × {source.height} px · {prettyBytes(source.file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={busy}
                    aria-label="นำรูปออก"
                    className="grid size-9 place-items-center rounded-lg text-on-surface-variant hover:bg-surface hover:text-on-error-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:opacity-50"
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
                      <canvas
                        key={`${source.file.name}:${source.file.lastModified}`}
                        ref={drawPreview(source.preview)}
                        role="img"
                        aria-label="ตัวอย่างรูปต้นฉบับ"
                        className="absolute inset-0 size-full object-contain p-3"
                      />
                    </div>
                  </figure>
                  <figure className="m-0 overflow-hidden rounded-xl border border-surface-variant bg-surface">
                    <figcaption className="border-b border-surface-variant px-3 py-2 text-sm font-medium">
                      รูปที่ขยายแล้ว
                    </figcaption>
                    <div className="relative grid h-56 place-items-center p-3">
                      {result ? (
                        <img
                          src={result.url}
                          alt="ตัวอย่างรูปหลังขยาย"
                          className="absolute inset-0 size-full object-contain p-3"
                        />
                      ) : busy ? (
                        <div className="w-full max-w-52 text-center text-sm text-on-surface-variant">
                          <div
                            role="progressbar"
                            aria-label="ความคืบหน้า"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(progress * 100)}
                            className="h-2 overflow-hidden rounded-full bg-surface-variant"
                          >
                            <div
                              className="h-full origin-left rounded-full bg-primary-container transition-transform"
                              style={{ transform: `scaleX(${progress})` }}
                            />
                          </div>
                          <p className="mb-0 mt-3">
                            {progress === 0 ? "กำลังโหลดโมเดล…" : `${Math.round(progress * 100)}%`}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-on-surface-variant">
                          เลือกขนาดแล้วกด
                          <br />
                          “ขยายรูป”
                        </div>
                      )}
                    </div>
                  </figure>
                </div>
                {result && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-success/10 px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-success">
                      <Check size={17} aria-hidden="true" /> {result.width} × {result.height} px ·{" "}
                      {prettyBytes(result.blob.size)}
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
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                void acceptFile(event.target.files?.[0])
              }
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
            <h2 className="m-0 text-base font-semibold">ขยายกี่เท่า</h2>
            <div role="radiogroup" aria-label="ขยายกี่เท่า" className="mt-4 grid grid-cols-3 gap-2">
              {SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={scale === s}
                  disabled={busy || s > top}
                  onClick={() => setScale(s)}
                  className={`min-h-11 rounded-lg border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:opacity-40 ${scale === s ? "border-primary-container bg-primary-container text-primary-foreground" : "border-surface-variant hover:bg-surface"}`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <p className="mb-0 mt-3 text-sm text-on-surface-variant">
              {source
                ? `ได้ ${source.width * scale} × ${source.height * scale} px`
                : "ผลลัพธ์ไม่เกิน 7680 × 4320 (8K)"}
            </p>
            <button
              type="button"
              onClick={() => void upscale()}
              disabled={!source || busy || gpu !== "yes"}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles size={16} aria-hidden="true" />
              )}
              {busy ? "กำลังขยาย…" : "ขยายรูป"}
            </button>
            <p className="mb-0 mt-4 text-xs leading-6 text-on-surface-variant">
              โมเดล Real-ESRGAN (realesr-general-x4v3, BSD-3-Clause) ขนาด 2.3 MB
              โหลดครั้งแรกครั้งเดียว รูปโปร่งใสได้ PNG รูปทั่วไปได้ JPG คุณภาพสูง
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
