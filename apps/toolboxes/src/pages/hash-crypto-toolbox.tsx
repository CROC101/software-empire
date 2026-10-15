import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  UnlockKeyhole,
} from "lucide-react";
import {
  decodeBase64Text,
  encodeBase64Text,
  hashText,
  transformAesText,
  type AesMode,
  type DigestAlgorithm,
} from "@/lib/hash-crypto";

type ToolMode = "hash" | "base64" | "aes";
type Base64Mode = "encode" | "decode";

const DIGESTS: { value: DigestAlgorithm; label: string; warning?: string }[] = [
  { value: "SHA-256", label: "SHA-256" },
  { value: "SHA-384", label: "SHA-384" },
  { value: "SHA-512", label: "SHA-512" },
  {
    value: "SHA-1",
    label: "SHA-1 (legacy)",
    warning: "SHA-1 มีจุดอ่อนด้าน collision ไม่ควรใช้ปกป้องข้อมูลจริง",
  },
];

const TABS: { value: ToolMode; label: string; icon: typeof Fingerprint }[] = [
  { value: "hash", label: "Hash", icon: Fingerprint },
  { value: "base64", label: "Base64", icon: ShieldCheck },
  { value: "aes", label: "AES", icon: LockKeyhole },
];

export default function HashCryptoToolboxPage() {
  const [mode, setMode] = useState<ToolMode>("hash");
  const [digest, setDigest] = useState<DigestAlgorithm>("SHA-256");
  const [hashInput, setHashInput] = useState("");
  const [base64Mode, setBase64Mode] = useState<Base64Mode>("encode");
  const [base64Input, setBase64Input] = useState("");
  const [aesMode, setAesMode] = useState<AesMode>("encrypt");
  const [aesInput, setAesInput] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const clearResult = () => {
    setResult("");
    setError("");
    setCopied(false);
  };

  const run = async () => {
    setBusy(true);
    clearResult();
    try {
      if (mode === "hash") {
        setResult(await hashText(hashInput, digest));
      } else if (mode === "base64") {
        if (!base64Input.trim()) throw new Error("กรอกข้อความหรือ Base64 ก่อน");
        setResult(
          base64Mode === "encode" ? encodeBase64Text(base64Input) : decodeBase64Text(base64Input),
        );
      } else {
        setResult(await transformAesText(aesInput, passphrase, aesMode));
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "ทำรายการไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองอีกครั้ง",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch {
      setError("คัดลอกไม่ได้ในเบราว์เซอร์นี้ คุณยังเลือกข้อความผลลัพธ์แล้วคัดลอกเองได้");
    }
  };

  const clearInputs = () => {
    setHashInput("");
    setBase64Input("");
    setAesInput("");
    setPassphrase("");
    clearResult();
  };

  const currentDigest = DIGESTS.find((item) => item.value === digest);
  const inputValue = mode === "hash" ? hashInput : mode === "base64" ? base64Input : aesInput;
  const updateInput =
    mode === "hash" ? setHashInput : mode === "base64" ? setBase64Input : setAesInput;
  const inputLabel =
    mode === "hash"
      ? "ข้อความต้นฉบับ"
      : mode === "base64"
        ? base64Mode === "encode"
          ? "ข้อความที่ต้องการเข้ารหัส Base64"
          : "ข้อความ Base64 ที่ต้องการถอดรหัส"
        : aesMode === "encrypt"
          ? "ข้อความที่ต้องการเข้ารหัส"
          : "ข้อมูล AES-GCM ที่ต้องการถอดรหัส";

  return (
    <main className="min-h-screen bg-surface px-4 py-6 text-on-surface sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-on-surface-variant hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          กลับไปหน้ารวมเครื่องมือ
        </Link>

        <header className="mt-4 rounded-lg border border-surface-variant bg-surface-container p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface text-primary-container">
              <ShieldCheck size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm leading-relaxed text-primary-container">
                Cyber Security · เรียนรู้การแปลงข้อมูล
              </p>
              <h1 className="text-2xl font-bold">Hash &amp; Crypto Toolbox</h1>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                ทดลอง Hash, Base64 และ AES-GCM พร้อมคำอธิบายว่าแต่ละแบบทำอะไรได้และทำอะไรไม่ได้
              </p>
            </div>
          </div>
        </header>

        <div
          className="mt-5 grid grid-cols-3 gap-2"
          role="group"
          aria-label="เลือกเครื่องมือเข้ารหัส"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const selected = mode === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setMode(tab.value);
                  if (tab.value !== "aes") {
                    setAesInput("");
                    setPassphrase("");
                  }
                  clearResult();
                }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${selected ? "border-primary-container bg-primary-container text-primary-foreground" : "border-surface-variant bg-surface-container text-on-surface hover:bg-surface-variant"}`}
              >
                <Icon size={17} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <section
          className="mt-3 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6"
          aria-label={`เครื่องมือ ${TABS.find((tab) => tab.value === mode)?.label}`}
        >
          {mode === "hash" && (
            <>
              <h2 className="text-lg font-semibold">คำนวณ Hash</h2>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                Hash เป็นผลลัพธ์ทางเดียว ข้อความเดิมกู้กลับจาก hash ไม่ได้ และ SHA-256/384/512
                เหมาะกับการเรียนรู้ hash สมัยใหม่
              </p>
              <div className="mt-4">
                <label htmlFor="digest-algorithm" className="mb-1 block text-sm font-medium">
                  อัลกอริทึม
                </label>
                <select
                  id="digest-algorithm"
                  value={digest}
                  onChange={(event) => {
                    setDigest(event.target.value as DigestAlgorithm);
                    clearResult();
                  }}
                  className="min-h-11 w-full max-w-sm rounded-md border border-surface-variant bg-surface-container px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                >
                  {DIGESTS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {currentDigest?.warning && (
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {currentDigest.warning}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  MD5 ไม่รองรับใน Web Crypto และไม่ได้ติดตั้งไลบรารีนอก dependency whitelist ·
                  ห้ามใช้ MD5 หรือ SHA-1 กับระบบความปลอดภัยจริง
                </p>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                  Hash ทั่วไปไม่เหมาะสำหรับเก็บรหัสผ่าน ควรใช้ password hashing ที่ออกแบบมาโดยเฉพาะ
                </p>
              </div>
            </>
          )}

          {mode === "base64" && (
            <>
              <h2 className="text-lg font-semibold">แปลงข้อความ Base64</h2>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                Base64 ใช้แทนข้อมูลไบนารีเป็นตัวอักษร ไม่ใช่การเข้ารหัสเพื่อปกปิดข้อมูล
              </p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="เลือกการแปลง Base64">
                <button
                  type="button"
                  aria-pressed={base64Mode === "encode"}
                  onClick={() => {
                    setBase64Mode("encode");
                    clearResult();
                  }}
                  className={`min-h-10 rounded-md border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${base64Mode === "encode" ? "border-primary-container bg-primary-container text-primary-foreground" : "border-surface-variant bg-surface-container hover:bg-surface-variant"}`}
                >
                  เข้ารหัส
                </button>
                <button
                  type="button"
                  aria-pressed={base64Mode === "decode"}
                  onClick={() => {
                    setBase64Mode("decode");
                    clearResult();
                  }}
                  className={`min-h-10 rounded-md border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${base64Mode === "decode" ? "border-primary-container bg-primary-container text-primary-foreground" : "border-surface-variant bg-surface-container hover:bg-surface-variant"}`}
                >
                  ถอดรหัส
                </button>
              </div>
            </>
          )}

          {mode === "aes" && (
            <>
              <h2 className="text-lg font-semibold">เข้ารหัสข้อความด้วย AES-256-GCM</h2>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                ใช้ passphrase derive key ด้วย PBKDF2-SHA-256 จำนวน 600,000 รอบ พร้อม salt และ IV
                แบบสุ่ม ระบบจะรวมข้อมูลเหล่านี้ไว้ในผลลัพธ์เพื่อใช้ถอดรหัส
              </p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="เลือกโหมด AES">
                <button
                  type="button"
                  aria-pressed={aesMode === "encrypt"}
                  onClick={() => {
                    setAesMode("encrypt");
                    clearResult();
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${aesMode === "encrypt" ? "border-primary-container bg-primary-container text-primary-foreground" : "border-surface-variant bg-surface-container hover:bg-surface-variant"}`}
                >
                  <LockKeyhole size={16} aria-hidden="true" />
                  เข้ารหัส
                </button>
                <button
                  type="button"
                  aria-pressed={aesMode === "decrypt"}
                  onClick={() => {
                    setAesMode("decrypt");
                    clearResult();
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container ${aesMode === "decrypt" ? "border-primary-container bg-primary-container text-primary-foreground" : "border-surface-variant bg-surface-container hover:bg-surface-variant"}`}
                >
                  <UnlockKeyhole size={16} aria-hidden="true" />
                  ถอดรหัส
                </button>
              </div>
              <div className="mt-4">
                <label htmlFor="crypto-passphrase" className="mb-1 block text-sm font-medium">
                  กุญแจข้อความสำหรับ AES (passphrase)
                </label>
                <input
                  id="crypto-passphrase"
                  type="text"
                  autoComplete="off"
                  value={passphrase}
                  onChange={(event) => {
                    setPassphrase(event.target.value);
                    clearResult();
                  }}
                  placeholder="ใช้ passphrase เดิมตอนถอดรหัส"
                  className="min-h-11 w-full rounded-md border border-surface-variant bg-surface-container px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
                />
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                  ค่านี้ใช้สร้างกุญแจเข้ารหัสในเครื่องมือ ไม่ใช่บัญชีผู้ใช้ ·
                  แนะนำข้อความยาวและคาดเดายาก · ค่าอยู่ในหน้านี้ชั่วคราว ไม่บันทึกลง browser storage
                  หากลืมจะถอดรหัสไม่ได้
                </p>
              </div>
            </>
          )}

          <div className="mt-4">
            <label htmlFor="crypto-input" className="mb-1 block text-sm font-medium">
              {inputLabel}
            </label>
            <textarea
              id="crypto-input"
              value={inputValue}
              onChange={(event) => {
                updateInput(event.target.value);
                clearResult();
              }}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void run();
              }}
              spellCheck={false}
              placeholder={
                mode === "hash"
                  ? "พิมพ์หรือวางข้อความที่นี่"
                  : mode === "base64"
                    ? base64Mode === "encode"
                      ? "ข้อความ UTF-8 ที่ต้องการแปลง"
                      : "วางข้อความ Base64 ที่นี่"
                    : aesMode === "encrypt"
                      ? "ข้อความต้นฉบับ"
                      : "วางผลลัพธ์ EMPIRE-AES-GCM ที่นี่"
              }
              className="min-h-40 w-full resize-y rounded-md border border-surface-variant bg-surface-container p-3 font-mono text-base leading-relaxed text-on-surface placeholder:font-sans placeholder:text-on-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            />
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              สูงสุด 1 MB ต่อข้อความ · คำนวณในเบราว์เซอร์ ไม่มีการส่งข้อมูลไป backend
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md bg-error-container px-4 py-3 text-sm leading-relaxed text-on-error-container"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy || (mode === "aes" && !passphrase)}
              aria-busy={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary-container px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <span
                  className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                  aria-hidden="true"
                />
              ) : mode === "aes" ? (
                aesMode === "encrypt" ? (
                  <LockKeyhole size={16} aria-hidden="true" />
                ) : (
                  <UnlockKeyhole size={16} aria-hidden="true" />
                )
              ) : (
                <Fingerprint size={16} aria-hidden="true" />
              )}
              {busy
                ? "กำลังประมวลผล…"
                : mode === "hash"
                  ? "คำนวณ Hash"
                  : mode === "base64"
                    ? base64Mode === "encode"
                      ? "เข้ารหัส Base64"
                      : "ถอดรหัส Base64"
                    : aesMode === "encrypt"
                      ? "เข้ารหัส AES"
                      : "ถอดรหัส AES"}
            </button>
            <button
              type="button"
              onClick={clearInputs}
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-md border border-surface-variant bg-surface-container px-4 text-sm hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              ล้างข้อมูล
            </button>
            {mode === "hash" && (
              <span className="self-center text-sm leading-relaxed text-on-surface-variant">
                กด Ctrl/⌘ + Enter เพื่อคำนวณ
              </span>
            )}
          </div>
        </section>

        {result ? (
          <section
            className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4 sm:p-6"
            aria-labelledby="result-title"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="result-title" className="text-lg font-semibold">
                ผลลัพธ์
              </h2>
              <button
                type="button"
                onClick={() => void copyResult()}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-surface-variant px-3 text-sm hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                {copied ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Clipboard size={16} aria-hidden="true" />
                )}
                {copied ? "คัดลอกแล้ว" : "คัดลอกผลลัพธ์"}
              </button>
            </div>
            {mode === "hash" && (
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {digest} · รูปแบบ Hexadecimal
              </p>
            )}
            {mode === "aes" && aesMode === "encrypt" && (
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                เก็บผลลัพธ์นี้และ passphrase ไว้ด้วยกันเพื่อถอดรหัสในภายหลัง
              </p>
            )}
            <textarea
              readOnly
              aria-label="ผลลัพธ์จากเครื่องมือ"
              value={result}
              rows={mode === "aes" && aesMode === "encrypt" ? 5 : 4}
              className="mt-3 w-full resize-y rounded-md border border-surface-variant bg-surface p-3 font-mono text-sm leading-relaxed text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            />
          </section>
        ) : (
          <section
            className="mt-5 rounded-lg border border-dashed border-surface-variant bg-surface-container px-4 py-8 text-center"
            aria-live="polite"
          >
            <Fingerprint size={24} className="mx-auto text-on-surface-variant" aria-hidden="true" />
            <h2 className="mt-2 font-semibold">พร้อมประมวลผลในเครื่อง</h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              เลือกโหมด กรอกข้อมูล แล้วกดปุ่มเพื่อดูผลลัพธ์
            </p>
          </section>
        )}

        <aside className="mt-5 rounded-lg border border-surface-variant bg-surface-container p-4">
          <h2 className="font-semibold">ข้อควรรู้สำหรับการเรียน</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-on-surface-variant">
            <li>
              Hash เป็นทางเดียว ส่วน Base64 เป็นเพียงการแปลงรูปแบบ ทั้งสองอย่างไม่ใช่การเข้ารหัสลับ
            </li>
            <li>
              AES-GCM ในหน้านี้มีไว้ทดลองและแลกเปลี่ยนข้อความเท่านั้น
              ไม่ควรใช้แทนระบบจัดการกุญแจของงานจริง
            </li>
            <li>อย่าใช้ SHA-1 หรือ MD5 ปกป้องข้อมูล และอย่าใช้ SHA-256 แบบธรรมดาเก็บรหัสผ่าน</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
