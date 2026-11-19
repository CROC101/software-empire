import { perRow, useWindowWidth } from '../lib/hooks';

export function SkeletonRows({ rows = 3, billboard = true }: { rows?: number; billboard?: boolean }) {
  const n = perRow(useWindowWidth());
  return (
    <div aria-busy="true" aria-label="กำลังโหลด">
      {billboard && <div className="skeleton h-[56.25vw] max-h-[85vh] w-full" />}
      <div className={billboard ? '-mt-[6vw] relative' : 'pt-28'}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="app-gutter mb-12">
            <div className="skeleton mb-3 h-5 w-48 rounded-sm" />
            <div className="grid gap-[0.4vw]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {Array.from({ length: n }, (_, i) => (
                <div key={i} className="skeleton aspect-video rounded-sm" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  const n = perRow(useWindowWidth());
  return (
    <div className="grid gap-x-[0.4vw] gap-y-10" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton aspect-video rounded-sm" />
      ))}
    </div>
  );
}
