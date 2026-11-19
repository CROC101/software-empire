import { Gallery } from "@/components/gallery";
import { registry } from "@/registry/meta";
import { AuroraTide } from "@/registry/ui/aurora-tide";

export default function Home() {
  return (
    <main>
      <section className="h-[26rem] sm:h-[30rem] [&>*]:h-full">
        <AuroraTide speed={20} intensity={0.55}>
          <div className="px-6 text-center">
            <p className="font-mono text-xs tracking-[0.2em] text-(--em-sky-400) uppercase">
              Design Registry · {registry.length} parts · 3 kinds
            </p>
            <h1 className="mt-4 font-heading text-4xl leading-tight font-black text-(--em-ink-50) sm:text-6xl">
              คอมโพเนนต์ที่ขยับได้
              <span className="block text-(--em-sky-400)">ปรับสด แล้วหยิบไปใช้</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-(--em-ink-300)">
              คอมโพเนนต์ บล็อกหน้าเว็บ และเทมเพลตทั้งหน้า ลองปรับค่าดูของจริง คัดลอกโค้ด หรือคัดลอก
              prompt ไปให้ AI สร้างใหม่ในโปรเจกต์ของเรา กด Ctrl K เพื่อค้นหาได้ทุกหน้า
            </p>
            <a
              href="#parts"
              className="mt-7 inline-flex items-center rounded-lg bg-(--em-blue-600) px-5 py-2.5 font-semibold text-(--em-ink-0) transition-transform hover:-translate-y-0.5"
            >
              ดูทั้งหมด →
            </a>
          </div>
        </AuroraTide>
      </section>
      <Gallery entries={registry} />
    </main>
  );
}
