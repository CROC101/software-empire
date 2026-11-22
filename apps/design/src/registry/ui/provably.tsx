"use client";

import { Provably } from "@empire/ui";

// The Provably hero in crocwork words, as the hub uses it (numbers here are a snapshot).
// Its own navbar is hidden: no brand and no links, so the host page keeps its navbar.
export default function Part() {
  return (
    <Provably
      brand={{ name: "", href: "#top" }}
      copy={{
        eyebrow: "crocwork studio",
        lines: ["ระบบที่ผมสร้าง", "ทำงานได้จริง"],
        lastWord: " พิสูจน์ได้",
        subtext: "ล็อกอินครั้งเดียว ใช้ได้ทุกระบบ",
      }}
      links={{
        explore: { label: "ดูผลงาน", href: "#subsystems" },
        howItWorks: { label: "ลองเล่นดู", href: "#login" },
      }}
      toggle={{ label: "ตรวจระบบ", hint: { pointer: "คลิกเพื่อตรวจ", touch: "แตะเพื่อตรวจ" } }}
      stats={{
        value: 7,
        suffix: "",
        word: "ระบบ",
        states: { off: "สร้างเสร็จ", on: "เปิดใช้แล้ว" },
        note: "จาก 8 ระบบในพอร์ตนี้ · 268 เทสต์ฐานข้อมูล",
      }}
      certificate={{
        kicker: "Subsystem",
        type: "crocwork subsystem",
        sampleLabel: "การ์ดตัวอย่าง",
        demoNote: "ภาพประกอบ ไม่ใช่ใบรับรองจริง",
        recipientLabel: "สร้างโดย",
        recipientNote: "ผมคนเดียว",
        status: { on: "ผ่าน CI", off: "ยังไม่ตรวจ" },
        statusDetail: {
          on: "ทุก PR ของระบบนี้ต้องผ่าน lint, typecheck, test และ build ก่อน merge",
          off: "กดสวิตช์ตรวจระบบเพื่อดูผล",
        },
        hover: "ดูรายละเอียด",
        share: { idle: "คัดลอกลิงก์", done: "คัดลอกแล้ว", locked: "ตรวจก่อนจึงแชร์ได้" },
        tilt: { rest: 9, verified: 4, hover: 0 },
      }}
      credentials={[
        {
          title: "Empire Canvas",
          recipient: "crocwork studio",
          accent: "var(--em-blue-500)",
          icon: "pen",
          skills: ["Layers", "Supabase Storage", "Vite", "RLS"],
        },
        {
          title: "Commerce",
          recipient: "crocwork studio",
          accent: "var(--em-sky-500)",
          icon: "chart",
          skills: ["Escrow จำลอง", "PromptPay", "Next.js", "pgTAP"],
        },
        {
          title: "Design Registry",
          recipient: "crocwork studio",
          accent: "var(--em-blue-700)",
          icon: "type",
          skills: ["Components", "Prompts", "Next.js", "Copy code"],
        },
      ]}
      statusBadge={{
        off: "READY TO CHECK",
        on: "TESTED IN CI",
        tail: "CROCWORK STUDIO",
        stampTilt: -6,
        hint: "ดูตรา",
        back: {
          title: "ตรวจได้ทุกระบบ",
          text: "ทุก PR ต้องผ่าน lint, typecheck, test และ build ก่อน merge",
          action: "กลับ",
        },
      }}
    />
  );
}
