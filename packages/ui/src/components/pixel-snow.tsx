"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { whenNear } from "../lib/when-near";

/**
 * Pixel snow: crystals, squares or round flakes on a pixel grid, in five sizes that fall at
 * different depths, sway and drift on the wind, sparkle, glow (a small bloom pass) and, if asked,
 * pile up in soft drifts along the bottom. The pointer brushes the snow aside.
 *
 * After React Bits' PixelSnow (MIT): same shaders, sprites, simulation and props. Changed for a
 * full-page winter background: the WebGL set-up waits until the canvas is near the viewport, the
 * canvas renders at most 1.5x, the loop stops off screen or in a hidden tab, the canvas never takes
 * pointer events (listeners are passive, on window), `paused` freezes it, reduced motion shows one
 * still frame. Styles are inline (no stylesheet).
 */

const SPRITES: Record<Variant, string[][]> = {
  square: [
    ["@"],
    ["oo", "oo"],
    ["xox", "o@o", "xox"],
    ["xoox", "o@@o", "o@@o", "xoox"],
    ["xooox", "oo@oo", "o@@@o", "oo@oo", "xooox"],
    ["xox", "o@o", "xox"],
    ["xoox", "o@@o", "o@@o", "xoox"],
    ["xooox", "oo@oo", "o@@@o", "oo@oo", "xooox"],
  ],
  round: [
    ["@"],
    [".x.", "x@x", ".x."],
    [".xx.", "x@@x", "x@@x", ".xx."],
    [".xxx.", "xo@ox", "x@@@x", "xo@ox", ".xxx."],
    ["..xxx..", ".xooox.", "xoo@oox", "xo@@@ox", "xoo@oox", ".xooox.", "..xxx.."],
    [".xx.", "x@@x", "x@@x", ".xx."],
    [".xxx.", "xo@ox", "x@@@x", "xo@ox", ".xxx."],
    ["..xxx..", ".xooox.", "xoo@oox", "xo@@@ox", "xoo@oox", ".xooox.", "..xxx.."],
  ],
  snowflake: [
    ["@"],
    [".x.", "x@x", ".x."],
    ["..x..", "x.o.x", ".o@o.", "x.o.x", "..x.."],
    ["...x...", ".x.o.x.", "..ooo..", "xoo@oox", "..ooo..", ".x.o.x.", "...x..."],
    [
      "....x....",
      ".x..o..x.",
      "..o.o.o..",
      "...ooo...",
      "xooo@ooox",
      "...ooo...",
      "..o.o.o..",
      ".x..o..x.",
      "....x....",
    ],
    ["x...x", ".o.o.", "..@..", ".o.o.", "x...x"],
    ["x..x..x", ".o.o.o.", "..ooo..", "xoo@oox", "..ooo..", ".o.o.o.", "x..x..x"],
    [
      "x...x...x",
      ".o..o..o.",
      "..o.o.o..",
      "...ooo...",
      "xooo@ooox",
      "...ooo...",
      "..o.o.o..",
      ".o..o..o.",
      "x...x...x",
    ],
  ],
};

type Variant = "square" | "round" | "snowflake";
const VARIANTS: Variant[] = ["square", "round", "snowflake"];
const CELL = 9;
const LEVELS = 5;
const SLOTS = 8;
const MAX_FLAKES = 4000;
const LEVEL_WEIGHTS = [0.46, 0.27, 0.15, 0.08, 0.04];
const LEVEL_FALL = [16, 24, 34, 48, 66];
const LEVEL_LIGHT = [0.42, 0.58, 0.76, 0.92, 1];
const INTRO_SECONDS = 1.4;

