"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { whenNear } from "../lib/when-near";

/**
 * Shafts of light fanning in from a corner, two coloured layers that shimmer and sway, leaning
 * toward the pointer. Meant for night scenes: light from the moon's corner (top right).
 *
 * After React Bits' SideRays (MIT): same shader and props. Changes: the WebGL set-up waits until
 * the canvas is near the screen (whenNear), the pixel ratio is capped at 1.5, the loop stops off
 * screen and in hidden tabs, reduced motion shows one still frame (the original kept drifting at
 * 0.3×), and a lost context is not rebuilt (the canvas just stays empty). Colours are props: pass
 * token values (useTokenColors), never hex literals.
 */

const PIXEL_BUDGET = 2.4e6;
const TAU = Math.PI * 2;

export type SideRaysOrigin =
  "top-right" | "top-left" | "bottom-right" | "bottom-left" | "right" | "left";

const ORIGINS: Record<SideRaysOrigin, { flipX: number; flipY: number; side: number }> = {
  "top-right": { flipX: 0, flipY: 0, side: 0 },
  "top-left": { flipX: 1, flipY: 0, side: 0 },
  "bottom-right": { flipX: 0, flipY: 1, side: 0 },
  "bottom-left": { flipX: 1, flipY: 1, side: 0 },
  right: { flipX: 0, flipY: 0, side: 1 },
  left: { flipX: 1, flipY: 0, side: 1 },
};

