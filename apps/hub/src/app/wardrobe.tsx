"use client";

import { ClothingRail, useTokenColors, type GarmentKind } from "@empire/ui";
import { PGTAP_TESTS } from "@/lib/facts";

const EYEBROW = "font-mono text-xs uppercase tracking-[0.2em]";

// one piece per hat the studio wears; colours are palette tokens, resolved to hex for the SVG
const ROLES: {
  id: string;
  name: string;
  tag: string;
  kind: GarmentKind;
  token: string;
  description: string;
  details: string[];
}[] = [
  {
    id: "pm",
    name: "Product Manager",
    tag: "PM",
    kind: "shirt",
    token: "--em-blue-500",
    description: "ตั้งโจทย์ จัดลำดับงาน และเขียนไว้ก่อนว่างานแบบไหนถึงเรียกว่าเสร็จ",
    details: ["Definition of Done", "ADR ทุกการตัดสินใจใหญ่", "ทุกงานผ่าน PR"],
  },
  {
    id: "pl",
    name: "Tech Lead",
    tag: "PL",
    kind: "jacket",
    token: "--em-ink-700",
    description: "ดูแลคุณภาพหน้าจอ และระบบดีไซน์กลางที่ทุกแอปใช้ร่วมกัน",
    details: ["packages/ui", "Tailwind v4", "Turborepo monorepo"],
  },
  {
    id: "aie",
    name: "AI Engineer",
    tag: "AIE",
    kind: "hoodie",
    token: "--em-violet-500",
    description: "ให้ AI ทำงานในเบราว์เซอร์ของผู้ใช้ งานหนักแยกไปทำใน Web Worker ไม่ถ่วงหน้าจอ",
    details: ["WebGPU", "Web Worker + Comlink", "BYOK"],
  },
  {
    id: "ux",
    name: "UX Designer",
    tag: "UX",
    kind: "knit",
    token: "--em-violet-300",
    description: "วาดหน้าจอ วางลำดับการใช้งาน ให้ทุกแอปดูเป็นสตูดิโอเดียวกัน",
    details: ["Design tokens", "ธีมสว่าง · มืด", "เคารพ reduced motion"],
  },
  {
    id: "dba",
    name: "Database Admin",
    tag: "DBA",
    kind: "tee",
    token: "--em-blue-700",
    description: "ออกแบบฐานข้อมูล กฎว่าใครเห็นอะไรอยู่ในฐานข้อมูลเอง ไม่ฝากไว้แค่หน้าเว็บ",
    details: ["Postgres + RLS", `${String(PGTAP_TESTS)} pgTAP tests`, "1 แอป = 1 schema"],
  },
  {
    id: "ops",
    name: "DevOps",
    tag: "OPS",
    kind: "coat",
    token: "--em-ink-600",
    description: "ทุก PR ต้องผ่านการตรวจอัตโนมัติก่อนเข้า main แล้วค่อยขึ้นระบบจริง",
    details: ["GitHub Actions", "Cloudflare Workers", "pnpm verify"],
  },
  {
    id: "qa",
    name: "QA",
    tag: "QA",
    kind: "tee",
    token: "--em-sky-500",
    description: "เขียนเทสต์ก่อนบอกว่าเสร็จ และเปิดหน้าจริงดูทุกครั้งก่อนส่ง",
    details: ["Vitest", "pgTAP", "lint + typecheck"],
  },
];

/** The roles one person switches between, as a rail of clothes: turn one, lift it, read the back. */
export function Wardrobe() {
  const colors = useTokenColors(ROLES.map((r) => r.token));
  return (
    <section data-tide id="wardrobe" aria-label="บทบาทที่ผมทำ" className="scroll-mt-16 pb-16">
      {colors && (
        <ClothingRail
          className="mx-auto max-w-6xl"
          railLabel="ราวเสื้อ 7 บทบาท"
          autoplay
          interval={2800}
          eyebrow={<p className={`${EYEBROW} cw-blue`}>wardrobe</p>}
          heading={
            <h2 className="text-4xl font-black tracking-tight sm:text-6xl">
              {ROLES.length} ชุดที่ผม <span className="cw-blue">สลับใส่ทุกวัน</span>
            </h2>
          }
          caption="ชี้ไปตามราวเพื่อหันเสื้อ กดเพื่อหยิบลงมาดูหน้าและหลัง"
          labels={{ front: "ด้านหน้า", back: "ด้านหลัง", close: "แขวนคืน", show: "ดู" }}
          items={ROLES.map((r, i) => ({
            id: r.id,
            name: r.name,
            tag: r.tag,
            kind: r.kind,
            color: colors[i] ?? "currentColor",
            description: r.description,
            details: r.details,
          }))}
        />
      )}
    </section>
  );
}
