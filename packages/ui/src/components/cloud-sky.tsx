"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useTokenColors, watchTheme } from "../lib/token-colors";

/*
 * A sky of drifting clouds drawn by one WebGL1 fragment shader. The cloud maths (dome-topped
 * envelopes filled with domain-warped billow noise, a second sample above for self-shadow) is the
 * cloud shader published for Aceternity UI; the vendored original is in the design registry
 * (cloud-sky-original). Ours takes its colours from palette tokens, turns the sun into the
 * moon at night, stops drawing off screen and holds one still frame under reduced motion.
 */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_time;
uniform float u_count;
uniform vec3 u_cloud;
uniform vec3 u_skyTop;
uniform vec3 u_skyBottom;
uniform vec3 u_glow;
uniform float u_shade;

const mat2 R = mat2(0.80, 0.60, -0.60, 0.80);

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.31, 289.17))) * 26737.367); }

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) { sum += amp * vnoise(p); p = R * p * 2.03 + 19.19; amp *= 0.5; }
  return sum;
}

float billow(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * (1.0 - abs(2.0 * vnoise(p) - 1.0));
    p = R * p * 2.11 + 13.37;
    amp *= 0.5;
  }
  return sum;
}

float cloudDensity(vec2 p, vec2 c, vec2 r, float seed, float t) {
  vec2 q = p - c;
  float ry = q.y > 0.0 ? r.y : r.y * 0.42;
  float env = 1.0 - length(vec2(q.x / r.x, q.y / ry));
  if (env < -0.35) return 0.0;
  vec2 dp = q * (2.4 / r.x) + seed;
  dp += 0.6 * vec2(fbm(dp * 1.4 + t * 0.04), fbm(dp * 1.4 + 7.7 - t * 0.03));
  return env + (billow(dp * 1.6) - 0.62) * 0.62;
}

vec3 shadeCloud(vec3 color, vec3 sky, vec2 p, vec2 c, vec2 r, float seed, float t, float dist) {
  float d = cloudDensity(p, c, r, seed, t);
  if (d < 0.02) return color;
  float dUp = cloudDensity(p + vec2(0.0, r.y * 0.55), c, r, seed, t);
  float occl = clamp((dUp - d) * 1.1 + d * 0.55, 0.0, 1.0);
  vec3 lit = u_cloud * 1.04;
  vec3 shadow = mix(u_cloud * u_shade, sky, 0.38);
  vec3 cloudCol = mix(lit, shadow, occl * 0.85);
  float alpha = smoothstep(0.02, 0.38, d);
  float rim = smoothstep(0.02, 0.14, d) * (1.0 - smoothstep(0.14, 0.40, d));
  cloudCol += rim * 0.10 * u_glow;
  cloudCol = mix(cloudCol, sky, dist * 0.35);
  alpha *= mix(1.0, 0.8, dist);
  return mix(color, cloudCol, alpha);
}

vec3 cloudPass(vec3 color, vec3 sky, vec2 p, float aspect, float t,
               float spd, float phase, float y, vec2 r, float seed, float dist) {
  float cx = mix(-r.x - 0.25, aspect + r.x + 0.25, fract(t * spd + phase));
  float cy = y + sin(t * 0.05 + phase * 6.2831) * 0.012;
  return shadeCloud(color, sky, p, vec2(cx, cy), r, seed, t, dist);
}

