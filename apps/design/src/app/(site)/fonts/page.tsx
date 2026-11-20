import type { Metadata } from "next";
import { FontLibrary } from "@/components/font-library";
import { fontFamilies } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "ฟอนต์",
  description: "ฟอนต์เปิดให้ใช้ฟรี พิมพ์คำของเราเองเพื่อดูหน้าตา แล้วดาวน์โหลดไปใช้ได้ทุกโปรแกรม",
};

const uses = [
  [
    "Windows · macOS",
    "แตกไฟล์ zip แล้วดับเบิลคลิกไฟล์ .ttf กดติดตั้ง ใช้ได้ใน Word, PowerPoint, Keynote, Photoshop, Figma",
  ],
  [
    "iPad · Goodnotes",
    "เปิดไฟล์ .ttf ผ่านแอปติดตั้งฟอนต์ เช่น iFont แล้วเลือกใช้ใน Goodnotes, Procreate, Notability",
  ],
  ["Canva", "อัปโหลด .ttf ใน Brand Kit (บัญชีที่อัปโหลดฟอนต์ได้)"],
  ["PDF", "ติดตั้งฟอนต์ในเครื่องก่อน แล้ว export เป็น PDF ฟอนต์ฝังไปกับไฟล์"],
  ["เว็บ · โค้ด", "กดคัดลอก CSS ไปวางได้ทันที หรือใช้ woff กับ fonts.css ในไฟล์ zip"],
] as const;

export default function FontsPage() {
  const styles = fontFamilies.reduce((n, f) => n + f.styles.length, 0);
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="py-12">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Fonts · {fontFamilies.length} families · {styles} styles
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight font-black sm:text-5xl">
          ฟอนต์ที่ใช้ได้ฟรี
          <span className="block text-(--em-blue-600) dark:text-(--em-sky-400)">
            พิมพ์คำของเรา แล้วโหลดไปใช้
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          พิมพ์ข้อความในช่องด้านล่างเพื่อดูทุกฟอนต์พร้อมกัน ทุกไฟล์ zip มี TTF, WOFF, fonts.css
          วิธีติดตั้ง และสัญญาอนุญาตของฟอนต์นั้น
        </p>
      </header>

      <FontLibrary />

      <section aria-labelledby="fonts-use" className="mt-20 border-t pt-10">
        <h2 id="fonts-use" className="font-heading text-2xl font-black">
          ใช้กับอะไรได้บ้าง
        </h2>
        <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {uses.map(([k, v]) => (
            <div key={k}>
              <dt className="font-medium">{k}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xs text-muted-foreground">
          รวบรวมจาก usemodify.com แต่ละฟอนต์เป็นของผู้ออกแบบและใช้ตามสัญญาอนุญาตที่แจ้งไว้ในการ์ด
        </p>
      </section>
    </main>
  );
}
