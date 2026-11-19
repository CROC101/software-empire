'use client';

import { Check, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useCanva } from '@/context/CanvaContext';
import { FONT_FAMILIES, fontCss, imageSize, readFileAsDataUrl, uid } from '@/lib/design';
import { ProBadge } from '@/components/ui/ProBadge';
import { InsertIntoDesign } from '@/components/ui/InsertIntoDesign';
import type { BrandKit, FontFamily } from '@/types/canva';

const ROLES = [
  { key: 'heading', label: 'Heading', sample: 'Bold ideas, beautifully set', size: 34 },
  { key: 'subheading', label: 'Subheading', sample: 'Supporting line that frames the story', size: 22 },
  { key: 'body', label: 'Body', sample: 'Body copy carries the details. It should stay comfortable to read at small sizes and long lengths.', size: 15 },
] as const;

export default function BrandPage() {
  const { brand, setBrand } = useCanva();
  const [logoId, setLogoId] = useState(brand.logos[0]?.id ?? '');
  const setPalette = (id: string, fn: (colors: string[]) => string[]) =>
    setBrand((b) => ({ ...b, palettes: b.palettes.map((p) => (p.id === id ? { ...p, colors: fn(p.colors) } : p)) }));

  const logo = brand.logos.find((l) => l.id === logoId) ?? brand.logos[0];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Brand Kit</h1>
          <p className="text-sm text-muted">Colours, fonts and logos here show up live in every design’s editor.</p>
        </div>
        <ProBadge />
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Brand palettes</h2>
          <button
            onClick={() => setBrand((b) => ({ ...b, palettes: [...b.palettes, { id: uid('pal'), name: `Palette ${b.palettes.length + 1}`, colors: ['#00C4CC', '#7D2AE8'] }] }))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-hover"
          >
            <Plus size={15} /> Add palette
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {brand.palettes.map((p) => {
            const active = brand.activePaletteId === p.id;
            return (
              <div key={p.id} className={`rounded-xl border bg-card p-4 ${active ? 'border-cyan ring-1 ring-cyan/40' : 'border-line'}`}>
                <div className="mb-3 flex items-center gap-2">
                  <input value={p.name} onChange={(e) => setBrand((b) => ({ ...b, palettes: b.palettes.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) }))} aria-label="Palette name" className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 font-semibold outline-none focus:bg-canvas" />
                  <button onClick={() => setBrand((b) => ({ ...b, activePaletteId: p.id }))} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${active ? 'bg-cyan text-[#06272a]' : 'border border-line text-muted hover:text-fg'}`}>
                    {active && <Check size={13} />} {active ? 'Default' : 'Set default'}
                  </button>
                  <button onClick={() => setBrand((b) => ({ ...b, palettes: b.palettes.filter((x) => x.id !== p.id) }))} aria-label={`Delete ${p.name}`} disabled={brand.palettes.length === 1} className="rounded-md p-1 text-muted hover:text-red-400 disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.colors.map((c, i) => (
                    <div key={i} className="group relative">
                      <label className="block h-12 w-12 cursor-pointer rounded-lg border border-line shadow-inner" style={{ background: c }} title={c}>
                        <input type="color" value={c} onChange={(e) => setPalette(p.id, (cs) => cs.map((x, j) => (j === i ? e.target.value.toUpperCase() : x)))} className="sr-only" aria-label={`Edit colour ${c}`} />
                      </label>
                      <button onClick={() => setPalette(p.id, (cs) => cs.filter((_, j) => j !== i))} aria-label={`Remove ${c}`} className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white group-hover:flex">
                        ×
                      </button>
                      <span className="mt-1 block text-center text-[10px] text-muted">{c}</span>
                    </div>
                  ))}
                  <button onClick={() => setPalette(p.id, (cs) => [...cs, '#FFFFFF'])} aria-label="Add colour" className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-line text-muted hover:border-cyan hover:text-fg">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Brand typography</h2>
        <div className="space-y-3">
          {ROLES.map((r) => {
            const role = brand.typography[r.key];
            const set = (patch: Partial<BrandKit['typography']['heading']>) => setBrand((b) => ({ ...b, typography: { ...b.typography, [r.key]: { ...b.typography[r.key], ...patch } } }));
            return (
              <div key={r.key} className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4 md:flex-row md:items-center">
                <div className="w-28 shrink-0 text-sm font-semibold text-muted">{r.label}</div>
                <div className="flex gap-2">
                  <select value={role.family} onChange={(e) => set({ family: e.target.value as FontFamily })} aria-label={`${r.label} font`} className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm">
                    {FONT_FAMILIES.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <select value={role.weight} onChange={(e) => set({ weight: +e.target.value })} aria-label={`${r.label} weight`} className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm">
                    {[300, 400, 500, 600, 700, 800].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="min-w-0 flex-1 truncate" style={{ fontFamily: fontCss(role.family), fontWeight: role.weight, fontSize: r.size }}>
                  {r.sample}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Brand logos &amp; stickers</h2>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-hover">
            <Upload size={15} /> Upload logo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const src = await readFileAsDataUrl(f);
                const { w, h } = await imageSize(src);
                const s = Math.min(1, 300 / Math.max(w, h));
                const id = uid('lg');
                setBrand((b) => ({ ...b, logos: [...b.logos, { id, name: f.name, src, w: Math.round(w * s), h: Math.round(h * s) }] }));
                setLogoId(id);
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {brand.logos.map((l) => (
            <button key={l.id} onClick={() => setLogoId(l.id)} className={`group relative flex aspect-square items-center justify-center rounded-xl border bg-[#2a2b31] p-4 ${logo?.id === l.id ? 'border-cyan ring-2 ring-cyan/40' : 'border-line'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt={l.name} className="max-h-full max-w-full object-contain" />
              <span className="absolute inset-x-0 bottom-0 truncate rounded-b-xl bg-black/50 px-2 py-1 text-[11px] text-white">{l.name}</span>
            </button>
          ))}
        </div>
        {logo && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-4">
            <span className="text-sm">
              Selected: <b>{logo.name}</b>
            </span>
            <div className="ml-auto">
              <InsertIntoDesign label="Insert logo" build={(W, H) => ({ id: '', type: 'image', name: logo.name, src: logo.src, w: logo.w, h: logo.h, x: W - logo.w - 40, y: H - logo.h - 40, rotation: 0, opacity: 1 })} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
