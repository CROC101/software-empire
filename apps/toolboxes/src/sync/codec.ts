/**
 * Turns what an app keeps in IndexedDB (structured-clone values: Blobs, typed arrays, Dates, Maps…)
 * into bytes and back, so a database can travel as one file. JSON with tagged values; binary is
 * base64. Anything that cannot leave the browser (file handles, class instances) throws.
 */

type Tagged = { $: string; [k: string]: unknown };

const TYPED = {
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
} as const;
type TypedName = keyof typeof TYPED;

function toBase64(bytes: Uint8Array) {
  let s = "";
  // String.fromCharCode takes arguments on the stack: go in 32 KiB slices
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64: string) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const bytesOf = (v: ArrayBufferView) => new Uint8Array(v.buffer, v.byteOffset, v.byteLength);

async function enc(v: unknown): Promise<unknown> {
  if (v === null || typeof v === "boolean" || typeof v === "string") return v;
  if (v === undefined) return { $: "u" };
  if (typeof v === "number")
    return Number.isFinite(v) && !Object.is(v, -0)
      ? v
      : { $: "n", v: Object.is(v, -0) ? "-0" : String(v) };
  if (typeof v === "bigint") return { $: "bi", v: v.toString() };
  if (Array.isArray(v)) return Promise.all(v.map(enc));
  if (v instanceof Date) return { $: "d", v: v.getTime() };
  if (v instanceof RegExp) return { $: "r", s: v.source, f: v.flags };
  if (v instanceof ArrayBuffer) return { $: "ab", v: toBase64(new Uint8Array(v)) };
  if (v instanceof DataView) return { $: "dv", v: toBase64(bytesOf(v)) };
  if (ArrayBuffer.isView(v)) {
    const t = v.constructor.name;
    if (!(t in TYPED)) throw new TypeError(`cannot sync ${t}`);
    return { $: "ta", t, v: toBase64(bytesOf(v)) };
  }
  if (v instanceof Blob) {
    const data = toBase64(new Uint8Array(await v.arrayBuffer()));
    return v instanceof File
      ? { $: "f", n: v.name, t: v.type, m: v.lastModified, v: data }
      : { $: "bl", t: v.type, v: data };
  }
  if (v instanceof Map)
    return {
      $: "m",
      v: await Promise.all([...v].map(async ([k, x]) => [await enc(k), await enc(x)])),
    };
  if (v instanceof Set) return { $: "s", v: await Promise.all([...v].map(enc)) };
  const proto = Object.getPrototypeOf(v) as unknown;
  if (typeof v === "object" && (proto === Object.prototype || proto === null)) {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = await enc(x);
    return { $: "o", v: o };
  }
  throw new TypeError(`cannot sync ${Object.prototype.toString.call(v)}`);
}

function dec(v: unknown): unknown {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(dec);
  const t = v as Tagged;
  switch (t.$) {
    case "u":
      return undefined;
    case "n":
      return Number(t.v);
    case "bi":
      return BigInt(t.v as string);
    case "d":
      return new Date(t.v as number);
    case "r":
      return new RegExp(t.s as string, t.f as string);
    case "ab":
      return fromBase64(t.v as string).buffer;
    case "dv":
      return new DataView(fromBase64(t.v as string).buffer);
    case "ta": {
      const Ctor = TYPED[t.t as TypedName] as unknown as new (b: ArrayBuffer) => ArrayBufferView;
      if (!((t.t as string) in TYPED)) throw new TypeError(`unknown array ${String(t.t)}`);
      return new Ctor(fromBase64(t.v as string).buffer);
    }
    case "bl":
      return new Blob([fromBase64(t.v as string)], { type: t.t as string });
    case "f":
      return new File([fromBase64(t.v as string)], t.n as string, {
        type: t.t as string,
        lastModified: t.m as number,
      });
    case "m":
      return new Map((t.v as [unknown, unknown][]).map(([k, x]) => [dec(k), dec(x)]));
    case "s":
      return new Set((t.v as unknown[]).map(dec));
    case "o":
      return Object.fromEntries(
        Object.entries(t.v as Record<string, unknown>).map(([k, x]) => [k, dec(x)]),
      );
    default:
      throw new TypeError(`unknown tag ${t.$}`);
  }
}

export async function encode(value: unknown): Promise<Uint8Array> {
  return new TextEncoder().encode(JSON.stringify(await enc(value)));
}

export function decode(bytes: Uint8Array): unknown {
  return dec(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function sha256(bytes: Uint8Array) {
  const d = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
  return Array.from(d, (b) => b.toString(16).padStart(2, "0")).join("");
}