const VERTEX = `#version 300 es
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBlend;
uniform float uIntensity;
uniform float uSpread;
uniform float uDensity;
uniform float uSharpness;
uniform float uFalloff;
uniform float uGlow;
uniform float uSaturation;
uniform float uDust;
uniform float uOpacity;
uniform float uReveal;
uniform float uLight;
uniform vec3 uFrame;
uniform float uAim;
uniform vec3 uFocus;
uniform float uSway;
out vec4 fragColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

float shafts(float u, float t, float seed, float aa) {
  float sway = (0.4 * sin(t * 0.31 + seed) + 0.24 * sin(t * 0.17 + seed * 2.3)) * uSway;
  float n = 0.7 * noise(vec2(u + sway + seed, t * 0.3)) + 0.3 * noise(vec2(u * 2.4 + sway * 1.5 + seed * 1.7, t * 0.45 + 3.0));
  float width = mix(0.5, 0.1, uSharpness);
  float s = mix(smoothstep(0.5 - width, 0.5 + width, n), 0.5, aa);
  return mix(0.05, 1.0, s);
}

float motes(vec2 p, float cell, float t, float seed) {
  p += vec2(t * 0.021, -t * 0.013) + seed * 7.31;
  vec2 grid = p / cell;
  vec2 id = floor(grid);
  vec2 f = grid - id;
  float h = hash(id + seed);
  if (h > 0.5) return 0.0;
  vec2 center = 0.25 + 0.5 * vec2(hash(id + 1.7 + seed), hash(id + 3.1 + seed));
  center += 0.1 * vec2(sin(t * 0.7 + h * 31.0), cos(t * 0.6 + h * 23.0));
  float size = mix(0.035, 0.09, hash(id + 5.3 + seed));
  float edge = length(fwidth(grid)) * 0.7;
  float twinkle = 0.55 + 0.45 * sin(t * 1.9 + h * 41.0);
  return (1.0 - smoothstep(size - edge, size + edge, length(f - center))) * twinkle;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 q = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  if (uFrame.x > 0.5) q.x = -q.x;
  if (uFrame.y > 0.5) q.y = -q.y;
  vec2 source = uFrame.z > 0.5 ? vec2(aspect * 0.5 + 0.42, 0.3) : vec2(aspect * 0.5 + 0.1, 0.62);
  float heading = (uFrame.z > 0.5 ? 3.42 : -2.48) + uAim + 0.035 * sin(uTime * 0.21) * uSway;
  vec2 v = q - source;
  float r = length(v);
  float angle = mod(atan(v.y, v.x) - heading + 3.14159265, 6.28318531) - 3.14159265;
  float t = uTime;
  float u = angle * uDensity;
  float aa = smoothstep(0.12, 0.45, fwidth(u));
  float offset = uSpread * 0.22;
  float fanA = exp(-pow((angle + offset) / uSpread, 2.0) * 1.4);
  float fanB = exp(-pow((angle - offset) / (uSpread * 1.15), 2.0) * 1.4);
  float focus = 1.0 + uFocus.z * exp(-pow((angle - uFocus.x) / uFocus.y, 2.0));
  float lightA = fanA * shafts(u, t, 0.0, aa) * focus;
  float lightB = fanB * shafts(u * 0.83, t * 0.6, 17.0, aa) * focus;
  float reach = 1.0 / (1.0 + pow(r / 0.4, uFalloff));
  vec3 glowColor = mix(uColorA, uColorB, uBlend);
  vec3 light = (uColorA * lightA * (1.0 - uBlend) + uColorB * lightB * uBlend) * 2.0 * reach;
  light += glowColor * uGlow * exp(-pow(r / 0.4, 2.0));
  if (uDust > 0.0) {
    float sparkle = motes(q, 0.06, t, 0.0) + 0.7 * motes(q, 0.038, t * 0.8, 9.0);
    light += mix(glowColor, vec3(1.0), 0.6) * sparkle * (lightA + lightB) * reach * uDust * 2.5;
  }
  light *= uIntensity * (1.0 - smoothstep(uReveal * 2.6 - 0.45, uReveal * 2.6, r)) * smoothstep(0.0, 0.35, uReveal);
  float gray = dot(light, vec3(0.2126, 0.7152, 0.0722));
  light = max(mix(vec3(gray), light, uSaturation), 0.0);
  float peak = max(light.r, max(light.g, light.b));
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;
  if (uLight > 0.5) {
    vec3 ink = pow(light / max(peak, 1e-4), vec3(2.0)) * 0.75;
    float alpha = clamp(pow(1.0 - exp(-peak * 2.6), 2.5) * 0.9 * uOpacity + grain, 0.0, 1.0);
    fragColor = vec4(pow(ink, vec3(1.0 / 2.2)) * alpha, alpha);
    return;
  }
  float mapped = 1.0 - exp(-peak);
  vec3 tone = light * (mapped / max(peak, 1e-4));
  tone = mix(tone, vec3(mapped), smoothstep(0.7, 1.0, mapped) * 0.55);
  vec3 shown = clamp(tone * uOpacity, 0.0, 1.0);
  float alpha = max(shown.r, max(shown.g, shown.b));
  vec3 color = clamp(shown * alpha + grain, 0.0, 1.0);
  fragColor = vec4(min(color, vec3(alpha)), alpha);
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const wrapAngle = (angle: number) => ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

type Rgb = [number, number, number];

function parseColor(value: string): Rgb {
  const text = value.trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text)?.[1];
  if (hex) {
    const full = hex.length === 3 ? hex.replace(/./g, (d) => d + d) : hex;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb)
    return [rgb[1], rgb[2], rgb[3]].map((c) => clamp(parseFloat(c ?? "0") / 255, 0, 1)) as Rgb;
  return [1, 1, 1];
}

const geometryFor = (frame: { side: number }, aspect: number) => ({
  source: frame.side ? [aspect * 0.5 + 0.42, 0.3] : [aspect * 0.5 + 0.1, 0.62],
  heading: frame.side ? 3.42 : -2.48,
});

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? gl.createProgram() : null;
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

export interface SideRaysProps {
  /** colour of the upper layer of the fan */
  rayColor1?: string;
  /** colour of the lower layer */
  rayColor2?: string;
  /** 0 = only the first colour, 1 = only the second */
  blend?: number;
  origin?: SideRaysOrigin;
  speed?: number;
  intensity?: number;
  spread?: number;
  density?: number;
  /** 0 soft haze … 1 defined beams */
  sharpness?: number;
  /** degrees */
  tilt?: number;
  /** lower reaches further */
  falloff?: number;
  glow?: number;
  saturation?: number;
  /** 0–1 specks drifting inside the rays */
  dust?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  intro?: boolean;
  /** soft tinted light for light backgrounds */
  lightMode?: boolean;
  opacity?: number;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SideRays({
  rayColor1 = "#FFC46B",
  rayColor2 = "#96c8ff",
  blend = 0.6,
  origin = "top-right",
  speed = 2.5,
  intensity = 2,
  spread = 2,
  density = 5,
  sharpness = 0.5,
  tilt = 0,
  falloff = 1.6,
  glow = 1,
  saturation = 1,
  dust = 0,
  followMouse = true,
  mouseInfluence = 0.5,
  intro = true,
  lightMode = false,
  opacity = 1,
  maxDevicePixelRatio = 1.5,
  className,
  style,
}: SideRaysProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const wakeRef = React.useRef<() => void>(() => undefined);

  const settings = {
    colorA: parseColor(rayColor1),
    colorB: parseColor(rayColor2),
    blend: clamp(blend, 0, 1),
    frame: ORIGINS[origin],
    speed: Math.max(0, speed) * 0.4,
    intensity: Math.max(0, intensity) * 0.75,
    spread: clamp(spread, 0.1, 8) * 0.225,
    density: clamp(density, 1, 40),
    sharpness: clamp(sharpness, 0, 1),
    tilt: (clamp(tilt, -180, 180) * Math.PI) / 180,
    falloff: clamp(falloff, 0.2, 6),
    glow: Math.max(0, glow) * 1.2,
    saturation: Math.max(0, saturation),
    dust: clamp(dust, 0, 1),
    followMouse,
    mouseInfluence: clamp(mouseInfluence, 0, 1),
    intro,
    light: lightMode,
    opacity: clamp(opacity, 0, 1),
    maxRatio: clamp(maxDevicePixelRatio, 0.5, 1.5),
  };
  const settingsRef = React.useRef(settings);
  React.useLayoutEffect(() => {
    settingsRef.current = settings;
    wakeRef.current();
  });

  React.useEffect(() => {
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
      const shader = gl ? link(gl) : null;
      if (!gl || !shader) return undefined;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const vao = gl.createVertexArray();
      const size = { width: 1, height: 1 };
      const pointer = { x: 0, y: 0, inside: false };
      const aim = { value: 0, velocity: 0 };
      const focus = { angle: 0, strength: 0 };
      let time = Math.random() * 100;
      let reveal = settingsRef.current.intro && !reduced ? 0 : 1;
      let raf = 0;
      let last = 0;
      let visible = true;
      let pageVisible = document.visibilityState !== "hidden";
      let lost = false;

      const resize = () => {
        const s = settingsRef.current;
        const rect = container.getBoundingClientRect();
        const cssWidth = Math.max(1, rect.width);
        const cssHeight = Math.max(1, rect.height);
        const ratio = Math.min(
          window.devicePixelRatio || 1,
          s.maxRatio,
          Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight)),
        );
        const width = Math.max(1, Math.round(cssWidth * ratio));
        const height = Math.max(1, Math.round(cssHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        size.width = cssWidth;
        size.height = cssHeight;
      };

      const pointerAngle = (s: typeof settings) => {
        let x = (pointer.x - size.width / 2) / size.height;
        let y = (size.height / 2 - pointer.y) / size.height;
        if (s.frame.flipX) x = -x;
        if (s.frame.flipY) y = -y;
        const { source, heading } = geometryFor(s.frame, size.width / size.height);
        return wrapAngle(Math.atan2(y - (source[1] ?? 0), x - (source[0] ?? 0)) - heading - s.tilt);
      };

      const frame = (now: number) => {
        raf = 0;
        if (lost) return;
        const s = settingsRef.current;
        const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
        last = Math.max(last, now);
        if (!reduced) time += dt * s.speed;
        if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.6);

        const tracking = s.followMouse && pointer.inside && !reduced;
        const pointed = tracking ? pointerAngle(s) : 0;
        const target = tracking ? clamp(pointed, -s.spread, s.spread) * s.mouseInfluence : 0;
        const focusTarget = tracking ? s.mouseInfluence : 0;
        const ease = 1 - Math.exp(-dt * 6);
        if (tracking) {
          focus.angle +=
            (clamp(pointed - aim.value, -s.spread * 1.5, s.spread * 1.5) - focus.angle) * ease;
        }
        focus.strength += (focusTarget - focus.strength) * ease;
        const stiffness = 18;
        const damping = 2 * Math.sqrt(stiffness);
        aim.velocity += ((target - aim.value) * stiffness - aim.velocity * damping) * dt;
        aim.value += aim.velocity * dt;

        const u = shader.uniforms;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(shader.program);
        gl.bindVertexArray(vao);
        gl.uniform2f(u.uResolution ?? null, canvas.width, canvas.height);
        gl.uniform1f(u.uTime ?? null, time);
        gl.uniform3f(u.uColorA ?? null, ...s.colorA);
        gl.uniform3f(u.uColorB ?? null, ...s.colorB);
        gl.uniform1f(u.uBlend ?? null, s.blend);
        gl.uniform1f(u.uIntensity ?? null, s.intensity);
        gl.uniform1f(u.uSpread ?? null, s.spread);
        gl.uniform1f(u.uDensity ?? null, s.density);
        gl.uniform1f(u.uSharpness ?? null, s.sharpness);
        gl.uniform1f(u.uFalloff ?? null, s.falloff);
        gl.uniform1f(u.uGlow ?? null, s.glow);
        gl.uniform1f(u.uSaturation ?? null, s.saturation);
        gl.uniform1f(u.uDust ?? null, s.dust);
        gl.uniform1f(u.uOpacity ?? null, s.opacity);
        gl.uniform1f(u.uReveal ?? null, 1 - Math.pow(1 - reveal, 3));
        gl.uniform1f(u.uLight ?? null, s.light ? 1 : 0);
        gl.uniform3f(u.uFrame ?? null, s.frame.flipX, s.frame.flipY, s.frame.side);
        gl.uniform1f(u.uAim ?? null, s.tilt + aim.value);
        gl.uniform3f(
          u.uFocus ?? null,
          focus.angle,
          Math.max(0.06, s.spread * 0.25),
          focus.strength * 1.4,
        );
        gl.uniform1f(u.uSway ?? null, reduced ? 0 : 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        const settling =
          Math.abs(target - aim.value) > 1e-4 ||
          Math.abs(aim.velocity) > 1e-4 ||
          Math.abs(focusTarget - focus.strength) > 1e-3;
        // reduced motion: one still frame, redrawn only on resize or a prop change
        const busy = (s.speed > 0 && !reduced) || reveal < 1 || settling;
        if (busy && visible && pageVisible) raf = requestAnimationFrame(frame);
      };

      const wake = () => {
        if (raf || lost || !visible || !pageVisible) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      wakeRef.current = () => {
        resize();
        wake();
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;
        wake();
      };
      const onLeave = () => {
        pointer.inside = false;
        wake();
      };
      const onPointerUp = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") onLeave();
      };
      const onLost = (event: Event) => {
        event.preventDefault();
        lost = true;
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const onVisibility = () => {
        pageVisible = document.visibilityState !== "hidden";
        wake();
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      window.addEventListener("pointercancel", onPointerUp, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      canvas.addEventListener("webglcontextlost", onLost);
      const resizeObserver = new ResizeObserver(() => {
        resize();
        wake();
      });
      resizeObserver.observe(container);
      const intersection = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        wake();
      });
      intersection.observe(container);

      resize();
      wake();

      return () => {
        cancelAnimationFrame(raf);
        wakeRef.current = () => undefined;
        resizeObserver.disconnect();
        intersection.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("webglcontextlost", onLost);
        if (!gl.isContextLost()) {
          gl.deleteVertexArray(vao);
          gl.deleteProgram(shader.program);
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none relative h-full w-full overflow-hidden", className)}
      style={style}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
