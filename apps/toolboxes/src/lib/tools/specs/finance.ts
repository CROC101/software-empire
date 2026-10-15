import {
  BadgePercent,
  ChartLine,
  Coins,
  Divide,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Landmark,
  Percent,
  PiggyBank,
  ReceiptText,
  RectangleHorizontal,
  ShoppingCart,
  Sigma,
  Target,
  TrendingUp,
} from "lucide-react";
import { checkbox, number, out, row, select, text, textarea } from "../fields";
import {
  aspectRatio,
  baht,
  bmi,
  breakEven,
  compound,
  gpa,
  loan,
  margin,
  money,
  number as fmt,
  percentage,
  thaiIncomeTax,
  unitPrice,
  vat,
} from "../impl/finance";
import { bool, num, str, type SpecTool } from "../types";

export function statistics(input: string) {
  const values = input
    .split(/[\s,;]+/u)
    .filter(Boolean)
    .map((t) => {
      const n = Number(t);

      if (!Number.isFinite(n)) throw new Error(`"${t}" ไม่ใช่ตัวเลข`);

      return n;
    });

  if (!values.length) throw new Error("กรอกตัวเลขอย่างน้อย 1 ค่า");

  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const counts = new Map<number, number>();

  for (const x of values) counts.set(x, (counts.get(x) ?? 0) + 1);

  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts.entries()].filter(([, c]) => c === top).map(([x]) => x) : [];
  const variance = values.reduce((a, x) => a + (x - mean) ** 2, 0) / n;
  const sampleVariance = n > 1 ? (variance * n) / (n - 1) : 0;

  return {
    n,
    sum,
    mean,
    median,
    modes,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    sd: Math.sqrt(variance),
    sampleSd: Math.sqrt(sampleVariance),
  };
}

