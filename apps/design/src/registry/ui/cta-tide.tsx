import { ArrowRight } from "lucide-react";

/** Closing call to action: water rises behind the headline and laps with two waves moving opposite ways. */
export default function CtaTide({
  title = "พร้อมลงน้ำหรือยัง",
  cta = "คุยกับเรา",
}: {
  title?: string;
  cta?: string;
}) {
  const wave = "M0 20 Q 50 0 100 20 T 200 20 T 300 20 T 400 20 V 60 H 0 Z";
  return (
    <section className="relative overflow-hidden bg-background text-foreground @container">
      <style>{`@keyframes cta-tide-rise{from{transform:translateY(40%)}to{transform:none}}@keyframes cta-tide-lap{to{transform:translateX(-50%)}}.cta-tide-water{animation:cta-tide-rise 1.6s cubic-bezier(.2,.7,.2,1) both}.cta-tide-a{animation:cta-tide-lap 7s linear infinite}.cta-tide-b{animation:cta-tide-lap 11s linear infinite reverse}@media (prefers-reduced-motion:reduce){.cta-tide-water,.cta-tide-a,.cta-tide-b{animation:none}}`}</style>
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-40 text-center">
        <h2 className="font-heading text-4xl font-black @3xl:text-6xl">{title}</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          เล่าโจทย์ให้ฟังสั้นๆ ตอบกลับภายในวันเดียว พร้อมราคาที่ชัดเจน
        </p>
        <a
          href="#contact"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          {cta}
          <ArrowRight aria-hidden className="size-4" />
        </a>
      </div>
      <div aria-hidden className="cta-tide-water absolute inset-x-0 bottom-0 h-44">
        <div className="relative h-full overflow-hidden">
          <svg
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
            className="cta-tide-b vt-live absolute -top-4 left-0 h-10 w-[200%] fill-(--em-blue-500)/50"
          >
            <path d={wave} />
            <path d={wave} transform="translate(400 0)" />
          </svg>
          <svg
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
            className="cta-tide-a vt-live absolute top-0 left-0 h-10 w-[200%] fill-(--em-blue-600)"
          >
            <path d={wave} />
            <path d={wave} transform="translate(400 0)" />
          </svg>
          <div className="absolute inset-x-0 top-9 bottom-0 bg-linear-to-b from-(--em-blue-600) to-(--em-blue-900)" />
        </div>
      </div>
    </section>
  );
}
