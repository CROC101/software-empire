import type { Layer, Tile } from "./model";

/** Tile core in input pixels; each tile also reads PAD real pixels around it (receptive field). */
export const TILE = 256;
export const PAD = 16;

// WebGPU flag values from the spec; TS's lib.dom has the GPU interfaces but not these globals
const GPUBufferUsage = {
  MAP_READ: 1,
  COPY_SRC: 4,
  COPY_DST: 8,
  UNIFORM: 64,
  STORAGE: 128,
} as const;
const GPUMapMode = { READ: 1 } as const;

// one invocation = one pixel, all output channels; features are vec4 packs of 4 channels
const CONV = /* wgsl */ `
override CIN4: u32;
override COUT: u32;
override PRELU: bool;
struct Dims { w: u32, h: u32 }
@group(0) @binding(0) var<uniform> d: Dims;
@group(0) @binding(1) var<storage, read> src: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> dst: array<vec4f>;
@group(0) @binding(3) var<storage, read> wt: array<vec4f>;
@group(0) @binding(4) var<storage, read> bp: array<vec4f>;
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) g: vec3u) {
  if (g.x >= d.w || g.y >= d.h) { return; }
  var acc: array<f32, 64>;
  for (var k = 0u; k < 9u; k++) {
    let sx = i32(g.x) + i32(k % 3u) - 1;
    let sy = i32(g.y) + i32(k / 3u) - 1;
    if (sx < 0 || sy < 0 || sx >= i32(d.w) || sy >= i32(d.h)) { continue; }
    let base = (u32(sy) * d.w + u32(sx)) * CIN4;
    for (var i = 0u; i < CIN4; i++) {
      let v = src[base + i];
      for (var o = 0u; o < COUT; o++) { acc[o] += dot(wt[(o * 9u + k) * CIN4 + i], v); }
    }
  }
  let out = (g.y * d.w + g.x) * (COUT / 4u);
  for (var q = 0u; q < COUT / 4u; q++) {
    var v = vec4f(acc[q * 4u], acc[q * 4u + 1u], acc[q * 4u + 2u], acc[q * 4u + 3u]) + bp[q];
    if (PRELU) { v = select(v * bp[COUT / 4u + q], v, v > vec4f(0.0)); }
    dst[out + q] = v;
  }
}`;

// pixel shuffle ×4 + nearest input, sampled n×n per output pixel so 2× and 3× are area averages
const SHUFFLE = /* wgsl */ `
struct P { tw: u32, padL: u32, padT: u32, rw: u32, rh: u32, n: u32, scale: f32 }
@group(0) @binding(0) var<uniform> p: P;
@group(0) @binding(1) var<storage, read> feat: array<vec4f>;
@group(0) @binding(2) var<storage, read> img: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> out: array<u32>;
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) g: vec3u) {
  if (g.x >= p.rw || g.y >= p.rh) { return; }
  let span = 4.0 / p.scale;
  let step = span / f32(p.n);
  var sum = vec3f(0.0);
  for (var j = 0u; j < p.n; j++) {
    for (var i = 0u; i < p.n; i++) {
      let u = u32(f32(g.x) * span + (f32(i) + 0.5) * step);
      let v = u32(f32(g.y) * span + (f32(j) + 0.5) * step);
      let px = (v / 4u + p.padT) * p.tw + u / 4u + p.padL;
      let sub = (v % 4u) * 4u + u % 4u;
      let f = px * 12u + sub / 4u;
      sum += vec3f(feat[f][sub % 4u], feat[f + 4u][sub % 4u], feat[f + 8u][sub % 4u]) + img[px].rgb;
    }
  }
  let c = clamp(sum / f32(p.n * p.n), vec3f(0.0), vec3f(1.0));
  out[g.y * p.rw + g.x] = pack4x8unorm(vec4f(c, 1.0));
}`;

function pack(L: Layer) {
  const cin4 = Math.ceil(L.cin / 4);
  const wt = new Float32Array(L.cout * 9 * cin4 * 4);
  for (let o = 0; o < L.cout; o += 1)
    for (let i = 0; i < L.cin; i += 1)
      for (let k = 0; k < 9; k += 1)
        wt[((o * 9 + k) * cin4 + (i >> 2)) * 4 + (i & 3)] = L.w[(o * L.cin + i) * 9 + k];
  const bp = new Float32Array(L.cout * 2);
  bp.set(L.b);
  if (L.prelu) bp.set(L.prelu, L.cout);
  return { cin4, wt, bp };
}

export type Gpu = {
  /** RGBA8 of the tile core at `scale`, from the tile's RGBA8 source with PAD context */
  run: (tile: Tile, source: ImageData, scale: number) => Promise<ImageData>;
  destroy: () => void;
};

