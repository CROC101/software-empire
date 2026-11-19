'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, ExternalLink, FolderInput, MoreHorizontal, Play, RotateCcw, Star, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DesignProject } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';
import { DesignPreview } from '@/components/design/DesignPreview';
import { useDesignActions } from '@/hooks/useDesignActions';
import { SPRING } from '@/lib/design';

export function timeAgo(t: number) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

interface Props {
  project: DesignProject;
  view?: 'grid' | 'list';
  selected?: boolean;
  onSelect?: (v: boolean) => void;
  onMove: (id: string) => void;
}

export function ProjectCard({ project: p, view = 'grid', selected, onSelect, onMove }: Props) {
  const canva = useCanva();
  const { duplicateAndOpen } = useDesignActions();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const folder = canva.folders.find((f) => f.id === p.folderId);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menu]);

  const item = 'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-hover';
  const actions = p.trashed ? (
    <>
      <button className={item} onClick={() => canva.setTrashed([p.id], false)}>
        <RotateCcw size={15} /> Restore
      </button>
      <button className={`${item} text-red-400`} onClick={() => confirm(`Delete “${p.title}” forever?`) && canva.deleteForever([p.id])}>
        <X size={15} /> Delete forever
      </button>
    </>
  ) : (
    <>
      <Link className={item} href={`/design/${p.id}/`}>
        <ExternalLink size={15} /> Open
      </Link>
      <Link className={item} href={`/present/${p.id}/`}>
        <Play size={15} /> Present
      </Link>
      <button className={item} onClick={() => duplicateAndOpen(p.id)}>
        <Copy size={15} /> Duplicate
      </button>
      <button className={item} onClick={() => (setMenu(false), onMove(p.id))}>
        <FolderInput size={15} /> Move to Folder
      </button>
      <button className={`${item} text-red-400`} onClick={() => canva.setTrashed([p.id], true)}>
        <Trash2 size={15} /> Move to Trash
      </button>
    </>
  );

  const menuEl = (
    <div ref={ref} className="relative">
      <button onClick={() => setMenu((m) => !m)} aria-label={`Actions for ${p.title}`} className="rounded-md p-1.5 text-muted hover:bg-hover hover:text-fg">
        <MoreHorizontal size={18} />
      </button>
      <AnimatePresence>
        {menu && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={SPRING} className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-line bg-toolbar p-1.5 shadow-2xl">
            {actions}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const star = !p.trashed && (
    <button onClick={() => canva.setStarred([p.id], !p.starred)} aria-label={p.starred ? 'Unstar' : 'Star'} className={`rounded-md p-1.5 hover:bg-hover ${p.starred ? 'text-gold' : 'text-muted'}`}>
      <Star size={16} fill={p.starred ? 'currentColor' : 'none'} />
    </button>
  );

  const check = onSelect && (
    <input type="checkbox" checked={!!selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`Select ${p.title}`} className="h-4 w-4 accent-cyan" />
  );

  const thumb = (
    <Link href={p.trashed ? '#' : `/design/${p.id}/`} onClick={(e) => p.trashed && e.preventDefault()} className="block">
      <div className="mx-auto overflow-hidden rounded-md shadow" style={{ maxWidth: p.width >= p.height ? '100%' : `${(p.width / p.height) * 100}%` }}>
        <DesignPreview page={p.pages[0]} width={p.width} height={p.height} />
      </div>
    </Link>
  );

  if (view === 'list')
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2">
        {check}
        <div className="w-20 shrink-0 bg-canvas p-1">{thumb}</div>
        <div className="min-w-0 flex-1">
          <Link href={`/design/${p.id}/`} className="line-clamp-1 text-sm font-semibold hover:underline">
            {p.title}
          </Link>
          <p className="text-xs text-muted" suppressHydrationWarning>
            {p.width}×{p.height} · {p.pages.length} page{p.pages.length > 1 ? 's' : ''} · Edited {timeAgo(p.updatedAt)}
            {folder && ` · ${folder.name}`}
          </p>
        </div>
        {star}
        {menuEl}
      </div>
    );

  return (
    <motion.div whileHover={{ y: -4 }} transition={SPRING} className={`group rounded-xl border bg-card ${selected ? 'border-cyan ring-2 ring-cyan/40' : 'border-line'}`}>
      <div className="relative rounded-t-xl bg-canvas p-3">
        {thumb}
        {check && <div className="absolute left-2 top-2">{check}</div>}
      </div>
      <div className="flex items-start gap-1 p-3">
        <div className="min-w-0 flex-1">
          <Link href={`/design/${p.id}/`} className="line-clamp-1 text-sm font-semibold hover:underline">
            {p.title}
          </Link>
          <p className="text-xs text-muted" suppressHydrationWarning>
            {p.width}×{p.height} · {timeAgo(p.updatedAt)}
            {folder && ` · ${folder.name}`}
          </p>
        </div>
        {star}
        {menuEl}
      </div>
    </motion.div>
  );
}
