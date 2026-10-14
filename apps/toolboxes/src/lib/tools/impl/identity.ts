/// ตรวจรูปแบบเลขประจำตัว — **ตรวจแค่รูปแบบ/เลขตรวจสอบ** ไม่ได้ยืนยันว่ามีตัวตนจริง และไม่ส่งข้อมูลออกจากเครื่อง

export function digitsOnly(text: string): string {
  return text.replace(/[\s-]/gu, "");
}

/// เลขบัตรประชาชนไทย 13 หลัก (หลักสุดท้ายคือเลขตรวจสอบ mod 11)
export function thaiIdCheckDigit(first12: string): number {
  const sum = [...first12].reduce((acc, d, i) => acc + Number(d) * (13 - i), 0);

  return (11 - (sum % 11)) % 10;
}

const ID_TYPES: Record<string, string> = {
  "1": "คนไทยที่แจ้งเกิดภายในกำหนด (เกิดตั้งแต่ปี 2527)",
  "2": "คนไทยที่แจ้งเกิดเกินกำหนด",
  "3": "คนไทยหรือต่างด้าวที่มีชื่ออยู่ในทะเบียนบ้านก่อนปี 2527",
  "4": "คนไทยหรือต่างด้าวที่ย้ายเข้าทะเบียนบ้านภายหลัง",
  "5": "คนไทยที่ได้รับอนุมัติให้เพิ่มชื่อเข้าทะเบียนบ้าน",
  "6": "ผู้เข้าเมืองโดยไม่ชอบด้วยกฎหมาย / อยู่ชั่วคราว",
  "7": "บุตรของบุคคลประเภท 6 ที่เกิดในไทย",
  "8": "ต่างด้าวที่ได้รับสัญชาติไทยหรือมีถิ่นที่อยู่ถาวร",
};

export function validateThaiId(text: string) {
  const id = digitsOnly(text);

  if (!/^\d{13}$/u.test(id)) return { valid: false, reason: "ต้องเป็นตัวเลข 13 หลัก" };
  if (id[0] === "0" || id[0] === "9") return { valid: false, reason: "หลักแรกต้องเป็น 1–8" };

  const expected = thaiIdCheckDigit(id.slice(0, 12));

  if (expected !== Number(id[12]))
    return { valid: false, reason: `เลขตรวจสอบไม่ตรง (ควรเป็น ${expected})` };

  return {
    valid: true,
    reason: "รูปแบบและเลขตรวจสอบถูกต้อง",
    type: ID_TYPES[id[0]],
    formatted: `${id[0]}-${id.slice(1, 5)}-${id.slice(5, 10)}-${id.slice(10, 12)}-${id[12]}`,
  };
}

/// Luhn — บัตรเครดิต, IMEI ฯลฯ
export function luhnValid(digits: string): boolean {
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);

    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }

  return sum % 10 === 0;
}

export function cardBrand(digits: string): string {
  if (/^4/u.test(digits)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/u.test(digits)) return "Mastercard";
  if (/^3[47]/u.test(digits)) return "American Express";
  if (/^35(2[89]|[3-8])/u.test(digits)) return "JCB";
  if (/^62/u.test(digits)) return "UnionPay";
  if (/^(6011|65|64[4-9])/u.test(digits)) return "Discover";
  if (/^3(0[0-5]|[68])/u.test(digits)) return "Diners Club";

  return "ไม่ทราบ";
}

export function validateCard(text: string) {
  const digits = digitsOnly(text);

  if (!/^\d{12,19}$/u.test(digits))
    return { valid: false, brand: "-", reason: "ต้องเป็นตัวเลข 12–19 หลัก" };

  const valid = luhnValid(digits);

  return {
    valid,
    brand: cardBrand(digits),
    reason: valid ? "ผ่านการตรวจ Luhn" : "ไม่ผ่านการตรวจ Luhn (พิมพ์ผิด?)",
    masked: `${"•".repeat(digits.length - 4)}${digits.slice(-4)}`,
  };
}

