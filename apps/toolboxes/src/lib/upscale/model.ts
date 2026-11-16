/// Real-ESRGAN realesr-general-x4v3 (SRVGGNetCompact, BSD-3-Clause, Xintao Wang):
/// conv 3→64 + PReLU, 32 × (conv 64→64 + PReLU), conv 64→48, pixel shuffle ×4,
/// plus the input upscaled by nearest neighbour. Weights: realesr-general-x4v3.bin, fp16 in
/// state_dict order (w, b, prelu per layer), converted from the official .pth release.

export const SCALE = 4;
export const PARAMS = 1_213_296;
/** 8K UHD: the longest side ≤ 7680 and the shortest ≤ 4320 */
export const MAX_LONG = 7680;
export const MAX_SHORT = 4320;

export type Layer = {
  cin: number;
  cout: number;
  /** [cout][cin][3][3] */
  w: Float32Array;
  b: Float32Array;
  /** per-channel PReLU slope; the last layer has none */
  prelu?: Float32Array;
};

function half(bits: number) {
  const exp = (bits >> 10) & 0x1f;
  const frac = bits & 0x3ff;
  const sign = bits & 0x8000 ? -1 : 1;
  if (exp === 0) return sign * frac * 2 ** -24;
  if (exp === 31) return frac ? Number.NaN : sign * Infinity;
  return sign * (1 + frac / 1024) * 2 ** (exp - 15);
}

export function parseWeights(buffer: ArrayBuffer): Layer[] {
  const raw = new Uint16Array(buffer);
  if (raw.length !== PARAMS) throw new Error("ไฟล์โมเดลไม่ครบ ลองโหลดหน้าใหม่");
  const all = Float32Array.from(raw, half);
  const shapes = [[3, 64], ...Array.from({ length: 32 }, () => [64, 64]), [64, 48]];
  let at = 0;
  const take = (n: number) => all.subarray(at, (at += n));
  return shapes.map(([cin, cout], i) => ({
    cin,
    cout,
    w: take(cout * cin * 9),
    b: take(cout),
    prelu: i < shapes.length - 1 ? take(cout) : undefined,
  }));
}

/** Largest integer scale (2–4) that keeps the result inside 8K, or 0 when even 2× is too big. */
export function maxScale(width: number, height: number) {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  for (let s = SCALE; s >= 2; s -= 1) if (long * s <= MAX_LONG && short * s <= MAX_SHORT) return s;
  return 0;
}

export type Tile = { x0: number; y0: number; x1: number; y1: number };

/** Split an image into tiles; each is run with `pad` real pixels around it and only its core kept. */
export function tiles(width: number, height: number, size: number): Tile[] {
  const out: Tile[] = [];
  for (let y0 = 0; y0 < height; y0 += size)
    for (let x0 = 0; x0 < width; x0 += size)
      out.push({ x0, y0, x1: Math.min(width, x0 + size), y1: Math.min(height, y0 + size) });
  return out;
}

/**
 * Reference forward pass on the CPU (planar RGB in 0–1, `w × h`), returns planar RGB at 4×.
 * Slow: only the yardstick the tests and the GPU path are checked against.
 */
export function forwardCpu(layers: Layer[], input: Float32Array, w: number, h: number) {
  const n = w * h;
  let x = input;
  for (const L of layers) {
    const y = new Float32Array(L.cout * n);
    for (let o = 0; o < L.cout; o += 1) {
      const plane = y.subarray(o * n, (o + 1) * n);
      plane.fill(L.b[o]);
      for (let i = 0; i < L.cin; i += 1) {
        const src = x.subarray(i * n, (i + 1) * n);
        for (let k = 0; k < 9; k += 1) {
          const weight = L.w[(o * L.cin + i) * 9 + k];
          const dy = Math.floor(k / 3) - 1;
          const dx = (k % 3) - 1;
          for (let py = Math.max(0, -dy); py < Math.min(h, h - dy); py += 1) {
            const row = py * w;
            const srow = (py + dy) * w + dx;
            for (let px = Math.max(0, -dx); px < Math.min(w, w - dx); px += 1)
              plane[row + px] += weight * src[srow + px];
          }
        }
      }
      if (L.prelu) {
        const a = L.prelu[o];
        for (let p = 0; p < n; p += 1) if (plane[p] < 0) plane[p] *= a;
      }
    }
    x = y;
  }
  const W = w * SCALE;
  const H = h * SCALE;
  const out = new Float32Array(3 * W * H);
  for (let c = 0; c < 3; c += 1)
    for (let Y = 0; Y < H; Y += 1)
      for (let X = 0; X < W; X += 1) {
        const lr = (Y >> 2) * w + (X >> 2);
        const sub = c * 16 + (Y % 4) * 4 + (X % 4);
        out[(c * H + Y) * W + X] = x[sub * n + lr] + input[c * n + lr];
      }
  return out;
}
