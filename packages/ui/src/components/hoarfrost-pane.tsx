"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Hoarfrost Pane: a winter window that frosts over while you watch. The ice is a real
 * phase-field crystal growth model (Kobayashi, 1993) on the GPU: a six-fold anisotropic solid
 * front, latent heat that slows it, noise that splits it into side branches. Each grain carries
 * its own lattice angle, so neighbouring ferns lean different ways. Frost creeps in from the cold
 * frame and stalls where the glass is warmer, leaving the middle clear.
 *
 * Once grown, the frost holds still. The pointer is a fingertip: it wipes a wet, clear trail,
 * and as the glass dries the ice creeps back in along the paths it first grew. WebGL2 with float
 * render targets; the blue-hour street behind the glass is drawn procedurally once per resize.
 * The sim sleeps when nothing changes and when off screen. Without WebGL2 a CSS frosted vignette.
 *
 * Vendored from 21st.dev ("hoarfrost-pane"): the injected <style> moved to styles.css
 * (`.hfp-*`), strict-lint fixes (typed tuples, uniform lookups, no render-time ref writes).
 */

export interface HoarfrostPaneProps {
  /** How far the frost reaches in from the frame, 0–1. Defaults to 0.6. */
  coverage?: number;
  /** Radius of the wiping fingertip in CSS px. Defaults to 46. */
  brush?: number;
  /** The pointer wipes the frost. Defaults to true. */
  interactive?: boolean;
  /** Reshuffles the crystals and the street. */
  seed?: number;
  /** Content laid over the glass. */
  children?: React.ReactNode;
  /** Root height. A definite length, never a percentage. */
  height?: string;
  /** Accessible description of the pane. */
  label?: string;
  className?: string;
}

/** Small seeded PRNG (mulberry32). */
export function hfpRandom(seed: number) {
  let a = seed >>> 0 || 1;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sim cell size in CSS px and grid size, so a w × h pane stays under `budget` cells. */
export function hfpGrid(w: number, h: number, budget: number): [number, number, number] {
  const cell = Math.max(1, Math.sqrt((w * h) / budget));
  return [cell, Math.max(8, Math.ceil(w / cell)), Math.max(8, Math.ceil(h / cell))];
}

/** Fewest sim cells: below this the fronds get too coarse to read as frost. */
export const HFP_MIN_CELLS = 50000;

/**
 * Sim cells for a GPU that managed `done` of `want` growth steps in the prewarm budget: step
 * time scales with cell count, so shrink until the whole growth fits (with headroom).
 */
export function hfpRescale(cells: number, done: number, want: number) {
  if (done >= want) return cells;
  return Math.max(HFP_MIN_CELLS, Math.floor(((cells * Math.max(done, 25)) / want) * 0.8));
}

/** Glass temperature: below freezing at the frame, `warm` in the middle. Freezing is 1. */
export function hfpAmbient(x: number, y: number, nx: number, ny: number, warm: number) {
  const de = Math.min(x, nx - x, y, ny - y) / (0.5 * Math.min(nx, ny));
  const t = Math.max(0, Math.min(1, (de - 0.4) / 0.55));
  return -0.15 + (warm + 0.15) * t * t * (3 - 2 * t);
}

/** Warmth of the middle of the glass for a 0–1 coverage. Above 1 nothing grows there. */
export function hfpWarmth(coverage: number) {
  const c = Math.max(0, Math.min(1, coverage));
  return 1.6 - c;
}

/** Nucleation sites [x, y, lattice angle]: jittered along the frame, plus sparse dust. */
export function hfpNuclei(nx: number, ny: number, rand: () => number) {
  const out: [number, number, number][] = [];
  const per = 2 * (nx + ny);
  // specks along the frame at uneven spacing and depth, the way dirt and scratches fall
  for (let at = rand() * 30; at < per; at += 24 + rand() * 60) {
    let s = at;
    const inset = 1 + rand() * rand() * 6;
    let x: number;
    let y: number;
    if (s < nx) {
      x = s;
      y = inset;
    } else if ((s -= nx) < ny) {
      x = nx - inset;
      y = s;
    } else if ((s -= ny) < nx) {
      x = nx - s;
      y = ny - inset;
    } else {
      s -= nx;
      x = inset;
      y = ny - s;
    }
    out.push([
      Math.min(nx - 3, Math.max(3, x)),
      Math.min(ny - 3, Math.max(3, y)),
      rand() * (Math.PI / 3),
    ]);
  }
  const dust = Math.max(2, Math.round((nx * ny) / 40000));
  for (let k = 0; k < dust; k++) {
    const a = rand() * Math.PI * 2;
    const r = 0.6 + rand() * 0.25;
    out.push([
      nx * (0.5 + Math.cos(a) * r * 0.5),
      ny * (0.5 + Math.sin(a) * r * 0.5),
      rand() * (Math.PI / 3),
    ]);
  }
  return out;
}

/**
 * Starting state, RGBA per cell: phase (1 = ice), temperature, wetness, lattice angle. Ice
 * nucleates on specks along the cold frame and on a few dust grains further in.
 */
export function hfpSeed(nx: number, ny: number, warm: number, seed: number) {
  const rand = hfpRandom(seed);
  const out = new Float32Array(nx * ny * 4);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++)
      out[(j * nx + i) * 4 + 1] = hfpAmbient(i + 0.5, j + 0.5, nx, ny, warm);
  }
  for (const [cx, cy, th] of hfpNuclei(nx, ny, rand)) {
    for (let j = Math.floor(cy - 3); j <= cy + 3; j++) {
      for (let i = Math.floor(cx - 3); i <= cx + 3; i++) {
        if (i < 0 || j < 0 || i >= nx || j >= ny || Math.hypot(i + 0.5 - cx, j + 0.5 - cy) > 2.2)
          continue;
        const o = (j * nx + i) * 4;
        out[o] = 1;
        out[o + 3] = th;
      }
    }
  }
  return out;
}

