import { AtSign, Globe, Link2 } from "lucide-react";

const team = [
  { n: "ภูมิ", r: "ออกแบบ", tone: "from-(--em-sky-400) to-(--em-blue-700)" },
  { n: "ฟ้า", r: "พัฒนาหน้าเว็บ", tone: "from-(--em-violet-500) to-(--em-blue-800)" },
  { n: "ต้นน้ำ", r: "หลังบ้านและฐานข้อมูล", tone: "from-(--em-teal-400) to-(--em-blue-800)" },
  { n: "ข้าวหอม", r: "ดูแลลูกค้า", tone: "from-(--em-gold-500) to-(--em-coral-500)" },
];

/** Team cards; hovering or focusing a card slides its links up from the bottom edge. */
export default function TeamGrid() {
  return (
    <section className="bg-background text-foreground @container">
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <h2 className="font-heading text-3xl font-black @3xl:text-5xl">ทีมเล็ก ตั้งใจเยอะ</h2>
        <ul className="mt-10 grid grid-cols-2 gap-4 @3xl:grid-cols-4">
          {team.map((m) => (
            <li
              key={m.n}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className={`grid aspect-square place-items-center bg-linear-to-br ${m.tone}`}>
                <span className="font-heading text-5xl font-black text-(--em-ink-0)/90">
                  {m.n.slice(0, 1)}
                </span>
              </div>
              <div className="p-4">
                <p className="font-semibold">{m.n}</p>
                <p className="text-sm text-muted-foreground">{m.r}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-card/95 p-3 transition-transform duration-200 group-focus-within:translate-y-0 group-hover:translate-y-0 translate-y-full motion-reduce:transition-none">
                {[
                  { i: Globe, l: "เว็บไซต์" },
                  { i: AtSign, l: "อีเมล" },
                  { i: Link2, l: "โปรไฟล์" },
                ].map(({ i: Icon, l }) => (
                  <a
                    key={l}
                    href={`#${m.n}-${l}`}
                    aria-label={`${l}ของ${m.n}`}
                    className="grid size-9 place-items-center rounded-md border border-border hover:bg-muted"
                  >
                    <Icon aria-hidden className="size-4" />
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
