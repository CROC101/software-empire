import type { Metadata } from "next";
import { FxMeter } from "@/components/fx-meter";
import { InView } from "@/components/in-view";
import { Thumb } from "@/components/preview";
import { ReactBitsList } from "@/components/react-bits-list";
import { reactBitsUrl } from "@/lib/react-bits-url";
import data from "@/lib/react-bits.json";
import { registry } from "@/registry/meta";

export const metadata: Metadata = {
  title: "React Bits",
  description:
    "เวอร์ชันของเราที่สร้างใหม่ตามแรงบันดาลใจจาก React Bits และคอมโพเนนต์ React Bits ทุกตัวพร้อมคำสั่งติดตั้งทางการ",
};

const total = data.categories.reduce((n, c) => n + c.items.length, 0);
const ours = [...registry.filter((e) => e.inspiredBy)].sort((a, b) =>
  b.added.localeCompare(a.added),
);
const days = [...new Set(ours.map((e) => e.added))];
const categoryOf = new Map(
  data.categories.flatMap((c) => c.items.map((it) => [it.title, c.name] as const)),
);
const thaiDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("th-TH", { dateStyle: "long", timeZone: "UTC" });

export default function ReactBitsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <header className="py-12">
        <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          React Bits · {total} components · {ours.length} rebuilt
        </p>
        <h1 className="mt-3 font-heading text-4xl leading-tight font-black sm:text-5xl">
          React Bits สองค่าย
          <span className="block text-(--em-blue-600) dark:text-(--em-sky-400)">
            ของเราสร้างใหม่ ของเขาพรีวิวจากเว็บเขา
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          ค่าย crocwork คือคอมโพเนนต์ที่เราเขียนเองใหม่ทั้งหมด ดูจากหน้าตาและการเคลื่อนไหวของต้นฉบับ
          ไม่ได้แปลงโค้ดของเขา ทุกตัววิ่งบนนาฬิกาเฟรมเดียวกัน หยุดเมื่อพ้นจอ
          และลดความละเอียดเองเมื่อเฟรมเริ่มตก ค่าย React Bits คือของจริงจาก reactbits.dev
          กดพรีวิวแล้วเปิดหน้าเขาในกรอบ โค้ดอยู่ที่เว็บเขาเท่านั้น
        </p>
      </header>

      <section aria-labelledby="camp-crocwork">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
          <h2 id="camp-crocwork" className="font-heading text-2xl font-black">
            ค่าย crocwork{" "}
            <span className="font-mono text-sm font-normal text-muted-foreground">
              {ours.length}
            </span>
          </h2>
          <FxMeter />
        </div>
        {days.map((day) => (
          <div key={day} className="mt-6">
            <h3 className="text-sm text-muted-foreground">
              ลงเมื่อ <time dateTime={day}>{thaiDate(day)}</time>
            </h3>
            <ul className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {ours
                .filter((e) => e.added === day)
                .map((e) => (
                  <li
                    key={e.slug}
                    className="relative flex flex-col overflow-hidden rounded-xl border bg-card"
                  >
                    <InView className="relative aspect-[16/10] overflow-hidden border-b">
                      <Thumb entry={e} />
                    </InView>
                    <div className="flex flex-1 flex-col gap-1.5 p-4">
                      <h4 className="font-heading text-lg font-bold">
                        {/* plain <a>: Next 16 export writes /c/<slug> RSC payloads where Link prefetch does not look */}
                        <a
                          href={`/c/${e.slug}`}
                          className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {e.name}
                        </a>
                      </h4>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>
                      <p className="mt-auto pt-2 text-xs text-muted-foreground">
                        แรงบันดาลใจจาก React Bits ·{" "}
                        <a
                          href={reactBitsUrl(
                            categoryOf.get(e.inspiredBy ?? "") ?? "Backgrounds",
                            e.inspiredBy ?? "",
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="relative z-10 underline underline-offset-4 hover:text-foreground"
                        >
                          {e.inspiredBy} <span aria-hidden>↗</span>
                        </a>
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="camp-react-bits" className="mt-16">
        <h2 id="camp-react-bits" className="border-b pb-3 font-heading text-2xl font-black">
          ค่าย React Bits{" "}
          <span className="font-mono text-sm font-normal text-muted-foreground">{total}</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          เลือกภาษากับสไตล์ แล้วคัดลอกคำสั่งไปรันในโปรเจกต์ โค้ดมาจาก reactbits.dev โดยตรง
          ไม่ได้เก็บไว้ที่นี่ เพราะสัญญาอนุญาต MIT + Commons Clause
          ห้ามแจกต่อหรือขายตัวคอมโพเนนต์เอง
        </p>
        <ReactBitsList ours={Object.fromEntries(ours.map((e) => [e.inspiredBy ?? "", e.slug]))} />
      </section>

      <p className="mt-12 text-sm text-muted-foreground">
        ขอบคุณ React Bits โดย David Haz ที่เป็นแรงบันดาลใจ ·{" "}
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
