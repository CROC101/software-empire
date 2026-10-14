/// เครื่องมือวันเวลา — ใช้ Intl ของเบราว์เซอร์ (ไม่มีไลบรารีวันที่ใน whitelist)

const DAY = 86_400_000;

export function parseDateInput(value: string, label = "วันที่"): Date {
  if (!value) throw new Error(`กรุณาเลือก${label}`);

  // "YYYY-MM-DD" จาก <input type=date> = เที่ยงคืนเวลาท้องถิ่น
  const date = /^\d{4}-\d{2}-\d{2}$/u.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);

  if (Number.isNaN(date.getTime())) throw new Error(`${label}ไม่ถูกต้อง`);

  return date;
}

export function formatThai(date: Date, withTime = true): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
    ...(withTime ? { timeStyle: "medium" } : {}),
  }).format(date);
}

/// Unix timestamp ↔ วันที่ (เดาวินาที/มิลลิวินาทีจากจำนวนหลัก)
export function fromTimestamp(raw: string) {
  const text = raw.trim();

  if (!/^-?\d+(\.\d+)?$/u.test(text)) throw new Error("timestamp ต้องเป็นตัวเลข");

  const n = Number(text);
  const ms = Math.abs(n) >= 1e11 ? n : n * 1000;
  const date = new Date(ms);

  if (Number.isNaN(date.getTime())) throw new Error("timestamp อยู่นอกช่วงที่รองรับ");

  return { date, unit: Math.abs(n) >= 1e11 ? "มิลลิวินาที" : "วินาที" };
}

export function relativeTime(date: Date, now = new Date()): string {
  const diff = date.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat("th-TH", { numeric: "auto" });
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365.25 * DAY],
    ["month", 30.44 * DAY],
    ["week", 7 * DAY],
    ["day", DAY],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1000],
  ];

  for (const [unit, size] of units)
    if (abs >= size || unit === "second") return rtf.format(Math.round(diff / size), unit);

  return "";
}

/// ผลต่างแบบปฏิทิน (ปี เดือน วัน) — นับแบบคนทั่วไปนับอายุ
export function calendarDiff(from: Date, to: Date) {
  let start = from;
  let end = to;
  const negative = end < start;

  if (negative) [start, end] = [end, start];

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDays = Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      DAY,
  );

  return { years, months, days, totalDays, negative };
}

export function addToDate(
  date: Date,
  amount: { years: number; months: number; days: number; hours: number },
): Date {
  const out = new Date(date);
  const day = out.getDate();

  out.setDate(1);
  out.setFullYear(out.getFullYear() + amount.years);
  out.setMonth(out.getMonth() + amount.months);
  // 31 ม.ค. + 1 เดือน → 28/29 ก.พ. (ไม่ล้นไปมีนาคม)
  out.setDate(Math.min(day, new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate()));
  out.setDate(out.getDate() + amount.days);
  out.setHours(out.getHours() + amount.hours);

  return out;
}

/// วันทำงาน (จันทร์–ศุกร์) ระหว่างสองวัน รวมวันแรกและวันสุดท้าย · หักวันหยุดที่ผู้ใช้กรอกเอง
export function workingDays(from: Date, to: Date, holidays: string[]) {
  const [start, end] = from <= to ? [from, to] : [to, from];
  const skip = new Set(holidays.map((h) => h.trim()).filter(Boolean));
  let work = 0;
  let weekend = 0;
  let holiday = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if ((end.getTime() - start.getTime()) / DAY > 3660) throw new Error("ช่วงยาวเกิน 10 ปี");

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const dow = cursor.getDay();

    if (dow === 0 || dow === 6) weekend++;
    else if (skip.has(key)) holiday++;
    else work++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { work, weekend, holiday, total: work + weekend + holiday };
}

export const TIME_ZONES = [
  "Asia/Bangkok",
  "UTC",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function inZone(date: Date, zone: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: zone,
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(date);
}

/// แปลง "วันเวลาตามโซน X" (ค่าจาก datetime-local) เป็นเวลาสัมบูรณ์
export function zonedToDate(local: string, zone: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/u.exec(local);

  if (!m) throw new Error("กรุณาเลือกวันเวลา");

  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // หา offset ของโซนนั้น ณ เวลานั้น (วนสองรอบให้ถูกช่วงเปลี่ยนเวลาออมแสง)
  let guess = asUtc;

  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
        .formatToParts(new Date(guess))
        .map((p) => [p.type, p.value]),
    );
    const shown = Date.UTC(
      +parts.year,
      +parts.month - 1,
      +parts.day,
      +parts.hour % 24,
      +parts.minute,
    );

    guess += asUtc - shown;
  }

  return new Date(guess);
}

/// พ.ศ. ↔ ค.ศ.
export function toBuddhistYear(year: number) {
  return year + 543;
}

// ---------- cron ----------

const CRON_FIELDS = [
  { name: "นาที", min: 0, max: 59 },
  { name: "ชั่วโมง", min: 0, max: 23 },
  { name: "วันที่", min: 1, max: 31 },
  { name: "เดือน", min: 1, max: 12 },
  { name: "วันในสัปดาห์", min: 0, max: 6 },
];
const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

