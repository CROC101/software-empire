'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { HOME_TABS, PRESETS, TEMPLATES } from '@/data/seed-templates';
import { useCanva } from '@/context/CanvaContext';
import { useDesignActions } from '@/hooks/useDesignActions';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { TemplateCard } from '@/components/cards/TemplateCard';
import { TemplatePreviewModal } from '@/components/cards/TemplatePreviewModal';
import { MoveToFolderModal } from '@/components/cards/MoveToFolderModal';
import { ProBadge } from '@/components/ui/ProBadge';
import { SPRING } from '@/lib/design';
import type { DesignTemplate } from '@/types/canva';

const QUICK = ['yt', 'ig', 'tt', 'pres', 'a4', 'logo'];

export default function HomePage() {
  const canva = useCanva();
  const { createAndOpen, cloneTemplate } = useDesignActions();
  const [tab, setTab] = useState<(typeof HOME_TABS)[number]>('For you');
  const [preview, setPreview] = useState<DesignTemplate | null>(null);
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [cw, setCw] = useState(1600);
  const [ch, setCh] = useState(900);
  const rail = useRef<HTMLDivElement>(null);

  const presets = tab === 'For you' ? PRESETS.filter((p) => QUICK.includes(p.id)) : PRESETS.filter((p) => p.group === tab);
  const recent = canva.projects.filter((p) => !p.trashed).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
  const featured = TEMPLATES.filter((t) => t.pro);

  return (
    <div className="space-y-10">
      <section className="bg-brand-gradient relative overflow-hidden rounded-2xl px-5 py-10 text-white md:px-10 md:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan/30 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-3 flex justify-center">
            <ProBadge />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-5xl">What will you design today?</h1>
          <div className="no-scrollbar mt-6 flex gap-1 overflow-x-auto md:flex-wrap md:justify-center" role="tablist">
            {HOME_TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium">
                {tab === t && <motion.span layoutId="home-tab" transition={SPRING} className="absolute inset-0 rounded-full bg-white" />}
                <span className={`relative ${tab === t ? 'text-[#4b1fa8]' : 'text-white/90'}`}>{t}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Start a design">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING}>
            {tab === 'Custom Size' ? (
              <form
                className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-card p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  createAndOpen({ width: Math.min(5000, Math.max(50, cw)), height: Math.min(5000, Math.max(50, ch)) });
                }}
              >
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Width (px)</span>
                  <input type="number" value={cw} min={50} max={5000} onChange={(e) => setCw(+e.target.value)} className="w-32 rounded-lg border border-line bg-canvas px-3 py-2" />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Height (px)</span>
                  <input type="number" value={ch} min={50} max={5000} onChange={(e) => setCh(+e.target.value)} className="w-32 rounded-lg border border-line bg-canvas px-3 py-2" />
                </label>
                <button className="bg-brand-gradient rounded-lg px-5 py-2 text-sm font-semibold text-white">Create new design</button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {presets.map((p) => {
                  const r = p.width / p.height;
                  return (
                    <motion.button key={p.id} whileHover={{ y: -4 }} transition={SPRING} onClick={() => createAndOpen({ width: p.width, height: p.height, title: p.label })} className="group flex flex-col items-center gap-2 rounded-xl border border-line bg-card p-4 text-center hover:border-cyan/50">
                      <span className="flex h-24 w-full items-center justify-center">
                        <span className="bg-brand-gradient block rounded-md opacity-80 shadow-lg transition group-hover:opacity-100" style={{ width: r >= 1 ? 96 : 96 * r, height: r >= 1 ? 96 / r : 96 }} />
                      </span>
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-xs text-muted">
                        {p.width}×{p.height}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent designs</h2>
          <Link href="/projects/" className="text-sm font-medium text-cyan hover:underline">
            See all
          </Link>
        </div>
        {recent.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} onMove={(id) => setMoveIds([id])} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No designs yet — pick a size above or a template below.</p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles size={20} className="text-gold" /> Featured Pro templates
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/templates/" className="mr-2 text-sm font-medium text-cyan hover:underline">
              Browse all
            </Link>
            <button aria-label="Scroll left" onClick={() => rail.current?.scrollBy({ left: -600, behavior: 'smooth' })} className="rounded-full border border-line p-1.5 hover:bg-hover">
              <ChevronLeft size={18} />
            </button>
            <button aria-label="Scroll right" onClick={() => rail.current?.scrollBy({ left: 600, behavior: 'smooth' })} className="rounded-full border border-line p-1.5 hover:bg-hover">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div ref={rail} className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-4 pt-1">
          {featured.map((t) => (
            <div key={t.id} className="w-60 shrink-0 snap-start">
              <TemplateCard tpl={t} onPreview={() => setPreview(t)} onUse={() => cloneTemplate(t.id)} />
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line pt-6 text-xs text-muted">
        Every Pro feature is unlocked. Trouble loading?{' '}
        <Link href="/en/help/troubleshoot-cloudflare-error/" className="text-cyan hover:underline">
          Visit the Help Centre
        </Link>
        .
      </footer>

      <TemplatePreviewModal tpl={preview} onClose={() => setPreview(null)} onUse={cloneTemplate} />
      <MoveToFolderModal ids={moveIds} onClose={() => setMoveIds([])} />
    </div>
  );
}
