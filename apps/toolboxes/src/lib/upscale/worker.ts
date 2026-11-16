import { expose, validated } from "@empire/core/worker";
import { z } from "zod";
import { createGpu, TILE, type Gpu } from "./gpu";
import { maxScale, parseWeights, tiles } from "./model";
import weightsUrl from "./realesr-general-x4v3.bin?url";

/// AI upscaler worker: the image never leaves the device, the model comes from our own /assets.

const input = z.object({
  bitmap: z.instanceof(ImageBitmap),
  scale: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});

let gpu: Promise<Gpu | null> | undefined;

const load = () =>
  (gpu ??= fetch(weightsUrl)
    .then((r) => {
      if (!r.ok) throw new Error("โหลดโมเดลไม่สำเร็จ ลองใหม่อีกครั้ง");
      return r.arrayBuffer();
    })
    .then((buffer) => createGpu(parseWeights(buffer)))
    .catch((error: unknown) => {
      gpu = undefined;
      throw error;
    }));

async function upscale(
  { bitmap, scale }: z.output<typeof input>,
  onProgress: (done: number, total: number) => void,
) {
  const { width, height } = bitmap;
  if (scale > maxScale(width, height)) throw new Error("ขยายแล้วจะเกิน 8K เลือกขนาดเล็กลง");
  const engine = await load();
  if (!engine) throw new Error("เบราว์เซอร์หรือการ์ดจอนี้ไม่รองรับ WebGPU");

  const src = new OffscreenCanvas(width, height).getContext("2d", { willReadFrequently: true });
  if (!src) throw new Error("เปิดรูปไม่สำเร็จ");
  src.drawImage(bitmap, 0, 0);
  const source = src.getImageData(0, 0, width, height);

  // the model only sees RGB; transparency is scaled the classic way and put back per tile
  let alpha: OffscreenCanvasRenderingContext2D | null = null;
  if (source.data.some((v, i) => i % 4 === 3 && v < 255)) {
    alpha = new OffscreenCanvas(width * scale, height * scale).getContext("2d", {
      willReadFrequently: true,
    });
    if (alpha) {
      alpha.imageSmoothingQuality = "high";
      alpha.drawImage(bitmap, 0, 0, width * scale, height * scale);
    }
  }
  bitmap.close();

  const out = new OffscreenCanvas(width * scale, height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("สร้างรูปผลลัพธ์ไม่สำเร็จ");
  const parts = tiles(width, height, TILE);
  for (const [i, tile] of parts.entries()) {
    const image = await engine.run(tile, source, scale);
    const x = tile.x0 * scale;
    const y = tile.y0 * scale;
    if (alpha) {
      const a = alpha.getImageData(x, y, image.width, image.height).data;
      for (let p = 3; p < a.length; p += 4) image.data[p] = a[p];
    }
    ctx.putImageData(image, x, y);
    onProgress(i + 1, parts.length);
  }
  const blob = await out.convertToBlob(
    alpha ? { type: "image/png" } : { type: "image/jpeg", quality: 0.95 },
  );
  return { blob, width: out.width, height: out.height };
}

const api = {
  /** true when WebGPU is usable here; also warms up the model */
  ready: () =>
    load().then(
      (engine) => engine !== null,
      () => false,
    ),
  upscale: (raw: unknown, onProgress: (done: number, total: number) => void) =>
    validated(input, (parsed) => upscale(parsed, onProgress))(raw),
};

export type UpscaleApi = typeof api;

expose(api);
