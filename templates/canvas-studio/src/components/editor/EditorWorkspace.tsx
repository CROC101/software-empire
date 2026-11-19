'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Reorder } from 'framer-motion';
import {
  ChevronDown, CloudCheck, Copy, FilePlus2, FileJson, FolderOpen, Grid3x3, Loader2, Magnet, Maximize2, Minus, Play, Plus, Presentation, Redo2,
  Share2, Trash2, TriangleAlert, Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CanvasElement, DesignPage, DesignProject } from '@/types/canva';
import { useCanva } from '@/context/CanvaContext';
import { useDesignActions } from '@/hooks/useDesignActions';
import { blankPage, clonePage, fitText, uid } from '@/lib/design';
import { exportJSON } from '@/lib/export-engine';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { ProBadge } from '@/components/ui/ProBadge';
import { DesignPreview } from '@/components/design/DesignPreview';
import { ArtboardStage } from './ArtboardStage';
import { ContextualToolbar } from './ContextualToolbar';
import { ExportModal } from './ExportModal';
import { MagicResizePopover } from './MagicResizePopover';
import { ObjectDrawer, type DrawerTab } from './ObjectDrawer';
import { EditorCtx, clampZoom, type Arrange, type EditorApi, type NewElement } from './editor-context';

export function EditorWorkspace({ id }: { id: string }) {
  const canva = useCanva();
  const project = canva.projects.find((p) => p.id === id);
  if (!canva.hydrated)
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas text-muted">
        <Loader2 className="mr-2 animate-spin" size={18} /> Opening your design…
      </div>
    );
  if (!project || project.trashed)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-canvas p-6 text-center text-fg">
        <BrandLogo />
        <h1 className="text-xl font-semibold">{project?.trashed ? 'This design is in the trash' : 'Design not found'}</h1>
        <p className="max-w-sm text-sm text-muted">{project?.trashed ? 'Restore it from the Trash to keep editing.' : 'It may have been deleted, or it was created in another browser.'}</p>
        <div className="flex gap-2">
          <Link href={project?.trashed ? '/trash/' : '/'} className="bg-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white">
            {project?.trashed ? 'Go to Trash' : 'Back to home'}
          </Link>
          <Link href="/templates/" className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-hover">
            Browse templates
          </Link>
        </div>
      </div>
    );
  return <Editor key={id} project={project} />;
}