export async function createGpu(layers: Layer[]): Promise<Gpu | null> {
  const adapter = await navigator.gpu?.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) return null;
  const device = await adapter.requestDevice();
  const S = GPUBufferUsage.STORAGE;
  const buffer = (size: number, usage: number) => device.createBuffer({ size, usage });
  const upload = (data: Float32Array) => {
    const b = buffer(data.byteLength, S | GPUBufferUsage.COPY_DST);
    device.queue.writeBuffer(b, 0, data);
    return b;
  };

  const side = TILE + 2 * PAD;
  const input = buffer(side * side * 16, S | GPUBufferUsage.COPY_DST);
  const ping = buffer(side * side * 256, S);
  const pong = buffer(side * side * 256, S);
  const dims = buffer(16, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
  const params = buffer(32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
  const outSize = TILE * TILE * 16 * 4;
  const output = buffer(outSize, S | GPUBufferUsage.COPY_SRC);
  const readback = buffer(outSize, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST);

  const convModule = device.createShaderModule({ code: CONV });
  const pipelines = new Map<string, GPUComputePipeline>();
  const convPipeline = (cin4: number, cout: number, prelu: boolean) => {
    const key = `${cin4}/${cout}/${prelu}`;
    let pipeline = pipelines.get(key);
    if (!pipeline) {
      pipeline = device.createComputePipeline({
        layout: "auto",
        compute: {
          module: convModule,
          constants: { CIN4: cin4, COUT: cout, PRELU: prelu ? 1 : 0 },
        },
      });
      pipelines.set(key, pipeline);
    }
    return pipeline;
  };

  const owned: GPUBuffer[] = [input, ping, pong, dims, params, output, readback];
  const steps = layers.map((L, i) => {
    const { cin4, wt, bp } = pack(L);
    const weights = upload(wt);
    const biases = upload(bp);
    owned.push(weights, biases);
    const pipeline = convPipeline(cin4, L.cout, Boolean(L.prelu));
    const src = i === 0 ? input : i % 2 ? ping : pong;
    const dst = i % 2 ? pong : ping;
    const group = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [dims, src, dst, weights, biases].map((b, binding) => ({
        binding,
        resource: { buffer: b },
      })),
    });
    return { pipeline, group };
  });
  // layer i writes ping when i is even, pong when odd; the last layer's output feeds the shuffle
  const features = layers.length % 2 ? ping : pong;
  const shuffle = device.createComputePipeline({
    layout: "auto",
    compute: { module: device.createShaderModule({ code: SHUFFLE }) },
  });
  const shuffleGroup = device.createBindGroup({
    layout: shuffle.getBindGroupLayout(0),
    entries: [params, features, input, output].map((b, binding) => ({
      binding,
      resource: { buffer: b },
    })),
  });

  const run: Gpu["run"] = async (tile, source, scale) => {
    // tile plus PAD real pixels around it, clipped to the image (outside = zero, as in PyTorch)
    const bx0 = Math.max(0, tile.x0 - PAD);
    const by0 = Math.max(0, tile.y0 - PAD);
    const tw = Math.min(source.width, tile.x1 + PAD) - bx0;
    const th = Math.min(source.height, tile.y1 + PAD) - by0;
    const rgb = new Float32Array(tw * th * 4);
    for (let y = 0; y < th; y += 1)
      for (let x = 0; x < tw; x += 1) {
        const s = ((by0 + y) * source.width + bx0 + x) * 4;
        const t = (y * tw + x) * 4;
        rgb[t] = source.data[s] / 255;
        rgb[t + 1] = source.data[s + 1] / 255;
        rgb[t + 2] = source.data[s + 2] / 255;
      }
    device.queue.writeBuffer(input, 0, rgb);
    device.queue.writeBuffer(dims, 0, new Uint32Array([tw, th]));
    const rw = (tile.x1 - tile.x0) * scale;
    const rh = (tile.y1 - tile.y0) * scale;
    const p = new ArrayBuffer(32);
    new Uint32Array(p, 0, 6).set([tw, tile.x0 - bx0, tile.y0 - by0, rw, rh, scale === 4 ? 1 : 4]);
    new Float32Array(p, 24, 1)[0] = scale;
    device.queue.writeBuffer(params, 0, p);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    for (const step of steps) {
      pass.setPipeline(step.pipeline);
      pass.setBindGroup(0, step.group);
      pass.dispatchWorkgroups(Math.ceil(tw / 8), Math.ceil(th / 8));
    }
    pass.setPipeline(shuffle);
    pass.setBindGroup(0, shuffleGroup);
    pass.dispatchWorkgroups(Math.ceil(rw / 8), Math.ceil(rh / 8));
    pass.end();
    const bytes = rw * rh * 4;
    encoder.copyBufferToBuffer(output, 0, readback, 0, bytes);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ, 0, bytes);
    const pixels = new Uint8ClampedArray(readback.getMappedRange(0, bytes).slice(0));
    readback.unmap();
    return new ImageData(pixels, rw, rh);
  };

  return {
    run,
    destroy: () => {
      for (const b of owned) b.destroy();
      device.destroy();
    },
  };
}
