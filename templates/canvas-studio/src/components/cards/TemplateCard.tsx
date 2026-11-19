'use client';

import { motion } from 'framer-motion';
import { Crown, Eye } from 'lucide-react';
import type { DesignTemplate } from '@/types/canva';
import { DesignPreview } from '@/components/design/DesignPreview';
import { SPRING } from '@/lib/design';

export function TemplateCard({ tpl, onPreview, onUse }: { tpl: DesignTemplate; onPreview: () => void; onUse: () => void }) {
  return (
    <motion.article whileHover={{ y: -4 }} transition={SPRING} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm hover:shadow-xl hover:shadow-violet/10">
      <button onClick={onPreview} className="relative block bg-canvas p-3 text-left" aria-label={`Preview ${tpl.name}`}>
        <div className="mx-auto overflow-hidden rounded-md shadow-md" style={{ maxWidth: tpl.width >= tpl.height ? '100%' : `${(tpl.width / tpl.height) * 100}%` }}>
          <DesignPreview page={tpl.pages[0]} width={tpl.width} height={tpl.height} />
        </div>
        {tpl.pro && (
          <span className="pro-crown absolute right-2 top-2 rounded-full p-1 text-[#1a1030] shadow" title="Pro — unlocked">
            <Crown size={12} strokeWidth={2.6} />
          </span>
        )}
        {tpl.pages.length > 1 && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">{tpl.pages.length} pages</span>}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#141518]">
            <Eye size={14} /> Preview
          </span>
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold">{tpl.name}</h3>
          <p className="text-xs text-muted">
            {tpl.category} · {tpl.width}×{tpl.height}
          </p>
        </div>
        <button onClick={onUse} className="bg-brand-gradient mt-auto rounded-lg py-1.5 text-xs font-semibold text-white transition hover:brightness-110">
          Customize this template
        </button>
      </div>
    </motion.article>
  );
}