const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FLAKE_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aFlake;
uniform vec2 uGrid;
uniform vec4 uSizes;
uniform float uLargest;
flat out ivec2 vOrigin;
flat out ivec2 vCell;
flat out int vSize;
flat out float vLight;
void main() {
  int index = int(aFlake.z + 0.5);
  int slot = index % ${String(SLOTS)};
  int variant = index / ${String(SLOTS)};
  int level = slot < ${String(LEVELS)} ? slot : slot - 3;
  float size = level == 0 ? 1.0 : (level == 1 ? uSizes.x : (level == 2 ? uSizes.y : (level == 3 ? uSizes.z : uLargest)));
  vec2 origin = floor(aFlake.xy) - floor(size * 0.5);
  origin.y = uGrid.y - origin.y - size;
  vec2 corner = origin + (aCorner * 0.5 + 0.5) * size;
  gl_Position = vec4(corner / uGrid * 2.0 - 1.0, 0.0, 1.0);
  vOrigin = ivec2(origin);
  vCell = ivec2(slot * ${String(CELL)}, variant * ${String(CELL)});
  vSize = int(size);
  vLight = aFlake.w;
}`;

const FLAKE_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uAtlas;
flat in ivec2 vOrigin;
flat in ivec2 vCell;
flat in int vSize;
flat in float vLight;
out vec4 outColor;
void main() {
  ivec2 local = ivec2(gl_FragCoord.xy) - vOrigin;
  if (local.x < 0 || local.y < 0 || local.x >= vSize || local.y >= vSize) discard;
  vec4 texel = texelFetch(uAtlas, vCell + local, 0);
  if (texel.r < 0.5) discard;
  outColor = vec4(vLight, texel.g * vLight, 0.0, 1.0);
}`;

const PILE = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uPile;
uniform float uTime;
uniform float uLight;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  float height = texelFetch(uPile, ivec2(cell.x, 0), 0).r;
  float row = float(cell.y);
  if (row >= floor(height + 0.5)) discard;
  float below = floor(height + 0.5) - row;
  float crest = below <= 1.0 ? 1.0 : 0.0;
  ivec2 bayerCell = cell & 3;
  int bayerIndex = bayerCell.x + bayerCell.y * 4;
  float bayer[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  float threshold = (bayer[bayerIndex] + 0.5) / 16.0;
  float shade = clamp((below - 1.0) / 9.0, 0.0, 1.0) * 3.0;
  float step3 = floor(shade) + step(threshold, fract(shade));
  float body = 0.94 - step3 * 0.13;
  float glint = below <= 3.0 ? step(0.992, hash(vec2(cell) + floor(uTime * 1.1 + hash(vec2(cell.yx)) * 9.0))) : 0.0;
  float core = crest * 0.6 + glint;
  outColor = vec4(body, core, 0.0, 1.0) * uLight;
}`;

const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 sum = texture(uSource, uv) * 4.0;
  sum += texture(uSource, uv - uTexel);
  sum += texture(uSource, uv + uTexel);
  sum += texture(uSource, uv + vec2(uTexel.x, -uTexel.y));
  sum += texture(uSource, uv - vec2(uTexel.x, -uTexel.y));
  outColor = sum / 8.0;
}`;

const UP = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec2 h = uTexel * 0.5;
  vec4 sum = texture(uSource, uv + vec2(-h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(0.0, -h.y * 2.0));
  sum += texture(uSource, uv + vec2(0.0, h.y * 2.0));
  sum += texture(uSource, uv + vec2(-h.x, h.y)) * 2.0;
  sum += texture(uSource, uv + h) * 2.0;
  sum += texture(uSource, uv + vec2(h.x, -h.y)) * 2.0;
  sum += texture(uSource, uv - h) * 2.0;
  outColor = (sum / 12.0 + texture(uBase, uv)) * 0.5;
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uSnow;
uniform sampler2D uGlowMap;
uniform vec2 uResolution;
uniform vec2 uGrid;
uniform float uPixel;
uniform vec3 uColor;
uniform float uBrightness;
uniform float uGlow;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  ivec2 cell = ivec2(floor(gl_FragCoord.xy / uPixel));
  vec4 snow = texelFetch(uSnow, clamp(cell, ivec2(0), ivec2(uGrid) - 1), 0);
  vec2 glow = texture(uGlowMap, gl_FragCoord.xy / (uGrid * uPixel)).rg;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float body = clamp(snow.r * uBrightness, 0.0, 1.0);
  float core = clamp(snow.g * uBrightness, 0.0, 1.0);
  float halo = clamp(glow.r * uGlow * uBrightness, 0.0, 1.0);
  if (uLightMode > 0.5) {
    vec3 tint = mix(uColor, vec3(1.0), clamp(core / max(body, 0.001), 0.0, 1.0) * 0.45);
    float alpha = body * 0.95;
    vec4 color = vec4(tint * alpha, alpha);
    float soft = halo * 0.22 * (1.0 - alpha);
    color += vec4(uColor * soft, soft);
    outColor = color * mask;
  } else {
    vec3 color = uColor * (body * 0.82 + core * 0.18) + uColor * halo * 0.55;
    color = 1.0 - exp(-color * 1.6);
    color *= mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: string[],
) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) => {
    gl.bindAttribLocation(program, index, name);
  });
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Program["uniforms"] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/** The sprite atlas: one 9×9 cell per (variant, slot); r = ink, g = brightness (@ 1, o 0.5, x 0). */
function buildAtlas() {
  const width = CELL * SLOTS;
  const height = CELL * VARIANTS.length;
  const data = new Uint8Array(width * height * 4);
  VARIANTS.forEach((variant, row) => {
    SPRITES[variant].forEach((rows, level) => {
      rows.forEach((line, y) => {
        for (let x = 0; x < line.length; x++) {
          const mark = line[x];
          if (mark === ".") continue;
          const offset = ((row * CELL + y) * width + level * CELL + x) * 4;
          data[offset] = 255;
          data[offset + 1] = mark === "@" ? 255 : mark === "o" ? 128 : 0;
          data[offset + 3] = 255;
        }
      });
    });
  });
  return { data, width, height };
}

