import {
  Binary,
  Crop,
  FileDiff,
  FileImage,
  FileText,
  Hash,
  ImageDown,
  Pipette,
  Scaling,
} from "lucide-react";
import { converterTools } from "./specs/convert";
import { developerTools } from "./specs/developer";
import { calculatorTools, financeTools } from "./specs/finance";
import { generatorTools, securityTools } from "./specs/generate";
import { identityTools, networkTools } from "./specs/network";
import { referenceTools, seoTools } from "./specs/seo";
import { textTools } from "./specs/text";
import { timeTools } from "./specs/time";
import type { CategoryKey, PageTool, SpecTool, Tool } from "./types";

/// เครื่องมือที่มีหน้าของตัวเอง (AIE ทำไว้แล้ว — งานไฟล์/รูปที่ต้องมี UI เฉพาะ)
const pageTools: PageTool[] = [
  {
    kind: "page",
    slug: "image-compressor",
    href: "/tools/image-compressor",
    name: "บีบอัดรูปภาพ",
    description: "ลดขนาดไฟล์ JPG PNG WebP ในเบราว์เซอร์ ปรับคุณภาพได้",
    category: "image",
    icon: ImageDown,
    keywords: ["compress", "image", "jpg", "png", "webp", "บีบอัด"],
  },
  {
    kind: "page",
    slug: "image-resizer",
    href: "/tools/image-resizer",
    name: "ปรับขนาดรูปภาพ",
    description: "ย่อหรือขยายรูปตามพิกเซล คงสัดส่วนได้",
    category: "image",
    icon: Scaling,
    keywords: ["resize", "image", "ย่อรูป"],
  },
  {
    kind: "page",
    slug: "image-format-converter",
    href: "/tools/image-format-converter",
    name: "แปลงไฟล์รูปภาพ",
    description: "แปลง JPG ↔ PNG ↔ WebP โดยไม่อัปโหลด",
    category: "image",
    icon: FileImage,
    keywords: ["convert", "jpg to png", "webp"],
  },
  {
    kind: "page",
    slug: "image-cropper",
    href: "/tools/image-cropper",
    name: "ตัดภาพ (Crop)",
    description: "ตัดเฉพาะส่วนของภาพตามพิกัด",
    category: "image",
    icon: Crop,
    keywords: ["crop", "ตัดภาพ"],
  },
  {
    kind: "page",
    slug: "image-color-picker",
    href: "/tools/image-color-picker",
    name: "ดูดสีจากรูปภาพ",
    description: "คลิกบนภาพเพื่ออ่านค่าสี",
    category: "image",
    icon: Pipette,
    keywords: ["color picker", "eyedropper", "ดูดสี"],
  },
  {
    kind: "page",
    slug: "file-comparison",
    href: "/tools/file-comparison",
    name: "เปรียบเทียบไฟล์",
    description: "เทียบไฟล์ข้อความสองไฟล์ ดูบรรทัดที่ต่างกัน",
    category: "document",
    icon: FileDiff,
    keywords: ["diff", "compare files", "เปรียบเทียบไฟล์"],
  },
  {
    kind: "page",
    slug: "pdf-to-word",
    href: "/tools/pdf-to-word",
    name: "แปลง PDF เป็น Word",
    description: "ดึงข้อความจาก PDF เป็นไฟล์ Word ในเบราว์เซอร์",
    category: "document",
    icon: FileText,
    keywords: ["pdf", "word", "docx", "convert"],
  },
  {
    kind: "page",
    slug: "number-base-converter",
    href: "/tools/number-base-converter",
    name: "แปลงเลขฐาน",
    description: "แปลงเลขฐาน 2 8 10 16 และฐานอื่น ๆ",
    category: "converter",
    icon: Binary,
    keywords: ["binary", "hex", "octal", "base", "เลขฐาน"],
  },
  {
    kind: "page",
    slug: "hash-crypto-toolbox",
    href: "/tools/hash-crypto-toolbox",
    name: "ชุดเครื่องมือ Hash และเข้ารหัส",
    description: "Hash ไฟล์ Base64 และเข้ารหัส AES-GCM ด้วย Web Crypto",
    category: "security",
    icon: Hash,
    keywords: ["hash file", "aes", "encrypt", "checksum"],
  },
];

/// เครื่องมือรูปภาพที่ใช้ `<ImageTool>` ในหน้า /tools/[toolId]
export const IMAGE_TOOL_SLUGS = new Set([
  "image-resizer",
  "image-format-converter",
  "image-cropper",
  "image-color-picker",
]);

export const SPEC_TOOLS: SpecTool[] = [
  ...developerTools,
  ...textTools,
  ...converterTools,
  ...calculatorTools,
  ...financeTools,
  ...generatorTools,
  ...securityTools,
  ...networkTools,
  ...identityTools,
  ...timeTools,
  ...seoTools,
  ...referenceTools,
];

export const TOOLS: Tool[] = [...SPEC_TOOLS, ...pageTools];

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));

export function findTool(slug: string): Tool | undefined {
  return bySlug.get(slug);
}

export function toolHref(tool: Tool): string {
  return tool.kind === "page" ? tool.href : `/tools/${tool.slug}`;
}

export function toolsIn(category: CategoryKey): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

/// ค้นแบบไม่สนตัวพิมพ์ — ชื่อ คำอธิบาย คำค้น และ slug · เรียงให้ชื่อที่ขึ้นต้นด้วยคำค้นมาก่อน
export function searchTools(query: string, pool: Tool[] = TOOLS): Tool[] {
  const q = query.trim().toLocaleLowerCase("th");

  if (!q) return pool;

  const terms = q.split(/\s+/u);
  const scored = pool
    .map((tool) => {
      const name = tool.name.toLocaleLowerCase("th");
      const haystack = [
        name,
        tool.slug,
        tool.description.toLocaleLowerCase("th"),
        ...(tool.keywords ?? []).map((k) => k.toLocaleLowerCase("th")),
      ].join(" ");

      if (!terms.every((t) => haystack.includes(t))) return null;

      const score =
        (name.startsWith(q)
          ? 0
          : name.includes(q)
            ? 1
            : (tool.keywords ?? []).some((k) => k.toLocaleLowerCase("th").startsWith(q)) ||
                tool.slug.startsWith(q)
              ? 2
              : 3) *
          1000 +
        name.length;

      return { tool, score };
    })
    .filter((x): x is { tool: Tool; score: number } => x !== null);

  return scored.sort((a, b) => a.score - b.score).map((x) => x.tool);
}
