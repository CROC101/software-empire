import type { CSSProperties } from "react";

const quotes = [
  { q: "ส่งงานเร็วกว่าที่นัดไว้ แถมแก้ให้จนพอใจ", n: "คุณมายด์", r: "ร้านกาแฟ" },
  { q: "เว็บโหลดไวขึ้นมาก ลูกค้าทักเข้ามาเยอะขึ้นจริง", n: "คุณต้น", r: "ร้านอุปกรณ์กีฬา" },
  { q: "อธิบายเรื่องเทคนิคให้เข้าใจง่าย ไม่ต้องเดา", n: "คุณแพร", r: "คลินิกทันตกรรม" },
  { q: "หน้าตาสวยและใช้บนมือถือได้ดีทุกหน้า", n: "คุณบอส", r: "สตาร์ตอัป" },
  { q: "ระบบหลังบ้านแก้ข้อความเองได้ ไม่ต้องรอใคร", n: "คุณฝน", r: "โรงเรียนกวดวิชา" },
  { q: "ตอบไวมาก แม้วันหยุดก็ช่วยดูให้", n: "คุณเจมส์", r: "ร้านออนไลน์" },
];

/**
 * Columns of reviews drift slowly in opposite directions and pause under the pointer.
 * Each column is the list twice, so a -50% translate loops without a seam.
 */
export default function TestimonialsWall() {
  const cols = [quotes.slice(0, 3), quotes.slice(3), quotes.filter((_, i) => i % 2 === 1)];
  return (
    <section className="bg-muted/40 text-foreground @container">
      <style>{`@keyframes testimonials-wall-up{to{transform:translateY(-50%)}}.testimonials-wall-col{animation:testimonials-wall-up var(--t) linear infinite}.testimonials-wall-col.rev{animation-direction:reverse}.testimonials-wall-box:hover .testimonials-wall-col{animation-play-state:paused}@media (prefers-reduced-motion:reduce){.testimonials-wall-col{animation:none}}`}</style>
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <h2 className="text-center font-heading text-3xl font-black @3xl:text-5xl">
          ลูกค้าพูดถึงเรา
        </h2>
        <div className="testimonials-wall-box mt-10 grid h-[28rem] gap-4 overflow-hidden [mask-image:linear-gradient(transparent,black_15%,black_85%,transparent)] @xl:grid-cols-2 @4xl:grid-cols-3">
          {cols.map((col, c) => (
            <div
              key={c}
              className={c === 1 ? "hidden @xl:block" : c === 2 ? "hidden @4xl:block" : ""}
            >
              <ul
                className={`testimonials-wall-col vt-live ${c === 1 ? "rev" : ""}`}
                style={{ "--t": `${String(26 + c * 6)}s` } as CSSProperties}
              >
                {[...col, ...col].map((q, i) => (
                  <li
                    key={i}
                    aria-hidden={i >= col.length}
                    className="mb-4 rounded-xl border border-border bg-card p-5"
                  >
                    <blockquote>“{q.q}”</blockquote>
                    <p className="mt-3 text-sm font-semibold">{q.n}</p>
                    <p className="text-sm text-muted-foreground">{q.r}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