void main() {
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(v_uv.x * aspect, v_uv.y);
  float t = u_time;
  vec3 sky = mix(u_skyBottom, u_skyTop, v_uv.y);
  vec3 color = mix(sky, u_skyBottom * 1.06, smoothstep(0.35, 0.0, v_uv.y) * 0.5);
  // the one light, top right: the sun by day, the moon at night
  float sd = length(p - vec2(aspect * 0.78, 0.92));
  color += u_glow * exp(-sd * sd * 5.0) * 0.28;
  float band = smoothstep(0.55, 0.8, v_uv.y) * (1.0 - smoothstep(0.9, 1.0, v_uv.y));
  if (band > 0.01) {
    float streak = fbm(vec2(p.x * 1.6 - t * 0.006, p.y * 12.0));
    color = mix(color, u_cloud * 0.98, smoothstep(0.52, 0.78, streak) * band * 0.35);
  }
  if (u_count > 5.5) color = cloudPass(color, sky, p, aspect, t, 0.006, 0.10, 0.84, vec2(0.20, 0.10), 43.7, 1.0);
  if (u_count > 4.5) color = cloudPass(color, sky, p, aspect, t, 0.008, 0.62, 0.73, vec2(0.24, 0.12), 71.3, 0.85);
  if (u_count > 3.5) color = cloudPass(color, sky, p, aspect, t, 0.011, 0.33, 0.60, vec2(0.34, 0.16), 17.3, 0.55);
  if (u_count > 2.5) color = cloudPass(color, sky, p, aspect, t, 0.013, 0.80, 0.47, vec2(0.30, 0.15), 29.9, 0.45);
  if (u_count > 1.5) color = cloudPass(color, sky, p, aspect, t, 0.016, 0.05, 0.35, vec2(0.46, 0.20), 91.1, 0.15);
  color = cloudPass(color, sky, p, aspect, t, 0.020, 0.48, 0.20, vec2(0.56, 0.24), 57.2, 0.0);
  gl_FragColor = vec4(color, 1.0);
}
`;

// day: sky top, sky bottom, cloud, light · night: the same four
const TOKENS = [
  "--em-blue-600",
  "--em-sky-400",
  "--em-ink-0",
  "--em-ink-0",
  "--em-ink-975",
  "--em-blue-900",
  "--em-ink-600",
  "--em-blue-200",
] as const;

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

/**
 * Drifting clouds over a day sky, or a moonlit night sky in the dark theme (follows the class on
 * <html>). Fills its box; children sit on top. Without WebGL the box shows the sky gradient.
 */
export function CloudSky({
  className,
  children,
  speed = 1,
  count = 6,
}: {
  className?: string;
  children?: ReactNode;
  /** Drift speed, 1 = the default drift. */
  speed?: number;
  /** Clouds on screen, 1 to 6. */
  count?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = useTokenColors(TOKENS);
  const opts = useRef({ speed, count });
  opts.current = { speed, count };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    const vert = compile(gl, gl.VERTEX_SHADER, VERT);
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vert || !frag) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.bindAttribLocation(program, 0, "a_pos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const loc = {
      res: u("u_res"),
      time: u("u_time"),
      count: u("u_count"),
      cloud: u("u_cloud"),
      top: u("u_skyTop"),
      bottom: u("u_skyBottom"),
      glow: u("u_glow"),
      shade: u("u_shade"),
    };
    const sets = [0, 4].map((at) => colors.slice(at, at + 4).map(rgb));

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let on = false;
    let shown = 0;
    let last = performance.now();

    const draw = () => {
      const night = document.documentElement.classList.contains("dark");
      const [top, bottom, cloud, glow] = sets[night ? 1 : 0] ?? [];
      if (!top || !bottom || !cloud || !glow) return;
      gl.uniform1f(loc.time, shown + 40);
      gl.uniform1f(loc.count, Math.min(6, Math.max(1, opts.current.count)));
      gl.uniform3f(loc.top, ...top);
      gl.uniform3f(loc.bottom, ...bottom);
      gl.uniform3f(loc.cloud, ...cloud);
      gl.uniform3f(loc.glow, ...glow);
      gl.uniform1f(loc.shade, night ? 0.45 : 0.6);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now: number) => {
      // time only moves while drawn, so the sky resumes where it was left
      shown += (Math.min(now - last, 100) / 1000) * opts.current.speed;
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const play = (want: boolean) => {
      if (still || want === on) return;
      on = want;
      cancelAnimationFrame(frame);
      if (on) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc.res, w, h);
      draw();
    };
    const sized = new ResizeObserver(resize);
    sized.observe(canvas);
    resize();
    const seen = new IntersectionObserver(([e]) => play(!!e?.isIntersecting && !document.hidden));
    seen.observe(canvas);
    const onVisibility = () => play(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const unwatch = watchTheme(draw);

    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      unwatch();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, [colors]);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-linear-to-b from-(--em-blue-600) to-(--em-sky-400) dark:from-(--em-ink-975) dark:to-(--em-blue-900)",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="vt-live pointer-events-none absolute inset-0 size-full"
      />
      {children}
    </div>
  );
}
