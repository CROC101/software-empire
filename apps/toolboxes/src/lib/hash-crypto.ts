export type DigestAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export type AesMode = "encrypt" | "decrypt";

const ENVELOPE_PREFIX = "EMPIRE-AES-GCM:v1:600000";
const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const MAX_TEXT_BYTES = 1_000_000;
const MAX_ENVELOPE_CHARACTERS = 2_000_000;

function getSubtleCrypto(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับ Web Crypto หรือหน้าเว็บไม่ได้อยู่บน HTTPS/localhost");
  }
  return globalThis.crypto.subtle;
}

function assertTextSize(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_TEXT_BYTES) throw new Error("รองรับข้อความไม่เกิน 1 MB ต่อครั้ง");
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const compact = value.replace(/\s/g, "");
  if (!compact || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
    throw new Error("รูปแบบ Base64 ไม่ถูกต้อง");
  }
  try {
    const binary = atob(compact.padEnd(Math.ceil(compact.length / 4) * 4, "="));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("รูปแบบ Base64 ไม่ถูกต้อง");
  }
}

async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const passphraseKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

export async function hashText(text: string, algorithm: DigestAlgorithm): Promise<string> {
  const data = new TextEncoder().encode(text);
  assertTextSize(data);
  const digest = await getSubtleCrypto().digest(algorithm, data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function encodeBase64Text(text: string): string {
  const bytes = new TextEncoder().encode(text);
  assertTextSize(bytes);
  return bytesToBase64(bytes);
}

export function decodeBase64Text(encoded: string): string {
  if (encoded.length > MAX_ENVELOPE_CHARACTERS) throw new Error("รองรับข้อมูล Base64 ไม่เกิน 2 MB");
  const bytes = base64ToBytes(encoded);
  if (bytes.byteLength > MAX_TEXT_BYTES) throw new Error("ข้อความหลังถอดรหัสมีขนาดเกิน 1 MB");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("ข้อมูล Base64 นี้ไม่ใช่ข้อความ UTF-8 ที่ถูกต้อง");
  }
}

export async function transformAesText(
  text: string,
  passphrase: string,
  mode: AesMode,
): Promise<string> {
  if (!passphrase) throw new Error("กรอก passphrase ก่อน");
  const subtle = getSubtleCrypto();

  if (mode === "encrypt") {
    const plainBytes = new TextEncoder().encode(text);
    assertTextSize(plainBytes);
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveAesKey(passphrase, salt, ["encrypt"]);
    const ciphertext = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: new TextEncoder().encode(ENVELOPE_PREFIX),
        tagLength: 128,
      },
      key,
      plainBytes,
    );
    return `${ENVELOPE_PREFIX}:${bytesToBase64(salt)}:${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
  }

  if (text.length > MAX_ENVELOPE_CHARACTERS)
    throw new Error("ข้อมูลเข้ารหัสต้องมีขนาดไม่เกิน 2 MB");
  const [prefix, version, iterationText, saltText, ivText, ciphertextText, ...extra] = text
    .trim()
    .split(":");
  if (
    prefix !== "EMPIRE-AES-GCM" ||
    version !== "v1" ||
    iterationText !== String(PBKDF2_ITERATIONS) ||
    !saltText ||
    !ivText ||
    !ciphertextText ||
    extra.length > 0
  ) {
    throw new Error("รูปแบบข้อมูลไม่ถูกต้อง หรือไม่ใช่ไฟล์เข้ารหัส EMPIRE AES-GCM");
  }

  const salt = base64ToBytes(saltText);
  const iv = base64ToBytes(ivText);
  const ciphertext = base64ToBytes(ciphertextText);
  if (
    salt.byteLength !== SALT_LENGTH ||
    iv.byteLength !== IV_LENGTH ||
    ciphertext.byteLength < 16
  ) {
    throw new Error("ข้อมูล salt, IV หรือ ciphertext ไม่ครบตามรูปแบบ");
  }

  try {
    const key = await deriveAesKey(passphrase, salt, ["decrypt"]);
    const plaintext = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: new TextEncoder().encode(ENVELOPE_PREFIX),
        tagLength: 128,
      },
      key,
      toArrayBuffer(ciphertext),
    );
    if (plaintext.byteLength > MAX_TEXT_BYTES) throw new Error("ข้อความหลังถอดรหัสมีขนาดเกิน 1 MB");
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    } catch {
      throw new Error("ข้อมูลที่ถอดรหัสได้ไม่ใช่ข้อความ UTF-8");
    }
  } catch (cause) {
    if (cause instanceof Error && cause.message === "ข้อความหลังถอดรหัสมีขนาดเกิน 1 MB")
      throw cause;
    if (cause instanceof Error && cause.message === "ข้อมูลที่ถอดรหัสได้ไม่ใช่ข้อความ UTF-8")
      throw cause;
    throw new Error("ถอดรหัสไม่สำเร็จ ตรวจ passphrase หรือข้อมูลเข้ารหัส", { cause });
  }
}
