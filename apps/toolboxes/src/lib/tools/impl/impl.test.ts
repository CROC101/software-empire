import { describe, expect, it } from "vitest";
import { bahtText, convertUnit } from "./convert";
import { decodeJwt, formatJson, parseJson } from "./developer";
import { gpa, loan, thaiIncomeTax, vat } from "./finance";
import {
  generatePassword,
  hashBytes,
  hmac,
  md5,
  passwordStrength,
  randomInt,
  totp,
  CHARSETS,
} from "./security";
import { randomNumbers, uuidV7 } from "./generate";
import {
  cardBrand,
  thaiIdCheckDigit,
  validateCard,
  validateIban,
  validateIsbn,
  validateThaiId,
  validateThaiPhone,
} from "./identity";
import { cidrInfo, compressIPv6, expandIPv6, maskToPrefix, parseIPv4 } from "./network";
import { parseMarkdown, safeHref } from "./markdown";
import { addToDate, calendarDiff, describeCron, nextCronRuns, workingDays } from "./time";
import { slugify } from "./text";
import { parseYaml, toYaml } from "./yaml";
import { metaTags, robotsTxt, sitemapXml, utmUrl } from "./seo";
import { parseUserAgent } from "./reference";

const enc = (s: string) => new TextEncoder().encode(s);

