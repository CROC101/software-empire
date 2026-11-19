import type { Metadata } from "next";
import { ReactBitsList } from "@/components/react-bits-list";
import data from "@/lib/react-bits.json";

export const metadata: Metadata = {
  title: "React Bits",
  description: "คอมโพเนนต์ React Bits ทุกตัว พร้อมคำสั่งติดตั้งทางการ 4 แบบ",
};

const total = data.categories.reduce((n, c) => n + c.items.length, 0);

export default function ReactBitsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="py-12">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          React Bits · {total} components · 4 variants
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight font-black sm:text-5xl">
          React Bits ครบทุกตัว
          <span className="block text-(--em-blue-600) dark:text-(--em-sky-400)">
            ติดตั้งได้ทั้ง JS, TS, CSS และ Tailwind
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          เลือกภาษากับสไตล์ แล้วคัดลอกคำสั่งไปรันในโปรเจกต์ โค้ดมาจาก reactbits.dev โดยตรง
          ไม่ได้เก็บไว้ที่นี่ เพราะสัญญาอนุญาต MIT + Commons Clause
          ห้ามแจกต่อหรือขายตัวคอมโพเนนต์เอง ใช้ในแอปหรือเว็บของเราได้ทุกแบบ
        </p>
      </header>
      <ReactBitsList />
      <p className="mt-12 text-sm text-muted-foreground">
        React Bits โดย David Haz ·{" "}
        <a
          href="https://github.com/DavidHDev/react-bits"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          github.com/DavidHDev/react-bits
        </a>{" "}
        · รายชื่อจาก commit {data.commit}
      </p>
    </main>
  );
}
