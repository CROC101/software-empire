import type { CSSProperties } from "react";

/** Three dots orbit one centre at different radii and speeds. */
export default function OrbitSpinner({ speed = 1.2 }: { speed?: number }) {
  const rings = [
    { r: "size-16", t: 1, c: "bg-(--em-sky-400)" },
    { r: "size-11", t: 0.7, c: "bg-(--em-blue-500)" },
    { r: "size-6", t: 0.45, c: "bg-(--em-violet-400)" },
  ];
  return (
    <div
      className="grid size-full min-h-56 place-items-center bg-(--em-ink-975) p-6"
      role="status"
      aria-label="กำลังโหลด"
    >
      <style>{`@keyframes orbit-spinner-turn{to{transform:rotate(360deg)}}.orbit-spinner-ring{animation:orbit-spinner-turn var(--t) linear infinite}@media (prefers-reduced-motion:reduce){.orbit-spinner-ring{animation-duration:calc(var(--t) * 4)}}`}</style>
      <div className="relative grid size-20 place-items-center">
        {rings.map((g) => (
          <span
            key={g.r}
            className={`orbit-spinner-ring vt-live absolute rounded-full border border-(--em-ink-800) ${g.r}`}
            style={{ "--t": `${String(speed * g.t)}s` } as CSSProperties}
          >
            <span
              className={`absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full ${g.c}`}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
