import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { search, similarTo } from '../data/catalog';
import { useCatalog, useDebounced } from '../lib/hooks';
import { TitleGrid } from '../components/Row';

export default function Search() {
  const [params] = useSearchParams();
  const q = useDebounced(params.get('q') ?? '', 200);
  const catalog = useCatalog();
  const allowedIds = useMemo(() => new Set(catalog.map((t) => t.id)), [catalog]);
  const results = useMemo(() => search(q).filter((t) => allowedIds.has(t.id)), [q, allowedIds]);

  // "Explore titles related to": similar titles + the genres the results share
  const related = useMemo(() => {
    const names = new Set<string>();
    for (const t of results.slice(0, 3)) for (const s of similarTo(t, 4)) if (allowedIds.has(s.id)) names.add(s.title);
    for (const t of results) for (const g of t.genres) names.add(g);
    return [...names].slice(0, 12);
  }, [results, allowedIds]);

  return (
    <main className="app-gutter min-h-screen pb-16 pt-[100px] sm:pt-[130px]">
      {results.length > 0 ? (
        <>
          {related.length > 0 && (
            <div className="mb-8 flex flex-wrap items-baseline gap-x-1 text-[clamp(13px,1.1vw,17px)]">
              <span className="mr-2 text-[#808080]">สำรวจเรื่องที่เกี่ยวข้องกับ:</span>
              {related.map((r, i) => (
                <span key={r} className="flex items-baseline">
                  {i > 0 && <span className="mx-2 text-[#808080]">|</span>}
                  <Link to={`/search?q=${encodeURIComponent(r)}`} className="text-white hover:text-accent">
                    {r}
                  </Link>
                </span>
              ))}
            </div>
          )}
          <TitleGrid items={results.map((title) => ({ title }))} />
        </>
      ) : (
        <div className="mx-auto max-w-[520px] py-16 text-[#e5e5e5]">
          <p>
            ผลการค้นหา "{q}" ไม่ตรงกับเรื่องใดเลย
          </p>
          <p className="mt-4">คำแนะนำ:</p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>ลองใช้คำค้นหาอื่น</li>
            <li>ค้นหาชื่อภาพยนตร์หรือซีรีส์</li>
            <li>ลองค้นหาด้วยชื่อนักแสดงหรือผู้กำกับ</li>
            <li>ลองใช้ประเภท เช่น ตลก โรแมนติก กีฬา หรือดราม่า</li>
          </ul>
        </div>
      )}
    </main>
  );
}