type Flake = {
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  rate: number;
  sparkle: number;
  drift: number;
  alt: boolean;
  reveal: number;
  levelSize: number;
};

type Target = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
};

export type PixelSnowProps = {
  color?: string;
  variant?: Variant;
  /** how much snow, 0–1 */
  density?: number;
  /** fall speed; negative rises */
  speed?: number;
  /** sideways drift; negative blows left */
  wind?: number;
  /** how much each flake swings */
  sway?: number;
  /** 0 mostly specks, 2 mostly large crystals */
  flakeSize?: number;
  /** one snow pixel, in px */
  pixelSize?: number;
  /** how much far flakes fall slower and dimmer, 0–1 */
  depth?: number;
  brightness?: number;
  glow?: number;
  /** how often flakes sparkle, 0–1 */
  twinkle?: number;
  /** let the snow pile up along the bottom edge */
  accumulate?: boolean;
  /** the pointer brushes the snow aside */
  mouseInteraction?: boolean;
  /** the snow drifts in from the top on mount */
  intro?: boolean;
  /** fade the edges into the page, 0–1 */
  fade?: number;
  opacity?: number;
  /** coloured pixels for a light page */
  lightMode?: boolean;
  paused?: boolean;
  /** pixel ratio cap (at most 1.5) */
  dpr?: number;
  className?: string;
  style?: CSSProperties;
};

