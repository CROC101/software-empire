'use client';

import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useState } from 'react';
import type { ElementAnimation } from '@/types/canva';
import { ANIMATIONS, DEFAULT_ANIM, motionFor } from '@/lib/animation';
import { useEditor } from './editor-context';

/** Tiny looping sample of each animation so the tile previews what it does. */
function Sample({ type }: { type: ElementAnimation['type'] }) {
  const [k, setK] = useState(0);
  const spec = motionFor({ type, duration: 0.6, delay: 0 });
  return (
    <span onMouseEnter={() => setK((x) => x + 1)} className="flex h-10 items-center justify-center">
      <motion.span key={k} className="bg-brand-gradient block h-6 w-6 rounded-md" initial={spec?.initial} animate={spec?.animate} transition={spec?.transition} />
    </span>
  );
}

export function AnimationPanel() {
  const ed = useEditor();
  const { sel, page } = ed;
  const current = sel ? sel.animation : page.animation;
  const anim = current ?? { ...DEFAULT_ANIM, type: 'none' as const };
  const apply = (next: ElementAnimation | undefined) => {
    if (sel) ed.updateEl(sel.id, { animation: next });
    else ed.updatePage((pg) => ({ ...pg, animation: next }));
    if (next && next.type !== 'none') ed.play();
  };
  const tune = (patch: Partial<ElementAnimation>) => apply({ ...anim, ...patch });

  return (
    <div>
      <p className="mb-3 text-xs text-muted">{sel ? `Animating the selected ${sel.type}. Element animations override the page animation.` : 'Page animation: every element enters one after another. Select an element to animate it on its own.'}</p>
      <div className="grid grid-cols-3 gap-2">
        {ANIMATIONS.map((a) => (
          <button
            key={a.type}
            onClick={() => apply(a.type === 'none' ? undefined : { ...DEFAULT_ANIM, ...current, type: a.type })}
            className={`rounded-xl border p-1.5 text-xs ${anim.type === a.type ? 'border-cyan bg-cyan/10 text-cyan' : 'border-line hover:bg-hover'}`}
          >
            {a.type === 'none' ? <span className="flex h-10 items-center justify-center text-lg text-muted">∅</span> : <Sample type={a.type} />}
            {a.label}
            {a.loop && <span className="block text-[10px] text-muted">loop</span>}
          </button>
        ))}
      </div>
      {anim.type !== 'none' && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs text-muted">
            <span className="flex justify-between">
              Speed <span className="font-mono text-fg">{anim.duration.toFixed(1)}s</span>
            </span>
            <input type="range" min={0.2} max={2.5} step={0.1} value={anim.duration} onChange={(e) => tune({ duration: +e.target.value })} className="w-full accent-[#00C4CC]" />
          </label>
          <label className="block text-xs text-muted">
            <span className="flex justify-between">
              Delay <span className="font-mono text-fg">{anim.delay.toFixed(1)}s</span>
            </span>
            <input type="range" min={0} max={3} step={0.1} value={anim.delay} onChange={(e) => tune({ delay: +e.target.value })} className="w-full accent-[#00C4CC]" />
          </label>
        </div>
      )}
      <button onClick={ed.play} className="bg-brand-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white">
        <Play size={15} /> Preview animations
      </button>
    </div>
  );
}