/// IBAN (ISO 13616) — ตรวจ mod 97
export function validateIban(text: string) {
  const iban = text.replace(/\s/gu, "").toUpperCase();

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/u.test(iban))
    return {
      valid: false,
      reason: "รูปแบบไม่ถูกต้อง (ประเทศ 2 ตัว + ตัวเลขตรวจสอบ 2 หลัก + บัญชี)",
    };

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/gu, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;

  for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;

  return remainder === 1
    ? {
        valid: true,
        reason: "ผ่านการตรวจ mod 97",
        country: iban.slice(0, 2),
        formatted: iban.match(/.{1,4}/gu)?.join(" "),
      }
    : { valid: false, reason: "เลขตรวจสอบไม่ตรง" };
}

/// เบอร์โทรไทย — มือถือ 06/08/09 (10 หลัก) · บ้าน 02–07 (9 หลัก) · รับ +66 ได้
export function validateThaiPhone(text: string) {
  let digits = text.replace(/[\s\-()]/gu, "");

  if (digits.startsWith("+66")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("66") && digits.length === 11) digits = `0${digits.slice(2)}`;

  if (/^0[689]\d{8}$/u.test(digits))
    return {
      valid: true,
      type: "มือถือ",
      local: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
      international: `+66 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`,
    };
  if (/^0[2-7]\d{7}$/u.test(digits)) {
    const area = digits[1] === "2" ? 2 : 3;

    return {
      valid: true,
      type: digits[1] === "2" ? "โทรศัพท์บ้าน (กรุงเทพฯ และปริมณฑล)" : "โทรศัพท์บ้าน (ต่างจังหวัด)",
      local: `${digits.slice(0, area)}-${digits.slice(area, area + 3)}-${digits.slice(area + 3)}`,
      international: `+66 ${digits.slice(1)}`,
    };
  }
  if (/^1\d{3}$/u.test(digits))
    return {
      valid: true,
      type: "เบอร์สั้น 4 หลัก (call center)",
      local: digits,
      international: "-",
    };

  return { valid: false, type: "ไม่ตรงรูปแบบเบอร์ไทย", local: "-", international: "-" };
}

/// เลขผู้เสียภาษีนิติบุคคล 13 หลักใช้สูตรเดียวกับบัตรประชาชน (หลักแรก 0)
export function validateTaxId(text: string) {
  const id = digitsOnly(text);

  if (!/^\d{13}$/u.test(id)) return { valid: false, reason: "ต้องเป็นตัวเลข 13 หลัก" };

  const expected = thaiIdCheckDigit(id.slice(0, 12));

  return expected === Number(id[12])
    ? {
        valid: true,
        reason: id[0] === "0" ? "รูปแบบถูกต้อง (นิติบุคคล)" : "รูปแบบถูกต้อง (บุคคลธรรมดา)",
      }
    : { valid: false, reason: `เลขตรวจสอบไม่ตรง (ควรเป็น ${expected})` };
}

/// ISBN-10 / ISBN-13
export function validateIsbn(text: string) {
  const s = text.replace(/[\s-]/gu, "").toUpperCase();

  if (/^\d{9}[\dX]$/u.test(s)) {
    const sum = [...s].reduce((acc, c, i) => acc + (c === "X" ? 10 : Number(c)) * (10 - i), 0);

    if (sum % 11 !== 0) return { valid: false, reason: "เลขตรวจสอบ ISBN-10 ไม่ตรง" };

    const core = `978${s.slice(0, 9)}`;
    const check =
      (10 - ([...core].reduce((a, c, i) => a + Number(c) * (i % 2 ? 3 : 1), 0) % 10)) % 10;

    return { valid: true, reason: "ISBN-10 ถูกต้อง", converted: `${core}${check}` };
  }

  if (/^\d{13}$/u.test(s)) {
    const sum = [...s].reduce((a, c, i) => a + Number(c) * (i % 2 ? 3 : 1), 0);

    return sum % 10 === 0
      ? { valid: true, reason: "ISBN-13 ถูกต้อง" }
      : { valid: false, reason: "เลขตรวจสอบ ISBN-13 ไม่ตรง" };
  }

  return { valid: false, reason: "ต้องเป็น 10 หรือ 13 หลัก" };
}
