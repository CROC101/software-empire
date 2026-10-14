import {
  Briefcase,
  Cake,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock3,
  Globe2,
  Hourglass,
  Timer,
} from "lucide-react";
import { date, datetime, number, out, row, select, text, textarea } from "../fields";
import {
  addToDate,
  calendarDiff,
  describeCron,
  formatThai,
  fromTimestamp,
  inZone,
  nextCronRuns,
  parseDateInput,
  relativeTime,
  TIME_ZONES,
  toBuddhistYear,
  workingDays,
  zonedToDate,
} from "../impl/time";
import { num, str, type SpecTool } from "../types";

const dayCount = (n: number) => `${n.toLocaleString("th-TH")} วัน`;

/// ISO-8601 week number
export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;

  t.setUTCDate(t.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));

  return {
    week: Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7),
    year: t.getUTCFullYear(),
  };
}

export const timeTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "timestamp-converter",
    name: "แปลง Unix Timestamp",
    description: "แปลง timestamp (วินาที/มิลลิวินาที) เป็นวันเวลา หรือวันเวลาเป็น timestamp",
    category: "time",
    icon: Clock3,
    keywords: ["unix", "timestamp", "epoch", "iso 8601"],
    live: true,
    fields: [
      text("input", "Timestamp หรือวันเวลา", {
        mono: true,
        placeholder: "1791417600 หรือ 2026-10-08T09:00:00+07:00",
        help: "เว้นว่าง = เวลาปัจจุบัน",
      }),
    ],
    run: (v) => {
      const input = str(v, "input").trim();
      let date: Date;
      let note = "";

      if (!input) date = new Date();
      else if (/^-?\d+(\.\d+)?$/u.test(input)) {
        const r = fromTimestamp(input);

        date = r.date;
        note = `ตีความเป็น${r.unit}`;
      } else date = parseDateInput(input, "วันเวลา");

      return out.rows(
        [
          row("เวลาไทย", formatThai(date)),
          row("ISO 8601 (UTC)", date.toISOString(), true),
          row("Unix (วินาที)", Math.floor(date.getTime() / 1000), true),
          row("Unix (มิลลิวินาที)", date.getTime(), true),
          row("RFC 2822", date.toUTCString(), true),
          row("เทียบกับตอนนี้", relativeTime(date)),
        ],
        note || undefined,
      );
    },
  },
  {
    kind: "spec",
    slug: "date-difference",
    name: "นับวันระหว่างสองวันที่",
    description: "ห่างกันกี่ปี เดือน วัน สัปดาห์ และชั่วโมง",
    category: "time",
    icon: CalendarRange,
    keywords: ["date difference", "days between", "นับวัน", "ระยะเวลา"],
    live: true,
    fields: [date("from", "วันเริ่ม"), date("to", "วันสิ้นสุด")],
    run: (v) => {
      if (!str(v, "from") || !str(v, "to")) return out.rows([]);

      const d = calendarDiff(
        parseDateInput(str(v, "from"), "วันเริ่ม"),
        parseDateInput(str(v, "to"), "วันสิ้นสุด"),
      );

      return out.rows([
        row(
          "ห่างกัน",
          `${d.negative ? "(ย้อนหลัง) " : ""}${d.years} ปี ${d.months} เดือน ${d.days} วัน`,
        ),
        row("รวม", dayCount(d.totalDays)),
        row("สัปดาห์", `${Math.floor(d.totalDays / 7)} สัปดาห์ ${d.totalDays % 7} วัน`),
        row("ชั่วโมง", (d.totalDays * 24).toLocaleString("th-TH")),
        row("นับรวมวันแรกและวันสุดท้าย", dayCount(d.totalDays + 1)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "date-add",
    name: "บวก / ลบวันที่",
    description: "หาวันที่หลังจากหรือก่อนหน้า X ปี เดือน วัน (เช่น ครบกำหนด 90 วัน)",
    category: "time",
    icon: CalendarPlus,
    keywords: ["add days", "date calculator", "ครบกำหนด", "บวกวัน"],
    live: true,
    fields: [
      date("start", "วันเริ่ม"),
      select("sign", "บวกหรือลบ", [
        ["1", "บวก (อนาคต)"],
        ["-1", "ลบ (ย้อนหลัง)"],
      ]),
      number("years", "ปี", 0),
      number("months", "เดือน", 0),
      number("days", "วัน", 30),
    ],
    run: (v) => {
      if (!str(v, "start")) return out.rows([]);

      const sign = Number(str(v, "sign"));
      const result = addToDate(parseDateInput(str(v, "start"), "วันเริ่ม"), {
        years: sign * num(v, "years", "ปี"),
        months: sign * num(v, "months", "เดือน"),
        days: sign * num(v, "days", "วัน"),
        hours: 0,
      });

      return out.rows([
        row("ผลลัพธ์", formatThai(result, false)),
        row(
          "ISO",
          `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`,
          true,
        ),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "age-calculator",
    name: "คำนวณอายุ",
    description: "อายุเป็นปี เดือน วัน และนับถอยหลังถึงวันเกิดครั้งถัดไป",
    category: "time",
    icon: Cake,
    keywords: ["age", "birthday", "อายุ", "วันเกิด"],
    live: true,
    fields: [date("birth", "วันเกิด"), date("at", "ณ วันที่ (เว้นว่าง = วันนี้)")],
    run: (v) => {
      if (!str(v, "birth")) return out.rows([]);

      const birth = parseDateInput(str(v, "birth"), "วันเกิด");
      const at = str(v, "at") ? parseDateInput(str(v, "at")) : new Date();

      if (birth > at) throw new Error("วันเกิดต้องไม่อยู่หลังวันที่คำนวณ");

      const d = calendarDiff(birth, at);
      const next = new Date(at.getFullYear(), birth.getMonth(), birth.getDate());

      if (next < new Date(at.getFullYear(), at.getMonth(), at.getDate()))
        next.setFullYear(next.getFullYear() + 1);

      const until = calendarDiff(
        new Date(at.getFullYear(), at.getMonth(), at.getDate()),
        next,
      ).totalDays;

      return out.rows([
        row("อายุ", `${d.years} ปี ${d.months} เดือน ${d.days} วัน`),
        row("รวม", dayCount(d.totalDays)),
        row("เกิดวัน", new Intl.DateTimeFormat("th-TH", { weekday: "long" }).format(birth)),
        row("ปีเกิด", `พ.ศ. ${toBuddhistYear(birth.getFullYear())}`),
        row("วันเกิดครั้งถัดไป", until === 0 ? "วันนี้" : `อีก ${dayCount(until)}`),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "working-days",
    name: "นับวันทำการ",
    description: "นับวันจันทร์–ศุกร์ระหว่างสองวัน หักวันหยุดที่กรอกเอง",
    category: "time",
    icon: Briefcase,
    keywords: ["working days", "business days", "วันทำการ", "วันหยุด"],
    live: true,
    fields: [
      date("from", "วันเริ่ม"),
      date("to", "วันสิ้นสุด"),
      textarea("holidays", "วันหยุดเพิ่มเติม (YYYY-MM-DD บรรทัดละวัน)", {
        rows: 4,
        placeholder: "2026-10-13\n2026-10-23",
        help: "ระบบไม่มีปฏิทินวันหยุดราชการในตัว — กรอกตามประกาศจริง",
      }),
    ],
    run: (v) => {
      if (!str(v, "from") || !str(v, "to")) return out.rows([]);

      const r = workingDays(
        parseDateInput(str(v, "from"), "วันเริ่ม"),
        parseDateInput(str(v, "to"), "วันสิ้นสุด"),
        str(v, "holidays").split(/\r?\n/u),
      );

      return out.rows([
        row("วันทำการ", dayCount(r.work)),
        row("เสาร์–อาทิตย์", dayCount(r.weekend)),
        row("วันหยุดที่กรอก (ตรงวันธรรมดา)", dayCount(r.holiday)),
        row("รวมทั้งช่วง", dayCount(r.total)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "timezone-converter",
    name: "แปลงเขตเวลา",
    description: "เวลาเดียวกันในเขตเวลาต่าง ๆ ทั่วโลก (คิดเวลาออมแสงให้)",
    category: "time",
    icon: Globe2,
    keywords: ["timezone", "time zone", "utc", "gmt", "เขตเวลา"],
    live: true,
    fields: [
      datetime("at", "วันเวลา (เว้นว่าง = ตอนนี้)"),
      select("zone", "เป็นเวลาของ", TIME_ZONES, "Asia/Bangkok"),
    ],
    run: (v) => {
      const at = str(v, "at") ? zonedToDate(str(v, "at"), str(v, "zone")) : new Date();

      return out.table(
        ["เขตเวลา", "วันเวลา"],
        TIME_ZONES.map((z) => [z, inZone(at, z)]),
      );
    },
  },
  {
    kind: "spec",
    slug: "cron-parser",
    name: "อ่านและทดสอบ Cron",
    description: "อธิบาย cron expression เป็นภาษาไทย และแสดงเวลาที่จะทำงานครั้งถัดไป",
    category: "time",
    icon: Timer,
    keywords: ["cron", "crontab", "schedule", "ตั้งเวลา"],
    live: true,
    fields: [
      text("input", "Cron expression (5 ช่อง)", {
        defaultValue: "30 8 * * 1-5",
        mono: true,
        help: "นาที ชั่วโมง วันที่ เดือน วันในสัปดาห์ · รองรับ @daily @hourly …",
      }),
      number("count", "แสดงกี่ครั้ง", 8, { min: 1, max: 50 }),
    ],
    run: (v) => {
      const runs = nextCronRuns(
        str(v, "input"),
        Math.min(50, Math.max(1, num(v, "count", "จำนวน"))),
      );

      return out.table(
        ["ครั้งที่", "เวลา (เครื่องของคุณ)"],
        runs.map((d, i) => [i + 1, formatThai(d)]),
        describeCron(str(v, "input")),
      );
    },
  },
  {
    kind: "spec",
    slug: "buddhist-year",
    name: "แปลง พ.ศ. ↔ ค.ศ.",
    description: "แปลงปีพุทธศักราชกับคริสต์ศักราช และวันที่แบบไทย",
    category: "time",
    icon: CalendarDays,
    keywords: ["buddhist era", "พ.ศ.", "ค.ศ.", "year"],
    live: true,
    fields: [
      number("year", "ปี", 2569),
      select("from", "เป็นปี", [
        ["be", "พ.ศ."],
        ["ce", "ค.ศ."],
      ]),
    ],
    run: (v) => {
      const year = num(v, "year", "ปี");
      const ce = str(v, "from") === "be" ? year - 543 : year;

      return out.rows([
        row("พ.ศ.", ce + 543),
        row("ค.ศ.", ce),
        row(
          "ปีอธิกสุรทิน (ก.พ. มี 29 วัน)",
          (ce % 4 === 0 && ce % 100 !== 0) || ce % 400 === 0 ? "ใช่" : "ไม่ใช่",
        ),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "week-number",
    name: "สัปดาห์ที่ของปี (ISO)",
    description: "หาเลขสัปดาห์ตาม ISO-8601 วันในปี และไตรมาส",
    category: "time",
    icon: Hourglass,
    keywords: ["week number", "iso week", "สัปดาห์", "quarter"],
    live: true,
    fields: [date("at", "วันที่ (เว้นว่าง = วันนี้)")],
    run: (v) => {
      const d = str(v, "at") ? parseDateInput(str(v, "at")) : new Date();
      const w = isoWeek(d);
      const dayOfYear =
        Math.round(
          (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) /
            86_400_000,
        ) + 1;
      const leap =
        (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || d.getFullYear() % 400 === 0;

      return out.rows([
        row("วันที่", formatThai(d, false)),
        row("สัปดาห์ ISO", `${w.year}-W${String(w.week).padStart(2, "0")}`, true),
        row("วันที่ของปี", `${dayOfYear} / ${leap ? 366 : 365}`),
        row("ไตรมาส", `Q${Math.floor(d.getMonth() / 3) + 1}`),
      ]);
    },
  },
];
