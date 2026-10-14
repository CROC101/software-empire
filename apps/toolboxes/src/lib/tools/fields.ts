import type { Field, FieldValue, ResultRow, ToolOutput } from "./types";

/// ตัวช่วยประกาศช่องกรอกและผลลัพธ์ให้สเปกเครื่องมือสั้นลง

type Extra = Partial<Omit<Field, "key" | "label" | "kind">>;

export const textarea = (key: string, label: string, extra: Extra = {}): Field => ({
  key,
  label,
  kind: "textarea",
  rows: 8,
  mono: true,
  ...extra,
});
export const text = (key: string, label: string, extra: Extra = {}): Field => ({
  key,
  label,
  kind: "text",
  ...extra,
});
export const number = (
  key: string,
  label: string,
  defaultValue: number,
  extra: Extra = {},
): Field => ({ key, label, kind: "number", defaultValue, ...extra });
export const checkbox = (
  key: string,
  label: string,
  defaultValue = false,
  extra: Extra = {},
): Field => ({ key, label, kind: "checkbox", defaultValue, ...extra });
export const date = (key: string, label: string, extra: Extra = {}): Field => ({
  key,
  label,
  kind: "date",
  ...extra,
});
export const datetime = (key: string, label: string, extra: Extra = {}): Field => ({
  key,
  label,
  kind: "datetime-local",
  ...extra,
});
export const color = (key: string, label: string, defaultValue: string): Field => ({
  key,
  label,
  kind: "color",
  defaultValue,
});

export function select(
  key: string,
  label: string,
  options: [string, string][] | string[],
  defaultValue?: FieldValue,
  extra: Extra = {},
): Field {
  const opts = options.map((o) =>
    Array.isArray(o) ? { value: o[0], label: o[1] } : { value: o, label: o },
  );

  return {
    key,
    label,
    kind: "select",
    options: opts,
    defaultValue: defaultValue ?? opts[0]?.value,
    ...extra,
  };
}

export const out = {
  text: (
    value: string,
    mono = true,
    download?: { filename: string; mime: string },
    note?: string,
  ): ToolOutput => ({ kind: "text", text: value, mono, download, note }),
  rows: (rows: (ResultRow | false | null | undefined | "")[], note?: string): ToolOutput => ({
    kind: "rows",
    rows: rows.filter(Boolean) as ResultRow[],
    note,
  }),
  table: (columns: string[], rows: (string | number)[][], note?: string): ToolOutput => ({
    kind: "table",
    columns,
    rows: rows.map((r) => r.map(String)),
    note,
  }),
  markdown: (markdown: string): ToolOutput => ({ kind: "markdown", markdown }),
};

export const row = (label: string, value: string | number, mono = false): ResultRow => ({
  label,
  value: String(value),
  mono,
});

export const yesNo = (v: boolean) => (v ? "ใช่" : "ไม่ใช่");

/// ตรวจความยาว input — กันหน้าค้างเมื่อวางข้อความใหญ่มาก (บรีฟ: จำกัด CPU/memory)
export function limit(textValue: string, max = 2_000_000): string {
  if (textValue.length > max)
    throw new Error(`ข้อความยาวเกิน ${max.toLocaleString("th-TH")} ตัวอักษร`);

  return textValue;
}
