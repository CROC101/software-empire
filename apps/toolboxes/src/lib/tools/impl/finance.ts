/// เครื่องคิดเลขการเงินและทั่วไป — ผลลัพธ์เป็นตัวเลขทศนิยม แสดงผลด้วย Intl (ไม่เก็บลงฐาน)

export const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(n);

/// จำนวนเงินทศนิยม 2 ตำแหน่งเสมอ (ตาราง)
export const money = (n: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export const number = (n: number, digits = 2) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: digits }).format(n);

export function vat(amount: number, rate: number, includesVat: boolean) {
  if (includesVat) {
    const base = amount / (1 + rate / 100);

    return { base, tax: amount - base, total: amount };
  }

  return { base: amount, tax: (amount * rate) / 100, total: amount * (1 + rate / 100) };
}

export function loan(principal: number, annualRate: number, months: number) {
  if (principal <= 0 || months <= 0) throw new Error("ยอดเงินกู้และจำนวนงวดต้องมากกว่า 0");
  if (months > 600) throw new Error("จำนวนงวดไม่เกิน 600");

  const r = annualRate / 100 / 12;
  const payment = r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
  const schedule: {
    month: number;
    payment: number;
    interest: number;
    principal: number;
    balance: number;
  }[] = [];
  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const paid = Math.min(payment - interest, balance);

    balance -= paid;
    schedule.push({
      month: m,
      payment: paid + interest,
      interest,
      principal: paid,
      balance: Math.max(balance, 0),
    });
  }

  return {
    payment,
    totalPaid: payment * months,
    totalInterest: payment * months - principal,
    schedule,
  };
}

export function compound(options: {
  principal: number;
  rate: number;
  years: number;
  perYear: number;
  monthly: number;
}) {
  const { principal, rate, years, perYear, monthly } = options;

  if (years <= 0 || years > 100) throw new Error("จำนวนปีต้องอยู่ระหว่าง 0–100");

  const rows: { year: number; contributed: number; balance: number }[] = [];
  const r = rate / 100 / perYear;
  let balance = principal;
  let contributed = principal;

  for (let y = 1; y <= years; y++) {
    for (let p = 0; p < perYear; p++) {
      balance *= 1 + r;
      const add = (monthly * 12) / perYear;

      balance += add;
      contributed += add;
    }
    rows.push({ year: y, contributed, balance });
  }

  return { balance, contributed, interest: balance - contributed, rows };
}

export function margin(cost: number, price: number) {
  if (price <= 0) throw new Error("ราคาขายต้องมากกว่า 0");

  return {
    profit: price - cost,
    margin: ((price - cost) / price) * 100,
    markup: cost > 0 ? ((price - cost) / cost) * 100 : Infinity,
  };
}

export function breakEven(fixed: number, price: number, variable: number) {
  if (price <= variable) throw new Error("ราคาขายต่อหน่วยต้องมากกว่าต้นทุนผันแปรต่อหน่วย");

  const units = fixed / (price - variable);

  return {
    units: Math.ceil(units),
    revenue: Math.ceil(units) * price,
    contribution: price - variable,
  };
}

/// ภาษีเงินได้บุคคลธรรมดา (อัตราก้าวหน้าตามประมวลรัษฎากร ม.48) — คำนวณจากเงินได้สุทธิที่ผู้ใช้กรอก
export const THAI_TAX_BRACKETS = [
  { upTo: 150_000, rate: 0 },
  { upTo: 300_000, rate: 5 },
  { upTo: 500_000, rate: 10 },
  { upTo: 750_000, rate: 15 },
  { upTo: 1_000_000, rate: 20 },
  { upTo: 2_000_000, rate: 25 },
  { upTo: 5_000_000, rate: 30 },
  { upTo: Infinity, rate: 35 },
];

export function thaiIncomeTax(netIncome: number) {
  let previous = 0;
  let tax = 0;
  const rows: { range: string; rate: number; tax: number }[] = [];

  for (const b of THAI_TAX_BRACKETS) {
    if (netIncome <= previous) break;

    const portion = Math.min(netIncome, b.upTo) - previous;
    const t = (portion * b.rate) / 100;

    tax += t;
    rows.push({
      range: `${number(previous + (previous ? 1 : 0), 0)} – ${Number.isFinite(b.upTo) ? number(b.upTo, 0) : "ขึ้นไป"}`,
      rate: b.rate,
      tax: t,
    });
    previous = b.upTo;
  }

  return { tax, effective: netIncome > 0 ? (tax / netIncome) * 100 : 0, rows };
}

