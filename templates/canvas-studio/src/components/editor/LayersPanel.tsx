'use client';

import { Reorder } from 'framer-motion';
import { Eye, EyeOff, GripVertical, Image as ImageIcon, Lock, LockOpen, Shapes, Trash2, Type } from 'lucide-react';
import type { CanvasElement } from '@/types/canva';
import { useEditor } from './editor-context';

const label = (el: CanvasElement) => el.name ?? (el.type === 'text' ? (el.text ?? '').slice(0, 28) || 'Text' : el.type === 'shape' ? `${el.shape ?? 'rect'} shape` : 'Image');

export function LayersPanel() {
  const ed = useEditor();
  const { page } = ed;
  // top of the stack first, like every layers panel
  const ordered = [...page.elements].reverse();
  if (!ordered.length) return <p className="text-sm text-muted">This page is empty. Add elements, text or uploads and they will show up here.</p>;
  return (
    <Reorder.Group
      axis="y"
      values={ordered}
      onReorder={(next: CanvasElement[]) => ed.updatePage((pg) => ({ ...pg, elements: [...next].reverse() }), false)}
      className="space-y-1.5"
    >
      {ordered.map((el) => {
        const Icon = el.type === 'text' ? Type : el.type === 'image' ? ImageIcon : Shapes;
        const active = ed.selId === el.id;
        return (
          <Reorder.Item
            key={el.id}
            value={el}
            onDragStart={ed.checkpoint}
            onClick={() => ed.select(el.id)}
            className={`group flex cursor-grab items-center gap-2 rounded-lg border px-2 py-2 text-sm active:cursor-grabbing ${active ? 'border-cyan bg-cyan/10' : 'border-line bg-canvas hover:bg-hover'} ${el.hidden ? 'opacity-50' : ''}`}
          >
            <GripVertical size={14} className="shrink-0 text-muted" />
            <Icon size={15} className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate">{label(el)}</span>
            <button onClick={(e) => (e.stopPropagation(), ed.updateEl(el.id, { hidden: !el.hidden }))} aria-label={el.hidden ? 'Show' : 'Hide'} className="rounded p-1 text-muted hover:text-fg">
              {el.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button onClick={(e) => (e.stopPropagation(), ed.updateEl(el.id, { locked: !el.locked }))} aria-label={el.locked ? 'Unlock' : 'Lock'} className="rounded p-1 text-muted hover:text-fg">
              {el.locked ? <Lock size={14} /> : <LockOpen size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                ed.updatePage((pg) => ({ ...pg, elements: pg.elements.filter((x) => x.id !== el.id) }));
                if (active) ed.select(null);
              }}
              aria-label="Delete layer"
              className="rounded p-1 text-muted hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}