const QUAD = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Shared model constants. Kobayashi's units: dx = 0.03, dt = 1e-4.
const MODEL = `
const float DX = 0.03;
const float DT = 0.0001;
const float TAU = 0.0003;
const float EB = 0.01;
const float DELTA = 0.06;
const float J = 6.0;
const float ALPHA = 0.9;
const float GAMMA = 10.0;
const float K = 2.0;
const float NOISE = 0.008;
const float SINK = 0.25;
const float COLD = -0.15;
const float PI = 3.14159265;
`;

// Pass 1: anisotropic gradient-energy terms per cell.
const AUX =
  `#version 300 es
precision highp float;
uniform highp sampler2D uS;
uniform ivec2 uN;
out vec4 o;
` +
  MODEL +
  `
float P(ivec2 q) { return texelFetch(uS, clamp(q, ivec2(0), uN - 1), 0).x; }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float th0 = texelFetch(uS, p, 0).w;
  float px = (P(p + ivec2(1, 0)) - P(p - ivec2(1, 0))) / (2.0 * DX);
  float py = (P(p + ivec2(0, 1)) - P(p - ivec2(0, 1))) / (2.0 * DX);
  float e = EB;
  float ed = 0.0;
  if (px * px + py * py > 1e-6) {
    float a = J * (atan(py, px) - th0);
    e = EB * (1.0 + DELTA * cos(a));
    ed = -EB * J * DELTA * sin(a);
  }
  o = vec4(e * e, e * ed * px, e * ed * py, 0.0);
}
`;

