'use client';

import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Blend, Bold, CaseUpper, Copy, FlipHorizontal2, FlipVertical2,
  Italic, Layers, Lock, LockOpen, Minus, Plus, Sparkles, Strikethrough, Trash2, Underline, WandSparkles,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { CanvasElement, Paint } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';
import { BACKDROPS } from '@/data/assets';
import { FONT_FAMILIES, firstColor, fitText, fontCss, paintToCss } from '@/lib/design';
import { useEditor } from './editor-context';

const BASICS = ['#FFFFFF', '#000000', '#141518', '#9AA0AE', '#FF007F', '#FF6B6B', '#FFC21A', '#7EE787', '#00C4CC', '#3B82F6', '#7D2AE8', '#C8A97E'];

/** A toolbar button that opens a small panel below it. */
export function Pop({ label, trigger, children, wide }: { label: string; trigger: ReactNode; children: ReactNode; wide?: boolean }) {
  // fixed position so the scrolling toolbar can't clip the panel
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const width = wide ? 288 : 240;
  return (
    <div className="shrink-0">
      <button
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setAt(at ? null : { left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), top: r.bottom + 8 });
        }}
        title={label}
        aria-label={label}
        aria-expanded={!!at}
        className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-sm hover:bg-hover ${at ? 'bg-hover' : ''}`}
      >
        {trigger}
      </button>
      {at && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAt(null)} />
          <div className="fixed z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-toolbar p-3 shadow-2xl scrollbar-thin" style={{ ...at, width }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function Swatch({ paint, active, onClick }: { paint: Paint; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} aria-label={typeof paint === 'string' ? paint : 'Gradient'} className={`h-7 w-7 rounded-md border ${active ? 'border-cyan ring-2 ring-cyan/40' : 'border-line'}`} style={{ background: paintToCss(paint) }} />;
}

export function ColorPicker({ value, onChange, label, gradients }: { value: Paint | undefined; onChange: (p: Paint) => void; label: string; gradients?: boolean }) {
  const { brand } = useCanva();
  const active = brand.palettes.find((p) => p.id === brand.activePaletteId) ?? brand.palettes[0];
  const hex = firstColor(value);
  const same = (p: Paint) => JSON.stringify(p) === JSON.stringify(value);
  return (
    <Pop label={label} wide trigger={<span className="h-5 w-5 rounded-md border border-line" style={{ background: paintToCss(value) }} />}>
      <p className="mb-1.5 text-xs font-semibold text-muted">Brand · {active?.name}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {active?.colors.map((c) => <Swatch key={c} paint={c} active={same(c)} onClick={() => onChange(c)} />)}
      </div>
      {brand.palettes
        .filter((p) => p.id !== active?.id)
        .map((p) => (
          <div key={p.id} className="mb-2 flex flex-wrap gap-1" title={p.name}>
            {p.colors.map((c) => (
              <button key={c} onClick={() => onChange(c)} aria-label={c} className="h-4 w-4 rounded-sm border border-line" style={{ background: c }} />
            ))}
          </div>
        ))}
      <p className="mb-1.5 mt-3 text-xs font-semibold text-muted">Default colours</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {BASICS.map((c) => <Swatch key={c} paint={c} active={same(c)} onClick={() => onChange(c)} />)}
      </div>
      {gradients && (
        <>
          <p className="mb-1.5 text-xs font-semibold text-muted">Gradients</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {BACKDROPS.filter((b) => typeof b.paint !== 'string').map((b) => <Swatch key={b.id} paint={b.paint} active={same(b.paint)} onClick={() => onChange(b.paint)} />)}
            <Swatch paint={{ kind: 'linear', stops: ['#00C4CC', '#7D2AE8'], angle: 135 }} onClick={() => onChange({ kind: 'linear', stops: ['#00C4CC', '#7D2AE8'], angle: 135 })} />
          </div>
        </>
      )}
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-8 w-10 rounded border border-line bg-canvas" />
        Custom colour <span className="ml-auto font-mono">{hex}</span>
      </label>
    </Pop>
  );
}

const Btn = ({ on, label, onClick, children }: { on?: boolean; label: string; onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} title={label} aria-label={label} aria-pressed={on} className={`flex h-8 min-w-8 shrink-0 items-center whitespace-nowrap justify-center rounded-md px-1.5 text-sm hover:bg-hover ${on ? 'bg-cyan/15 text-cyan' : ''}`}>
    {children}
  </button>
);
const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-line" />;

function Slider({ label, value, min, max, step = 1, onChange, onStart }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onStart: () => void }) {
  return (
    <label className="mb-2 block text-xs text-muted">
      <span className="flex justify-between">
        {label} <span className="font-mono text-fg">{Math.round(value * 100) / 100}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onPointerDown={onStart} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[#00C4CC]" />
    </label>
  );
}

export function ContextualToolbar({ openTab }: { openTab: (tab: 'animate') => void }) {
  const ed = useEditor();
  const { sel, page, project } = ed;
  // slider drags: one undo step per drag, then live updates without history
  const live = (patch: Partial<CanvasElement>) => sel && ed.updateEl(sel.id, (e) => fitText({ ...e, ...patch }), false);
  const set = (patch: Partial<CanvasElement>) => sel && ed.updateEl(sel.id, (e) => fitText({ ...e, ...patch }));

  if (!sel)
    return (
      <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-line bg-toolbar px-3 no-scrollbar">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Page {ed.pageIndex + 1}</span>
        <Sep />
        <ColorPicker label="Background colour" gradients value={page.background} onChange={(background) => ed.updatePage((pg) => ({ ...pg, background }))} />
        <span className="text-sm text-muted">Background</span>
        <Sep />
        <Btn label="Animate page" onClick={() => openTab('animate')}>
          <WandSparkles size={16} /> <span className="ml-1.5">Animate</span>
        </Btn>
        <span className="ml-auto whitespace-nowrap font-mono text-xs text-muted">
          {project.width} × {project.height} px
        </span>
      </div>
    );

  const bold = (sel.fontWeight ?? 400) >= 700;
  const AlignIcon = sel.align === 'center' ? AlignCenter : sel.align === 'right' ? AlignRight : AlignLeft;
  const nextAlign = sel.align === 'left' || !sel.align ? 'center' : sel.align === 'center' ? 'right' : 'left';

  return (
    <div className="flex h-12 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-line bg-toolbar px-3 no-scrollbar">
      {sel.type === 'text' && (
        <>
          <select value={sel.fontFamily ?? 'Inter'} onChange={(e) => set({ fontFamily: e.target.value as CanvasElement['fontFamily'] })} aria-label="Font" className="h-8 w-40 rounded-md border border-line bg-canvas px-2 text-sm" style={{ fontFamily: fontCss(sel.fontFamily) }}>
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f} style={{ fontFamily: fontCss(f) }}>
                {f}
              </option>
            ))}
          </select>
          <div className="ml-1 flex h-8 items-center rounded-md border border-line">
            <button aria-label="Smaller" onClick={() => set({ fontSize: Math.max(4, Math.round((sel.fontSize ?? 32) - 2)) })} className="px-1.5 hover:text-cyan">
              <Minus size={14} />
            </button>
            <input
              aria-label="Font size"
              value={Math.round(sel.fontSize ?? 32)}
              onChange={(e) => +e.target.value > 0 && set({ fontSize: Math.min(800, +e.target.value) })}
              className="w-10 bg-transparent text-center text-sm outline-none"
            />
            <button aria-label="Bigger" onClick={() => set({ fontSize: Math.round((sel.fontSize ?? 32) + 2) })} className="px-1.5 hover:text-cyan">
              <Plus size={14} />
            </button>
          </div>
          <ColorPicker label="Text colour" value={sel.color} onChange={(p) => set({ color: typeof p === 'string' ? p : p.stops[0] })} />
          <Sep />
          <Btn on={bold} label="Bold" onClick={() => set({ fontWeight: bold ? 400 : 700 })}>
            <Bold size={16} />
          </Btn>
          <Btn on={sel.italic} label="Italic" onClick={() => set({ italic: !sel.italic })}>
            <Italic size={16} />
          </Btn>
          <Btn on={sel.underline} label="Underline" onClick={() => set({ underline: !sel.underline })}>
            <Underline size={16} />
          </Btn>
          <Btn on={sel.strike} label="Strikethrough" onClick={() => set({ strike: !sel.strike })}>
            <Strikethrough size={16} />
          </Btn>
          <Btn label={`Align ${nextAlign}`} onClick={() => set({ align: nextAlign })}>
            <AlignIcon size={16} />
          </Btn>
          <Btn on={sel.uppercase} label="Uppercase" onClick={() => set({ uppercase: !sel.uppercase })}>
            <CaseUpper size={16} />
          </Btn>
          <Pop label="Spacing" trigger={<span className="text-xs font-semibold">Spacing</span>}>
            <Slider label="Letter spacing" value={sel.letterSpacing ?? 0} min={-10} max={40} onStart={ed.checkpoint} onChange={(v) => live({ letterSpacing: v })} />
            <Slider label="Line height" value={sel.lineHeight ?? 1.2} min={0.7} max={2.5} step={0.05} onStart={ed.checkpoint} onChange={(v) => live({ lineHeight: v })} />
          </Pop>
          <Pop label="Effects" trigger={<><Sparkles size={15} /><span className="text-xs font-semibold">Effects</span></>}>
            <div className="grid grid-cols-2 gap-2">
              {([['Shadow', 'shadow'], ['Neon glow', 'glow']] as const).map(([name, key]) => (
                <button key={key} onClick={() => set({ [key]: !sel[key] })} className={`rounded-lg border px-2 py-3 text-sm ${sel[key] ? 'border-cyan text-cyan' : 'border-line hover:bg-hover'}`}>
                  {name}
                </button>
              ))}
            </div>
          </Pop>
        </>
      )}

      {sel.type === 'shape' && (
        <>
          <ColorPicker label="Fill colour" gradients value={sel.fill} onChange={(fill) => set({ fill })} />
          <Pop label="Border" trigger={<span className="h-4 w-4 rounded-sm border-2" style={{ borderColor: sel.strokeWidth ? sel.stroke : 'currentColor' }} />}>
            <Slider label="Border weight" value={sel.strokeWidth ?? 0} min={0} max={40} onStart={ed.checkpoint} onChange={(v) => live({ strokeWidth: v, stroke: sel.stroke ?? '#FFFFFF' })} />
            <div className="flex flex-wrap gap-1.5">
              {BASICS.map((c) => <Swatch key={c} paint={c} active={sel.stroke === c} onClick={() => set({ stroke: c, strokeWidth: sel.strokeWidth || 4 })} />)}
            </div>
          </Pop>
          {(sel.shape === 'rect' || sel.shape === 'roundedRect' || !sel.shape) && (
            <Pop label="Corner rounding" trigger={<span className="text-xs font-semibold">Corners</span>}>
              <Slider label="Radius" value={sel.radius ?? 0} min={0} max={Math.round(Math.min(sel.w, sel.h) / 2)} onStart={ed.checkpoint} onChange={(v) => live({ radius: v, shape: 'roundedRect' })} />
            </Pop>
          )}
          <Btn on={sel.shadow} label="Drop shadow" onClick={() => set({ shadow: !sel.shadow })}>
            <Sparkles size={16} />
          </Btn>
        </>
      )}

      {sel.type === 'image' && (
        <>
          <Pop label="Corner rounding" trigger={<span className="text-xs font-semibold">Corners</span>}>
            <Slider label="Radius" value={sel.radius ?? 0} min={0} max={Math.round(Math.min(sel.w, sel.h) / 2)} onStart={ed.checkpoint} onChange={(v) => live({ radius: v })} />
          </Pop>
          <Pop label="Border" trigger={<span className="text-xs font-semibold">Border</span>}>
            <Slider label="Border weight" value={sel.strokeWidth ?? 0} min={0} max={40} onStart={ed.checkpoint} onChange={(v) => live({ strokeWidth: v })} />
            <div className="flex flex-wrap gap-1.5">
              {BASICS.map((c) => <Swatch key={c} paint={c} active={sel.stroke === c} onClick={() => set({ stroke: c, strokeWidth: sel.strokeWidth || 6 })} />)}
            </div>
          </Pop>
          <Btn on={sel.shadow} label="Drop shadow" onClick={() => set({ shadow: !sel.shadow })}>
            <Sparkles size={16} />
          </Btn>
        </>
      )}

      {sel.type !== 'text' && (
        <>
          <Btn on={sel.flipH} label="Flip horizontal" onClick={() => set({ flipH: !sel.flipH })}>
            <FlipHorizontal2 size={16} />
          </Btn>
          <Btn on={sel.flipV} label="Flip vertical" onClick={() => set({ flipV: !sel.flipV })}>
            <FlipVertical2 size={16} />
          </Btn>
        </>
      )}

      <Sep />
      <Btn label="Animate" onClick={() => openTab('animate')}>
        <WandSparkles size={16} /> <span className="ml-1.5 text-xs font-semibold">Animate</span>
      </Btn>
      <Pop label="Position" trigger={<><Layers size={15} /><span className="text-xs font-semibold">Position</span></>}>
        <div className="grid grid-cols-2 gap-1.5 text-sm">
          {([['forward', 'Forward', ArrowUp], ['backward', 'Backward', ArrowDown], ['front', 'To front', ArrowUpToLine], ['back', 'To back', ArrowDownToLine]] as const).map(([dir, name, Icon]) => (
            <button key={dir} onClick={() => ed.arrange(dir)} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1.5 hover:bg-hover">
              <Icon size={14} /> {name}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs">
          {([['Left', { x: 0 }], ['Centre', { x: (project.width - sel.w) / 2 }], ['Right', { x: project.width - sel.w }], ['Top', { y: 0 }], ['Middle', { y: (project.height - sel.h) / 2 }], ['Bottom', { y: project.height - sel.h }]] as const).map(([name, patch]) => (
            <button key={name} onClick={() => set(patch)} className="rounded-md border border-line px-1 py-1.5 hover:bg-hover">
              {name}
            </button>
          ))}
        </div>
      </Pop>
      <Pop label="Transparency" trigger={<Blend size={16} />}>
        <Slider label="Opacity" value={Math.round(sel.opacity * 100)} min={0} max={100} onStart={ed.checkpoint} onChange={(v) => live({ opacity: v / 100 })} />
      </Pop>
      <Btn on={sel.locked} label={sel.locked ? 'Unlock' : 'Lock'} onClick={() => set({ locked: !sel.locked })}>
        {sel.locked ? <Lock size={16} /> : <LockOpen size={16} />}
      </Btn>
      <Btn label="Duplicate" onClick={ed.duplicateSel}>
        <Copy size={16} />
      </Btn>
      <Btn label="Delete" onClick={ed.removeSel}>
        <Trash2 size={16} />
      </Btn>
    </div>
  );
}
