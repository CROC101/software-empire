'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useCanva } from '@/context/CanvaContext';
import { MAGIC_SIZES } from '@/data/seed-templates';
import { ProBadge } from '@/components/ui/ProBadge';
import { useEditor } from './editor-context';

export function MagicResizePopover() {
  const ed = useEditor();
  const canva = useCanva();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<{ width: number; height: number } | null>(null);
  const [custom, setCustom] = useState({ width: ed.project.width, height: ed.project.height });
  const valid = (n: number) => Number.isFinite(n) && n >= 40 && n <= 8000;
  const target = pick ?? (valid(custom.width) && valid(custom.height) ? custom : null);

  const run = (copy: boolean) => {
    if (!target) return;
    if (copy) {
      const id = canva.duplicateProject(ed.project.id);
      if (!id) return;
      canva.magicResize(id, target.width, target.height);
      canva.updateProject(id, (p) => ({ ...p, title: `${ed.project.title} · ${target.width}×${target.height}` }), { history: false });
      router.push(`/design/${id}/`);
    } else {
      canva.magicResize(ed.project.id, target.width, target.height);
      ed.select(null);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium hover:bg-hover">
        <Sparkles size={16} className="text-gold" /> <span className="hidden lg:inline">Magic Resize</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-line bg-toolbar p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Magic Resize</h3>
              <ProBadge small />
            </div>
            <p className="mb-3 text-xs text-muted">
              Now {ed.project.width} × {ed.project.height}. Elements are re-laid out proportionally; backgrounds stretch to fill.
            </p>
            <div className="space-y-1.5">
              {MAGIC_SIZES.map((s) => {
                const on = pick?.width === s.width && pick.height === s.height;
                return (
                  <button key={s.label} onClick={() => setPick(on ? null : s)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${on ? 'border-cyan bg-cyan/10' : 'border-line hover:bg-hover'}`}>
                    {s.label}
                    <span className="font-mono text-xs text-muted">
                      {s.width}×{s.height}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-xs text-muted">Custom</span>
              <input aria-label="Width" type="number" value={custom.width} onFocus={() => setPick(null)} onChange={(e) => setCustom((c) => ({ ...c, width: +e.target.value }))} className="w-20 rounded-md border border-line bg-canvas px-2 py-1" />
              ×
              <input aria-label="Height" type="number" value={custom.height} onFocus={() => setPick(null)} onChange={(e) => setCustom((c) => ({ ...c, height: +e.target.value }))} className="w-20 rounded-md border border-line bg-canvas px-2 py-1" />
            </div>
            {!target && <p className="mt-2 text-xs text-red-400">Sizes must be between 40 and 8000 px.</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button disabled={!target} onClick={() => run(true)} className="bg-brand-gradient rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40">
                Copy &amp; resize
              </button>
              <button disabled={!target} onClick={() => run(false)} className="rounded-lg border border-line py-2 text-sm hover:bg-hover disabled:opacity-40">
                Resize this
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