export const calculatorTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "percentage-calculator",
    name: "คำนวณเปอร์เซ็นต์",
    description: "X% ของ Y, X เป็นกี่ % ของ Y, % การเปลี่ยนแปลง, เพิ่มหรือลดตาม %",
    category: "calculator",
    icon: Percent,
    keywords: ["percent", "percentage", "เปอร์เซ็นต์", "ร้อยละ"],
    live: true,
    fields: [
      select("mode", "คำนวณ", [
        ["of", "A% ของ B"],
        ["is", "A เป็นกี่ % ของ B"],
        ["change", "% การเปลี่ยนแปลงจาก A ไป B"],
        ["add", "A เพิ่มขึ้น B%"],
        ["sub", "A ลดลง B%"],
      ]),
      number("a", "A", 15),
      number("b", "B", 200),
    ],
    run: (v) => {
      const r = percentage(str(v, "mode"), num(v, "a", "A"), num(v, "b", "B"));

      return out.rows([row(r.label, `${fmt(r.value, 4)}${r.suffix ?? ""}`)]);
    },
  },
  {
    kind: "spec",
    slug: "aspect-ratio",
    name: "คำนวณอัตราส่วนภาพ",
    description: "หาอัตราส่วนจากความกว้าง/สูง และคำนวณขนาดใหม่ที่คงสัดส่วน",
    category: "calculator",
    icon: RectangleHorizontal,
    keywords: ["aspect ratio", "16:9", "resolution", "อัตราส่วน"],
    live: true,
    fields: [
      number("width", "กว้าง (px)", 1920, { min: 1 }),
      number("height", "สูง (px)", 1080, { min: 1 }),
      number("newWidth", "ความกว้างใหม่ (px)", 1280, { min: 1 }),
    ],
    run: (v) => {
      const w = num(v, "width", "ความกว้าง");
      const h = num(v, "height", "ความสูง");
      const r = aspectRatio(w, h);
      const nw = num(v, "newWidth", "ความกว้างใหม่");

      return out.rows([
        row("อัตราส่วน", r.ratio),
        row("ทศนิยม", fmt(r.decimal, 4)),
        row(`สูงใหม่เมื่อกว้าง ${fmt(nw, 0)}`, `${fmt((nw * h) / w, 2)} px`),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "bmi-calculator",
    name: "คำนวณดัชนีมวลกาย (BMI)",
    description:
      "คำนวณ BMI ตามเกณฑ์คนเอเชีย พร้อมช่วงน้ำหนักที่เหมาะสม (ข้อมูลประกอบเท่านั้น ไม่ใช่คำวินิจฉัยทางการแพทย์)",
    category: "calculator",
    icon: HeartPulse,
    keywords: ["bmi", "body mass index", "น้ำหนัก", "สุขภาพ"],
    live: true,
    fields: [
      number("weight", "น้ำหนัก (กก.)", 60, { min: 1, step: 0.1 }),
      number("height", "ส่วนสูง (ซม.)", 165, { min: 50, step: 0.1 }),
    ],
    run: (v) => {
      const r = bmi(num(v, "weight", "น้ำหนัก"), num(v, "height", "ส่วนสูง"));

      return out.rows(
        [
          row("BMI", fmt(r.value, 1)),
          row("เกณฑ์", r.label),
          row("น้ำหนักที่เหมาะสม", `${fmt(r.healthyMin, 1)} – ${fmt(r.healthyMax, 1)} กก.`),
        ],
        "เกณฑ์ WHO สำหรับคนเอเชีย: < 18.5 น้อย · 18.5–22.9 ปกติ · 23–24.9 ท้วม · 25–29.9 อ้วน 1 · ≥ 30 อ้วน 2",
      );
    },
  },
  {
    kind: "spec",
    slug: "gpa-calculator",
    name: "คำนวณเกรดเฉลี่ย (GPA)",
    description: 'กรอก "เกรด หน่วยกิต" ทีละบรรทัด คำนวณ GPA แบบปัดลงสองตำแหน่ง',
    category: "calculator",
    icon: GraduationCap,
    keywords: ["gpa", "gpax", "เกรด", "เกรดเฉลี่ย", "grade"],
    live: true,
    fields: [
      textarea("input", "รายวิชา", {
        rows: 8,
        placeholder: "โครงสร้างข้อมูล, A, 3\nคณิตศาสตร์ดิสครีต, B+, 3\nภาษาอังกฤษ, B, 3",
        help: 'รูปแบบ: ชื่อวิชา, เกรด, หน่วยกิต หรือแค่ "A 3"',
      }),
    ],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = gpa(str(v, "input"));

      return out.table(
        ["วิชา", "เกรด", "หน่วยกิต", "แต้ม"],
        r.rows,
        `GPA ${r.gpa.toFixed(2)} · หน่วยกิตรวม ${r.credits} · แต้มรวม ${r.points}`,
      );
    },
  },
  {
    kind: "spec",
    slug: "statistics-calculator",
    name: "คำนวณสถิติพื้นฐาน",
    description: "ค่าเฉลี่ย มัธยฐาน ฐานนิยม ส่วนเบี่ยงเบนมาตรฐาน ต่ำสุด สูงสุด จากชุดตัวเลข",
    category: "calculator",
    icon: Sigma,
    keywords: ["mean", "median", "mode", "standard deviation", "average", "ค่าเฉลี่ย", "สถิติ"],
    live: true,
    fields: [
      textarea("input", "ตัวเลข (คั่นด้วยช่องว่าง จุลภาค หรือขึ้นบรรทัด)", {
        rows: 5,
        placeholder: "12 15 18 18 20 25",
      }),
    ],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const s = statistics(str(v, "input"));

      return out.rows([
        row("จำนวน", s.n),
        row("ผลรวม", fmt(s.sum, 6)),
        row("ค่าเฉลี่ย", fmt(s.mean, 6)),
        row("มัธยฐาน", fmt(s.median, 6)),
        row(
          "ฐานนิยม",
          s.modes.length
            ? s.modes.map((m) => fmt(m, 6)).join(", ")
            : "ไม่มี (ทุกค่าปรากฏครั้งเดียว)",
        ),
        row("ต่ำสุด / สูงสุด", `${fmt(s.min, 6)} / ${fmt(s.max, 6)}`),
        row("พิสัย", fmt(s.range, 6)),
        row("SD (ประชากร)", fmt(s.sd, 6)),
        row("SD (ตัวอย่าง)", fmt(s.sampleSd, 6)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "unit-price",
    name: "เทียบราคาต่อหน่วย (ห่อไหนคุ้ม)",
    description: "เทียบราคาต่อกรัม/มล./ชิ้นของสินค้าหลายขนาด บอกห่อที่คุ้มที่สุด",
    category: "calculator",
    icon: ShoppingCart,
    keywords: ["unit price", "compare", "คุ้ม", "ราคาต่อหน่วย"],
    live: true,
    fields: [
      number("p1", "ราคา A (บาท)", 25),
      number("q1", "ปริมาณ A", 350),
      number("p2", "ราคา B (บาท)", 59),
      number("q2", "ปริมาณ B", 1000),
      number("p3", "ราคา C (บาท) — ไม่ใช้ให้ใส่ 0", 0),
      number("q3", "ปริมาณ C", 0),
    ],
    run: (v) => {
      const items = ["A", "B", "C"].map((label, i) => ({
        label,
        price: num(v, `p${i + 1}`, `ราคา ${label}`),
        quantity: num(v, `q${i + 1}`, `ปริมาณ ${label}`),
      }));
      const r = unitPrice(items);

      return out.table(
        ["รายการ", "ราคา", "ปริมาณ", "ราคาต่อหน่วย", "เทียบกับคุ้มสุด"],
        r.map((i) => [
          i.best ? `${i.label} (คุ้มสุด)` : i.label,
          fmt(i.price),
          fmt(i.quantity),
          fmt(i.unit, 4),
          i.best ? "—" : `แพงกว่า ${fmt(i.extra, 1)}%`,
        ]),
      );
    },
  },
];

export const financeTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "discount-calculator",
    name: "คำนวณส่วนลด",
    description: "ราคาหลังลด % (ลดซ้อนได้) และจำนวนเงินที่ประหยัด",
    category: "finance",
    icon: BadgePercent,
    keywords: ["discount", "sale", "ส่วนลด", "ลดราคา"],
    live: true,
    fields: [
      number("price", "ราคาเต็ม (บาท)", 1290),
      number("discount", "ส่วนลด (%)", 20, { min: 0, max: 100 }),
      number("extra", "ลดเพิ่มอีก (%)", 0, { min: 0, max: 100 }),
    ],
    run: (v) => {
      const price = num(v, "price", "ราคา");
      const after =
        price *
        (1 - num(v, "discount", "ส่วนลด") / 100) *
        (1 - num(v, "extra", "ส่วนลดเพิ่ม") / 100);

      return out.rows([
        row("ราคาหลังลด", baht(after)),
        row("ประหยัด", baht(price - after)),
        row("ลดรวมจริง", `${fmt(price ? ((price - after) / price) * 100 : 0, 2)}%`),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "vat-calculator",
    name: "คำนวณภาษีมูลค่าเพิ่ม (VAT)",
    description: "แยก VAT 7% ออกจากราคารวม หรือบวก VAT เข้าไปในราคา",
    category: "finance",
    icon: ReceiptText,
    keywords: ["vat", "tax", "ภาษี", "แวต", "7%"],
    live: true,
    fields: [
      number("amount", "จำนวนเงิน (บาท)", 1070),
      number("rate", "อัตรา (%)", 7, { step: 0.5 }),
      checkbox("includes", "ราคานี้รวม VAT แล้ว", true),
    ],
    run: (v) => {
      const r = vat(num(v, "amount", "จำนวนเงิน"), num(v, "rate", "อัตรา"), bool(v, "includes"));

      return out.rows([
        row("ราคาก่อน VAT", baht(r.base)),
        row("VAT", baht(r.tax)),
        row("ราคารวม VAT", baht(r.total)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "split-bill",
    name: "หารค่าอาหาร",
    description: "รวมเซอร์วิสชาร์จและ VAT แล้วหารต่อคน (ปัดขึ้นเป็นบาทได้)",
    category: "finance",
    icon: HandCoins,
    keywords: ["split bill", "tip", "หาร", "service charge", "ค่าอาหาร"],
    live: true,
    fields: [
      number("total", "ค่าอาหาร (บาท)", 1850),
      number("people", "จำนวนคน", 4, { min: 1 }),
      number("service", "Service charge (%)", 10),
      number("vat", "VAT (%)", 7),
      checkbox("roundUp", "ปัดขึ้นเป็นบาทเต็ม", true),
    ],
    run: (v) => {
      const people = num(v, "people", "จำนวนคน");

      if (!Number.isInteger(people) || people < 1) throw new Error("จำนวนคนต้องเป็นจำนวนเต็มบวก");

      const subtotal = num(v, "total", "ค่าอาหาร");
      const service = (subtotal * num(v, "service", "service charge")) / 100;
      const tax = ((subtotal + service) * num(v, "vat", "VAT")) / 100;
      const grand = subtotal + service + tax;
      const each = bool(v, "roundUp") ? Math.ceil(grand / people) : grand / people;

      return out.rows([
        row("Service charge", baht(service)),
        row("VAT", baht(tax)),
        row("รวมทั้งหมด", baht(grand)),
        row("คนละ", baht(each)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "loan-calculator",
    name: "คำนวณผ่อนชำระเงินกู้",
    description: "ค่างวดรายเดือนแบบลดต้นลดดอก ดอกเบี้ยรวม และตารางผ่อน",
    category: "finance",
    icon: Landmark,
    keywords: ["loan", "mortgage", "installment", "ผ่อน", "กู้", "บ้าน", "รถ"],
    live: true,
    fields: [
      number("principal", "ยอดเงินกู้ (บาท)", 500000),
      number("rate", "ดอกเบี้ยต่อปี (%)", 6.5, { step: 0.05 }),
      number("months", "จำนวนงวด (เดือน)", 60, { min: 1, max: 600 }),
    ],
    run: (v) => {
      const r = loan(
        num(v, "principal", "ยอดเงินกู้"),
        num(v, "rate", "ดอกเบี้ย"),
        num(v, "months", "จำนวนงวด"),
      );

      return out.table(
        ["งวด", "ค่างวด", "ดอกเบี้ย", "เงินต้น", "คงเหลือ"],
        r.schedule.map((s) => [
          s.month,
          money(s.payment),
          money(s.interest),
          money(s.principal),
          money(s.balance),
        ]),
        `ค่างวด ${baht(r.payment)} · จ่ายรวม ${baht(r.totalPaid)} · ดอกเบี้ยรวม ${baht(r.totalInterest)}`,
      );
    },
  },
  {
    kind: "spec",
    slug: "compound-interest",
    name: "คำนวณดอกเบี้ยทบต้น / ออมเงิน",
    description: "เงินต้น + ฝากเพิ่มทุกเดือน ทบต้นรายเดือน/รายปี ดูยอดแต่ละปี",
    category: "finance",
    icon: PiggyBank,
    keywords: ["compound interest", "saving", "invest", "ดอกเบี้ยทบต้น", "ออม"],
    live: true,
    fields: [
      number("principal", "เงินต้น (บาท)", 10000),
      number("monthly", "ฝากเพิ่มทุกเดือน (บาท)", 1000),
      number("rate", "ผลตอบแทนต่อปี (%)", 3, { step: 0.1 }),
      number("years", "จำนวนปี", 10, { min: 1, max: 100 }),
      select("perYear", "ทบต้น", [
        ["12", "รายเดือน"],
        ["4", "รายไตรมาส"],
        ["1", "รายปี"],
      ]),
    ],
    run: (v) => {
      const r = compound({
        principal: num(v, "principal", "เงินต้น"),
        monthly: num(v, "monthly", "เงินฝากรายเดือน"),
        rate: num(v, "rate", "ผลตอบแทน"),
        years: num(v, "years", "จำนวนปี"),
        perYear: Number(str(v, "perYear")),
      });

      return out.table(
        ["ปีที่", "เงินที่ฝากสะสม", "ยอดรวม"],
        r.rows.map((x) => [x.year, money(x.contributed), money(x.balance)]),
        `ยอดสุดท้าย ${baht(r.balance)} · ฝากรวม ${baht(r.contributed)} · ดอกผล ${baht(r.interest)}`,
      );
    },
  },
  {
    kind: "spec",
    slug: "profit-margin",
    name: "คำนวณกำไร Margin / Markup",
    description: "จากต้นทุนและราคาขาย หากำไร อัตรากำไรขั้นต้น และ markup",
    category: "finance",
    icon: TrendingUp,
    keywords: ["margin", "markup", "profit", "กำไร"],
    live: true,
    fields: [number("cost", "ต้นทุน (บาท)", 60), number("price", "ราคาขาย (บาท)", 100)],
    run: (v) => {
      const r = margin(num(v, "cost", "ต้นทุน"), num(v, "price", "ราคาขาย"));

      return out.rows([
        row("กำไร", baht(r.profit)),
        row("Margin (กำไร ÷ ราคาขาย)", `${fmt(r.margin)}%`),
        row("Markup (กำไร ÷ ต้นทุน)", Number.isFinite(r.markup) ? `${fmt(r.markup)}%` : "—"),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "break-even",
    name: "คำนวณจุดคุ้มทุน",
    description: "ต้องขายกี่ชิ้นจึงคุ้มต้นทุนคงที่",
    category: "finance",
    icon: Target,
    keywords: ["break even", "จุดคุ้มทุน", "ธุรกิจ"],
    live: true,
    fields: [
      number("fixed", "ต้นทุนคงที่ (บาท)", 30000),
      number("price", "ราคาขายต่อชิ้น", 120),
      number("variable", "ต้นทุนผันแปรต่อชิ้น", 70),
    ],
    run: (v) => {
      const r = breakEven(
        num(v, "fixed", "ต้นทุนคงที่"),
        num(v, "price", "ราคาขาย"),
        num(v, "variable", "ต้นทุนผันแปร"),
      );

      return out.rows([
        row("ต้องขาย", `${r.units.toLocaleString("th-TH")} ชิ้น`),
        row("ยอดขายที่จุดคุ้มทุน", baht(r.revenue)),
        row("กำไรส่วนเกินต่อชิ้น", baht(r.contribution)),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "thai-income-tax",
    name: "คำนวณภาษีเงินได้บุคคลธรรมดา",
    description: "คำนวณจากเงินได้สุทธิ (หลังหักค่าใช้จ่ายและค่าลดหย่อนแล้ว) ตามอัตราก้าวหน้า",
    category: "finance",
    icon: Coins,
    keywords: ["income tax", "ภาษี", "ภาษีเงินได้", "ภงด"],
    live: true,
    fields: [
      number("net", "เงินได้สุทธิต่อปี (บาท)", 420000, {
        help: "ใช้ตรวจสอบประกอบเท่านั้น ยอดจริงให้ยึดตามกรมสรรพากร",
      }),
    ],
    run: (v) => {
      const r = thaiIncomeTax(num(v, "net", "เงินได้สุทธิ"));

      return out.table(
        ["ช่วงเงินได้สุทธิ", "อัตรา", "ภาษี"],
        r.rows.map((x) => [x.range, `${x.rate}%`, money(x.tax)]),
        `ภาษีทั้งปี ${baht(r.tax)} · อัตราเฉลี่ย ${fmt(r.effective)}%`,
      );
    },
  },
  {
    kind: "spec",
    slug: "savings-goal",
    name: "วางแผนเก็บเงินให้ถึงเป้า",
    description: "ต้องเก็บเดือนละเท่าไรเพื่อให้ถึงเป้าหมายในเวลาที่กำหนด",
    category: "finance",
    icon: ChartLine,
    keywords: ["saving goal", "เก็บเงิน", "เป้าหมาย", "ออม"],
    live: true,
    fields: [
      number("goal", "เป้าหมาย (บาท)", 50000),
      number("current", "มีอยู่แล้ว (บาท)", 5000),
      number("months", "ภายใน (เดือน)", 12, { min: 1 }),
      number("rate", "ผลตอบแทนต่อปี (%)", 0, { step: 0.1 }),
    ],
    run: (v) => {
      const goal = num(v, "goal", "เป้าหมาย");
      const current = num(v, "current", "เงินที่มี");
      const months = num(v, "months", "จำนวนเดือน");
      const r = num(v, "rate", "ผลตอบแทน") / 100 / 12;
      const future = current * (1 + r) ** months;
      const need = goal - future;
      const monthly =
        need <= 0 ? 0 : r === 0 ? need / months : (need * r) / ((1 + r) ** months - 1);

      return out.rows([
        row("ต้องเก็บเดือนละ", baht(Math.max(0, monthly))),
        row("ต่อวัน (ประมาณ)", baht(Math.max(0, (monthly * 12) / 365))),
        need <= 0 && row("สถานะ", "เงินที่มีพอถึงเป้าแล้ว"),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "average-cost",
    name: "คำนวณราคาเฉลี่ย (DCA)",
    description: 'ราคาเฉลี่ยต่อหน่วยจากการซื้อหลายครั้ง — กรอก "จำนวน ราคา" ทีละบรรทัด',
    category: "finance",
    icon: Divide,
    keywords: ["average cost", "dca", "ราคาเฉลี่ย", "ถัวเฉลี่ย"],
    live: true,
    fields: [
      textarea("input", "รายการซื้อ", {
        rows: 6,
        placeholder: "100 25.50\n200 24.00\n150 26.25",
        help: "หนึ่งบรรทัด: จำนวนหน่วย ราคาต่อหน่วย",
      }),
      text("fee", "ค่าธรรมเนียมรวม (บาท)", { defaultValue: "0", mono: true }),
    ],
    run: (v) => {
      let units = 0;
      let cost = 0;

      str(v, "input")
        .split(/\r?\n/u)
        .filter((l) => l.trim())
        .forEach((l, i) => {
          const [q, p] = l
            .trim()
            .split(/[\s,]+/u)
            .map(Number);

          if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p < 0)
            throw new Error(`บรรทัด ${i + 1}: ต้องเป็น "จำนวน ราคา"`);
          units += q;
          cost += q * p;
        });

      if (!units) return out.rows([]);

      const fee = Number(str(v, "fee")) || 0;

      return out.rows([
        row("จำนวนรวม", fmt(units, 6)),
        row("ต้นทุนรวม", baht(cost + fee)),
        row("ราคาเฉลี่ยต่อหน่วย", fmt((cost + fee) / units, 4)),
      ]);
    },
  },
];
