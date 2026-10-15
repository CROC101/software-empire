/// เครื่องมือความปลอดภัย — ใช้ Web Crypto ของเบราว์เซอร์ (crypto.subtle / getRandomValues)
/// **ห้ามใช้ Math.random กับงานความปลอดภัย** (บรีฟ) · ข้อมูลไม่ออกจากเครื่องผู้ใช้

export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  let binary = "";

  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);

  return btoa(binary);
}

/// MD5 (RFC 1321) — Web Crypto ไม่มีให้ เขียนเองเพื่อใช้ตรวจ checksum เท่านั้น **ไม่ปลอดภัยสำหรับรหัสผ่าน**
export function md5(data: Uint8Array): string {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = Array.from(
    { length: 64 },
    (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0,
  );
  const length = data.length;
  const padded = new Uint8Array((((length + 8) >> 6) + 1) * 64);

  padded.set(data);
  padded[length] = 0x80;

  const view = new DataView(padded.buffer);

  view.setUint32(padded.length - 8, (length * 8) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor((length * 8) / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunk = 0; chunk < padded.length; chunk += 64) {
    const M = Array.from({ length: 16 }, (_, i) => view.getUint32(chunk + i * 4, true));
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;

      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }

      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);

  [a0, b0, c0, d0].forEach((v, i) => ov.setUint32(i * 4, v, true));

  return toHex(out);
}

export async function hashBytes(data: Uint8Array, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === "MD5") return md5(data);

  return toHex(await crypto.subtle.digest(algorithm, data as Uint8Array<ArrayBuffer>));
}

export async function hmac(
  message: string,
  secret: string,
  algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));

  return { hex: toHex(sig), base64: toBase64(sig) };
}

/// Base32 (RFC 4648) — secret ของแอปยืนยันตัวตน
export function base32Decode(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.toUpperCase().replace(/[\s=-]/gu, "");

  if (!clean || /[^A-Z2-7]/u.test(clean)) throw new Error("secret ต้องเป็น Base32 (A–Z และ 2–7)");

  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const ch of clean) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(out);
}

/// TOTP (RFC 6238) — รหัส 6 หลักแบบ Google Authenticator
export async function totp(
  secret: string,
  options: {
    period?: number;
    digits?: number;
    algorithm?: "SHA-1" | "SHA-256" | "SHA-512";
    time?: number;
  } = {},
) {
  const period = options.period ?? 30;
  const digits = options.digits ?? 6;
  const now = options.time ?? Date.now();
  const counter = Math.floor(now / 1000 / period);
  const msg = new Uint8Array(8);
  const view = new DataView(msg.buffer);

  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);

  const keyBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as Uint8Array<ArrayBuffer>,
    { name: "HMAC", hash: options.algorithm ?? "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const offset = sig[sig.length - 1] & 0x0f;
  const binary =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  const code = String(binary % 10 ** digits).padStart(digits, "0");
  const remaining = period - (Math.floor(now / 1000) % period);

  return { code, remaining };
}

/// เลขสุ่มจริงจาก crypto ในช่วง [0, max) แบบไม่เอนเอียง (rejection sampling)
export function randomInt(max: number): number {
  if (max <= 0 || max > 2 ** 32) throw new Error("ช่วงสุ่มไม่ถูกต้อง");

  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);

  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);

  return buf[0] % max;
}

export const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

const AMBIGUOUS = /[O0Il1|]/gu;

export function generatePassword(options: {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
}): string {
  if (!Number.isInteger(options.length) || options.length < 6 || options.length > 128)
    throw new Error("ความยาวต้องอยู่ระหว่าง 6–128");

  const groups = (["upper", "lower", "digits", "symbols"] as const)
    .filter((k) => options[k])
    .map((k) => (options.avoidAmbiguous ? CHARSETS[k].replace(AMBIGUOUS, "") : CHARSETS[k]));

  if (!groups.length) throw new Error("เลือกชุดตัวอักษรอย่างน้อย 1 ชุด");

  const all = groups.join("");
  // รับประกันว่ามีครบทุกชุดที่เลือก แล้วสลับตำแหน่ง
  const chars = groups.map((g) => g[randomInt(g.length)]);

  while (chars.length < options.length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);

    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/// ประเมินความแข็งแรงจากเอนโทรปีและรูปแบบที่เดาง่าย (ไม่ส่งรหัสไปไหน)
export function passwordStrength(password: string) {
  let pool = 0;

  if (/[a-z]/u.test(password)) pool += 26;
  if (/[A-Z]/u.test(password)) pool += 26;
  if (/\d/u.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/u.test(password)) pool += 33;

  let entropy = password.length * Math.log2(Math.max(pool, 1));
  const issues: string[] = [];

  if (password.length < 12) issues.push("สั้นกว่า 12 ตัว");
  if (/(.)\1{2,}/u.test(password)) {
    issues.push("มีตัวซ้ำติดกันหลายตัว");
    entropy *= 0.8;
  }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv)/iu.test(password)) {
    issues.push("มีลำดับที่เดาง่าย เช่น 1234 หรือ qwer");
    entropy *= 0.7;
  }
  if (/^(password|admin|letmein|welcome|iloveyou|123456|qwerty)/iu.test(password)) {
    issues.push("ขึ้นต้นด้วยคำที่ใช้บ่อยที่สุด");
    entropy *= 0.4;
  }
  if (pool <= 26) issues.push("ใช้ตัวอักษรชนิดเดียว");

  const score = entropy < 28 ? 0 : entropy < 36 ? 1 : entropy < 60 ? 2 : entropy < 80 ? 3 : 4;
  // เดาออฟไลน์ 10 พันล้านครั้ง/วินาที
  const seconds = 2 ** entropy / 1e10 / 2;

  return {
    score,
    label: ["อ่อนมาก", "อ่อน", "พอใช้", "แข็งแรง", "แข็งแรงมาก"][score],
    entropy: Math.round(entropy),
    crackTime: humanDuration(seconds),
    issues,
  };
}

export function humanDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds > 1e15 * 31557600) return "นานกว่าอายุจักรวาล";
  if (seconds < 1) return "ไม่ถึง 1 วินาที";

  const units: [number, string][] = [
    [31557600 * 1e6, "ล้านปี"],
    [31557600, "ปี"],
    [2629800, "เดือน"],
    [86400, "วัน"],
    [3600, "ชั่วโมง"],
    [60, "นาที"],
    [1, "วินาที"],
  ];

  for (const [size, label] of units)
    if (seconds >= size)
      return `ราว ${Math.round(seconds / size).toLocaleString("th-TH")} ${label}`;

  return "ไม่ถึง 1 วินาที";
}

export function randomToken(bits: number, format: "hex" | "base64url" | "base32"): string {
  if (![64, 128, 192, 256, 384, 512].includes(bits)) throw new Error("ขนาดต้องเป็น 64–512 บิต");

  const bytes = crypto.getRandomValues(new Uint8Array(bits / 8));

  if (format === "hex") return toHex(bytes);
  if (format === "base64url")
    return toBase64(bytes).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "";
  let bitsLeft = 0;
  let value = 0;

  for (const b of bytes) {
    value = (value << 8) | b;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      out += alphabet[(value >>> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }

  if (bitsLeft > 0) out += alphabet[(value << (5 - bitsLeft)) & 31];

  return out;
}
