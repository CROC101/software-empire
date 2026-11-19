const names = [
  "Tidewell",
  "Northpier",
  "Lumenfold",
  "Riverly",
  "Kraftbay",
  "Moonquay",
  "Saltline",
  "Harborly",
];

/** A strip of made-up client wordmarks that runs forever with faded edges; pauses on hover. */
export default function LogoCloud() {
  return (
    <section className="bg-background py-14 text-foreground">
      <style>{`@keyframes logo-cloud-run{to{transform:translateX(-50%)}}.logo-cloud-track{animation:logo-cloud-run 30s linear infinite}.logo-cloud-box:hover .logo-cloud-track{animation-play-state:paused}@media (prefers-reduced-motion:reduce){.logo-cloud-track{animation:none}}`}</style>
      <p className="text-center text-sm text-muted-foreground">
        ทีมที่ไว้ใจให้เราดูแลเว็บ (ชื่อสมมติ)
      </p>
      <div className="logo-cloud-box mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="logo-cloud-track vt-live flex w-max gap-12 px-6">
          {[...names, ...names].map((n, i) => (
            <li
              key={i}
              aria-hidden={i >= names.length}
              className="font-heading text-2xl font-black whitespace-nowrap text-muted-foreground/70"
            >
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
