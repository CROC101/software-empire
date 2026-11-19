'use client';

import Link from 'next/link';
import { ChevronLeft, Crown, Layers, LayoutTemplate, Search, Shapes, Type, Upload, WandSparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CanvasElement, DesignTemplate, Paint, ShapeKind } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';
import { BACKDROPS, BADGES, ILLUSTRATIONS, STICKERS, type SvgAsset } from '@/data/assets';
import { FONT_COMBOS, TEMPLATES } from '@/data/seed-templates';
import { clonePage, firstColor, fitText, fontCss, imageSize, paintToCss, readFileAsDataUrl, resizeProject, shapePath } from '@/lib/design';
import { DesignPreview } from '@/components/design/DesignPreview';
import { AnimationPanel } from './AnimationPanel';
import { LayersPanel } from './LayersPanel';
import { useEditor } from './editor-context';

export type DrawerTab = 'design' | 'elements' | 'text' | 'brand' | 'uploads' | 'animate' | 'layers';

export const DRAWER_TABS: { id: DrawerTab; label: string; icon: typeof Type }[] = [
  { id: 'design', label: 'Design', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'brand', label: 'Brand', icon: Crown },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'animate', label: 'Animate', icon: WandSparkles },
  { id: 'layers', label: 'Layers', icon: Layers },
];

const SHAPES: { kind: ShapeKind; w: number; h: number }[] = [
  { kind: 'rect', w: 100, h: 100 }, { kind: 'roundedRect', w: 100, h: 100 }, { kind: 'circle', w: 100, h: 100 },
  { kind: 'triangle', w: 100, h: 90 }, { kind: 'star', w: 100, h: 100 }, { kind: 'hexagon', w: 100, h: 88 },
  { kind: 'pill', w: 100, h: 44 }, { kind: 'line', w: 100, h: 8 }, { kind: 'arrow', w: 100, h: 56 },
];

/** Readable text colour for a background paint. */
function contrastOn(p: Paint): string {
  const hex = firstColor(p).replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#FFFFFF';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#141518' : '#FFFFFF';
}

/** Keep uploads small enough for browser storage: max 1600px, WebP. */
async function shrinkImage(src: string): Promise<{ src: string; w: number; h: number }> {
  const { w, h } = await imageSize(src);
  const s = Math.min(1, 1600 / Math.max(w, h));
  if (s === 1 && src.length < 600_000) return { src, w, h };
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
  return { src: c.toDataURL('image/webp', 0.88), w: c.width, h: c.height };
}

const H3 = ({ children }: { children: React.ReactNode }) => <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted first:mt-0">{children}</h3>;

