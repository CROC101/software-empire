'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PRESETS } from '@/data/seed-templates';
import { useDesignActions } from '@/hooks/useDesignActions';
import { SPRING } from '@/lib/design';

export function CreateDesignMenu({ variant = 'button', align = 'right' }: { variant?: 'button' | 'rail'; align?: 'right' | 'left' }) {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState(1200);
  const [h, setH] = useState(800);
  const ref = useRef<HTMLDivElement>(null);
  const { createAndOpen } = useDesignActions();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {variant === 'rail' ? (
        <button onClick={() => setOpen((o) => !o)} className="flex flex-col items-center gap-1 text-[11px] font-medium text-fg" aria-label="Create a design">
          <span className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg shadow-violet/30 transition-transform hover:scale-105">
            <Plus size={22} />
          </span>
          Create
        </button>
      ) : (
        <button onClick={() => setOpen((o) => !o)} className="bg-brand-gradient inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-violet/25 transition hover:brightness-110">
          <Plus size={16} /> <span className="hidden sm:inline">Create a design</span>
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING}
            className={`absolute z-[70] mt-2 w-72 rounded-xl border border-line bg-toolbar p-2 shadow-2xl ${variant === 'rail' ? 'left-14 top-0' : align === 'right' ? 'right-0' : 'left-0'}`}
          >
            <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-muted">Start a blank design</p>
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => createAndOpen({ width: p.width, height: p.height, title: p.label })} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-hover">
                <span>{p.label}</span>
                <span className="text-xs text-muted">
                  {p.width}×{p.height}
                </span>
              </button>
            ))}
            <div className="mt-1 border-t border-line p-2">
              <p className="mb-2 text-xs font-semibold text-muted">Custom size (px)</p>
              <div className="flex items-center gap-2">
                <input type="number" min={50} max={5000} value={w} onChange={(e) => setW(+e.target.value)} className="w-20 rounded-md border border-line bg-canvas px-2 py-1 text-sm" aria-label="Width" />
                <span className="text-muted">×</span>
                <input type="number" min={50} max={5000} value={h} onChange={(e) => setH(+e.target.value)} className="w-20 rounded-md border border-line bg-canvas px-2 py-1 text-sm" aria-label="Height" />
                <button
                  onClick={() => createAndOpen({ width: Math.min(5000, Math.max(50, w)), height: Math.min(5000, Math.max(50, h)) })}
                  className="ml-auto rounded-md bg-cyan px-2.5 py-1 text-sm font-semibold text-[#06272a]"
                >
                  Go
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
