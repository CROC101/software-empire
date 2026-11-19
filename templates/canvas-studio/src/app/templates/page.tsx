'use client';

import { Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/seed-templates';
import { TemplateCard } from '@/components/cards/TemplateCard';
import { TemplatePreviewModal } from '@/components/cards/TemplatePreviewModal';
import { useDesignActions } from '@/hooks/useDesignActions';
import { ratioLabel } from '@/lib/design';
import { ProBadge } from '@/components/ui/ProBadge';
import type { DesignTemplate } from '@/types/canva';

const SWATCHES = ['#00C4CC', '#7D2AE8', '#FF007F', '#FFD400', '#FF6B6B', '#C8A97E', '#141518', '#F4EBDD'];
const RATIOS = ['All', 'Square', 'Landscape', 'Portrait'] as const;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const near = (a: string, b: string) => {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return false;
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 90;
};

function Library() {
  const params = useSearchParams();
  const { cloneTemplate } = useDesignActions();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [color, setColor] = useState<string | null>(null);
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>('All');
  const [preview, setPreview] = useState<DesignTemplate | null>(null);

  useEffect(() => setQ(params.get('q') ?? ''), [params]);

  const list = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (cat === 'All' || t.category === cat) &&
          (!q || `${t.name} ${t.category}`.toLowerCase().includes(q.toLowerCase())) &&
          (!color || t.colors.some((c) => near(c, color))) &&
          (ratio === 'All' || ratioLabel(t.width, t.height) === ratio),
      ),
    [q, cat, color, ratio],
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="md:sticky md:top-20 md:h-[calc(100vh-6rem)] md:w-52 md:shrink-0">
        <h1 className="mb-1 text-2xl font-bold">Templates</h1>
        <p className="mb-4 text-xs text-muted">{TEMPLATES.length} templates · all Pro unlocked</p>
        <nav aria-label="Categories" className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col">
          {['All', ...TEMPLATE_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm ${cat === c ? 'bg-hover font-semibold text-fg ring-1 ring-cyan/40' : 'text-muted hover:bg-hover hover:text-fg'}`}>
              {c}
              <span className="ml-1 text-xs text-muted">({c === 'All' ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === c).length})</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm">
            <Search size={16} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" className="w-full bg-transparent outline-none placeholder:text-muted" />
            {q && (
              <button onClick={() => setQ('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </label>
          <ProBadge />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-muted">Colour</span>
            {SWATCHES.map((c) => (
              <button key={c} onClick={() => setColor(color === c ? null : c)} aria-label={`Filter by colour ${c}`} aria-pressed={color === c} className={`h-6 w-6 rounded-full border border-line transition ${color === c ? 'scale-110 ring-2 ring-cyan ring-offset-2 ring-offset-canvas' : ''}`} style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
            {RATIOS.map((r) => (
              <button key={r} onClick={() => setRatio(r)} className={`rounded-md px-2.5 py-1 text-xs font-medium ${ratio === r ? 'bg-cyan text-[#06272a]' : 'text-muted hover:text-fg'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        {list.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((t) => (
              <TemplateCard key={t.id} tpl={t} onPreview={() => setPreview(t)} onUse={() => cloneTemplate(t.id)} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">No templates match these filters.</p>
        )}
      </div>
      <TemplatePreviewModal tpl={preview} onClose={() => setPreview(null)} onUse={cloneTemplate} />
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}