// Pass 2: advance phase and temperature one step; a liquid cell inherits its grain's angle.
const STEP =
  `#version 300 es
precision highp float;
uniform highp sampler2D uS;
uniform highp sampler2D uA;
uniform ivec2 uN;
uniform float uTick;
uniform float uWarm;
out vec4 o;
` +
  MODEL +
  `
vec4 S(ivec2 q) { return texelFetch(uS, clamp(q, ivec2(0), uN - 1), 0); }
vec4 A(ivec2 q) { return texelFetch(uA, clamp(q, ivec2(0), uN - 1), 0); }
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 X = ivec2(1, 0);
  ivec2 Y = ivec2(0, 1);
  vec4 c = S(p);
  vec4 e = S(p + X); vec4 w = S(p - X); vec4 n = S(p + Y); vec4 s = S(p - Y);
  vec4 ne = S(p + X + Y); vec4 nw = S(p - X + Y); vec4 se = S(p + X - Y); vec4 sw = S(p - X - Y);
  vec2 lap = (4.0 * (e.xy + w.xy + n.xy + s.xy) + ne.xy + nw.xy + se.xy + sw.xy - 20.0 * c.xy) / (6.0 * DX * DX);
  vec4 ac = A(p); vec4 ae = A(p + X); vec4 aw = A(p - X); vec4 an = A(p + Y); vec4 as_ = A(p - Y);
  float px = (e.x - w.x) / (2.0 * DX);
  float py = (n.x - s.x) / (2.0 * DX);
  float aniso = ((an.y - as_.y) - (ae.z - aw.z) + (ae.x - aw.x) * px + (an.x - as_.x) * py) / (2.0 * DX);
  float m = ALPHA / PI * atan(GAMMA * (1.0 - c.y));
  float chi = hash(vec2(p) + fract(uTick * 0.61803) * 517.0) - 0.5;
  float phi = clamp(c.x + DT / TAU * (aniso + ac.x * lap.x + c.x * (1.0 - c.x) * (c.x - 0.5 + m + NOISE * chi)), 0.0, 1.0);

  vec2 q = vec2(p) + 0.5;
  vec2 nn = vec2(uN);
  float de = min(min(q.x, nn.x - q.x), min(q.y, nn.y - q.y)) / (0.5 * min(nn.x, nn.y));
  float amb = mix(COLD, uWarm, smoothstep(0.4, 0.95, de));
  float T = c.y + DT * lap.y + K * (phi - c.x) + DT * SINK * (amb - c.y);

  float th = c.w;
  if (phi < 0.5) {
    float mx = phi;
    if (e.x > mx) { mx = e.x; th = e.w; }
    if (w.x > mx) { mx = w.x; th = w.w; }
    if (n.x > mx) { mx = n.x; th = n.w; }
    if (s.x > mx) { mx = s.x; th = s.w; }
  }
  o = vec4(phi, T, c.z, th);
}
`;

// Once grown, the frost holds as it froze; a wipe clears a wet trail that heals from its edges.
const HEAL = `#version 300 es
precision highp float;
uniform highp sampler2D uS;
uniform ivec2 uN;
uniform vec4 uSeg;
uniform float uR;
uniform float uWipe;
uniform float uInit;
out vec4 o;
vec4 S(ivec2 q) { return texelFetch(uS, clamp(q, ivec2(0), uN - 1), 0); }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec4 c = S(p);
  if (uInit > 0.5) { o = vec4(c.x, c.x, 0.0, c.w); return; }
  vec2 q = vec2(p) + 0.5;
  vec2 ab = uSeg.zw - uSeg.xy;
  float t = clamp(dot(q - uSeg.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  vec2 d = q - uSeg.xy - ab * t;
  float touch = uWipe > 0.5 ? smoothstep(uR, uR * 0.55, length(d)) : 0.0;
  float phi = c.x;
  float wet = c.z;
  if (touch > 0.0) {
    phi *= 1.0 - 0.3 * touch;
    wet = max(wet, touch);
  }
  if (wet > 0.0) {
    float mx = max(max(S(p + ivec2(1, 0)).x, S(p - ivec2(1, 0)).x), max(S(p + ivec2(0, 1)).x, S(p - ivec2(0, 1)).x));
    float cold = smoothstep(0.92, 0.5, wet) * (1.0 - touch);
    phi = min(max(c.y, phi), phi + 0.018 * cold * smoothstep(0.35, 0.9, mx));
    wet = wet < 0.003 ? 0.0 : wet * 0.99985;
  }
  o = vec4(phi, c.y, wet, c.w);
}
`;