function Editor({ project }: { project: DesignProject }) {
  const canva = useCanva();
  const router = useRouter();
  const actions = useDesignActions();
  const id = project.id;
  const W = project.width;
  const H = project.height;
  const [pageIndex, setPageIndex] = useState(0);
  const pi = Math.min(pageIndex, project.pages.length - 1);
  const page = project.pages[pi];
  const [selId, setSelId] = useState<string | null>(null);
  const sel = page.elements.find((e) => e.id === selId) ?? null;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoom, setZoomRaw] = useState(0.5);
  const setZoom = (z: number) => setZoomRaw(clampZoom(z));
  const fitRef = useRef<(() => void) | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [tab, setTab] = useState<DrawerTab | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 768) setTab('design');
  }, []);

  // stop animation preview after the entrances have played (loops would otherwise run forever)
  useEffect(() => {
    if (!previewing) return;
    const t = setTimeout(() => setPreviewing(false), 4500);
    return () => clearTimeout(t);
  }, [previewing, playKey]);

  const update: EditorApi['update'] = (fn, history = true) => canva.updateProject(id, fn, { history });
  const updatePage: EditorApi['updatePage'] = (fn, history = true) => update((p) => ({ ...p, pages: p.pages.map((pg, i) => (i === pi ? fn(pg) : pg)) }), history);
  const updateEl: EditorApi['updateEl'] = (elId, patch, history = true) =>
    updatePage((pg) => ({ ...pg, elements: pg.elements.map((e) => (e.id === elId ? (typeof patch === 'function' ? patch(e) : { ...e, ...patch }) : e)) }), history);

  const addEl = (el: NewElement) => {
    let full: CanvasElement = { rotation: 0, opacity: 1, ...el, id: uid(), x: el.x ?? (W - el.w) / 2, y: el.y ?? (H - el.h) / 2 };
    if (full.type === 'text') {
      full = fitText(full);
      if (el.y === undefined) full.y = (H - full.h) / 2;
    }
    updatePage((pg) => ({ ...pg, elements: [...pg.elements, full] }));
    setSelId(full.id);
  };
  const removeSel = () => {
    if (!sel) return;
    updatePage((pg) => ({ ...pg, elements: pg.elements.filter((e) => e.id !== sel.id) }));
    setSelId(null);
  };
  const duplicateSel = () => {
    if (!sel) return;
    const copy = { ...structuredClone(sel), id: uid(), x: sel.x + 24, y: sel.y + 24, locked: false };
    updatePage((pg) => {
      const i = pg.elements.findIndex((e) => e.id === sel.id);
      const els = [...pg.elements];
      els.splice(i + 1, 0, copy);
      return { ...pg, elements: els };
    });
    setSelId(copy.id);
  };
  const arrange = (dir: Arrange) =>
    sel &&
    updatePage((pg) => {
      const els = [...pg.elements];
      const i = els.findIndex((e) => e.id === sel.id);
      const [e] = els.splice(i, 1);
      const j = dir === 'front' ? els.length : dir === 'back' ? 0 : dir === 'forward' ? Math.min(els.length, i + 1) : Math.max(0, i - 1);
      els.splice(j, 0, e);
      return { ...pg, elements: els };
    });
  const goPage = (i: number) => {
    setPageIndex(i);
    setSelId(null);
    setEditingId(null);
  };
  const play = () => {
    setPlayKey((k) => k + 1);
    setPreviewing(true);
  };

  const api: EditorApi = {
    project, page, pageIndex: pi, setPageIndex: goPage, selId, sel, select: setSelId, editingId, setEditingId, zoom, setZoom,
    fit: () => fitRef.current?.(), playKey, previewing, play, checkpoint: () => canva.checkpoint(id),
    update, updatePage, updateEl, addEl, removeSel, duplicateSel, arrange,
  };

  // keyboard shortcuts (re-bound each render so they always see the current selection)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'z') (e.preventDefault(), e.shiftKey ? canva.redo(id) : canva.undo(id));
      else if (mod && k === 'y') (e.preventDefault(), canva.redo(id));
      else if (mod && k === 'd') (e.preventDefault(), duplicateSel());
      else if (mod && (k === '=' || k === '+')) (e.preventDefault(), setZoom(zoom * 1.1));
      else if (mod && k === '-') (e.preventDefault(), setZoom(zoom / 1.1));
      else if (mod && k === '0') (e.preventDefault(), fitRef.current?.());
      else if ((k === 'delete' || k === 'backspace') && sel) (e.preventDefault(), removeSel());
      else if (k === 'escape') (setSelId(null), setEditingId(null));
      else if (sel && !sel.locked && k.startsWith('arrow')) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        updateEl(sel.id, { x: sel.x + (k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0), y: sel.y + (k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0) });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const SaveIcon = canva.saveState === 'saving' ? Loader2 : canva.saveState === 'error' ? TriangleAlert : CloudCheck;
  const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-lg hover:bg-hover disabled:opacity-30';
  const menuItem = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-hover';
  const thumbW = Math.round(Math.min(120, Math.max(36, (56 * W) / H)));

  const pagesOp = (fn: (pages: DesignPage[]) => DesignPage[], nextIndex: number) => {
    update((p) => ({ ...p, pages: fn(p.pages) }));
    goPage(nextIndex);
  };

  return (
    <EditorCtx.Provider value={api}>
      <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-fg">
        {/* top bar */}
        <header className="flex h-[52px] shrink-0 items-center gap-1 border-b border-line bg-toolbar px-2">
          <BrandLogo compact href="/" />
          <div className="relative">
            <button onClick={() => setFileOpen((o) => !o)} aria-expanded={fileOpen} className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium hover:bg-hover">
              File <ChevronDown size={14} />
            </button>
            {fileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setFileOpen(false)} />
                <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-toolbar p-1.5 shadow-2xl" onClick={() => setFileOpen(false)}>
                  <button className={menuItem} onClick={() => actions.createAndOpen({ width: W, height: H })}>
                    <FilePlus2 size={16} /> New design ({W}×{H})
                  </button>
                  <button className={menuItem} onClick={() => actions.duplicateAndOpen(id)}>
                    <Copy size={16} /> Make a copy
                  </button>
                  <button className={menuItem} onClick={() => exportJSON(project)}>
                    <FileJson size={16} /> Download project (JSON)
                  </button>
                  <Link className={menuItem} href="/projects/">
                    <FolderOpen size={16} /> All projects
                  </Link>
                  <div className="my-1 h-px bg-line" />
                  <button className={menuItem} onClick={() => canva.setSettings({ grid: !canva.settings.grid })}>
                    <Grid3x3 size={16} /> {canva.settings.grid ? 'Hide grid' : 'Show grid'}
                  </button>
                  <button className={menuItem} onClick={() => canva.setSettings({ snap: !canva.settings.snap })}>
                    <Magnet size={16} /> {canva.settings.snap ? 'Turn off smart guides' : 'Turn on smart guides'}
                  </button>
                  <div className="my-1 h-px bg-line" />
                  <button
                    className={`${menuItem} text-red-400`}
                    onClick={() => {
                      canva.setTrashed([id], true);
                      router.push('/projects/');
                    }}
                  >
                    <Trash2 size={16} /> Move to trash
                  </button>
                </div>
              </>
            )}
          </div>
          <MagicResizePopover />
          <span className="mx-1 h-5 w-px bg-line" />
          <button className={iconBtn} disabled={!canva.canUndo(id)} onClick={() => canva.undo(id)} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 size={17} />
          </button>
          <button className={iconBtn} disabled={!canva.canRedo(id)} onClick={() => canva.redo(id)} aria-label="Redo" title="Redo (Ctrl+Y)">
            <Redo2 size={17} />
          </button>
          <span className={`ml-1 hidden items-center gap-1.5 text-xs sm:flex ${canva.saveState === 'error' ? 'text-red-400' : 'text-muted'}`} title={canva.saveState === 'error' ? 'Browser storage is full: remove large images or download a copy.' : undefined}>
            <SaveIcon size={15} className={canva.saveState === 'saving' ? 'animate-spin' : ''} />
            {canva.saveState === 'saving' ? 'Saving…' : canva.saveState === 'error' ? 'Not saved' : 'Saved'}
          </span>

          <input
            value={project.title}
            onChange={(e) => update((p) => ({ ...p, title: e.target.value }), false)}
            onBlur={(e) => !e.target.value.trim() && update((p) => ({ ...p, title: 'Untitled design' }), false)}
            aria-label="Design title"
            maxLength={80}
            className="mx-auto w-full min-w-0 max-w-xs truncate rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-center text-sm font-medium hover:border-line focus:border-cyan focus:outline-none"
          />

          <span className="hidden md:block">
            <ProBadge small />
          </span>
          <Link href={`/present/${id}/?p=${pi}`} className="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-hover">
            <Presentation size={16} /> <span className="hidden sm:inline">Present</span>
          </Link>
          <button onClick={() => setExportOpen(true)} className="bg-brand-gradient flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white hover:brightness-110">
            <Share2 size={16} /> <span className="hidden sm:inline">Share</span>
          </button>
        </header>

        <div className="relative flex min-h-0 flex-1">
          <ObjectDrawer tab={tab} setTab={setTab} />
          <main className="flex min-w-0 flex-1 flex-col">
            <ContextualToolbar openTab={setTab} />
            <ArtboardStage fitRef={fitRef} />

            {/* page filmstrip + zoom */}
            <footer className="flex h-[92px] shrink-0 items-center gap-2 border-t border-line bg-toolbar px-3">
              <button onClick={play} title="Play animations" aria-label="Play animations" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hover hover:text-cyan">
                <Play size={16} />
              </button>
              <Reorder.Group
                axis="x"
                values={project.pages}
                onReorder={(pages: DesignPage[]) => {
                  const cur = page.id;
                  update((p) => ({ ...p, pages }), false);
                  setPageIndex(Math.max(0, pages.findIndex((p) => p.id === cur)));
                }}
                className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 scrollbar-thin"
              >
                {project.pages.map((pg, i) => (
                  <Reorder.Item key={pg.id} value={pg} onDragStart={() => canva.checkpoint(id)} className="group relative shrink-0 cursor-grab active:cursor-grabbing">
                    <button onClick={() => goPage(i)} aria-label={`Page ${i + 1}`} className={`block overflow-hidden rounded-md border-2 ${i === pi ? 'border-cyan' : 'border-transparent hover:border-line'}`} style={{ width: thumbW }}>
                      <DesignPreview page={pg} width={W} height={H} />
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">{i + 1}</span>
                    <span className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
                      <button onClick={() => pagesOp((ps) => [...ps.slice(0, i + 1), clonePage(pg), ...ps.slice(i + 1)], i + 1)} aria-label={`Duplicate page ${i + 1}`} title="Duplicate page" className="rounded bg-toolbar p-0.5 shadow ring-1 ring-line hover:text-cyan">
                        <Copy size={12} />
                      </button>
                      {project.pages.length > 1 && (
                        <button onClick={() => pagesOp((ps) => ps.filter((_, j) => j !== i), Math.max(0, Math.min(pi > i ? pi - 1 : pi, project.pages.length - 2)))} aria-label={`Delete page ${i + 1}`} title="Delete page" className="rounded bg-toolbar p-0.5 shadow ring-1 ring-line hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </span>
                  </Reorder.Item>
                ))}
                <button
                  onClick={() => pagesOp((ps) => [...ps.slice(0, pi + 1), blankPage(typeof page.background === 'string' ? page.background : '#FFFFFF'), ...ps.slice(pi + 1)], pi + 1)}
                  aria-label="Add page"
                  title="Add page"
                  className="flex shrink-0 items-center justify-center rounded-md border-2 border-dashed border-line text-muted hover:border-cyan hover:text-fg"
                  style={{ width: thumbW, height: Math.round((thumbW * H) / W) + 4 }}
                >
                  <Plus size={18} />
                </button>
              </Reorder.Group>

              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                <button className={iconBtn} onClick={() => setZoom(zoom / 1.1)} aria-label="Zoom out">
                  <Minus size={15} />
                </button>
                <input type="range" min={20} max={250} value={Math.round(zoom * 100)} onChange={(e) => setZoom(+e.target.value / 100)} aria-label="Zoom" className="w-24 accent-[#00C4CC]" />
                <button className={iconBtn} onClick={() => setZoom(zoom * 1.1)} aria-label="Zoom in">
                  <Plus size={15} />
                </button>
                <span className="w-11 text-center font-mono text-xs">{Math.round(zoom * 100)}%</span>
                <button onClick={() => fitRef.current?.()} className="flex h-8 items-center gap-1 rounded-lg border border-line px-2 text-xs hover:bg-hover" title="Fit to screen (Ctrl+0)">
                  <Maximize2 size={13} /> Fit
                </button>
              </div>
            </footer>
          </main>
        </div>
        <ExportModal project={project} open={exportOpen} onClose={() => setExportOpen(false)} />
      </div>
    </EditorCtx.Provider>
  );
}
