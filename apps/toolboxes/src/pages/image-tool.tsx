import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, ImagePlus, RotateCcw } from "lucide-react";

const titles: Record<string, { title: string; description: string }> = {
  "image-resizer": {
    title: "ปรับขนาดรูปภาพ",
    description: "กำหนดขนาดผลลัพธ์โดยประมวลผลภาพในเบราว์เซอร์",
  },
  "image-format-converter": {
    title: "แปลงไฟล์รูปภาพ",
    description: "แปลง JPG, PNG และ WebP โดยไม่อัปโหลดภาพ",
  },
  "image-cropper": {
    title: "ตัดภาพตามขอบเขต",
    description: "ระบุพิกัดบนภาพต้นฉบับเพื่อสร้างภาพส่วนที่เลือก",
  },
  "image-color-picker": {
    title: "ดูดค่าสีจากรูปภาพ",
    description: "คลิกตำแหน่งบนภาพเพื่ออ่านค่าสีในเบราว์เซอร์",
  },
};

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;

export default function ImageTool({ toolId }: { toolId: string }) {
  const details = titles[toolId];
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("toolboxes-image.png");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState("0.85");
  const [dimensions, setDimensions] = useState("");
  const [pickedColor, setPickedColor] = useState("");
  const [error, setError] = useState("");
  const isPicker = toolId === "image-color-picker";
  const isCropper = toolId === "image-cropper";

  // URL ของภาพตัวอย่างคำนวณจากไฟล์ตรง ๆ (ไม่ setState ใน effect) แล้วคืนหน่วยความจำเมื่อเปลี่ยนไฟล์
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    void createImageBitmap(file)
      .then((bitmap) => {
        if (!cancelled) {
          setDimensions(`ภาพต้นฉบับ ${bitmap.width} × ${bitmap.height} px`);
          if (toolId === "image-cropper") {
            setWidth(String(bitmap.width));
            setHeight(String(bitmap.height));
          }
        }
        bitmap.close();
      })
      .catch(() => {
        if (!cancelled) setError("อ่านข้อมูลรูปภาพไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
    };
  }, [file, toolId]);

  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  const resetResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    setPickedColor("");
    setError("");
  };

  const chooseFile = (candidate?: File) => {
    resetResult();
    if (!candidate) {
      setFile(null);
      setDimensions("");
      return;
    }
    if (!acceptedTypes.includes(candidate.type)) {
      setError("รองรับเฉพาะไฟล์ JPG, PNG และ WebP");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 20 MB");
      return;
    }
    setError("");
    setFile(candidate);
    setWidth("");
    setHeight("");
    setCropX("0");
    setCropY("0");
  };

  const loadBitmap = async () => {
    if (!file) throw new Error("กรุณาเลือกรูปภาพก่อน");
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > MAX_PIXELS) {
      bitmap.close();
      throw new Error("รูปภาพมีความละเอียดสูงเกินไป (สูงสุด 40 ล้านพิกเซล)");
    }
    return bitmap;
  };

  const processImage = async () => {
    setError("");
    resetResult();
    const sourceName = file?.name ?? "image";
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await loadBitmap();
      setDimensions(`ภาพต้นฉบับ ${bitmap.width} × ${bitmap.height} px`);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("เบราว์เซอร์ไม่สามารถประมวลผล canvas ได้");
      let outWidth = bitmap.width,
        outHeight = bitmap.height,
        sourceX = 0,
        sourceY = 0,
        sourceWidth = bitmap.width,
        sourceHeight = bitmap.height;
      if (toolId === "image-resizer") {
        const requestedWidth = Number(width),
          requestedHeight = Number(height);
        if (
          (!requestedWidth && !requestedHeight) ||
          [requestedWidth, requestedHeight].some((n) => n && (!Number.isInteger(n) || n < 1))
        )
          throw new Error("ใส่ความกว้างหรือความสูงเป็นจำนวนเต็มบวก");
        if (keepRatio) {
          const scale =
            requestedWidth && requestedHeight
              ? Math.min(requestedWidth / bitmap.width, requestedHeight / bitmap.height)
              : requestedWidth
                ? requestedWidth / bitmap.width
                : requestedHeight / bitmap.height;
          outWidth = Math.max(1, Math.round(bitmap.width * scale));
          outHeight = Math.max(1, Math.round(bitmap.height * scale));
        } else {
          outWidth = requestedWidth || bitmap.width;
          outHeight = requestedHeight || bitmap.height;
        }
      }
      if (isCropper) {
        sourceX = Number(cropX);
        sourceY = Number(cropY);
        outWidth = Number(width);
        outHeight = Number(height);
        if (
          ![sourceX, sourceY, outWidth, outHeight].every(Number.isInteger) ||
          sourceX < 0 ||
          sourceY < 0 ||
          outWidth < 1 ||
          outHeight < 1 ||
          sourceX + outWidth > bitmap.width ||
          sourceY + outHeight > bitmap.height
        )
          throw new Error(`ขอบเขตต้องอยู่ในภาพ ${bitmap.width} × ${bitmap.height} px`);
        sourceWidth = outWidth;
        sourceHeight = outHeight;
      }
      if (outWidth * outHeight > MAX_PIXELS) throw new Error("ภาพผลลัพธ์มีความละเอียดสูงเกินไป");
      canvas.width = outWidth;
      canvas.height = outHeight;
      if (format === "image/jpeg") {
        context.fillStyle =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--color-surface-container")
            .trim() || "white";
        context.fillRect(0, 0, outWidth, outHeight);
      }
      context.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outWidth,
        outHeight,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, Number(quality)),
      );
      if (!blob) throw new Error("สร้างไฟล์ภาพไม่สำเร็จ");
      const extension = format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
      setResultName(
        `${sourceName.replace(/\.[^.]+$/u, "")}-${isCropper ? "crop" : toolId === "image-resizer" ? "resized" : "converted"}.${extension}`,
      );
      setResultUrl(URL.createObjectURL(blob));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ประมวลผลภาพไม่สำเร็จ");
    } finally {
      bitmap?.close();
    }
  };

  const pickColor = async (event: React.MouseEvent<HTMLImageElement>) => {
    try {
      const img = event.currentTarget;
      const rect = img.getBoundingClientRect();
      const x = Math.min(
        img.naturalWidth - 1,
        Math.max(0, Math.floor(((event.clientX - rect.left) * img.naturalWidth) / rect.width)),
      );
      const y = Math.min(
        img.naturalHeight - 1,
        Math.max(0, Math.floor(((event.clientY - rect.top) * img.naturalHeight) / rect.height)),
      );
      const bitmap = await loadBitmap();
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("ไม่สามารถอ่านพิกเซลได้");
      context.drawImage(bitmap, 0, 0);
      const [r, g, b, a] = context.getImageData(x, y, 1, 1).data;
      bitmap.close();
      const hex = `#${[r, g, b]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()}`;
      setPickedColor(`${hex} · rgb(${r}, ${g}, ${b}) · alpha ${a}`);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "อ่านค่าสีไม่สำเร็จ");
    }
  };

  if (!details) return null;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-on-surface-variant hover:bg-surface-variant"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          กลับไปหน้ารวมเครื่องมือ
        </Link>
        <header className="mt-4 rounded-lg border border-surface-variant bg-surface-container p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-primary-container">
              <ImagePlus size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-primary-container">เครื่องมือรูปภาพ</p>
              <h1 className="text-2xl font-bold">{details.title}</h1>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {details.description}
              </p>
            </div>
          </div>
        </header>
        <section className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6">
          <label htmlFor="image-file" className="mb-2 block text-sm font-medium">
            เลือกรูปภาพ (JPG, PNG หรือ WebP · ไม่เกิน 20 MB)
          </label>
          <input
            id="image-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => chooseFile(event.target.files?.[0])}
            className="block min-h-11 w-full rounded-md border border-surface-variant bg-surface-container p-2 text-sm"
          />
          {file && (
            <p className="mt-2 text-sm text-on-surface-variant">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          {file && (toolId === "image-resizer" || isCropper) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {isCropper && (
                <>
                  <NumberField label="เริ่ม X" value={cropX} setValue={setCropX} />
                  <NumberField label="เริ่ม Y" value={cropY} setValue={setCropY} />
                </>
              )}
              <NumberField
                label={isCropper ? "ความกว้างพื้นที่ตัด (px)" : "ความกว้างผลลัพธ์ (px)"}
                value={width}
                setValue={setWidth}
              />
              <NumberField
                label={isCropper ? "ความสูงพื้นที่ตัด (px)" : "ความสูงผลลัพธ์ (px)"}
                value={height}
                setValue={setHeight}
              />
              {!isCropper && (
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={keepRatio}
                    onChange={(event) => setKeepRatio(event.target.checked)}
                  />
                  รักษาสัดส่วนภาพ (ถ้าใส่ทั้งสองค่า จะพอดีในกรอบ)
                </label>
              )}
            </div>
          )}
          {file && !isPicker && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                รูปแบบผลลัพธ์
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-md border border-surface-variant bg-surface-container px-3"
                >
                  <option value="image/webp">WebP</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/png">PNG</option>
                </select>
              </label>
              {format !== "image/png" && (
                <label className="block text-sm font-medium">
                  คุณภาพ: {Math.round(Number(quality) * 100)}%
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(event) => setQuality(event.target.value)}
                    className="mt-2 block w-full"
                  />
                </label>
              )}
            </div>
          )}
          {file && dimensions && (
            <p className="mt-3 text-sm text-on-surface-variant">{dimensions}</p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-md border border-error p-3 text-sm text-error">
              {error}
            </p>
          )}
          {file && !isPicker && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void processImage()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-container px-4 font-semibold text-primary-foreground hover:opacity-90"
              >
                ประมวลผลภาพ
              </button>
              <button
                type="button"
                onClick={() => {
                  chooseFile();
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-surface-variant px-4 text-sm hover:bg-surface-variant"
              >
                <RotateCcw size={16} aria-hidden="true" />
                ล้างรูป
              </button>
            </div>
          )}
          {file && isPicker && (
            <p className="mt-4 text-sm text-on-surface-variant">
              คลิกบนรูปเพื่ออ่านสีที่ตำแหน่งนั้น
            </p>
          )}
        </section>
        {previewUrl && (
          <section className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              {isPicker ? "คลิกภาพเพื่อเลือกสี" : "ภาพต้นฉบับ"}
            </h2>
            <img
              src={previewUrl}
              alt="ภาพต้นฉบับที่เลือก"
              onClick={isPicker ? (event) => void pickColor(event) : undefined}
              className={`mt-3 max-h-[32rem] max-w-full rounded-md border border-surface-variant object-contain ${isPicker ? "cursor-crosshair" : ""}`}
            />
            {pickedColor && (
              <p className="mt-3 rounded-md border border-surface-variant p-3 font-mono text-sm">
                {pickedColor}
              </p>
            )}
          </section>
        )}
        {resultUrl && (
          <section className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6">
            <h2 className="text-lg font-semibold">ภาพผลลัพธ์</h2>
            <img
              src={resultUrl}
              alt="ภาพผลลัพธ์"
              className="mt-3 max-h-[32rem] max-w-full rounded-md border border-surface-variant object-contain"
            />
            <a
              href={resultUrl}
              download={resultName}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-container px-4 font-semibold text-primary-foreground"
            >
              <Download size={17} aria-hidden="true" />
              ดาวน์โหลด {resultName}
            </a>
          </section>
        )}
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-surface-variant bg-surface-container px-3 font-mono"
      />
    </label>
  );
}