// The street behind the glass, rendered once per resize: sharp, and a softer copy seen through ice.
const BACK = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uSoft;
uniform float uSeed;
out vec4 o;
float h1(float x) { x = fract((x + uSeed * 3.17) * 0.1031); x *= x + 33.33; x *= x + x; return fract(x); }
float h2(vec2 p) { vec3 q = fract(vec3(p.xyx + uSeed * 1.37) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float roof(float x, float blur) {
  float i = floor(x); float f = fract(x);
  float hl = h1(i - 1.0); float hc = h1(i); float hr = h1(i + 1.0);
  float a = mix(hl, hc, smoothstep(-blur, blur, f));
  float b = mix(hc, hr, smoothstep(1.0 - blur, 1.0 + blur, f));
  return f < 0.5 ? a : b;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float soft = uSoft;
  vec3 col = mix(vec3(0.30, 0.27, 0.33), vec3(0.12, 0.17, 0.27), smoothstep(0.28, 0.56, uv.y));
  col = mix(col, vec3(0.03, 0.055, 0.11), smoothstep(0.5, 1.05, uv.y));
  float bl = 0.06 + soft * 0.1;
  float far = 0.30 + 0.16 * roof(uv.x * asp * 5.0 + uSeed, bl * 3.0);
  float near = 0.22 + 0.22 * roof(uv.x * asp * 2.3 + uSeed * 1.7 + 9.0, bl * 1.5);
  float wf = 0.012 + soft * 0.03;
  float inFar = 1.0 - smoothstep(far - wf, far + wf, uv.y);
  float inNear = 1.0 - smoothstep(near - wf * 1.4, near + wf * 1.4, uv.y);
  col = mix(col, vec3(0.06, 0.07, 0.10), inFar * 0.85);
  col = mix(col, vec3(0.025, 0.03, 0.045), inNear);
  for (int k = 0; k < 2; k++) {
    vec2 gw = vec2(uv.x * asp * (11.0 + float(k) * 7.0), uv.y * (15.0 + float(k) * 9.0)) + float(k) * 3.7;
    vec2 ci = floor(gw);
    vec2 jit = vec2(h2(ci + 1.3), h2(ci + 5.1)) - 0.5;
    vec2 cf = fract(gw) - 0.5 - jit * 0.5;
    float lit = step(0.8, h2(ci + float(k) * 11.0)) * (inFar - inNear * 0.3);
    float sz = 0.1 + 0.12 * h2(ci + 2.9);
    float win = 1.0 - smoothstep(sz * 0.4, sz + 0.12 + soft * 0.3, length(cf * vec2(1.3, 1.0)));
    col += mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.82, 0.6), h2(ci + 8.0)) * win * max(lit, 0.0) * (0.12 + 0.2 * h2(ci + 7.0)) * (1.0 - soft * 0.4);
  }
  col += vec3(0.55, 0.33, 0.16) * 0.18 * (1.0 - smoothstep(0.0, 0.22, uv.y));
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    vec2 c = vec2(h1(fi * 3.1 + 1.0) * asp, 0.04 + 0.42 * pow(h1(fi * 5.7 + 2.0), 1.3));
    float r = (0.022 + 0.055 * h1(fi * 1.3 + 4.0)) * (1.0 + soft * 0.35);
    float k = h1(fi * 9.1 + 3.0);
    vec3 lc = k < 0.55 ? vec3(1.0, 0.6, 0.26) : k < 0.8 ? vec3(1.0, 0.84, 0.62) : k < 0.93 ? vec3(0.72, 0.84, 1.0) : vec3(1.0, 0.24, 0.18);
    float d = length(vec2(uv.x * asp, uv.y) - c);
    float edge = r * (0.06 + soft * 0.5);
    float disc = 1.0 - smoothstep(r - edge, r + edge, d);
    float rim = 0.8 + 0.3 * smoothstep(r * 0.4, r, d) * (1.0 - soft);
    col += lc * disc * rim * (0.22 + 0.5 * h1(fi * 2.3 + 6.0)) / (1.0 + soft * 0.5);
  }
  col += (h2(gl_FragCoord.xy * 0.37 + uSoft) - 0.5) / 255.0 * 1.5;
  o = vec4(col, 1.0);
}
`;

// Ice relief at grid resolution: a soft profile across each frond (x), ice around (y).
const RELIEF = `#version 300 es
precision highp float;
uniform highp sampler2D uS;
uniform ivec2 uN;
out vec4 o;
float P(ivec2 q) { return texelFetch(uS, clamp(q, ivec2(0), uN - 1), 0).x; }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float w[5] = float[5](1.0, 4.0, 6.0, 4.0, 1.0);
  float near = 0.0;
  float far = 0.0;
  for (int j = 0; j < 5; j++) {
    for (int i = 0; i < 5; i++) {
      float k = w[i] * w[j] / 256.0;
      near += k * P(p + ivec2(i - 2, j - 2));
      far += k * P(p + ivec2(i - 2, j - 2) * 4);
    }
  }
  o = vec4(near, far, 0.0, 0.0);
}
`;

// What you see: the street through haze, ice and wiped-clear glass.
const SHOW = `#version 300 es
precision highp float;
uniform highp sampler2D uS;
uniform highp sampler2D uR;
uniform sampler2D uBg;
uniform sampler2D uSoft;
uniform ivec2 uN;
uniform vec2 uRes;
uniform float uCell;
uniform float uTime;
out vec4 o;
vec4 F(ivec2 q) { return texelFetch(uS, clamp(q, ivec2(0), uN - 1), 0); }
vec2 G(ivec2 q) { return texelFetch(uR, clamp(q, ivec2(0), uN - 1), 0).xy; }
vec4 st(vec2 g) {
  g -= 0.5;
  ivec2 i = ivec2(floor(g)); vec2 f = fract(g);
  return mix(mix(F(i), F(i + ivec2(1, 0)), f.x), mix(F(i + ivec2(0, 1)), F(i + ivec2(1, 1)), f.x), f.y);
}
vec2 rl(vec2 g) {
  g -= 0.5;
  ivec2 i = ivec2(floor(g)); vec2 f = fract(g);
  return mix(mix(G(i), G(i + ivec2(1, 0)), f.x), mix(G(i + ivec2(0, 1)), G(i + ivec2(1, 1)), f.x), f.y);
}
float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 g = gl_FragCoord.xy / uCell;
  vec4 s0 = st(g);
  vec2 r0 = rl(g);
  float h = r0.x;
  float far = r0.y;
  float hx = rl(g + vec2(1.0, 0.0)).x - rl(g - vec2(1.0, 0.0)).x;
  float hy = rl(g + vec2(0.0, 1.0)).x - rl(g - vec2(0.0, 1.0)).x;
  float ex = st(g + vec2(0.7, 0.0)).x - st(g - vec2(0.7, 0.0)).x;
  float ey = st(g + vec2(0.0, 0.7)).x - st(g - vec2(0.0, 0.7)).x;
  float edge = clamp(length(vec2(ex, ey)) * 1.1, 0.0, 1.0);
  float cover = smoothstep(0.3, 0.7, s0.x);
  float thick = cover * smoothstep(0.2, 1.0, h);
  float wet = s0.z;
  vec2 grad = vec2(hx, hy);
  vec2 bend = -grad * 0.035 * cover;
  vec3 bg = texture(uBg, uv + bend).rgb;
  vec3 soft = texture(uSoft, uv + bend).rgb;
  vec3 soft0 = texture(uSoft, uv).rgb;
  float fog = (0.18 + 0.5 * far) * (1.0 - wet) * (1.0 - cover * 0.75);
  vec3 col = mix(bg, soft, clamp(fog * 1.8, 0.0, 1.0));
  col = mix(col, vec3(0.42, 0.48, 0.58), fog * 0.22);
  col += soft0 * fog * 0.3;
  float lamp = 0.55 + 0.8 * exp(-dot(uv - vec2(0.06, 0.12), uv - vec2(0.06, 0.12)) * 2.0);
  vec3 room = vec3(0.6, 0.67, 0.78) * lamp;
  vec2 fr = min(uv, 1.0 - uv) * vec2(uRes.x / uRes.y, 1.0);
  float frame = 1.0 - smoothstep(0.0, 0.25, min(fr.x, fr.y));
  float milk = cover * (0.03 + 0.36 * pow(thick, 2.4) * (0.45 + frame));
  vec3 icecol = mix(col * vec3(0.95, 0.99, 1.05) * 1.06, room, clamp(milk, 0.0, 1.0));
  icecol += room * edge * cover * 0.5 + soft * (edge * 0.7 + thick * 0.35) * cover;
  col = mix(col, icecol, cover);
  col *= 1.0 - edge * (1.0 - cover) * 0.42 * (1.0 - wet);
  vec2 cg = floor(gl_FragCoord.xy / max(2.0, uCell * 0.9));
  float r = hash(cg);
  float glint = step(0.997, r) * thick * edge;
  glint *= 0.6 + 0.4 * sin(uTime * (1.5 + r * 3.0) + r * 60.0);
  col += glint * 0.7 * vec3(0.95, 0.98, 1.0);
  col = 1.0 - exp(-col * 1.15);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0 * 2.0;
  o = vec4(col, 1.0);
}
`;

// Sim steps per second while the first frost grows, and while a wipe heals.
const GROW_RATE = 900;
const HEAL_RATE = 600;
// The first frost grows across the whole pane for this many steps, then only wiped glass evolves.
const GROW_STEPS = 2000;

type Prog = { pr: WebGLProgram; u: Map<string, WebGLUniformLocation | null>; ok: boolean };

export function HoarfrostPane({
  coverage = 0.6,
  brush = 46,
  interactive = true,
  seed = 11,
  children,
  height = "100svh",
  label = "หน้าต่างที่มีน้ำแข็งเกาะ ลากเมาส์หรือนิ้วผ่านกระจกเพื่อเช็ดน้ำแข็งออก แล้วน้ำแข็งจะค่อย ๆ กลับมาเกาะ",
  className,
}: HoarfrostPaneProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = React.useState(false);
  const opts = React.useRef({ brush, interactive });
  React.useLayoutEffect(() => {
    opts.current = { brush, interactive };
  });

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl?.getExtension("EXT_color_buffer_float")) {
      setFailed(true);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const warm = hfpWarmth(coverage);

    const shaders: WebGLShader[] = [];
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      shaders.push(sh);
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, QUAD);
    const make = (src: string): Prog => {
      const fs = compile(gl.FRAGMENT_SHADER, src);
      const pr = gl.createProgram();
      const u = new Map<string, WebGLUniformLocation | null>();
      if (!vs || !fs) return { pr, u, ok: false };
      gl.attachShader(pr, vs);
      gl.attachShader(pr, fs);
      gl.bindAttribLocation(pr, 0, "aPos");
      gl.linkProgram(pr);
      const count = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(pr, i);
        if (info) u.set(info.name, gl.getUniformLocation(pr, info.name));
      }
      return { pr, u, ok: gl.getProgramParameter(pr, gl.LINK_STATUS) === true };
    };
    const U = (p: Prog, name: string) => p.u.get(name) ?? null;
    const aux = make(AUX);
    const stepP = make(STEP);
    const heal = make(HEAL);
    const back = make(BACK);
    const show = make(SHOW);
    const relief = make(RELIEF);
    const programs = [aux, stepP, heal, back, show, relief];
    if (programs.some((p) => !p.ok)) {
      setFailed(true);
      return;
    }
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    let w = 0;
    let h = 0;
    let cell = 3;
    // A software renderer (some VMs, headless capture) starts small so the frost still grows.
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    let cells = /swiftshader|llvmpipe|software|basic render/i.test(renderer)
      ? HFP_MIN_CELLS
      : 320000;
    let nx = 8;
    let ny = 8;
    let dpr = 1;
    let tex: WebGLTexture[] = [];
    let fbo: WebGLFramebuffer[] = [];
    const T = (i: number) => tex[i] ?? null;
    const FB = (i: number) => fbo[i] ?? null;
    let cur = 0;
    let tick = 0;
    let raf = 0;
    let visible = true;
    let lastFrame = 0;
    let quietUntil = 0;
    const start = performance.now();
    const pointer = { x: 0, y: 0, px: 0, py: 0, on: false };

    const target = (
      internal: number,
      format: number,
      type: number,
      tw: number,
      th: number,
      filter: number,
      data: ArrayBufferView | null,
    ) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, tw, th, 0, format, type, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      tex.push(t);
      fbo.push(f);
      return tex.length - 1;
    };
    const free = () => {
      for (const t of tex) gl.deleteTexture(t);
      for (const f of fbo) gl.deleteFramebuffer(f);
      tex = [];
      fbo = [];
    };

    // texture slots: 0, 1 state ping-pong; 2 aux, then relief; 3 street; 4 street through ice
    const build = () => {
      free();
      [cell, nx, ny] = hfpGrid(w, h, cells);
      const init = hfpSeed(nx, ny, warm, seed);
      target(gl.RGBA32F, gl.RGBA, gl.FLOAT, nx, ny, gl.NEAREST, init);
      target(gl.RGBA32F, gl.RGBA, gl.FLOAT, nx, ny, gl.NEAREST, init);
      target(gl.RGBA32F, gl.RGBA, gl.FLOAT, nx, ny, gl.NEAREST, null);
      const bw = Math.max(1, Math.round(canvas.width / 2));
      const bh = Math.max(1, Math.round(canvas.height / 2));
      for (let k = 0; k < 2; k++) {
        const slot = target(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bw, bh, gl.LINEAR, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, FB(slot));
        gl.viewport(0, 0, bw, bh);
        gl.useProgram(back.pr);
        gl.uniform2f(U(back, "uRes"), bw, bh);
        gl.uniform1f(U(back, "uSoft"), k);
        gl.uniform1f(U(back, "uSeed"), (seed % 97) * 0.37);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      cur = 0;
      tick = 0;
    };

    const simulate = (n: number) => {
      const o = opts.current;
      // wiping starts once the first frost has formed; until then the growth is the show
      const wiping = pointer.on && o.interactive && tick >= GROW_STEPS;
      gl.viewport(0, 0, nx, ny);
      for (let k = 0; k < n; k++) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, T(cur));
        if (tick < GROW_STEPS) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, FB(2));
          gl.useProgram(aux.pr);
          gl.uniform1i(U(aux, "uS"), 0);
          gl.uniform2i(U(aux, "uN"), nx, ny);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindFramebuffer(gl.FRAMEBUFFER, FB(1 - cur));
          gl.useProgram(stepP.pr);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, T(2));
          gl.uniform1i(U(stepP, "uS"), 0);
          gl.uniform1i(U(stepP, "uA"), 1);
          gl.uniform2i(U(stepP, "uN"), nx, ny);
          gl.uniform1f(U(stepP, "uTick"), tick);
          gl.uniform1f(U(stepP, "uWarm"), warm);
        } else {
          gl.bindFramebuffer(gl.FRAMEBUFFER, FB(1 - cur));
          gl.useProgram(heal.pr);
          gl.uniform1i(U(heal, "uS"), 0);
          gl.uniform2i(U(heal, "uN"), nx, ny);
          // the fingertip sweeps the whole segment it travelled, so fast strokes stay continuous
          gl.uniform4f(
            U(heal, "uSeg"),
            pointer.px / cell,
            ny - pointer.py / cell,
            pointer.x / cell,
            ny - pointer.y / cell,
          );
          gl.uniform1f(U(heal, "uR"), Math.max(8, o.brush) / cell);
          gl.uniform1f(U(heal, "uWipe"), wiping ? 1 : 0);
          gl.uniform1f(U(heal, "uInit"), tick === GROW_STEPS ? 1 : 0);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        tick++;
        cur = 1 - cur;
      }
      gl.activeTexture(gl.TEXTURE0);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
    };

    const render = (now: number) => {
      // the aux target is free between steps, so the relief lands there
      gl.bindFramebuffer(gl.FRAMEBUFFER, FB(2));
      gl.viewport(0, 0, nx, ny);
      gl.useProgram(relief.pr);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, T(cur));
      gl.uniform1i(U(relief, "uS"), 0);
      gl.uniform2i(U(relief, "uN"), nx, ny);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(show.pr);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, T(cur));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, T(3));
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, T(4));
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, T(2));
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(U(show, "uS"), 0);
      gl.uniform1i(U(show, "uR"), 3);
      gl.uniform1i(U(show, "uBg"), 1);
      gl.uniform1i(U(show, "uSoft"), 2);
      gl.uniform2i(U(show, "uN"), nx, ny);
      gl.uniform2f(U(show, "uRes"), canvas.width, canvas.height);
      gl.uniform1f(U(show, "uCell"), cell * dpr);
      gl.uniform1f(U(show, "uTime"), reduce ? 0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // grow some rime before the first paint, within a time budget, so frame one looks frozen
    const prewarm = (budget: number, most: number) => {
      const t0 = performance.now();
      const px = new Float32Array(4);
      let done = 0;
      while (done < most) {
        simulate(25);
        done += 25;
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px);
        if (performance.now() - t0 > budget) break;
      }
      return done;
    };

    // the frost grows for a while after load or the last touch, then the sim sleeps
    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      // steps follow wall time, so 60 Hz and 120 Hz screens freeze at the same pace
      const dt = lastFrame ? Math.min(50, now - lastFrame) : 16;
      lastFrame = now;
      const active = pointer.on || now < quietUntil;
      if (active)
        simulate(
          Math.max(
            1,
            Math.min(24, Math.round(((tick < GROW_STEPS ? GROW_RATE : HEAL_RATE) * dt) / 1000)),
          ),
        );
      render(now);
      if (active) raf = requestAnimationFrame(frame);
    };
    function wake(ms: number) {
      quietUntil = Math.max(quietUntil, performance.now() + ms);
      if (!raf && visible) {
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    const resize = () => {
      const rect = root.getBoundingClientRect();
      const nw = Math.max(1, Math.round(rect.width));
      const nh = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (nw === w && nh === h && tex.length) return;
      // shortcut: a resize regrows the frost from scratch; resample the old state if that shows
      w = nw;
      h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      build();
      const most = reduce ? GROW_STEPS + 1 : 1700;
      const done = prewarm(reduce ? 2500 : 400, most);
      const fewer = hfpRescale(cells, done, most);
      if (fewer < cells) {
        // too slow a GPU to frost over in time: regrow on a coarser grid it can keep up with
        cells = fewer;
        build();
        prewarm(reduce ? 2500 : 400, most);
      }
      render(performance.now());
      canvas.setAttribute("data-ready", "");
      wake(reduce ? 0 : 45000);
    };

    const local = (e: PointerEvent): [number, number] => {
      const b = canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    };
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e);
      if (!pointer.on) {
        pointer.px = x;
        pointer.py = y;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.on = true;
      wake(25000);
    };
    const onLeave = () => {
      pointer.on = false;
      wake(25000);
    };

    const lost = (ev: Event) => {
      ev.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
      setFailed(true);
    };
    canvas.addEventListener("webglcontextlost", lost);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointercancel", onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake(0);
    });
    io.observe(root);
    resize();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointercancel", onLeave);
      free();
      gl.deleteBuffer(quad);
      for (const p of programs) gl.deleteProgram(p.pr);
      for (const s of shaders) gl.deleteShader(s);
    };
  }, [coverage, seed]);

  return (
    <div ref={rootRef} className={cn("hfp-root", className)} style={{ height }}>
      {/* the glass is the picture; content laid over it stays readable to screen readers */}
      {failed ? (
        <div className="hfp-fallback" role="img" aria-label={label} />
      ) : (
        <canvas ref={canvasRef} role="img" aria-label={label} />
      )}
      {children ? <div className="hfp-over">{children}</div> : null}
    </div>
  );
}
