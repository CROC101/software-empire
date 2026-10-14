import {
  BadgeCheck,
  Barcode,
  BookMarked,
  Building2,
  CreditCard,
  Cable,
  Network,
  Phone,
  Router,
  Server,
  ShieldQuestion,
  Waypoints,
  IdCard,
} from "lucide-react";
import { out, row, text, textarea } from "../fields";
import {
  validateCard,
  validateIban,
  validateIsbn,
  validateTaxId,
  validateThaiId,
  validateThaiPhone,
} from "../impl/identity";
import {
  cidrInfo,
  compressIPv6,
  expandIPv6,
  formatIPv4,
  ipInRange,
  ipv4Class,
  ipv6Type,
  macInfo,
  maskToPrefix,
  parseIPv4,
} from "../impl/network";
import { str, type SpecTool } from "../types";

const verdict = (valid: boolean) => (valid ? "ถูกต้อง" : "ไม่ถูกต้อง");

export const networkTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "subnet-calculator",
    name: "คำนวณ IPv4 Subnet (CIDR)",
    description: "network, broadcast, ช่วง host, subnet mask, wildcard และจำนวน host จาก CIDR",
    category: "network",
    icon: Network,
    keywords: ["subnet", "cidr", "ipv4", "netmask", "network"],
    live: true,
    fields: [text("input", "IPv4/prefix", { defaultValue: "192.168.1.10/24", mono: true })],
    run: (v) => {
      const c = cidrInfo(str(v, "input"));

      return out.rows([
        row("Network", `${c.network}/${c.prefix}`, true),
        row("Broadcast", c.broadcast, true),
        row("Host แรก – สุดท้าย", `${c.first} – ${c.last}`, true),
        row("Subnet mask", c.mask, true),
        row("Wildcard", c.wildcard, true),
        row("Mask แบบ binary", c.binaryMask, true),
        row("จำนวน IP ทั้งหมด", c.total.toLocaleString("th-TH")),
        row("Host ที่ใช้ได้", c.usable.toLocaleString("th-TH")),
        row("ประเภท", c.type),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "ip-validator",
    name: "ตรวจ IP Address (IPv4/IPv6)",
    description: "ตรวจรูปแบบ IP บอกประเภท (private, public, loopback …) และรูปเต็ม/ย่อของ IPv6",
    category: "network",
    icon: ShieldQuestion,
    keywords: ["ip", "validate", "ipv4", "ipv6", "private ip"],
    live: true,
    fields: [text("input", "IP address", { defaultValue: "2001:db8::1", mono: true })],
    run: (v) => {
      const input = str(v, "input").trim();

      if (!input) return out.rows([]);
      if (input.includes(":")) {
        const groups = expandIPv6(input);

        return out.rows([
          row("ผล", "IPv6 ที่ถูกต้อง"),
          row("ประเภท", ipv6Type(groups)),
          row("รูปเต็ม", groups.join(":"), true),
          row("รูปย่อ (RFC 5952)", compressIPv6(groups), true),
        ]);
      }

      const n = parseIPv4(input);

      return out.rows([
        row("ผล", "IPv4 ที่ถูกต้อง"),
        row("ประเภท", ipv4Class(n)),
        row("เลขจำนวนเต็ม", n, true),
        row("ฐาน 16", `0x${n.toString(16).padStart(8, "0").toUpperCase()}`, true),
        row("IPv4-mapped IPv6", `::ffff:${input}`, true),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "ip-converter",
    name: "แปลง IPv4 ↔ ตัวเลข / Binary",
    description: "แปลง IPv4 เป็นเลขฐาน 10, 16, 2 และแปลงตัวเลขกลับเป็น IPv4",
    category: "network",
    icon: Cable,
    keywords: ["ip to int", "ip to decimal", "ip binary", "long ip"],
    live: true,
    fields: [text("input", "IPv4 หรือตัวเลข", { defaultValue: "10.0.0.1", mono: true })],
    run: (v) => {
      const input = str(v, "input").trim();

      if (!input) return out.rows([]);

      const n = /^\d+$/u.test(input)
        ? Number(input)
        : /^0x[0-9a-f]+$/iu.test(input)
          ? parseInt(input, 16)
          : parseIPv4(input);

      if (!Number.isInteger(n) || n < 0 || n > 0xffffffff)
        throw new Error("ตัวเลขต้องอยู่ระหว่าง 0 – 4294967295");

      return out.rows([
        row("IPv4", formatIPv4(n), true),
        row("ฐาน 10", n, true),
        row("ฐาน 16", `0x${n.toString(16).padStart(8, "0")}`, true),
        row(
          "ฐาน 2",
          n
            .toString(2)
            .padStart(32, "0")
            .replace(/(.{8})(?!$)/gu, "$1."),
          true,
        ),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "subnet-mask-converter",
    name: "แปลง Subnet Mask ↔ Prefix",
    description: "แปลง 255.255.255.0 ↔ /24 และดูตาราง mask ทุกขนาด",
    category: "network",
    icon: Router,
    keywords: ["subnet mask", "netmask", "prefix", "cidr"],
    live: true,
    fields: [text("input", "Mask หรือ prefix", { defaultValue: "255.255.255.0", mono: true })],
    run: (v) => {
      const input = str(v, "input").trim().replace(/^\//u, "");

      if (!input) return out.rows([]);

      const prefix = /^\d{1,2}$/u.test(input) ? Number(input) : maskToPrefix(input);
      const c = cidrInfo(`0.0.0.0/${prefix}`);

      return out.rows([
        row("Prefix", `/${prefix}`, true),
        row("Subnet mask", c.mask, true),
        row("Wildcard", c.wildcard, true),
        row("จำนวน IP ต่อ subnet", c.total.toLocaleString("th-TH")),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "ip-range-checker",
    name: "ตรวจว่า IP อยู่ในช่วง CIDR",
    description: "ตรวจ IP หลายตัวพร้อมกันว่าอยู่ในเครือข่ายที่กำหนดหรือไม่ (เช่น ตั้ง allowlist)",
    category: "network",
    icon: Waypoints,
    keywords: ["ip in range", "cidr match", "allowlist", "whitelist"],
    live: true,
    fields: [
      text("cidr", "เครือข่าย (CIDR)", { defaultValue: "10.0.0.0/8", mono: true }),
      textarea("ips", "IP ที่ต้องการตรวจ (บรรทัดละตัว)", {
        rows: 5,
        defaultValue: "10.1.2.3\n192.168.0.1",
      }),
    ],
    run: (v) => {
      const ips = str(v, "ips")
        .split(/\r?\n/u)
        .map((s) => s.trim())
        .filter(Boolean);

      return out.table(
        ["IP", "ผล"],
        ips.slice(0, 1000).map((ip) => {
          try {
            return [ip, ipInRange(ip, str(v, "cidr")) ? "อยู่ในช่วง" : "ไม่อยู่ในช่วง"];
          } catch (error) {
            return [ip, error instanceof Error ? error.message : "ไม่ถูกต้อง"];
          }
        }),
      );
    },
  },
  {
    kind: "spec",
    slug: "ipv6-expander",
    name: "ขยาย / ย่อ IPv6",
    description: "แปลง IPv6 รูปย่อ (::) เป็นรูปเต็ม 8 กลุ่ม และย่อกลับตาม RFC 5952",
    category: "network",
    icon: Server,
    keywords: ["ipv6", "expand", "compress", "shorten"],
    live: true,
    fields: [text("input", "IPv6", { defaultValue: "fe80::1ff:fe23:4567:890a", mono: true })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const groups = expandIPv6(str(v, "input"));

      return out.rows([
        row("รูปเต็ม", groups.join(":"), true),
        row("รูปย่อ", compressIPv6(groups), true),
        row("ประเภท", ipv6Type(groups)),
        row("reverse DNS", `${[...groups.join("")].reverse().join(".")}.ip6.arpa`, true),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "mac-address-formatter",
    name: "จัดรูปแบบ MAC Address",
    description: "แปลง MAC เป็นรูปแบบ : - และ . พร้อมบอกว่าเป็น unicast/multicast และ local/global",
    category: "network",
    icon: Barcode,
    keywords: ["mac", "mac address", "hardware address"],
    live: true,
    fields: [text("input", "MAC address", { defaultValue: "00-1A-2B-3C-4D-5E", mono: true })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const m = macInfo(str(v, "input"));

      return out.rows([
        row("แบบ :", m.colon, true),
        row("แบบ -", m.hyphen, true),
        row("แบบ Cisco", m.dot, true),
        row("OUI (ผู้ผลิต)", m.oui, true),
        row("ชนิด", m.unicast ? "Unicast" : "Multicast"),
        row(
          "การกำหนด",
          m.local ? "ตั้งเอง (locally administered)" : "จากผู้ผลิต (globally unique)",
        ),
      ]);
    },
  },
];

export const identityTools: SpecTool[] = [
  {
    kind: "spec",
    slug: "thai-id-validator",
    name: "ตรวจเลขบัตรประชาชนไทย",
    description:
      "ตรวจรูปแบบ 13 หลักและเลขตรวจสอบ (mod 11) — ไม่ได้ยืนยันว่ามีตัวตนจริง และไม่ส่งข้อมูลออกจากเครื่อง",
    category: "identity",
    icon: IdCard,
    keywords: ["thai id", "citizen id", "บัตรประชาชน", "เลข 13 หลัก"],
    live: true,
    fields: [text("input", "เลขบัตรประชาชน", { mono: true, placeholder: "x-xxxx-xxxxx-xx-x" })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = validateThaiId(str(v, "input"));

      return out.rows([
        row("ผล", verdict(r.valid)),
        row("รายละเอียด", r.reason),
        r.formatted && row("รูปแบบ", r.formatted, true),
        r.type && row("ประเภทบุคคล (หลักแรก)", r.type),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "thai-phone-validator",
    name: "ตรวจและจัดรูปแบบเบอร์โทรไทย",
    description: "ตรวจเบอร์มือถือ/บ้าน แปลงเป็นรูปแบบ 0xx-xxx-xxxx และ +66",
    category: "identity",
    icon: Phone,
    keywords: ["phone", "mobile", "เบอร์โทร", "+66"],
    live: true,
    fields: [
      text("input", "เบอร์โทร", { mono: true, placeholder: "0812345678 หรือ +66 81 234 5678" }),
    ],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = validateThaiPhone(str(v, "input"));

      return out.rows([
        row("ผล", verdict(r.valid)),
        row("ชนิด", r.type),
        row("รูปแบบในประเทศ", r.local, true),
        row("รูปแบบสากล", r.international, true),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "credit-card-validator",
    name: "ตรวจเลขบัตรด้วย Luhn",
    description:
      "ตรวจว่าเลขบัตรพิมพ์ถูกรูปแบบ (Luhn) และบอกเครือข่ายบัตร — ใช้ทดสอบฟอร์ม ไม่ได้ตรวจกับธนาคาร",
    category: "identity",
    icon: CreditCard,
    keywords: ["credit card", "luhn", "visa", "mastercard", "บัตรเครดิต"],
    live: true,
    fields: [
      {
        key: "input",
        label: "เลขบัตร",
        kind: "password",
        mono: true,
        help: "ตรวจในเครื่องเท่านั้น ไม่บันทึก ไม่ส่งออก",
      },
    ],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = validateCard(str(v, "input"));

      return out.rows([
        row("ผล", verdict(r.valid)),
        row("เครือข่าย", r.brand),
        row("รายละเอียด", r.reason),
        r.masked && row("เลขบัตร", r.masked, true),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "iban-validator",
    name: "ตรวจเลขบัญชี IBAN",
    description: "ตรวจเลขบัญชีธนาคารระหว่างประเทศ (IBAN) ด้วย mod 97",
    category: "identity",
    icon: Building2,
    keywords: ["iban", "bank account", "swift"],
    live: true,
    fields: [text("input", "IBAN", { mono: true, placeholder: "GB82 WEST 1234 5698 7654 32" })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = validateIban(str(v, "input"));

      return out.rows([
        row("ผล", verdict(r.valid)),
        row("รายละเอียด", r.reason),
        r.country && row("ประเทศ", r.country),
        r.formatted && row("รูปแบบ", r.formatted, true),
      ]);
    },
  },
  {
    kind: "spec",
    slug: "tax-id-validator",
    name: "ตรวจเลขประจำตัวผู้เสียภาษี",
    description: "ตรวจเลข 13 หลักของนิติบุคคล/บุคคลธรรมดาด้วยเลขตรวจสอบ",
    category: "identity",
    icon: BadgeCheck,
    keywords: ["tax id", "เลขผู้เสียภาษี", "นิติบุคคล"],
    live: true,
    fields: [text("input", "เลขผู้เสียภาษี", { mono: true })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = validateTaxId(str(v, "input"));

      return out.rows([row("ผล", verdict(r.valid)), row("รายละเอียด", r.reason)]);
    },
  },
  {
    kind: "spec",
    slug: "isbn-validator",
    name: "ตรวจเลข ISBN หนังสือ",
    description: "ตรวจ ISBN-10 / ISBN-13 และแปลง ISBN-10 เป็น ISBN-13",
    category: "identity",
    icon: BookMarked,
    keywords: ["isbn", "book", "หนังสือ"],
    live: true,
    fields: [text("input", "ISBN", { mono: true, placeholder: "978-616-..." })],
    run: (v) => {
      if (!str(v, "input").trim()) return out.rows([]);

      const r = validateIsbn(str(v, "input"));

      return out.rows([
        row("ผล", verdict(r.valid)),
        row("รายละเอียด", r.reason),
        "converted" in r && r.converted ? row("ISBN-13", r.converted, true) : null,
      ]);
    },
  },
];
