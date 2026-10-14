import {
  Download,
  Eye,
  EyeOff,
  LoaderCircle,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { parseColor, toHex } from "@/lib/tools/impl/convert";
import type { Field, FieldValue, SpecTool, ToolOutput, Values } from "@/lib/tools/types";
import { CopyButton, downloadBlob, outputAsText, ToolOutputView } from "./tool-output";

function defaults(fields: Field[]): Values {
  return Object.fromEntries(
    fields.map((f) => [f.key, f.defaultValue ?? (f.kind === "checkbox" ? false : "")]),
  );
}

const control =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-on-surface outline-none focus:border-primary-container focus:ring-4 focus:ring-primary-container/15";

function nativeColor(value: FieldValue): string {
  try {
    return toHex({ ...parseColor(String(value)), a: 1 }).slice(0, 7);
  } catch {
    return toHex({ r: 0, g: 0, b: 0, a: 1 });
  }
}

function FieldControl({
  field,
  value,
  onChange,
  id,
}: {
  field: Field;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  id: string;
}) {
  const [reveal, setReveal] = useState(false);
  const mono = field.mono ? "font-mono text-sm" : "";
  const describedBy = field.help ? `${id}-help` : undefined;

  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          id={id}
          aria-describedby={describedBy}
          rows={field.rows ?? 8}
          spellCheck={false}
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={`${control} py-2.5 leading-relaxed ${mono}`}
        />
      );
    case "select":
      return (
        <select
          id={id}
          aria-describedby={describedBy}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={`${control} min-h-11`}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "number":
      return (
        <input
          id={id}
          aria-describedby={describedBy}
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step ?? "any"}
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={`${control} min-h-11 font-mono`}
        />
      );
    case "password":
      return (
        <div className="relative">
          <input
            id={id}
            aria-describedby={describedBy}
            type={reveal ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={`${control} min-h-11 pr-12 ${mono}`}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "ซ่อน" : "แสดง"}
            aria-pressed={reveal}
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            {reveal ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
      );
    case "color":
      return (
        <div className="flex gap-2">
          <input
            type="color"
            aria-label={`เลือก${field.label}`}
            value={nativeColor(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-outline-variant bg-surface-container-lowest p-1"
          />
          <input
            id={id}
            type="text"
            spellCheck={false}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={`${control} min-h-11 font-mono text-sm`}
          />
        </div>
      );
    default:
      return (
        <input
          id={id}
          aria-describedby={describedBy}
          type={field.kind}
          spellCheck={false}
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={`${control} min-h-11 ${mono}`}
        />
      );
  }
}

/// ตัวแสดงผลกลางของเครื่องมือแบบสเปก: ฟอร์ม → run() → ผลลัพธ์ · ทุกอย่างคำนวณในเบราว์เซอร์
export function SpecToolView({ tool }: { tool: SpecTool }) {
  const id = useId();
  const [values, setValues] = useState<Values>(() => defaults(tool.fields));
  const [output, setOutput] = useState<ToolOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const runId = useRef(0);

  const execute = useCallback(
    (current: Values) => {
      const ticket = ++runId.current;

      setBusy(true);
      Promise.resolve()
        .then(() => tool.run(current))
        .then(
          (result) => {
            if (ticket !== runId.current) return;
            setOutput(result);
            setError(null);
          },
          (err: unknown) => {
            if (ticket !== runId.current) return;
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
          },
        )
        .finally(() => {
          if (ticket === runId.current) setBusy(false);
        });
    },
    [tool],
  );

  // live: คำนวณใหม่หลังหยุดพิมพ์ 150 ms · random: สร้างชุดแรกให้ทันทีที่เปิดหน้า
  useEffect(() => {
    if (!tool.live && !(tool.random && output === null && error === null)) return;

    const timer = setTimeout(() => execute(values), tool.live ? 150 : 0);

    return () => clearTimeout(timer);
    // output/error ใช้แค่ตอนเปิดหน้าของเครื่องมือสุ่ม — ไม่ต้องรันซ้ำเมื่อผลเปลี่ยน
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, tool, execute]);

  const set = (key: string) => (value: FieldValue) => setValues((v) => ({ ...v, [key]: value }));
  const text = output ? outputAsText(output) : "";
  const download = output?.kind === "text" ? output.download : undefined;
  const note =
    output && (output.kind === "rows" || output.kind === "table" || output.kind === "text")
      ? output.note
      : undefined;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <form
        aria-label={`ข้อมูลสำหรับ ${tool.name}`}
        onSubmit={(e) => {
          e.preventDefault();
          execute(values);
        }}
        className="h-fit rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {tool.fields.map((field) => {
            if (field.when && !field.when.in.includes(String(values[field.when.key]))) return null;

            const fieldId = `${id}-${field.key}`;
            const wide =
              field.kind === "textarea" || field.kind === "checkbox" || tool.fields.length === 1;

            if (field.kind === "checkbox") {
              return (
                <label
                  key={field.key}
                  htmlFor={fieldId}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-1 sm:col-span-1"
                >
                  <input
                    id={fieldId}
                    type="checkbox"
                    checked={values[field.key] === true}
                    onChange={(e) => set(field.key)(e.target.checked)}
                    className="size-5 accent-primary-container"
                  />
                  <span>{field.label}</span>
                </label>
              );
            }

            return (
              <div key={field.key} className={wide ? "sm:col-span-2" : ""}>
                <label
                  htmlFor={fieldId}
                  className="mb-1.5 block text-sm font-medium text-on-surface"
                >
                  {field.label}
                </label>
                <FieldControl
                  field={field}
                  id={fieldId}
                  value={values[field.key] ?? ""}
                  onChange={set(field.key)}
                />
                {field.help && (
                  <p id={`${fieldId}-help`} className="mt-1 text-sm text-on-surface-variant">
                    {field.help}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {!tool.live && (
            <button
              type="submit"
              disabled={busy}
              className="btn-gradient inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-semibold disabled:opacity-60"
            >
              {busy ? (
                <LoaderCircle aria-hidden className="size-4 animate-spin" />
              ) : tool.random ? (
                <RefreshCw aria-hidden className="size-4" />
              ) : (
                <Play aria-hidden className="size-4" />
              )}
              {tool.random && output ? "สุ่มใหม่" : (tool.action ?? "ประมวลผล")}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              runId.current++;
              setValues(defaults(tool.fields));
              setOutput(null);
              setError(null);
              setBusy(false);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 hover:bg-surface-container"
          >
            <RotateCcw aria-hidden className="size-4" />
            ล้างค่า
          </button>
          <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <ShieldCheck aria-hidden className="size-4 text-success" />
            ประมวลผลในเครื่องคุณ
          </span>
        </div>
      </form>

      <section
        aria-labelledby={`${id}-result`}
        aria-live="polite"
        aria-busy={busy}
        className="min-w-0 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 sm:p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${id}-result`} className="text-lg font-semibold">
            ผลลัพธ์
          </h2>
          {output && !error && (
            <div className="flex flex-wrap gap-2">
              {output.kind !== "qr" && <CopyButton value={text} label="คัดลอกทั้งหมด" />}
              {download && (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([text], { type: `${download.mime};charset=utf-8` }),
                      download.filename,
                    )
                  }
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant px-3 text-sm hover:bg-surface-container"
                >
                  <Download aria-hidden className="size-4" />
                  {download.filename}
                </button>
              )}
            </div>
          )}
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-error/40 bg-error-container/60 p-4 text-on-error-container"
          >
            {error}
          </p>
        ) : output ? (
          <>
            <ToolOutputView output={output} />
            {note && <p className="mt-3 text-sm text-on-surface-variant">{note}</p>}
          </>
        ) : busy ? (
          <div className="skeleton h-32" />
        ) : (
          <p className="text-on-surface-variant">
            {tool.live
              ? "กรอกข้อมูลทางซ้าย ผลลัพธ์จะขึ้นทันที"
              : `กรอกข้อมูลแล้วกด "${tool.action ?? "ประมวลผล"}"`}
          </p>
        )}
      </section>
    </div>
  );
}
