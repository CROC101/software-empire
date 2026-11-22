import type { Metadata } from "next";
import { BrandIcon, Elias, type EliasBook } from "@empire/ui";
import { contactEmail, contacts } from "@empire/core/subsystems";
import { ContactSection, SiteFooter } from "../sections";

export const metadata: Metadata = {
  title: "Sarawut Phusee · CrocByte",
  description:
    "CrocByte: พอร์ตโฟลิโอและช่องทางติดต่อของ Sarawut Phusee ผู้ทำ crocwork คนเดียวทั้งระบบ",
};

// the books are real subsystems: cover art from the template, colours from the palette
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
    text: "ฟีด รีลส์ สตอรี่ แชตเรียลไทม์ และห้องประชุมเสียง ทุกตารางเปิด RLS พร้อมเทสต์ฐานข้อมูล",
  },
  {
    label: "Subsystem 3",
    title: "Toolboxes",
    coverLines: ["Tool-", "boxes"],
    topics: ["Dev tools", "MCP"],
    art: "lamp",
    colors: { ...COVER, cover: "var(--em-ink-100)", spine: "var(--em-blue-300)" },
    chapter: "Chapter one",
    chapterTitle: "เครื่องมือในเบราว์เซอร์",
    text: "เครื่องมือนักพัฒนาและ MCP Inspector ที่เปิดใช้ได้ทันทีในเบราว์เซอร์ ไม่ต้องติดตั้งอะไรเพิ่ม",
  },
  {
    label: "Subsystem 5",
    title: "Design Registry",
    coverLines: ["De-", "sign", "Regis-", "try"],
    topics: ["Components", "Prompts"],
    art: "path",
    colors: { ...COVER, cover: "var(--em-blue-50)", spine: "var(--em-blue-300)" },
    chapter: "Chapter one",
    chapterTitle: "คลังชิ้นงานพร้อมโค้ด",
    text: "คลัง component และ prompt ของ crocwork ทุกชิ้นที่ผมทำ หยิบโค้ดไปใช้ต่อได้",
  },
  {
    label: "Subsystem 7",
    title: "Stream",
    coverLines: ["Stream"],
    topics: ["Movies", "Music", "Watch party"],
    art: "days",
    colors: { ...COVER, cover: "var(--em-blue-50)", spine: "var(--em-blue-200)" },
    chapter: "Chapter one",
    chapterTitle: "ดูพร้อมเพื่อน",
    text: "หนัง เพลง คลิปสั้น จาก YouTube ทางการ พับจอฟังต่อได้ และเปิดห้องดูพร้อมเพื่อน",
  },
];

/** CrocByte: the owner's own portfolio and every way to reach him, on the Elias author hero. */
export default function CrocbytePage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? contactEmail;
  return (
    <main>
      <Elias
        brand={{ name: "crocwork", href: "/" }}
        navLinks={{
          left: [
            { label: "Portfolio", href: "/crocbyte", active: true },
            { label: "หน้าแรก", href: "/" },
          ],
          right: [
            { label: "ผลงาน", href: "/#subsystems" },
            { label: "ติดต่อ", href: "#channels" },
          ],
        }}
        navCta={{ label: "ส่งอีเมล", href: `mailto:${email}` }}
        navStatus={{ label: "Open for work", detail: "Bangkok" }}
        name={{ first: "Sarawut", last: "Phusee", fit: { first: 0.56 } }}
        intro={{
          roles: ["Developer", "Designer", "AI Engineer"],
          headline: ["ออกแบบเป็น", "เขียนโค้ดได้", "แล้วส่งงานจนมีคนใช้"],
          description:
            "ผมทำ crocwork คนเดียวทั้งระบบ ตั้งแต่หน้าจอ ฐานข้อมูล ไปจนถึงขึ้นระบบจริง หนังสือข้าง ๆ คือระบบย่อยที่เปิดใช้อยู่",
        }}
        portrait={{
          src: "/crocbyte/mascot.webp",
          width: 499,
          height: 500,
          alt: "มาสคอตจระเข้ดินปั้นมีหนวดสีแดง ตัวแทนของผม",
        }}
        books={BOOKS}
        bookCard={{ href: "/#subsystems", open: "เปิด", close: "ปิดแล้วดูเล่มถัดไป", folio: "1" }}
        letter={{
          eyebrow: "A note to clients",
          greeting: "ถึงคุณที่กำลังจะจ้างผม",
          stamp: "Seal & send",
          postmark: "Bangkok",
          seal: "S",
          sealing: "ปิดผนึกแล้ว",
          counter: "Note",
          messages: [
            "ผมจะตอบข้อความภายใน 1 วันทำการ",
            "ผมจะบอกว่าควรเริ่มตรงไหนให้พอกับงบ",
            "ทุกงานผ่าน lint typecheck test และ build ก่อนถึงมือคุณ",
            "คุยกับผมได้ทั้งไทยและ English",
          ],
        }}
        socialLinks={contacts
          .filter((c) => c.href.startsWith("https:"))
          .map(({ label, href }) => ({ label, href }))}
        motion={{ cursor: { readLabel: "เปิด" } }}
      />

      <section
        id="channels"
        aria-labelledby="channels-title"
        className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">contact</p>
        <h2 id="channels-title" className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
          ทักผมได้ <span className="text-primary">ทุกช่องทาง</span>
        </h2>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((c) => {
            const href = c.icon === "gmail" ? `mailto:${email}` : c.href;
            return (
              <li key={c.label}>
                <a
                  href={href}
                  {...(href.startsWith("https:") ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
                    <BrandIcon name={c.icon} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{c.label}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {href.replace(/^(mailto:|https:\/\/(www\.)?)/, "").replace(/\/$/, "")}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <ContactSection cta={{ href: `mailto:${email}`, label: "ส่งอีเมลหาผม" }} />
      <SiteFooter />
    </main>
  );
}
