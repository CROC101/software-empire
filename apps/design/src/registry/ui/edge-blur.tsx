"use client";

const steps = 5;

/**
 * Content melts into the edge of a scroll box: stacked blur layers, each stronger and each masked
 * to a thinner band, so the blur grows gradually instead of starting at a hard line.
 */
export default function EdgeBlur({
  height = 96,
  strength = 8,
  position = "ล่าง",
}: {
  height?: number;
  strength?: number;
  position?: "บน" | "ล่าง" | "ทั้งสอง";
}) {
  const edges =
    position === "ทั้งสอง"
      ? (["top", "bottom"] as const)
      : position === "บน"
        ? (["top"] as const)
        : (["bottom"] as const);
  return (
    <div className="grid size-full min-h-72 place-items-center bg-(--em-ink-975) p-6">
      <div className="relative h-72 w-full max-w-sm overflow-hidden rounded-xl border border-(--em-ink-800)">
        <ul className="h-full space-y-3 overflow-y-auto overscroll-contain p-4">
          {Array.from({ length: 14 }, (_, i) => (
            <li key={i} className="rounded-lg bg-(--em-ink-900) p-4">
              <p className="font-mono text-xs text-(--em-sky-400)">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm text-(--em-ink-200)">
                รายการที่ {i + 1} เลื่อนดูได้ ขอบค่อยๆ เบลอ
              </p>
            </li>
          ))}
        </ul>
        {edges.map((edge) =>
          Array.from({ length: steps }, (_, i) => {
            const from = (i / steps) * 100;
            const to = ((i + 2) / steps) * 100;
            const dir = edge === "top" ? "to top" : "to bottom";
            const mask = `linear-gradient(${dir}, transparent ${String(from)}%, black ${String(Math.min(to, 100))}%)`;
            return (
              <div
                key={`${edge}-${String(i)}`}
                aria-hidden
                className="pointer-events-none absolute inset-x-0"
                style={{
                  [edge]: 0,
                  height,
                  backdropFilter: `blur(${String((strength * 2 ** i) / 2 ** (steps - 1))}px)`,
                  maskImage: mask,
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
