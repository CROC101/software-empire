'use client';

import { Crown } from 'lucide-react';
import { useState } from 'react';
import type { DesignTemplate } from '@/types/canva';
import { Modal } from '@/components/ui/Modal';
import { DesignPreview } from '@/components/design/DesignPreview';
import { ProBadge } from '@/components/ui/ProBadge';

export function TemplatePreviewModal({ tpl, onClose, onUse }: { tpl: DesignTemplate | null; onClose: () => void; onUse: (id: string) => void }) {
  const [play, setPlay] = useState(0);
  return (
    <Modal
      open={!!tpl}
      onClose={onClose}
      wide
      title={
        tpl && (
          <span className="flex items-center gap-2">
            {tpl.name} {tpl.pro && <ProBadge small label="PRO · FREE" />}
          </span>
        )
      }
    >
      {tpl && (
        <div className="grid gap-5 md:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            {tpl.pages.map((p, i) => (
              <div key={p.id}>
                <p className="mb-1.5 text-xs font-semibold text-muted">
                  Page {i + 1} of {tpl.pages.length}
                </p>
                <div className="checker mx-auto overflow-hidden rounded-lg shadow-lg" style={{ maxWidth: tpl.width >= tpl.height ? '100%' : `${Math.min(100, (tpl.width / tpl.height) * 120)}%` }}>
                  <DesignPreview page={p} width={tpl.width} height={tpl.height} animate playKey={play} />
                </div>
              </div>
            ))}
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl border border-line bg-canvas p-4 text-sm">
              <p className="text-muted">Category</p>
              <p className="font-semibold">{tpl.category}</p>
              <p className="mt-3 text-muted">Size</p>
              <p className="font-semibold">
                {tpl.width} × {tpl.height} px
              </p>
              <p className="mt-3 text-muted">Colours</p>
              <div className="mt-1 flex gap-1.5">
                {tpl.colors.map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full border border-line" style={{ background: c }} title={c} />
                ))}
              </div>
              {tpl.pro && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-gold">
                  <Crown size={13} /> Pro template — unlocked for you
                </p>
              )}
            </div>
            <button onClick={() => onUse(tpl.id)} className="bg-brand-gradient w-full rounded-lg py-2.5 text-sm font-semibold text-white hover:brightness-110">
              Use this template
            </button>
            <button onClick={() => setPlay((k) => k + 1)} className="w-full rounded-lg border border-line py-2 text-sm hover:bg-hover">
              Replay animations
            </button>
          </aside>
        </div>
      )}
    </Modal>
  );
}
