import { Globe, Mail } from "lucide-react";

const team = [
  {
    name: "ณัฐชา ริมธาร",
    role: "ออกแบบ",
    text: "เริ่มทุกงานด้วยการถามว่าคนใช้ต้องการอะไร ก่อนเลือกสี",
    sky: "from-(--em-blue-800) to-(--em-sky-400)",
  },
  {
    name: "ปกรณ์ ใจกว้าง",
    role: "หน้าบ้าน",
    text: "ดูแลให้ทุกหน้าโหลดเร็วบนมือถือรุ่นเก่า",
    sky: "from-(--em-ink-900) to-(--em-blue-600)",
  },
  {
    name: "มาริสา ทองคำ",
    role: "หลังบ้าน",
    text: "เขียนเทสต์ก่อนเขียนตาราง ทุกตารางมีสิทธิ์ของมันเอง",
    sky: "from-(--em-blue-900) to-(--em-blue-500)",
  },
  {
    name: "ศิวกร แสงเพชร",
    role: "ดูแลลูกค้า",
    text: "ตอบแชตภายในวันทำการ และจดทุกคำขอไว้ให้ทีมเห็น",
    sky: "from-(--em-ink-950) to-(--em-ink-600)",
  },
];

/** Member cards: a drawn portrait band with initials, name, role, one line about them and two links */
export default function TeamCards({ title = "ทีมที่ทำงานให้คุณ" }: { title?: string }) {
  return (
    <section className="@container bg-background px-4 py-16 text-foreground @lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-heading text-3xl font-black @lg:text-4xl">{title}</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          สี่คน ทีมเดิมตั้งแต่วันคุยงานจนดูแลหลังเปิดใช้
        </p>
        <ul className="mt-10 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          {team.map((m) => (
            <li key={m.name} className="overflow-clip rounded-xl border border-border bg-card">
              <div
                aria-hidden
                className={`relative grid h-40 place-items-center bg-linear-to-b ${m.sky}`}
              >
                <span className="font-heading text-5xl font-black text-(--em-ink-50)/90">
                  {m.name.slice(0, 1)}
                </span>
                <span className="absolute inset-x-0 bottom-0 h-8 bg-(--em-ink-975)/40 [clip-path:polygon(0_100%,0_50%,35%_10%,60%_55%,100%_20%,100%_100%)]" />
              </div>
              <div className="p-5">
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.role}</p>
                <p className="mt-3 text-sm">{m.text}</p>
                <div className="mt-4 flex gap-2">
                  <a
                    href="#contact"
                    aria-label={`อีเมลถึง ${m.name}`}
                    className="grid size-8 place-items-center rounded-md border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Mail aria-hidden className="size-4" />
                  </a>
                  <a
                    href="#work"
                    aria-label={`ผลงานของ ${m.name}`}
                    className="grid size-8 place-items-center rounded-md border border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Globe aria-hidden className="size-4" />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
