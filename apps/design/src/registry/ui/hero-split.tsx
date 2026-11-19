import { ArrowRight, Play } from "lucide-react";

/** Two-line headline on the left, a floating product window on the right that bobs on the water. */
export default function HeroSplit({
  title = "สร้างเว็บที่คนจำได้",
  accent = "ในวันเดียว",
  cta = "เริ่มฟรี",
}: {
  title?: string;
  accent?: string;
  cta?: string;
}) {
  return (
    <section className="bg-background text-foreground @container">
      <style>{`@keyframes hero-split-bob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-10px) rotate(0deg)}}.hero-split-float{animation:hero-split-bob 6s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.hero-split-float{animation:none}}`}</style>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 @3xl:grid-cols-2 @3xl:py-24">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">web studio</p>
          <h1 className="mt-4 font-heading text-4xl leading-tight font-black @3xl:text-6xl">
            {title}
            <span className="block text-primary">{accent}</span>
          </h1>
          <p className="mt-5 max-w-md text-muted-foreground">
            ชิ้นส่วนพร้อมใช้ ธีมมืดสว่างในตัว และทุกอย่างลองบนมือถือมาแล้ว
            เปลี่ยนข้อความแล้วขึ้นระบบได้เลย
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#start"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              {cta}
              <ArrowRight aria-hidden className="size-4" />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-semibold"
            >
              <Play aria-hidden className="size-4" />
              ดูตัวอย่าง
            </a>
          </div>
        </div>
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-x-8 -bottom-6 h-16 rounded-full bg-primary/30 blur-2xl"
          />
          <div className="hero-split-float vt-live relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex gap-1.5 border-b border-border px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2.5 rounded-full bg-muted-foreground/40" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 p-5">
              <div className="col-span-3 h-24 rounded-lg bg-linear-to-br from-(--em-sky-400) to-(--em-blue-700)" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2 rounded-lg bg-muted p-3">
                  <div className="h-2 w-2/3 rounded bg-muted-foreground/30" />
                  <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
