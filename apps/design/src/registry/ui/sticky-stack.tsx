const cards = [
  { n: "01", t: "คุยโจทย์", s: "ฟังปัญหาจริง ตัดสิ่งที่ไม่จำเป็นออก", tone: "bg-(--em-ink-900)" },
  { n: "02", t: "ออกแบบ", s: "ระบบสี ฟอนต์ และหน้าจอหลักบนมือถือก่อน", tone: "bg-(--em-blue-900)" },
  { n: "03", t: "ลงมือทำ", s: "โค้ดที่มีเทสต์ ตรวจทุกขั้นก่อนส่ง", tone: "bg-(--em-blue-700)" },
  { n: "04", t: "ขึ้นระบบ", s: "ส่งมอบพร้อมคู่มือ ดูแลต่อได้", tone: "bg-(--em-blue-600)" },
];

/** Cards pin with position: sticky and pile on top of each other as you scroll. No JavaScript at all. */
export default function StickyStack() {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="ขั้นตอนการทำงาน"
      className="h-96 overflow-y-auto bg-(--em-ink-975) px-6 pb-40 focus-visible:outline-2 focus-visible:outline-(--em-sky-400)"
    >
      <p className="py-6 text-center font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
        scroll · process
      </p>
      <ol className="mx-auto max-w-sm">
        {cards.map((c, i) => (
          <li
            key={c.n}
            className={`sticky mb-6 rounded-xl border border-(--em-ink-0)/10 p-6 shadow-2xl ${c.tone}`}
            style={{ top: `${String(16 + i * 14)}px` }}
          >
            <p className="font-mono text-sm text-(--em-sky-400)">{c.n}</p>
            <p className="mt-1 font-heading text-2xl font-black text-(--em-ink-50)">{c.t}</p>
            <p className="mt-2 text-sm text-(--em-ink-200)">{c.s}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
