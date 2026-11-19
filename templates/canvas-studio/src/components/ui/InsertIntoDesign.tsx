'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CanvasElement } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';

/** Pick a design (or a new one) and drop an element into its first page, then open the editor. */
export function InsertIntoDesign({ build, label = 'Insert into design', atBack = false }: { build: (canvasW: number, canvasH: number) => CanvasElement | null; label?: string; atBack?: boolean }) {
  const canva = useCanva();
  const router = useRouter();
  const live = canva.projects.filter((p) => !p.trashed);
  const [target, setTarget] = useState('new');
  const go = () => {
    let id: string | null = target;
    if (target === 'new' || !live.some((p) => p.id === target)) id = canva.createProject({ width: 1080, height: 1080, title: 'Untitled design' });
    if (!id) return;
    const p = canva.getProject(id);
    const el = build(p?.width ?? 1080, p?.height ?? 1080);
    if (!el) return;
    canva.insertElement(id, el, 0, atBack);
    router.push(`/design/${id}/`);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target design" className="min-w-0 max-w-[220px] flex-1 rounded-lg border border-line bg-canvas px-2.5 py-2 text-sm">
        <option value="new">+ New 1080×1080 design</option>
        {live.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <button onClick={go} className="bg-brand-gradient rounded-lg px-3.5 py-2 text-sm font-semibold text-white hover:brightness-110">
        {label}
      </button>
    </div>
  );
}
