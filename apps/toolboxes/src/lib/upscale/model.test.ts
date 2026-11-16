import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { forwardCpu, maxScale, PARAMS, parseWeights, tiles } from "./model";
import reference from "./reference.json";

const bin = readFileSync(join(import.meta.dirname, "realesr-general-x4v3.bin"));
const layers = parseWeights(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength));

describe("upscaler model", () => {
  it("reads every weight of SRVGGNetCompact", () => {
    expect(layers).toHaveLength(34);
    const count = layers.reduce((n, L) => n + L.w.length + L.b.length + (L.prelu?.length ?? 0), 0);
    expect(count).toBe(PARAMS);
    expect(layers.at(-1)?.cout).toBe(48);
    expect(layers.every((L) => L.w.every(Number.isFinite))).toBe(true);
  });

  it("refuses a truncated file", () => {
    expect(() => parseWeights(new ArrayBuffer(100))).toThrow();
  });

  it("keeps the result inside 8K", () => {
    expect(maxScale(256, 144)).toBe(4);
    expect(maxScale(1920, 1080)).toBe(4);
    expect(maxScale(2560, 1440)).toBe(3);
    expect(maxScale(1080, 1920)).toBe(4);
    expect(maxScale(3840, 2160)).toBe(2);
    expect(maxScale(3841, 100)).toBe(0);
  });

  it("covers the image with tiles exactly once", () => {
    const parts = tiles(600, 300, 256);
    expect(parts).toHaveLength(6);
    const area = parts.reduce((n, t) => n + (t.x1 - t.x0) * (t.y1 - t.y0), 0);
    expect(area).toBe(600 * 300);
  });

  it("matches the numpy reference forward pass (tools/upscale-reference.py)", () => {
    const { w, h, out: want } = reference;
    const input = new Float32Array(3 * w * h);
    for (let c = 0; c < 3; c += 1)
      for (let y = 0; y < h; y += 1)
        for (let x = 0; x < w; x += 1)
          input[(c * h + y) * w + x] = ((x * 7 + y * 13 + c * 5) % 11) / 10;
    const out = forwardCpu(layers, input, w, h);
    expect(out).toHaveLength(want.length);
    const worst = want.reduce((m, v, i) => Math.max(m, Math.abs(out[i] - v)), 0);
    expect(worst).toBeLessThan(1e-3);
  });

  // a wrong weight order or pixel-shuffle layout turns this into noise, not a smooth gradient
  it("upscales a smooth gradient into the same gradient, 4× larger", () => {
    const w = 12;
    const h = 10;
    const input = new Float32Array(3 * w * h);
    for (let y = 0; y < h; y += 1)
      for (let x = 0; x < w; x += 1) {
        input[y * w + x] = 0.2 + (0.6 * x) / w;
        input[w * h + y * w + x] = 0.3 + (0.4 * y) / h;
        input[2 * w * h + y * w + x] = 0.5;
      }
    const out = forwardCpu(layers, input, w, h);
    expect(out).toHaveLength(3 * 16 * w * h);
    let error = 0;
    for (let c = 0; c < 3; c += 1)
      for (let Y = 0; Y < h * 4; Y += 1)
        for (let X = 0; X < w * 4; X += 1) {
          const want = input[c * w * h + (Y >> 2) * w + (X >> 2)];
          error += Math.abs(out[(c * h * 4 + Y) * w * 4 + X] - want);
        }
    expect(error / out.length).toBeLessThan(0.03);
  });
});
