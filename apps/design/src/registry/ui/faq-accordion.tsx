const faqs = [
  {
    q: "ใช้เวลาทำเว็บนานแค่ไหน",
    a: "เว็บแนะนำธุรกิจประมาณ 1 ถึง 2 สัปดาห์ ระบบที่มีหลังบ้านประมาณ 4 ถึง 8 สัปดาห์",
  },
  { q: "แก้ไขงานได้กี่รอบ", a: "แก้ดีไซน์ได้ 2 รอบ และแก้ข้อความได้ตลอดผ่านหลังบ้าน" },
  { q: "หลังส่งงานดูแลต่อไหม", a: "ดูแลฟรี 30 วัน จากนั้นมีแพ็กดูแลรายเดือนถ้าต้องการ" },
  { q: "โค้ดเป็นของใคร", a: "เป็นของคุณทั้งหมด ส่งมอบพร้อมคู่มือและวิธีขึ้นระบบ" },
];

/**
 * FAQ with native details/summary, grouped by name so only one stays open. No JavaScript.
 * The answer fades up; the marker turns into a cross when open.
 */
export default function FaqAccordion() {
  return (
    <section className="bg-background text-foreground">
      <style>{`@keyframes faq-accordion-in{from{opacity:0;transform:translateY(-4px)}}.faq-accordion-a{animation:faq-accordion-in .25s ease-out}@media (prefers-reduced-motion:reduce){.faq-accordion-a{animation:none}}`}</style>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center font-heading text-3xl font-black">คำถามพบบ่อย</h2>
        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
          {faqs.map((f, i) => (
            <details key={f.q} name="faq-accordion" open={i === 0} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="text-xl leading-none text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none"
                >
                  +
                </span>
              </summary>
              <p className="faq-accordion-a pb-5 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
