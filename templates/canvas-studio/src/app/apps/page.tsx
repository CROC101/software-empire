'use client';

import { motion } from 'framer-motion';
import { Grid3x3, QrCode, Search, Shapes, Shuffle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { ICON_PACK, iconSvgFromNode } from '@/data/icons';
import { meshSvg, PATTERNS, patternSvg, qrSvg, type PatternKind } from '@/lib/generators';
import { SPRING, svgDataUri } from '@/lib/design';
import { download } from '@/lib/export-engine';
import { InsertIntoDesign } from '@/components/ui/InsertIntoDesign';
import { ProBadge } from '@/components/ui/ProBadge';

const APPS = [
  { id: 'qr', name: 'QR Code Generator', icon: QrCode, blurb: 'Crisp vector QR codes from any link or text.' },
  { id: 'mesh', name: 'Mesh Gradient & Patterns', icon: Grid3x3, blurb: 'Blurred mesh gradients and seamless SVG patterns.' },
  { id: 'icons', name: 'Icon & Vector Pack', icon: Shapes, blurb: `${ICON_PACK.length} clean line icons in any colour.` },
] as const;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm">
    <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
    {children}
  </label>
);
const input = 'w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm';

function QrApp() {
  const [text, setText] = useState('https://example.com');
  const [fg, setFg] = useState('#141518');
  const [bg, setBg] = useState('#FFFFFF');
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const svg = useMemo(() => {
    try {
      return qrSvg(text, fg, bg, level);
    } catch {
      return null; // text too long for a QR code
    }
  }, [text, fg, bg, level]);
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <Field label="URL or text">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={input} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Foreground">
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-canvas" />
          </Field>
          <Field label="Background">
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 w-full rounded-lg border border-line bg-canvas" />
          </Field>
          <Field label="Error correction">
            <select value={level} onChange={(e) => setLevel(e.target.value as typeof level)} className={input}>
              <option value="L">Low</option>
              <option value="M">Medium</option>
              <option value="Q">Quartile</option>
              <option value="H">High</option>
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <InsertIntoDesign label="Insert QR code" build={(W, H) => (svg ? { id: '', type: 'image', name: 'QR code', src: svgDataUri(svg), w: 320, h: 320, x: (W - 320) / 2, y: (H - 320) / 2, rotation: 0, opacity: 1 } : null)} />
          <button disabled={!svg} onClick={() => svg && download(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg')} className="rounded-lg border border-line px-3.5 py-2 text-sm hover:bg-hover disabled:opacity-40">
            Download SVG
          </button>
        </div>
      </div>
      <div className="flex aspect-square items-center justify-center rounded-xl border border-line bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {svg ? <img src={svgDataUri(svg)} alt="QR code preview" className="h-full w-full" /> : <p className="text-sm text-red-500">Text is too long for a QR code.</p>}
      </div>
    </div>
  );
}

function MeshApp() {
  const [mode, setMode] = useState<'mesh' | 'pattern'>('mesh');
  const [colors, setColors] = useState(['#141518', '#00C4CC', '#7D2AE8', '#FF007F']);
  const [seed, setSeed] = useState(7);
  const [blur, setBlur] = useState(120);
  const [kind, setKind] = useState<PatternKind>('dots');
  const [size, setSize] = useState(48);
  const svg = mode === 'mesh' ? meshSvg(colors, seed, blur) : patternSvg(kind, colors[1], colors[0], size);
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="flex w-fit rounded-lg border border-line p-0.5">
          {(['mesh', 'pattern'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1 text-sm capitalize ${mode === m ? 'bg-cyan font-semibold text-[#06272a]' : 'text-muted'}`}>
              {m === 'mesh' ? 'Mesh gradient' : 'Pattern'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {colors.slice(0, mode === 'mesh' ? 4 : 2).map((c, i) => (
            <Field key={i} label={i === 0 ? 'Base' : mode === 'mesh' ? `Blob ${i}` : 'Pattern'}>
              <input type="color" value={c} onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? e.target.value : x)))} className="h-10 w-16 rounded-lg border border-line bg-canvas" />
            </Field>
          ))}
        </div>
        {mode === 'mesh' ? (
          <div className="flex items-end gap-4">
            <Field label={`Softness (${blur})`}>
              <input type="range" min={20} max={220} value={blur} onChange={(e) => setBlur(+e.target.value)} className="w-48" />
            </Field>
            <button onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm hover:bg-hover">
              <Shuffle size={15} /> Shuffle
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Pattern">
              <select value={kind} onChange={(e) => setKind(e.target.value as PatternKind)} className={input}>
                {PATTERNS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label={`Scale (${size}px)`}>
              <input type="range" min={12} max={160} value={size} onChange={(e) => setSize(+e.target.value)} className="w-48" />
            </Field>
          </div>
        )}
        <InsertIntoDesign atBack label="Insert as background" build={(W, H) => ({ id: '', type: 'image', name: mode === 'mesh' ? 'Mesh gradient' : 'Pattern', src: svgDataUri(mode === 'mesh' ? meshSvg(colors, seed, blur, W, H) : patternSvg(kind, colors[1], colors[0], size, W, H)), x: 0, y: 0, w: W, h: H, rotation: 0, opacity: 1 })} />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={svgDataUri(svg)} alt="Generated background preview" className="aspect-square w-full rounded-xl border border-line object-cover" />
    </div>
  );
}

function IconsApp() {
  const [q, setQ] = useState('');
  const [color, setColor] = useState('#00C4CC');
  const [pick, setPick] = useState(ICON_PACK[0].name);
  const ref = useRef<HTMLDivElement>(null);
  const list = ICON_PACK.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const Picked = ICON_PACK.find((i) => i.name === pick)?.Icon ?? ICON_PACK[0].Icon;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div>
        <label className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${ICON_PACK.length} icons`} className="w-full bg-transparent outline-none" />
        </label>
        <div className="grid max-h-80 grid-cols-6 gap-1.5 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-8 lg:grid-cols-10">
          {list.map(({ name, Icon }) => (
            <button key={name} onClick={() => setPick(name)} title={name} aria-label={name} className={`flex aspect-square items-center justify-center rounded-lg border ${pick === name ? 'border-cyan bg-cyan/10 text-cyan' : 'border-line text-muted hover:text-fg'}`}>
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div ref={ref} className="flex aspect-square items-center justify-center rounded-xl border border-line bg-canvas">
          <Picked size={140} color={color} strokeWidth={1.75} />
        </div>
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Icon colour" className="h-10 w-14 rounded-lg border border-line bg-canvas" />
          <span className="text-sm font-semibold">{pick}</span>
        </div>
        <InsertIntoDesign
          label="Insert icon"
          build={(W, H) => {
            const node = ref.current?.querySelector('svg');
            return node ? { id: '', type: 'image', name: `${pick} icon`, src: iconSvgFromNode(node, color), w: 240, h: 240, x: (W - 240) / 2, y: (H - 240) / 2, rotation: 0, opacity: 1 } : null;
          }}
        />
      </div>
    </div>
  );
}

export default function AppsPage() {
  const [active, setActive] = useState<(typeof APPS)[number]['id']>('qr');
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Apps</h1>
          <p className="text-sm text-muted">Generators that drop finished assets straight into any design.</p>
        </div>
        <ProBadge />
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {APPS.map(({ id, name, icon: Icon, blurb }) => (
          <motion.button key={id} whileHover={{ y: -4 }} transition={SPRING} onClick={() => setActive(id)} className={`rounded-xl border bg-card p-4 text-left ${active === id ? 'border-cyan ring-2 ring-cyan/30' : 'border-line'}`}>
            <span className="bg-brand-gradient mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-white">
              <Icon size={20} />
            </span>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted">{blurb}</p>
          </motion.button>
        ))}
      </div>
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">{APPS.find((a) => a.id === active)?.name}</h2>
        {active === 'qr' ? <QrApp /> : active === 'mesh' ? <MeshApp /> : <IconsApp />}
      </section>
    </div>
  );
}
