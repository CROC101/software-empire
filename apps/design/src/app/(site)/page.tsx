import { OrbitGallery } from "@empire/ui";
import { Gallery } from "@/components/gallery";
import { kinds, registry } from "@/registry/meta";

/** Screens of the parts with the strongest effects, turning round the hero. */
const shots = [
  "aurora-tide",
  "dither-tide",
  "where-globe",
  "tide-plasma",
  "warp-lanes",
  "particle-title",
  "ripple-mesh",
  "float-particles",
  "ripple-pond",
  "deep-galaxy",
].map((s) => `/orbit/${s}.webp`);

export default function Home() {
  return (
    <main>
      <OrbitGallery images={shots} className="flex min-h-[34rem] items-center sm:min-h-[44rem]">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
            Design Registry · {registry.length} parts · {Object.keys(kinds).length} kinds
          </p>
          <h1 className="mt-4 font-heading text-4xl leading-tight font-black sm:text-6xl">
            คอมโพเนนต์ที่ขยับได้
            <span className="block text-primary">ปรับสด แล้วหยิบไปใช้</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
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
      </OrbitGallery>
      <Gallery entries={registry} />
    </main>
  );
}