function DesignTab() {
  const ed = useEditor();
  const [q, setQ] = useState('');
  const list = TEMPLATES.filter((t) => `${t.name} ${t.category}`.toLowerCase().includes(q.toLowerCase()));
  const apply = (tpl: DesignTemplate) => {
    const W = ed.project.width;
    const H = ed.project.height;
    const pages = resizeProject({ ...ed.project, width: tpl.width, height: tpl.height, pages: tpl.pages.map(clonePage) }, W, H).pages;
    const i = ed.pageIndex;
    const replace = ed.page.elements.length === 0; // fill an empty page instead of adding after it
    ed.update((p) => ({ ...p, pages: [...p.pages.slice(0, replace ? i : i + 1), ...pages, ...p.pages.slice(i + 1)] }));
    ed.setPageIndex(replace ? i : i + 1);
    ed.select(null);
  };
  return (
    <>
      <label className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
        <Search size={15} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" className="w-full bg-transparent outline-none" />
      </label>
      <H3>Backgrounds</H3>
      <div className="mb-2 grid grid-cols-6 gap-1.5">
        {BACKDROPS.map((b) => (
          <button key={b.id} title={b.name} aria-label={b.name} onClick={() => ed.updatePage((pg) => ({ ...pg, background: b.paint }))} className="aspect-square rounded-md border border-line" style={{ background: paintToCss(b.paint) }} />
        ))}
      </div>
      <H3>Templates · adds pages to this design</H3>
      <div className="grid grid-cols-2 gap-2">
        {list.map((t) => (
          <button key={t.id} onClick={() => apply(t)} className="group text-left">
            <DesignPreview page={t.pages[0]} width={t.width} height={t.height} className="rounded-lg border border-line transition group-hover:border-cyan" />
            <span className="mt-1 block truncate text-xs text-muted group-hover:text-fg">{t.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function ElementsTab() {
  const ed = useEditor();
  const { brand } = useCanva();
  const [q, setQ] = useState('');
  const W = ed.project.width;
  const H = ed.project.height;
  const accent = brand.palettes.find((p) => p.id === brand.activePaletteId)?.colors.find((c) => c.toUpperCase() !== firstColor(ed.page.background).toUpperCase()) ?? '#00C4CC';
  const unit = Math.min(W, H) / 1080;
  const addShape = (kind: ShapeKind, w: number, h: number) =>
    ed.addEl({ type: 'shape', shape: kind, w: Math.round(w * 3 * unit), h: Math.round(h * 3 * unit), fill: accent, name: `${kind} shape` });
  const addAsset = (a: SvgAsset) => {
    const s = Math.min(1.6 * unit, (0.6 * W) / a.w, (0.6 * H) / a.h);
    ed.addEl({ type: 'image', src: a.src, w: Math.round(a.w * s), h: Math.round(a.h * s), name: a.name });
  };
  const match = (a: SvgAsset) => a.name.toLowerCase().includes(q.toLowerCase());
  const grids: [string, SvgAsset[]][] = [['Badges', BADGES.filter(match)], ['Stickers', STICKERS.filter(match)], ['Illustrations', ILLUSTRATIONS.filter(match)]];
  return (
    <>
      <label className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
        <Search size={15} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search elements" className="w-full bg-transparent outline-none" />
      </label>
      {(!q || 'shapes lines arrow'.includes(q.toLowerCase())) && (
        <>
          <H3>Shapes &amp; lines</H3>
          <div className="grid grid-cols-5 gap-1.5">
            {SHAPES.map((s) => (
              <button key={s.kind} onClick={() => addShape(s.kind, s.w, s.h)} title={s.kind} aria-label={`Add ${s.kind}`} className="flex aspect-square items-center justify-center rounded-lg border border-line bg-canvas p-2 hover:border-cyan">
                <svg viewBox={`0 0 ${s.w} ${s.h}`} className="max-h-full w-full" style={{ aspectRatio: `${s.w}/${s.h}` }}>
                  <path d={shapePath(s.kind, s.w, s.h)} fill="currentColor" />
                </svg>
              </button>
            ))}
            {BACKDROPS.filter((b) => typeof b.paint !== 'string')
              .slice(0, 1)
              .map((b) => (
                <button key={b.id} onClick={() => ed.addEl({ type: 'shape', shape: 'roundedRect', radius: 32 * unit, w: Math.round(320 * unit), h: Math.round(320 * unit), fill: b.paint, name: 'Gradient block' })} title="Gradient block" aria-label="Add gradient block" className="aspect-square rounded-lg border border-line" style={{ background: paintToCss(b.paint) }} />
              ))}
          </div>
        </>
      )}
      {grids.map(([title, items]) =>
        items.length ? (
          <div key={title}>
            <H3>{title}</H3>
            <div className="grid grid-cols-3 gap-2">
              {items.map((a) => (
                <button key={a.id} onClick={() => addAsset(a)} title={a.name} aria-label={`Add ${a.name}`} className="checker flex aspect-square items-center justify-center rounded-lg border border-line p-2 hover:border-cyan">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt="" className="max-h-full max-w-full" />
                </button>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </>
  );
}

function TextTab() {
  const ed = useEditor();
  const { brand } = useCanva();
  const W = ed.project.width;
  const H = ed.project.height;
  const unit = Math.min(W, H) / 1080;
  const color = contrastOn(ed.page.background);
  const base = (style: Partial<CanvasElement>): CanvasElement => ({ id: '', type: 'text', x: 0, y: 0, w: Math.round(W * 0.8), h: 10, rotation: 0, opacity: 1, align: 'center', lineHeight: 1.2, color, ...style });
  const role = (key: 'heading' | 'subheading' | 'body', text: string, size: number) =>
    ed.addEl(base({ text, fontFamily: brand.typography[key].family, fontWeight: brand.typography[key].weight, fontSize: Math.round(size * unit) }));
  const combo = (c: (typeof FONT_COMBOS)[number]) => {
    const hd = fitText(base({ ...c.heading, fontSize: Math.round((c.heading.fontSize ?? 64) * unit), letterSpacing: (c.heading.letterSpacing ?? 0) * unit }));
    const sb = fitText(base({ ...c.sub, fontSize: Math.round((c.sub.fontSize ?? 28) * unit), letterSpacing: (c.sub.letterSpacing ?? 0) * unit }));
    const gap = 18 * unit;
    const top = (H - hd.h - gap - sb.h) / 2;
    ed.addEl({ ...hd, x: (W - hd.w) / 2, y: top });
    ed.addEl({ ...sb, x: (W - sb.w) / 2, y: top + hd.h + gap });
  };
  const btn = 'mb-2 block w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-left hover:border-cyan';
  return (
    <>
      <button onClick={() => role('heading', 'Add a heading', 96)} className={btn} style={{ fontFamily: fontCss(brand.typography.heading.family), fontWeight: brand.typography.heading.weight, fontSize: 24 }}>
        Add a heading
      </button>
      <button onClick={() => role('subheading', 'Add a subheading', 56)} className={btn} style={{ fontFamily: fontCss(brand.typography.subheading.family), fontWeight: brand.typography.subheading.weight, fontSize: 17 }}>
        Add a subheading
      </button>
      <button onClick={() => role('body', 'Add a little bit of body text', 32)} className={btn} style={{ fontFamily: fontCss(brand.typography.body.family), fontWeight: brand.typography.body.weight, fontSize: 13 }}>
        Add a little bit of body text
      </button>
      <H3>Font combinations</H3>
      <div className="grid grid-cols-2 gap-2">
        {FONT_COMBOS.map((c) => (
          <button key={c.id} onClick={() => combo(c)} title={c.name} className="flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-lg border border-line bg-[#101114] p-2 text-center hover:border-cyan">
            <span className="line-clamp-2 leading-tight" style={{ fontFamily: fontCss(c.heading.fontFamily), fontWeight: c.heading.fontWeight, fontStyle: c.heading.italic ? 'italic' : undefined, color: c.heading.color, fontSize: 15, textTransform: c.heading.uppercase ? 'uppercase' : undefined, textShadow: c.heading.glow ? `0 0 8px ${c.heading.color}` : undefined }}>
              {c.heading.text}
            </span>
            <span className="mt-1 truncate text-[9px]" style={{ fontFamily: fontCss(c.sub.fontFamily), color: c.sub.color, letterSpacing: c.sub.letterSpacing ? 2 : undefined }}>
              {c.sub.text}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function BrandTab() {
  const ed = useEditor();
  const { brand } = useCanva();
  const W = ed.project.width;
  const H = ed.project.height;
  const paint = (c: string) => {
    const s = ed.sel;
    if (s?.type === 'text') ed.updateEl(s.id, { color: c });
    else if (s?.type === 'shape') ed.updateEl(s.id, { fill: c });
    else ed.updatePage((pg) => ({ ...pg, background: c }));
  };
  return (
    <>
      <p className="mb-3 text-xs text-muted">Click a colour to paint the selected text or shape, or the page background when nothing is selected.</p>
      {brand.palettes.map((p) => (
        <div key={p.id} className="mb-3">
          <p className="mb-1.5 text-xs font-semibold">
            {p.name} {p.id === brand.activePaletteId && <span className="ml-1 rounded bg-cyan/15 px-1.5 py-0.5 text-[10px] text-cyan">default</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {p.colors.map((c) => (
              <button key={c} onClick={() => paint(c)} title={c} aria-label={`Use ${c}`} className="h-8 w-8 rounded-md border border-line" style={{ background: c }} />
            ))}
          </div>
        </div>
      ))}
      <H3>Brand fonts</H3>
      <TextTabRoles />
      <H3>Logos</H3>
      <div className="grid grid-cols-3 gap-2">
        {brand.logos.map((l) => (
          <button
            key={l.id}
            onClick={() => {
              const s = Math.min(1, (0.4 * W) / l.w, (0.4 * H) / l.h) * (Math.min(W, H) / 1080 + 0.2);
              ed.addEl({ type: 'image', src: l.src, w: Math.round(l.w * s), h: Math.round(l.h * s), name: l.name });
            }}
            title={l.name}
            aria-label={`Add ${l.name}`}
            className="flex aspect-square items-center justify-center rounded-lg border border-line bg-[#2a2b31] p-2 hover:border-cyan"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.src} alt="" className="max-h-full max-w-full" />
          </button>
        ))}
      </div>
      <Link href="/brand/" className="mt-4 block text-center text-sm text-cyan hover:underline">
        Edit Brand Kit →
      </Link>
    </>
  );
}

/** The three brand text roles as quick-add buttons (shared look with the Text tab). */
function TextTabRoles() {
  const { brand } = useCanva();
  const ed = useEditor();
  const unit = Math.min(ed.project.width, ed.project.height) / 1080;
  const color = contrastOn(ed.page.background);
  return (
    <div className="space-y-1.5">
      {(['heading', 'subheading', 'body'] as const).map((k, i) => (
        <button
          key={k}
          onClick={() => ed.addEl({ type: 'text', text: k === 'body' ? 'Body copy in your brand font' : k === 'heading' ? 'Brand heading' : 'Brand subheading', w: Math.round(ed.project.width * 0.8), h: 10, align: 'center', color, lineHeight: 1.2, fontFamily: brand.typography[k].family, fontWeight: brand.typography[k].weight, fontSize: Math.round([88, 52, 30][i] * unit) })}
          className="block w-full truncate rounded-lg border border-line bg-canvas px-3 py-2 text-left capitalize hover:border-cyan"
          style={{ fontFamily: fontCss(brand.typography[k].family), fontWeight: brand.typography[k].weight, fontSize: [18, 15, 12][i] }}
        >
          {k} · {brand.typography[k].family}
        </button>
      ))}
    </div>
  );
}

function UploadsTab() {
  const ed = useEditor();
  const { projects } = useCanva();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // previous uploads = raster images already used in any design
  const library = useMemo(() => {
    const seen = new Set<string>();
    for (const p of projects) for (const pg of p.pages) for (const e of pg.elements) if (e.type === 'image' && e.src && /^data:image\/(png|jpe?g|webp|gif)/.test(e.src)) seen.add(e.src);
    return Array.from(seen);
  }, [projects]);
  const W = ed.project.width;
  const H = ed.project.height;
  const insert = (src: string, w: number, h: number, name = 'Upload') => {
    const s = Math.min(1, (0.6 * W) / w, (0.6 * H) / h);
    ed.addEl({ type: 'image', src, w: Math.round(w * s), h: Math.round(h * s), name });
  };
  return (
    <>
      <label className={`bg-brand-gradient flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white ${busy ? 'opacity-60' : ''}`}>
        <Upload size={16} /> {busy ? 'Uploading…' : 'Upload files'}
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            setBusy(true);
            setError('');
            for (const f of files) {
              if (!f.type.startsWith('image/')) {
                setError(`${f.name} is not an image.`);
                continue;
              }
              try {
                const img = await shrinkImage(await readFileAsDataUrl(f));
                insert(img.src, img.w, img.h, f.name);
              } catch {
                setError(`Could not read ${f.name}.`);
              }
            }
            setBusy(false);
          }}
        />
      </label>
      <p className="mt-2 text-xs text-muted">Images stay in this browser. Large photos are resized to 1600px so they fit in local storage.</p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <H3>Your images</H3>
      {library.length ? (
        <div className="grid grid-cols-2 gap-2">
          {library.map((src, i) => (
            <button key={i} onClick={async () => { const s = await imageSize(src); insert(src, s.w, s.h); }} className="checker overflow-hidden rounded-lg border border-line hover:border-cyan" aria-label="Insert image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No uploads yet.</p>
      )}
    </>
  );
}

export function ObjectDrawer({ tab, setTab }: { tab: DrawerTab | null; setTab: (t: DrawerTab | null) => void }) {
  const current = DRAWER_TABS.find((t) => t.id === tab);
  return (
    <>
      <nav className="flex w-[72px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-toolbar py-2 no-scrollbar" aria-label="Editor tools">
        {DRAWER_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(tab === id ? null : id)} aria-pressed={tab === id} className={`flex w-16 flex-col items-center gap-1 rounded-xl py-2 text-[11px] ${tab === id ? 'bg-hover text-fg' : 'text-muted hover:text-fg'}`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tab === id ? 'bg-brand-gradient text-white' : ''}`}>
              <Icon size={19} />
            </span>
            {label}
          </button>
        ))}
      </nav>
      {current && (
        <aside className="absolute bottom-0 left-[72px] top-0 z-30 flex w-[310px] flex-col border-r border-line bg-drawer shadow-2xl md:relative md:left-0 md:shadow-none">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 className="font-semibold">{current.label}</h2>
            <button onClick={() => setTab(null)} aria-label="Close panel" className="rounded-md p-1 text-muted hover:bg-hover hover:text-fg">
              <ChevronLeft size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
            {tab === 'design' && <DesignTab />}
            {tab === 'elements' && <ElementsTab />}
            {tab === 'text' && <TextTab />}
            {tab === 'brand' && <BrandTab />}
            {tab === 'uploads' && <UploadsTab />}
            {tab === 'animate' && <AnimationPanel />}
            {tab === 'layers' && <LayersPanel />}
          </div>
        </aside>
      )}
    </>
  );
}
