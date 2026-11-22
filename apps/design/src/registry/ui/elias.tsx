"use client";

import { Elias, type EliasBook } from "@empire/ui";

// The Elias author hero in crocwork words, as hub /crocbyte uses it: the owner's portfolio, the
// clay croc mascot in place of a photo, real subsystems as the books.
const COVER = { type: "var(--em-ink-900)" };
const BOOKS: EliasBook[] = [
  {
    label: "Subsystem 1",
    title: "Community",
    coverLines: ["Com-", "mun-", "ity"],
    topics: ["Feed", "Reels", "Chat"],
    art: "sunrise",
    colors: { ...COVER, cover: "var(--em-blue-100)", spine: "var(--em-blue-500)" },
    chapter: "Chapter one",
    chapterTitle: "โซเชียลเต็มรูปแบบ",
    text: "ฟีด รีลส์ สตอรี่ แชตเรียลไทม์ และห้องประชุมเสียง",
  },
  {
    label: "Subsystem 7",
    title: "Stream",
    coverLines: ["Stream"],
    topics: ["Movies", "Music"],
    art: "days",
    colors: { ...COVER, cover: "var(--em-blue-50)", spine: "var(--em-blue-200)" },
    chapter: "Chapter one",
    chapterTitle: "ดูพร้อมเพื่อน",
    text: "หนัง เพลง คลิปสั้น จาก YouTube ทางการ และเปิดห้องดูพร้อมเพื่อน",
  },
];

export default function Part() {
  return (
    <Elias
      brand={{ name: "crocwork", href: "#top" }}
      navLinks={{
        left: [{ label: "Portfolio", href: "#top", active: true }],
        right: [{ label: "ติดต่อ", href: "#contact" }],
      }}
      navCta={{ label: "ส่งอีเมล", href: "#contact" }}
      navStatus={{ label: "Open for work", detail: "Bangkok" }}
      name={{ first: "Sarawut", last: "Phusee", fit: { first: 0.56 } }}
      intro={{
        roles: ["Developer", "Designer", "AI Engineer"],
        headline: ["ออกแบบเป็น", "เขียนโค้ดได้", "แล้วส่งงานจนมีคนใช้"],
        description: "ผมทำ crocwork คนเดียวทั้งระบบ ตั้งแต่หน้าจอ ฐานข้อมูล ไปจนถึงขึ้นระบบจริง",
      }}
      portrait={{
        src: "/previews/crocbyte-mascot.webp",
        width: 499,
        height: 500,
        alt: "มาสคอตจระเข้ดินปั้นของ crocwork",
      }}
      books={BOOKS}
      bookCard={{ href: "#work", open: "เปิด", close: "ปิดแล้วดูเล่มถัดไป", folio: "1" }}
      letter={{
        eyebrow: "A note to clients",
        greeting: "ถึงคุณที่กำลังจะจ้างผม",
        stamp: "Seal & send",
        postmark: "Bangkok",
        seal: "S",
        sealing: "ปิดผนึกแล้ว",
        counter: "Note",
        messages: ["ผมจะตอบข้อความภายใน 1 วันทำการ", "คุยกับผมได้ทั้งไทยและ English"],
      }}
      socialLinks={[
        { label: "GitHub", href: "https://github.com/CROC101" },
        { label: "Discord", href: "https://discord.gg/sNYsVbh3v" },
      ]}
      motion={{ cursor: { readLabel: "เปิด" } }}
    />
  );
}