export function PixelSnow({
  color = "#ffffff",
  variant = "snowflake",
  density = 0.5,
  speed = 1,
  wind = 0.25,
  sway = 0.5,
  flakeSize = 1,
  pixelSize = 3,
  depth = 0.6,
  brightness = 1,
  glow = 0.8,
  twinkle = 0.35,
  accumulate = false,
  mouseInteraction = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  className,
  style,
}: PixelSnowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settings = {
    color,
    variant: Math.max(0, VARIANTS.indexOf(variant)),
    density: clamp(density, 0, 1),
    speed,
    wind: clamp(wind, -2, 2),
    sway: Math.max(0, sway),
    flakeSize: clamp(flakeSize, 0, 2),
    pixelSize: Math.round(clamp(pixelSize, 1, 12)),
    depth: clamp(depth, 0, 1),
    brightness: Math.max(0, brightness),
    glow: Math.max(0, glow),
    twinkle: clamp(twinkle, 0, 1),
    accumulate,
    mouseInteraction,
    intro,
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    lightMode,
    paused,
    dpr,
  };
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    return whenNear(container, () => {
      const gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
      });
      if (!gl) return undefined;

      const flakeProgram = link(gl, FLAKE_VERTEX, FLAKE_FRAGMENT, ["aCorner", "aFlake"]);
      const pileProgram = link(gl, QUAD_VERTEX, PILE, ["aPosition"]);
      const downProgram = link(gl, QUAD_VERTEX, DOWN, ["aPosition"]);
      const upProgram = link(gl, QUAD_VERTEX, UP, ["aPosition"]);
      const compositeProgram = link(gl, QUAD_VERTEX, COMPOSITE, ["aPosition"]);
      const linked = [flakeProgram, pileProgram, downProgram, upProgram, compositeProgram];
      if (!flakeProgram || !pileProgram || !downProgram || !upProgram || !compositeProgram) {
        for (const p of linked) if (p) gl.deleteProgram(p.program);
        return undefined;
      }

      const atlas = buildAtlas();
      const atlasTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        atlas.width,
        atlas.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        atlas.data,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      const quadBuffer = gl.createBuffer();
      const quadVao = gl.createVertexArray();
      gl.bindVertexArray(quadVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      const cornerBuffer = gl.createBuffer();
      const instanceBuffer = gl.createBuffer();
      const flakeVao = gl.createVertexArray();
      gl.bindVertexArray(flakeVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.bindVertexArray(null);

      const createTarget = (filter: number): Target => {
        const target = {
          texture: gl.createTexture(),
          framebuffer: gl.createFramebuffer(),
          width: 0,
          height: 0,
        };
        gl.bindTexture(gl.TEXTURE_2D, target.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return target;
      };
      const sizeTarget = (target: Target, width: number, height: number) => {
        if (target.width === width && target.height === height) return;
        target.width = width;
        target.height = height;
        gl.bindTexture(gl.TEXTURE_2D, target.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          target.texture,
          0,
        );
      };
      const snow = createTarget(gl.NEAREST);
      const pileTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, pileTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      let pile = new Float32Array(0);
      let pileWidth = 0;
      const down = [createTarget(gl.LINEAR), createTarget(gl.LINEAR), createTarget(gl.LINEAR)];
      const up = [createTarget(gl.LINEAR), createTarget(gl.LINEAR)];

      const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const colorCache = new Map<string, [number, number, number]>();
      const toRgb = (value: string): [number, number, number] => {
        const hit = colorCache.get(value);
        if (hit) return hit;
        let rgb: [number, number, number] = [1, 1, 1];
        if (probe) {
          probe.clearRect(0, 0, 1, 1);
          probe.fillStyle = "#ffffff";
          probe.fillStyle = value;
          probe.fillRect(0, 0, 1, 1);
          const [r = 255, g = 255, b = 255] = probe.getImageData(0, 0, 1, 1).data;
          rgb = [r / 255, g / 255, b / 255];
        }
        colorCache.set(value, rgb);
        return rgb;
      };

      const rng = seeded(4271);
      const flakes: Flake[] = [];
      const view = { width: 1, height: 1, ratio: 1, pixel: 1, gridWidth: 1, gridHeight: 1 };
      const pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false, time: 0 };
      const state = { time: 0, intro: settingsRef.current.intro && !reduce ? 0 : 1, push: 0 };
      const instances = new Float32Array(MAX_FLAKES * 4);
      let raf = 0;
      let last = 0;
      let visible = true;
      let alive = true;

      const pickLevel = (r: number, flakeSize: number) => {
        const shift = flakeSize - 1;
        const weights = LEVEL_WEIGHTS.map((w, level) => w * Math.pow(2.2, shift * (level - 1.5)));
        const sum = weights.reduce((a, b) => a + b, 0);
        let total = 0;
        for (let level = 0; level < LEVELS; level++) {
          total += (weights[level] ?? 0) / sum;
          if (r <= total) return level;
        }
        return LEVELS - 1;
      };

      const spawn = (flake: Flake, flakeSize: number, top: boolean) => {
        flake.level = pickLevel(rng(), flakeSize);
        flake.x = rng() * (view.width + 40) - 20;
        flake.y = top ? -10 - rng() * 30 : rng() * view.height;
        flake.vx = 0;
        flake.vy = LEVEL_FALL[flake.level] ?? 16;
        flake.phase = rng() * Math.PI * 2;
        flake.rate = 0.6 + rng() * 0.9;
        flake.sparkle = rng() * 100;
        flake.drift = 0.7 + rng() * 0.6;
        flake.alt = rng() < 0.5;
        flake.reveal = rng();
        flake.levelSize = flakeSize;
      };

      const populate = (s: typeof settings) => {
        const target = Math.round(
          clamp((view.width * view.height * s.density) / 1100, 0, MAX_FLAKES),
        );
        while (flakes.length < target) {
          const flake = {} as Flake;
          spawn(flake, s.flakeSize, false);
          flakes.push(flake);
        }
        if (flakes.length > target) flakes.length = target;
      };

      const simulate = (s: typeof settings, dt: number) => {
        const fall = s.speed;
        const windSpeed = s.wind * 46;
        const radius = 120;
        const pushing = state.push > 0.001 && pointer.inside;
        const margin = 24;
        const settle = s.accumulate && fall > 0 && pile.length > 0;
        for (const flake of flakes) {
          if (flake.levelSize !== s.flakeSize) {
            flake.level = pickLevel(rng(), s.flakeSize);
            flake.levelSize = s.flakeSize;
          }
          const level = flake.level;
          const parallax = 1 - s.depth * (1 - (level + 1) / LEVELS) * 0.75;
          const swing = Math.sin(state.time * flake.rate + flake.phase) * s.sway * (6 + level * 7);
          const targetX = (windSpeed * parallax + swing) * flake.drift;
          const targetY = (LEVEL_FALL[level] ?? 16) * parallax * fall * flake.drift;
          const ease = 1 - Math.exp(-dt * 2.2);
          flake.vx += (targetX - flake.vx) * ease;
          flake.vy += (targetY - flake.vy) * ease;
          if (pushing) {
            const dx = flake.x - pointer.x;
            const dy = flake.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < radius && distance > 0.001) {
              const near = 1 - distance / radius;
              const repel = near * near * near * state.push * 1500 * dt;
              const carry = near * near * state.push * dt * 5;
              flake.vx += (dx / distance) * repel + pointer.vx * carry;
              flake.vy += (dy / distance) * repel + pointer.vy * carry;
            }
          }
          flake.x += flake.vx * dt;
          flake.y += flake.vy * dt;
          if (settle) {
            const column = Math.floor(flake.x / view.pixel);
            const height = pile[column];
            if (height !== undefined) {
              const surface = view.height - height * view.pixel;
              if (flake.y >= surface && height > 0.5) {
                for (let k = -level; k <= level; k++) {
                  const index = column + k;
                  const h = pile[index];
                  if (h !== undefined)
                    pile[index] = h + (0.35 + level * 0.15) * (1 - Math.abs(k) / (level + 1));
                }
                spawn(flake, s.flakeSize, true);
                flake.reveal = -1;
                continue;
              }
            }
          }
          if (fall >= 0 ? flake.y > view.height + margin : flake.y < -margin) {
            spawn(flake, s.flakeSize, true);
            flake.reveal = -1;
            if (fall < 0) flake.y = view.height + 10 + rng() * 30;
          }
          if (flake.x < -margin) flake.x += view.width + margin * 2;
          else if (flake.x > view.width + margin) flake.x -= view.width + margin * 2;
        }
      };

      const settlePile = (s: typeof settings, dt: number) => {
        if (!pile.length) return;
        const at = (i: number) => pile[i] ?? 0;
        const cap = Math.max(4, view.gridHeight * 0.08);
        if (s.accumulate && s.speed > 0) {
          const grow = (0.25 + s.density * 0.9) * dt * Math.min(1, s.speed);
          for (let i = 0; i < pile.length; i++) {
            const dune =
              0.55 +
              0.45 * Math.sin(i * 0.045 + Math.sin(i * 0.013) * 2.1) * Math.sin(i * 0.021 + 1.3);
            if (at(i) < cap * dune) pile[i] = at(i) + grow * (0.6 + 0.8 * dune);
          }
        }
        // let steep steps slide down, both ways, so drifts stay soft
        for (let pass = 0; pass < 2; pass++) {
          for (let k = 0; k < pile.length - 1; k++) {
            const i = pass === 0 ? k : pile.length - 2 - k;
            const difference = at(i) - at(i + 1);
            if (Math.abs(difference) > 1.2) {
              const move = (Math.abs(difference) - 1.2) * 0.5 * Math.sign(difference);
              pile[i] = at(i) - move;
              pile[i + 1] = at(i + 1) + move;
            }
          }
        }
        for (let i = 0; i < pile.length; i++) {
          const excess = Math.max(0, at(i) - cap);
          const rate = s.accumulate && s.speed > 0 ? excess * 0.8 : 2 + at(i) * 0.6;
          pile[i] = Math.max(0, at(i) - rate * dt);
        }
      };

      const run = (entry: Program, target: Target | null, width: number, height: number) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
        gl.viewport(0, 0, width, height);
        gl.useProgram(entry.program);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const bindTexture = (entry: Program, name: string, unit: number, texture: WebGLTexture) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(entry.uniforms[name] ?? null, unit);
      };

      const render = () => {
        const s = settingsRef.current;
        sizeTarget(snow, view.gridWidth, view.gridHeight);
        let count = 0;
        const sizes = SPRITES[VARIANTS[s.variant] ?? "snowflake"].map((rows) => rows.length);
        const sweep = state.intro * 1.75;
        for (const flake of flakes) {
          const level = flake.level;
          const depthLight = 1 - s.depth * (1 - (LEVEL_LIGHT[level] ?? 1));
          const spark =
            Math.pow(Math.max(0, Math.sin(state.time * 0.9 + flake.sparkle)), 60) * s.twinkle;
          const reveal =
            flake.reveal < 0 || state.intro >= 1
              ? 1
              : clamp((sweep - flake.y / view.height - flake.reveal * 0.25) / 0.35, 0, 1);
          if (reveal <= 0) continue;
          const slot = level >= 2 && flake.alt ? level + 3 : level;
          const o = count * 4;
          instances[o] = flake.x / view.pixel;
          instances[o + 1] = flake.y / view.pixel;
          instances[o + 2] = s.variant * SLOTS + slot;
          instances[o + 3] = Math.min(1, depthLight * (0.85 + spark * 0.6)) * reveal * reveal;
          count++;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, snow.framebuffer);
        gl.viewport(0, 0, snow.width, snow.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (pile.some((h) => h > 0.4)) {
          gl.bindTexture(gl.TEXTURE_2D, pileTexture);
          if (pileWidth !== pile.length) {
            pileWidth = pile.length;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, pileWidth, 1, 0, gl.RED, gl.FLOAT, pile);
          } else {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, pileWidth, 1, gl.RED, gl.FLOAT, pile);
          }
          gl.useProgram(pileProgram.program);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, pileTexture);
          gl.uniform1i(pileProgram.uniforms.uPile ?? null, 0);
          gl.uniform1f(pileProgram.uniforms.uTime ?? null, state.time);
          gl.uniform1f(pileProgram.uniforms.uLight ?? null, 1 - s.depth * 0.1);
          gl.bindVertexArray(quadVao);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        if (count > 0) {
          const u = flakeProgram.uniforms;
          gl.useProgram(flakeProgram.program);
          gl.uniform2f(u.uGrid ?? null, snow.width, snow.height);
          gl.uniform4f(u.uSizes ?? null, sizes[1] ?? 1, sizes[2] ?? 1, sizes[3] ?? 1, 0);
          gl.uniform1f(u.uLargest ?? null, sizes[4] ?? 1);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
          gl.uniform1i(u.uAtlas ?? null, 0);
          gl.enable(gl.BLEND);
          // overlapping flakes keep the brightest, never add up
          gl.blendEquation(gl.MAX);
          gl.bindVertexArray(flakeVao);
          gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, count * 4), gl.DYNAMIC_DRAW);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
          gl.blendEquation(gl.FUNC_ADD);
          gl.disable(gl.BLEND);
        }

        // bloom: three halvings down, two doublings back up
        gl.bindVertexArray(quadVao);
        let source = snow;
        for (const target of down) {
          sizeTarget(
            target,
            Math.max(1, Math.ceil(source.width / 2)),
            Math.max(1, Math.ceil(source.height / 2)),
          );
          gl.useProgram(downProgram.program);
          gl.uniform2f(downProgram.uniforms.uTexel ?? null, 1 / source.width, 1 / source.height);
          gl.uniform2f(downProgram.uniforms.uTarget ?? null, target.width, target.height);
          bindTexture(downProgram, "uSource", 0, source.texture);
          run(downProgram, target, target.width, target.height);
          source = target;
        }
        for (let level = up.length - 1; level >= 0; level--) {
          const target = up[level];
          const base = down[level];
          const from = level === up.length - 1 ? down[down.length - 1] : up[level + 1];
          if (!target || !base || !from) continue;
          sizeTarget(target, base.width, base.height);
          gl.useProgram(upProgram.program);
          gl.uniform2f(upProgram.uniforms.uTexel ?? null, 1 / from.width, 1 / from.height);
          gl.uniform2f(upProgram.uniforms.uTarget ?? null, target.width, target.height);
          bindTexture(upProgram, "uSource", 0, from.texture);
          bindTexture(upProgram, "uBase", 1, base.texture);
          run(upProgram, target, target.width, target.height);
        }

        const c = compositeProgram.uniforms;
        const glowMap = up[0] ?? snow;
        gl.useProgram(compositeProgram.program);
        gl.uniform2f(c.uResolution ?? null, canvas.width, canvas.height);
        gl.uniform2f(c.uGrid ?? null, snow.width, snow.height);
        gl.uniform1f(c.uPixel ?? null, view.pixel * view.ratio);
        gl.uniform3fv(c.uColor ?? null, toRgb(s.color));
        gl.uniform1f(c.uBrightness ?? null, s.brightness);
        gl.uniform1f(c.uGlow ?? null, s.glow);
        gl.uniform1f(c.uFade ?? null, s.fade);
        gl.uniform1f(c.uOpacity ?? null, s.opacity);
        gl.uniform1f(c.uLightMode ?? null, s.lightMode ? 1 : 0);
        bindTexture(compositeProgram, "uSnow", 0, snow.texture);
        bindTexture(compositeProgram, "uGlowMap", 1, glowMap.texture);
        run(compositeProgram, null, canvas.width, canvas.height);
      };

      const frame = (now: number) => {
        raf = 0;
        if (!alive || !visible || document.hidden) return;
        const s = settingsRef.current;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        const moving = !s.paused && !reduce;
        if (!s.intro || reduce) state.intro = 1;
        else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
        const goal = s.mouseInteraction && pointer.inside && !reduce ? 1 : 0;
        state.push += (goal - state.push) * (1 - Math.exp(-dt * (goal ? 6 : 3)));
        pointer.vx *= Math.exp(-dt * 6);
        pointer.vy *= Math.exp(-dt * 6);
        populate(s);
        if (moving) {
          state.time += dt;
          simulate(s, dt);
          settlePile(s, dt);
        }
        render();
        if (moving || Math.abs(goal - state.push) > 0.001) raf = requestAnimationFrame(frame);
        else last = 0;
      };

      const wake = () => {
        if (!raf && alive && visible && !document.hidden) raf = requestAnimationFrame(frame);
      };

      const resize = () => {
        const s = settingsRef.current;
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        const ratio = Math.min(s.dpr ?? window.devicePixelRatio, 1.5) || 1;
        view.width = width;
        view.height = height;
        view.ratio = ratio;
        view.pixel = Math.max(1, Math.round(s.pixelSize * ratio)) / ratio;
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        view.gridWidth = Math.max(1, Math.ceil(width / view.pixel));
        view.gridHeight = Math.max(1, Math.ceil(height / view.pixel));
        if (pile.length !== view.gridWidth) pile = new Float32Array(view.gridWidth);
        populate(s);
        if (!raf) render();
        wake();
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const now = performance.now();
        if (pointer.inside && pointer.time) {
          const elapsed = Math.max(1, now - pointer.time) / 1000;
          pointer.vx = clamp((x - pointer.x) / elapsed, -3000, 3000);
          pointer.vy = clamp((y - pointer.y) / elapsed, -3000, 3000);
        }
        pointer.x = x;
        pointer.y = y;
        pointer.time = now;
        pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        wake();
      };
      const onPointerLeave = () => {
        pointer.inside = false;
        wake();
      };
      const onVisibility = () => {
        last = 0;
        wake();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      const intersection = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          last = 0;
          wake();
        }
      });
      intersection.observe(container);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      resize();

      let lastPixel = settingsRef.current.pixelSize;
      let lastDpr = settingsRef.current.dpr;
      wakeRef.current = () => {
        const s = settingsRef.current;
        if (s.pixelSize !== lastPixel || s.dpr !== lastDpr) {
          lastPixel = s.pixelSize;
          lastDpr = s.dpr;
          resize();
          return;
        }
        populate(s);
        if (!raf) render();
        wake();
      };

      return () => {
        alive = false;
        cancelAnimationFrame(raf);
        wakeRef.current = null;
        resizeObserver.disconnect();
        intersection.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        document.documentElement.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        for (const target of [snow, ...down, ...up]) {
          gl.deleteTexture(target.texture);
          gl.deleteFramebuffer(target.framebuffer);
        }
        for (const p of linked) if (p) gl.deleteProgram(p.program);
        gl.deleteTexture(atlasTexture);
        gl.deleteTexture(pileTexture);
        gl.deleteBuffer(quadBuffer);
        gl.deleteBuffer(cornerBuffer);
        gl.deleteBuffer(instanceBuffer);
        gl.deleteVertexArray(quadVao);
        gl.deleteVertexArray(flakeVao);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