function cronField(text: string, index: number): { values: Set<number>; any: boolean } {
  const spec = CRON_FIELDS[index];
  const names = index === 3 ? MONTH_NAMES : index === 4 ? DAY_NAMES : null;
  const values = new Set<number>();
  const value = (raw: string) => {
    const upper = raw.toUpperCase();
    const named = names?.indexOf(upper) ?? -1;
    const n = named >= 0 ? named + (index === 3 ? 1 : 0) : Number(raw);

    if (!/^\d+$/u.test(raw) && named < 0)
      throw new Error(`ช่อง${spec.name}: "${raw}" ไม่ใช่ตัวเลข`);
    // วันอาทิตย์เขียน 7 ได้
    const v = index === 4 && n === 7 ? 0 : n;

    if (v < spec.min || v > spec.max)
      throw new Error(`ช่อง${spec.name}: ${raw} อยู่นอกช่วง ${spec.min}–${spec.max}`);

    return v;
  };

  for (const part of text.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);

    if (!Number.isInteger(step) || step < 1)
      throw new Error(`ช่อง${spec.name}: step "${stepText}" ไม่ถูกต้อง`);

    let lo: number;
    let hi: number;

    if (range === "*") [lo, hi] = [spec.min, spec.max];
    else if (range.includes("-")) {
      const [a, b] = range.split("-");

      [lo, hi] = [value(a), value(b)];
      if (lo > hi) throw new Error(`ช่อง${spec.name}: ช่วง ${range} กลับด้าน`);
    } else {
      lo = value(range);
      hi = stepText === undefined ? lo : spec.max;
    }

    for (let v = lo; v <= hi; v += step) values.add(v);
  }

  return { values, any: text === "*" };
}

export function parseCron(expression: string) {
  const text = MACROS[expression.trim().toLowerCase()] ?? expression.trim();
  const parts = text.split(/\s+/u);

  if (parts.length !== 5)
    throw new Error("cron ต้องมี 5 ช่อง: นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์");

  return parts.map(cronField);
}

export function nextCronRuns(expression: string, count: number, from = new Date()): Date[] {
  const [minute, hour, dom, month, dow] = parseCron(expression);
  const out: Date[] = [];
  const t = new Date(from);

  t.setSeconds(0, 0);
  t.setMinutes(t.getMinutes() + 1);

  // จำกัดการค้นหา ~5 ปี กันวนไม่จบ (เช่น 30 ก.พ.)
  for (let guard = 0; out.length < count && guard < 5 * 366 * 24 * 60; guard++) {
    if (!month.values.has(t.getMonth() + 1)) {
      t.setMonth(t.getMonth() + 1, 1);
      t.setHours(0, 0);
      continue;
    }

    // กติกา cron: ถ้ากำหนดทั้งวันที่และวันในสัปดาห์ ให้ตรงอย่างใดอย่างหนึ่งก็พอ
    const domOk = dom.values.has(t.getDate());
    const dowOk = dow.values.has(t.getDay());
    const dayOk = dom.any && dow.any ? true : dom.any ? dowOk : dow.any ? domOk : domOk || dowOk;

    if (!dayOk) {
      t.setDate(t.getDate() + 1);
      t.setHours(0, 0);
      continue;
    }
    if (!hour.values.has(t.getHours())) {
      t.setHours(t.getHours() + 1, 0);
      continue;
    }
    if (!minute.values.has(t.getMinutes())) {
      t.setMinutes(t.getMinutes() + 1);
      continue;
    }

    out.push(new Date(t));
    t.setMinutes(t.getMinutes() + 1);
  }

  if (!out.length) throw new Error("ไม่มีเวลาที่ตรงกับ cron นี้ใน 5 ปีข้างหน้า");

  return out;
}

export function describeCron(expression: string): string {
  const fields = expression.trim().split(/\s+/u);
  const text = MACROS[expression.trim().toLowerCase()];

  if (text) return describeCron(text);
  parseCron(expression);

  const [mi, h, dom, mo, dow] = fields;
  const parts: string[] = [];

  if (mi === "*" && h === "*") parts.push("ทุกนาที");
  else if (mi.startsWith("*/")) parts.push(`ทุก ${mi.slice(2)} นาที`);
  else if (h === "*") parts.push(`นาทีที่ ${mi} ของทุกชั่วโมง`);
  else if (h.startsWith("*/")) parts.push(`นาทีที่ ${mi} ทุก ${h.slice(2)} ชั่วโมง`);
  else if (/^\d+$/u.test(h) && /^\d+$/u.test(mi))
    parts.push(`เวลา ${h.padStart(2, "0")}:${mi.padStart(2, "0")} น.`);
  else parts.push(`นาที ${mi} ชั่วโมง ${h}`);

  if (dom !== "*") parts.push(`วันที่ ${dom}`);
  if (mo !== "*") parts.push(`เดือน ${mo}`);
  if (dow !== "*") parts.push(`วันในสัปดาห์ ${dow} (0 = อาทิตย์)`);
  if (dom === "*" && dow === "*") parts.push("ทุกวัน");

  return parts.join(" · ");
}