describe("security", () => {
  it("MD5 ตรงกับค่ามาตรฐานของ RFC 1321", () => {
    expect(md5(enc(""))).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(md5(enc("abc"))).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(md5(enc("The quick brown fox jumps over the lazy dog"))).toBe(
      "9e107d9d372bb6826bd81d3542a419d6",
    );
    // ข้อความยาวกว่าหนึ่งบล็อก (64 ไบต์) และภาษาไทย (UTF-8 หลายไบต์)
    expect(md5(enc("a".repeat(100)))).toBe("36a92cc94a9e0fa21f625f8bfb007adf");
  });

  it("SHA-256 ผ่าน Web Crypto", async () => {
    expect(await hashBytes(enc("abc"), "SHA-256")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("HMAC-SHA256 ตรงกับตัวอย่างมาตรฐาน", async () => {
    const r = await hmac("The quick brown fox jumps over the lazy dog", "key", "SHA-256");

    expect(r.hex).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });

  it("TOTP ตรงกับเวกเตอร์ทดสอบของ RFC 6238", async () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // "12345678901234567890"

    expect((await totp(secret, { time: 59_000, digits: 8 })).code).toBe("94287082");
    expect((await totp(secret, { time: 1_111_111_109_000, digits: 8 })).code).toBe("07081804");
  });

  it("รหัสผ่านมีครบทุกชุดที่เลือกและยาวตามกำหนด", () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword({
        length: 12,
        upper: true,
        lower: true,
        digits: true,
        symbols: true,
        avoidAmbiguous: true,
      });

      expect(p).toHaveLength(12);
      expect(p).toMatch(/[A-Z]/u);
      expect(p).toMatch(/[a-z]/u);
      expect(p).toMatch(/\d/u);
      expect([...p].some((c) => CHARSETS.symbols.includes(c))).toBe(true);
      expect(p).not.toMatch(/[O0Il1|]/u);
    }
  });

  it("ไม่เลือกชุดตัวอักษรเลย = แจ้งข้อผิดพลาด", () => {
    expect(() =>
      generatePassword({
        length: 12,
        upper: false,
        lower: false,
        digits: false,
        symbols: false,
        avoidAmbiguous: false,
      }),
    ).toThrow("อย่างน้อย 1 ชุด");
  });

  it("randomInt อยู่ในช่วงเสมอ", () => {
    for (let i = 0; i < 1000; i++) {
      const n = randomInt(7);

      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it("รหัสผ่านที่เดาง่ายได้คะแนนต่ำ", () => {
    expect(passwordStrength("password123").score).toBeLessThanOrEqual(1);
    expect(passwordStrength("v9#Lq2!xT7@mR4$w").score).toBeGreaterThanOrEqual(3);
  });
});

describe("generate", () => {
  it("UUID v7 มีเวอร์ชัน 7 และเวลาที่ฝังไว้", () => {
    const id = uuidV7(Date.UTC(2026, 9, 8));

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    expect(parseInt(id.replace(/-/gu, "").slice(0, 12), 16)).toBe(Date.UTC(2026, 9, 8));
  });

  it("สุ่มเลขไม่ซ้ำครบทั้งช่วง", () => {
    const list = randomNumbers({ min: 1, max: 10, count: 10, unique: true, decimals: 0 });

    expect([...list].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(() => randomNumbers({ min: 1, max: 3, count: 4, unique: true, decimals: 0 })).toThrow(
      "ไม่ซ้ำได้แค่ 3",
    );
  });
});

describe("identity", () => {
  it("เลขบัตรประชาชน: เลขตรวจสอบถูก = ผ่าน · ผิดหนึ่งหลัก = ไม่ผ่าน", () => {
    const first12 = "110170020345";
    const valid = `${first12}${thaiIdCheckDigit(first12)}`;
    const wrong = `${first12}${(thaiIdCheckDigit(first12) + 1) % 10}`;

    expect(validateThaiId(valid).valid).toBe(true);
    expect(validateThaiId(wrong).valid).toBe(false);
    expect(validateThaiId("123").valid).toBe(false);
  });

  it("Luhn และเครือข่ายบัตร", () => {
    expect(validateCard("4111 1111 1111 1111").valid).toBe(true);
    expect(validateCard("4111 1111 1111 1112").valid).toBe(false);
    expect(cardBrand("5500000000000004")).toBe("Mastercard");
  });

  it("IBAN และ ISBN", () => {
    expect(validateIban("GB82 WEST 1234 5698 7654 32").valid).toBe(true);
    expect(validateIban("GB82 WEST 1234 5698 7654 33").valid).toBe(false);
    expect(validateIsbn("978-0-306-40615-7").valid).toBe(true);
    expect(validateIsbn("0-306-40615-2")).toMatchObject({
      valid: true,
      converted: "9780306406157",
    });
  });

  it("เบอร์โทรไทยแปลง +66 ได้", () => {
    expect(validateThaiPhone("+66 81 234 5678")).toMatchObject({
      valid: true,
      type: "มือถือ",
      local: "081-234-5678",
    });
    expect(validateThaiPhone("02-123-4567").valid).toBe(true);
    expect(validateThaiPhone("12345").valid).toBe(false);
  });
});

describe("network", () => {
  it("คำนวณ CIDR", () => {
    expect(cidrInfo("192.168.1.10/24")).toMatchObject({
      network: "192.168.1.0",
      broadcast: "192.168.1.255",
      first: "192.168.1.1",
      last: "192.168.1.254",
      usable: 254,
      mask: "255.255.255.0",
      type: "Private (RFC 1918)",
    });
    expect(cidrInfo("10.0.0.0/31").usable).toBe(2);
    expect(maskToPrefix("255.255.240.0")).toBe(20);
    expect(() => maskToPrefix("255.0.255.0")).toThrow();
  });

  it("IPv4 ที่มีเลข 0 นำหน้าหรือเกิน 255 ไม่ผ่าน", () => {
    expect(() => parseIPv4("192.168.01.1")).toThrow();
    expect(() => parseIPv4("256.1.1.1")).toThrow();
  });

  it("ขยายและย่อ IPv6 ตาม RFC 5952", () => {
    const full = expandIPv6("2001:db8::1");

    expect(full.join(":")).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
    expect(compressIPv6(full)).toBe("2001:db8::1");
    expect(compressIPv6(expandIPv6("::ffff:192.0.2.1"))).toBe("::ffff:c000:201");
  });
});

describe("time", () => {
  it("ผลต่างแบบปฏิทิน", () => {
    expect(calendarDiff(new Date(2004, 0, 15), new Date(2026, 9, 8))).toMatchObject({
      years: 22,
      months: 8,
      days: 23,
    });
  });

  it("31 ม.ค. + 1 เดือน = วันสุดท้ายของ ก.พ.", () => {
    const d = addToDate(new Date(2026, 0, 31), { years: 0, months: 1, days: 0, hours: 0 });

    expect([d.getMonth(), d.getDate()]).toEqual([1, 28]);
  });

  it("cron วันทำงาน 08:30 ข้ามเสาร์-อาทิตย์", () => {
    const runs = nextCronRuns("30 8 * * 1-5", 2, new Date(2026, 9, 9, 9, 0));

    expect(runs.map((d) => [d.getDate(), d.getHours(), d.getMinutes()])).toEqual([
      [12, 8, 30],
      [13, 8, 30],
    ]);
    expect(describeCron("30 8 * * 1-5")).toContain("08:30");
    expect(() => nextCronRuns("61 * * * *", 1)).toThrow("นอกช่วง");
  });

  it("นับวันทำการหักวันหยุดที่กรอก", () => {
    // จันทร์ 12 – ศุกร์ 16 ต.ค. 2569 หยุดวันอังคาร
    expect(workingDays(new Date(2026, 9, 12), new Date(2026, 9, 18), ["2026-10-13"])).toEqual({
      work: 4,
      weekend: 2,
      holiday: 1,
      total: 7,
    });
  });
});

describe("finance", () => {
  it("VAT 7% แยกออกจากราคารวม", () => {
    const r = vat(1070, 7, true);

    expect(r.base).toBeCloseTo(1000);
    expect(r.tax).toBeCloseTo(70);
  });

  it("เงินกู้ดอกเบี้ย 0% = หารเท่ากัน", () => {
    expect(loan(100000, 0, 10).payment).toBe(10000);
  });

  it("ภาษีเงินได้แบบขั้นบันได", () => {
    expect(thaiIncomeTax(420000).tax).toBe(19500);
    expect(thaiIncomeTax(100000).tax).toBe(0);
  });

  it("GPA ปัดลงสองตำแหน่ง", () => {
    expect(gpa("A 3\nB+ 3\nC 2").gpa).toBe(3.31);
  });
});

describe("convert", () => {
  it("อ่านจำนวนเงินเป็นภาษาไทย", () => {
    expect(bahtText("21")).toBe("ยี่สิบเอ็ดบาทถ้วน");
    expect(bahtText("1,250.75")).toBe("หนึ่งพันสองร้อยห้าสิบบาทเจ็ดสิบห้าสตางค์");
  });

  it("หน่วยไทย: 1 ไร่ = 400 ตารางวา", () => {
    expect(convertUnit("area", 1, "rai", "wa2")).toBe(400);
    expect(convertUnit("temperature", 100, "c", "f")).toBe(212);
  });
});

describe("developer", () => {
  it("JSON ผิดบอกบรรทัด", () => {
    expect(() => parseJson('{\n  "a": 1,\n}')).toThrow(/บรรทัด 3/u);
    expect(formatJson('{"b":1,"a":2}', "sort")).toBe('{\n  "a": 2,\n  "b": 1\n}');
  });

  it("ถอด JWT ได้แม้ไม่มีลายเซ็น", () => {
    const part = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/u, "");
    const r = decodeJwt(`${part({ alg: "none" })}.${part({ sub: "x", exp: 1 })}.`);

    expect(r.payload.sub).toBe("x");
    expect(r.expired).toBe(true);
    expect(r.signed).toBe(false);
  });

  it("YAML ↔ JSON ไปกลับได้", () => {
    const data = { name: "CS Toolboxes", tools: ["json", "yaml"], nested: { ok: true, n: 3 } };

    expect(parseYaml(toYaml(data))).toEqual(data);
    expect(parseYaml("a: 1\nb:\n  - x\n  - y")).toEqual({ a: 1, b: ["x", "y"] });
  });

  it("Markdown ไม่สร้างลิงก์ javascript:", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();

    const blocks = parseMarkdown("[คลิก](javascript:alert(1)) และ [ปกติ](https://example.com)");

    expect(JSON.stringify(blocks)).not.toContain("javascript");
    expect(JSON.stringify(blocks)).toContain('"href":"https://example.com"');
  });

  it("slug ใช้ตัวคั่น - และ _ ได้ (regex โหมด u)", () => {
    expect(slugify("  Hello,  World!! ", { separator: "-", keepThai: true, lowercase: true })).toBe(
      "hello-world",
    );
    expect(slugify("สวัสดี ชาวโลก", { separator: "_", keepThai: true, lowercase: true })).toBe(
      "สวัสดี_ชาวโลก",
    );
  });
});

describe("seo", () => {
  it("meta tags escape ค่าที่ผู้ใช้กรอก", () => {
    const html = metaTags({
      title: '"><script>',
      description: "d",
      url: "",
      image: "",
      siteName: "",
      locale: "th_TH",
      twitterCard: "summary",
      robots: "",
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("robots / sitemap / utm", () => {
    expect(
      robotsTxt({
        userAgent: "*",
        disallow: "/admin",
        allow: "",
        sitemap: "https://e.com/s.xml",
        crawlDelay: 0,
      }),
    ).toBe("User-agent: *\nDisallow: /admin\n\nSitemap: https://e.com/s.xml");
    expect(sitemapXml("https://e.com/a", "weekly", "0.8")).toContain("<loc>https://e.com/a</loc>");
    expect(() => sitemapXml("javascript:x", "weekly", "0.8")).toThrow();
    expect(
      utmUrl({
        url: "https://e.com/?a=1",
        source: "fb",
        medium: "social",
        campaign: "x",
        term: "",
        content: "",
      }),
    ).toBe("https://e.com/?a=1&utm_source=fb&utm_medium=social&utm_campaign=x");
  });
});

describe("reference", () => {
  it("แยก User-Agent", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    );

    expect(r).toMatchObject({
      browser: "Safari 18.1",
      os: "iOS 18.1",
      device: "มือถือ",
      engine: "WebKit",
    });
  });
});
