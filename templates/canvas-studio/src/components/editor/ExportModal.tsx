'use client';

import { Check, Copy, FileCode2, FileImage, FileJson } from 'lucide-react';
import { useState } from 'react';
import type { DesignProject } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';
import { exportJSON, exportPNG, exportSVG } from '@/lib/export-engine';
import { Modal } from '@/components/ui/Modal';
import { DesignPreview } from '@/components/design/DesignPreview';

type Format = 'png' | 'svg' | 'json';
const FORMATS: { id: Format; name: string; hint: string; icon: typeof FileImage }[] = [
  { id: 'png', name: 'PNG', hint: 'High quality image', icon: FileImage },
  { id: 'svg', name: 'SVG', hint: 'Scalable vector', icon: FileCode2 },
  { id: 'json', name: 'JSON', hint: 'Editable project file', icon: FileJson },
];

export function ExportModal({ project, open, onClose }: { project: DesignProject; open: boolean; onClose: () => void }) {
  const { settings } = useCanva();
  const [format, setFormat] = useState<Format>('png');
  const [scale, setScale] = useState<1 | 2>(settings.exportScale);
  const [pages, setPages] = useState<number[] | null>(null); // null = all pages
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const chosen = (pages ?? project.pages.map((_, i) => i)).filter((i) => i < project.pages.length);

  const go = async () => {
    setState('busy');
    try {
      if (format === 'png') await exportPNG(project, scale, chosen);
      else if (format === 'svg') exportSVG(project, chosen);
      else exportJSON(project);
      setState('done');
    } catch {
      setState('error');
    }
  };

  const toggle = (i: number) => {
    const next = chosen.includes(i) ? chosen.filter((x) => x !== i) : [...chosen, i].sort((a, b) => a - b);
    setPages(next);
  };

  return (
    <Modal open={open} onClose={onClose} title="Share & download">
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-canvas p-2">
        <span className="min-w-0 flex-1 truncate px-1 font-mono text-xs text-muted">{typeof window !== 'undefined' ? window.location.href : ''}</span>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              setCopied(false);
            }
          }}
          className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs hover:bg-hover"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="mb-4 text-xs text-muted">Designs live in this browser, so the link opens on this device. Download a file to share elsewhere.</p>

      <h3 className="mb-2 text-sm font-semibold">File type</h3>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {FORMATS.map(({ id, name, hint, icon: Icon }) => (
          <button key={id} onClick={() => (setFormat(id), setState('idle'))} className={`rounded-xl border p-3 text-left ${format === id ? 'border-cyan bg-cyan/10' : 'border-line hover:bg-hover'}`}>
            <Icon size={18} className={format === id ? 'text-cyan' : 'text-muted'} />
            <p className="mt-1 text-sm font-semibold">{name}</p>
            <p className="text-[11px] text-muted">{hint}</p>
          </button>
        ))}
      </div>

      {format === 'png' && (
        <>
          <h3 className="mb-2 text-sm font-semibold">Size</h3>
          <div className="mb-4 flex rounded-lg border border-line p-0.5">
            {([1, 2] as const).map((s) => (
              <button key={s} onClick={() => setScale(s)} className={`flex-1 rounded-md py-1.5 text-sm ${scale === s ? 'bg-cyan font-semibold text-[#06272a]' : 'text-muted'}`}>
                {s}× · {project.width * s} × {project.height * s}
              </button>
            ))}
          </div>
        </>
      )}

      {format !== 'json' && (
        <>
          <h3 className="mb-2 text-sm font-semibold">
            Pages <span className="font-normal text-muted">({chosen.length} of {project.pages.length})</span>
          </h3>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {project.pages.map((pg, i) => (
              <button key={pg.id} onClick={() => toggle(i)} aria-pressed={chosen.includes(i)} className={`relative rounded-lg border-2 p-0.5 ${chosen.includes(i) ? 'border-cyan' : 'border-transparent opacity-50'}`}>
                <DesignPreview page={pg} width={project.width} height={project.height} className="rounded" />
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">{i + 1}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <button disabled={state === 'busy' || (format !== 'json' && chosen.length === 0)} onClick={go} className="bg-brand-gradient w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {state === 'busy' ? 'Preparing…' : `Download ${format.toUpperCase()}`}
      </button>
      {state === 'done' && <p className="mt-2 text-center text-xs text-cyan">Download started.</p>}
      {state === 'error' && <p className="mt-2 text-center text-xs text-red-400">Export failed. Try SVG or JSON, or remove very large images.</p>}
    </Modal>
  );
}
