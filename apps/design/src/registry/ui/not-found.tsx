/** 404 page: the number floats on the water with a broken reflection beneath it. */
export default function NotFound() {
  return (
    <section className="relative grid min-h-[34rem] place-items-center overflow-hidden bg-background px-6 text-center text-foreground">
      <style>{`@keyframes not-found-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes not-found-shimmer{0%,100%{transform:scaleY(-1) translateY(0) skewX(0)}50%{transform:scaleY(-1) translateY(-8px) skewX(-4deg)}}.not-found-num{animation:not-found-bob 5s ease-in-out infinite}.not-found-echo{animation:not-found-shimmer 5s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.not-found-num{animation:none}.not-found-echo{animation:none;transform:scaleY(-1)}}`}</style>
      <div className="relative z-10">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">error 404</p>
        <p className="not-found-num vt-live mt-2 font-heading text-[9rem] leading-none font-black">
          404
        </p>
        <div aria-hidden className="h-24 overflow-hidden">
          <p className="not-found-echo vt-live origin-top font-heading text-[9rem] leading-none font-black text-primary/35 [mask-image:repeating-linear-gradient(to_bottom,black_0_6px,transparent_6px_9px)]">
            404
          </p>
        </div>
        <h1 className="mt-4 font-heading text-2xl font-black">หน้านี้จมน้ำไปแล้ว</h1>
        <p className="mt-2 text-muted-foreground">ลิงก์อาจผิด หรือหน้านี้ถูกย้ายไปที่อื่น</p>
        <a
          href="#home"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          กลับหน้าแรก
        </a>
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-(--em-sky-500)/0 via-(--em-blue-500)/15 to-(--em-blue-700)/30"
      />
    </section>
  );
}