export function percentage(mode: string, a: number, b: number) {
  switch (mode) {
    case "of":
      return { label: `${number(a)}% ของ ${number(b)}`, value: (a / 100) * b };
    case "is":
      if (b === 0) throw new Error("ตัวหารเป็น 0 ไม่ได้");

      return {
        label: `${number(a)} คิดเป็นกี่ % ของ ${number(b)}`,
        value: (a / b) * 100,
        suffix: "%",
      };
    case "change":
      if (a === 0) throw new Error("ค่าเดิมเป็น 0 คำนวณ % การเปลี่ยนแปลงไม่ได้");

      return {
        label: `เปลี่ยนจาก ${number(a)} เป็น ${number(b)}`,
        value: ((b - a) / Math.abs(a)) * 100,
        suffix: "%",
      };
    case "add":
      return { label: `${number(a)} เพิ่มขึ้น ${number(b)}%`, value: a * (1 + b / 100) };
    case "sub":
      return { label: `${number(a)} ลดลง ${number(b)}%`, value: a * (1 - b / 100) };
    default:
      throw new Error("ไม่รู้จักโหมดนี้");
  }
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function aspectRatio(width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0)
    throw new Error("กว้างและสูงต้องเป็นจำนวนเต็มบวก");

  const g = gcd(width, height);

  return { ratio: `${width / g}:${height / g}`, decimal: width / height };
}

export function bmi(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) throw new Error("น้ำหนักและส่วนสูงต้องมากกว่า 0");

  const value = weightKg / (heightCm / 100) ** 2;
  // เกณฑ์เอเชีย (WHO Asia-Pacific) ที่กรมอนามัยใช้
  const label =
    value < 18.5
      ? "น้ำหนักน้อย"
      : value < 23
        ? "ปกติ"
        : value < 25
          ? "ท้วม"
          : value < 30
            ? "อ้วนระดับ 1"
            : "อ้วนระดับ 2";
  const hm = heightCm / 100;

  return { value, label, healthyMin: 18.5 * hm * hm, healthyMax: 22.9 * hm * hm };
}

export const GRADE_POINTS: Record<string, number> = {
  A: 4,
  "B+": 3.5,
  B: 3,
  "C+": 2.5,
  C: 2,
  "D+": 1.5,
  D: 1,
  F: 0,
};

/// GPA จากบรรทัด "เกรด หน่วยกิต" เช่น "A 3" หรือ "B+, 2"
export function gpa(text: string) {
  let points = 0;
  let credits = 0;
  const rows: string[][] = [];

  text.split(/\r?\n/u).forEach((line, i) => {
    if (!line.trim()) return;

    const m = /^\s*(?:(.+?)\s*[,\t|]\s*)?([A-DFa-df]\+?)\s*[,\s]\s*(\d+(?:\.\d+)?)\s*$/u.exec(line);

    if (!m)
      throw new Error(`บรรทัด ${i + 1}: ต้องเป็น "เกรด หน่วยกิต" เช่น A 3 หรือ "ชื่อวิชา, B+, 3"`);

    const grade = m[2].toUpperCase();
    const gp = GRADE_POINTS[grade];

    if (gp === undefined) throw new Error(`บรรทัด ${i + 1}: ไม่รู้จักเกรด ${grade}`);

    const credit = Number(m[3]);

    points += gp * credit;
    credits += credit;
    rows.push([
      m[1]?.trim() || `วิชาที่ ${rows.length + 1}`,
      grade,
      String(credit),
      (gp * credit).toFixed(1),
    ]);
  });

  if (!credits) throw new Error("ยังไม่มีรายวิชา");

  return { gpa: Math.floor((points / credits) * 100) / 100, credits, points, rows };
}

export function unitPrice(items: { label: string; price: number; quantity: number }[]) {
  const valid = items.filter((i) => i.price > 0 && i.quantity > 0);

  if (valid.length < 2) throw new Error("กรอกอย่างน้อย 2 รายการ");

  const withUnit = valid.map((i) => ({ ...i, unit: i.price / i.quantity }));
  const best = Math.min(...withUnit.map((i) => i.unit));

  return withUnit.map((i) => ({
    ...i,
    best: i.unit === best,
    extra: ((i.unit - best) / best) * 100,
  }));
}
