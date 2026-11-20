"use client";

import { ClothingRail, useTokenColors, type GarmentKind } from "@empire/ui";

const roles: {
  id: string;
  name: string;
  kind: GarmentKind;
  token: string;
  description: string;
}[] = [
  {
    id: "pm",
    name: "Product Manager",
    kind: "shirt",
    token: "--em-blue-500",
    description: "ตั้งโจทย์ จัดลำดับงาน และเขียนไว้ก่อนว่าเสร็จแล้วหน้าตาเป็นอย่างไร",
  },
  {
    id: "pl",
    name: "Tech Lead",
    kind: "jacket",
    token: "--em-ink-700",
    description: "ดูแลคุณภาพหน้าจอและระบบดีไซน์ที่ทุกแอปใช้ร่วมกัน",
  },
  {
    id: "ux",
    name: "UX Designer",
    kind: "knit",
    token: "--em-sky-500",
    description: "วาดหน้าจอ วางลำดับการใช้งาน ให้ทุกหน้าดูเป็นงานชุดเดียวกัน",
  },
  {
    id: "dba",
    name: "Database Admin",
    kind: "tee",
    token: "--em-blue-700",
    description: "ออกแบบฐานข้อมูล กฎว่าใครเห็นอะไรอยู่ในฐานข้อมูลเอง",
  },
  {
    id: "ops",
    name: "DevOps",
    kind: "coat",
    token: "--em-ink-600",
    description: "ทุกงานผ่านการตรวจอัตโนมัติก่อนขึ้นระบบจริง",
  },
  {
    id: "qa",
    name: "QA",
    kind: "hoodie",
    token: "--em-sky-400",
    description: "เขียนเทสต์ก่อนบอกว่าเสร็จ และเปิดหน้าจริงดูทุกครั้ง",
  },
];

/** Roles as clothes on a rail: point to turn one, click to lift it down and read it. */
export default function ClothingRailDemo({ seconds = 3 }: { seconds?: number }) {
  const colors = useTokenColors(roles.map((r) => r.token));
  return (
    <div className="size-full min-h-[36rem] bg-background py-10 text-foreground">
      {colors && (
        <ClothingRail
          railLabel={`ราวเสื้อ ${String(roles.length)} บทบาท`}
          autoplay
          interval={seconds * 1000}
          eyebrow={
            <p className="font-mono text-xs tracking-[0.2em] text-(--em-blue-600) uppercase">
              wardrobe
            </p>
          }
          heading={<h2 className="font-heading text-4xl font-black">ชุดที่สลับใส่ทุกวัน</h2>}
          caption="ชี้ไปตามราวเพื่อหันเสื้อ กดเพื่อหยิบลงมาดู"
          items={roles.map(({ token: _, ...r }, i) => ({ ...r, color: colors[i] }))}
        />
      )}
    </div>
  );
}
