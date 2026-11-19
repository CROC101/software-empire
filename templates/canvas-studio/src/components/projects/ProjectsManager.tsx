'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Folder, FolderInput, FolderPlus, LayoutGrid, List, Pencil, RotateCcw, Search, Star, Trash2, X } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';
import { useCanva } from '@/context/CanvaContext';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { MoveToFolderModal } from '@/components/cards/MoveToFolderModal';
import { Modal } from '@/components/ui/Modal';
import { SPRING } from '@/lib/design';

export type ProjectsTab = 'all' | 'folders' | 'starred' | 'trash';

const TABS: { id: ProjectsTab; label: string; href: string }[] = [
  { id: 'all', label: 'All Designs', href: '/projects/' },
  { id: 'folders', label: 'Folders', href: '/projects/?tab=folders' },
  { id: 'starred', label: 'Starred', href: '/starred/' },
  { id: 'trash', label: 'Trash', href: '/trash/' },
];

function Manager({ route }: { route: 'projects' | 'starred' | 'trash' }) {
  const params = useSearchParams();
  const tab: ProjectsTab = route === 'projects' ? (params.get('tab') === 'folders' ? 'folders' : 'all') : route;
  const canva = useCanva();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<string[]>([]);
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [folderModal, setFolderModal] = useState<{ id?: string; name: string } | null>(null);

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    return canva.projects
      .filter((p) => (tab === 'trash' ? p.trashed : !p.trashed))
      .filter((p) => tab !== 'starred' || p.starred)
      .filter((p) => tab !== 'folders' || (openFolder && p.folderId === openFolder))
      .filter((p) => !ql || p.title.toLowerCase().includes(ql))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [canva.projects, tab, q, openFolder]);

  const toggle = (id: string, v: boolean) => setSelected((s) => (v ? [...s, id] : s.filter((x) => x !== id)));
  const clear = () => setSelected([]);
  const folder = canva.folders.find((f) => f.id === openFolder);
  const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-hover';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tab === 'trash' ? 'Trash' : tab === 'starred' ? 'Starred' : 'Projects'}</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm">
            <Search size={15} className="text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs" className="w-36 bg-transparent outline-none sm:w-52" />
          </label>
          <div className="flex rounded-lg border border-line p-0.5">
            <button onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'} className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-hover text-cyan' : 'text-muted'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'} className={`rounded-md p-1.5 ${view === 'list' ? 'bg-hover text-cyan' : 'text-muted'}`}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line" aria-label="Project views">
        {TABS.map((t) => (
          <Link key={t.id} href={t.href} onClick={() => (clear(), setOpenFolder(null))} className={`relative shrink-0 px-3 pb-2.5 pt-1 text-sm font-medium ${tab === t.id ? 'text-fg' : 'text-muted hover:text-fg'}`}>
            {t.label}
            {tab === t.id && <motion.span layoutId="proj-tab" transition={SPRING} className="bg-brand-gradient absolute inset-x-1 -bottom-px h-0.5 rounded-full" />}
          </Link>
        ))}
      </nav>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm">
          <span className="mr-2 font-semibold">{selected.length} selected</span>
          {tab === 'trash' ? (
            <>
              <button className={btn} onClick={() => (canva.setTrashed(selected, false), clear())}>
                <RotateCcw size={15} /> Restore
              </button>
              <button className={`${btn} text-red-400`} onClick={() => confirm('Delete selected designs forever?') && (canva.deleteForever(selected), clear())}>
                <X size={15} /> Delete forever
              </button>
            </>
          ) : (
            <>
              <button className={btn} onClick={() => canva.setStarred(selected, true)}>
                <Star size={15} /> Star
              </button>
              <button className={btn} onClick={() => canva.setStarred(selected, false)}>
                <Star size={15} /> Unstar
              </button>
              <button className={btn} onClick={() => setMoveIds(selected)}>
                <FolderInput size={15} /> Move
              </button>
              <button className={`${btn} text-red-400`} onClick={() => (canva.setTrashed(selected, true), clear())}>
                <Trash2 size={15} /> Trash
              </button>
            </>
          )}
          <button className="ml-auto text-muted hover:text-fg" onClick={clear}>
            Clear
          </button>
        </div>
      )}

      {tab === 'trash' && list.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-sm">
          <span className="text-muted">Designs in the trash can be restored until you empty it.</span>
          <button className={`${btn} text-red-400`} onClick={() => confirm('Empty the trash? This cannot be undone.') && (canva.emptyTrash(), clear())}>
            <Trash2 size={15} /> Empty Trash
          </button>
        </div>
      )}

      {tab === 'folders' && !openFolder && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <button onClick={() => setFolderModal({ name: '' })} className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-muted hover:border-cyan hover:text-fg">
            <FolderPlus size={24} /> New folder
          </button>
          {canva.folders.map((f) => {
            const count = canva.projects.filter((p) => p.folderId === f.id && !p.trashed).length;
            return (
              <motion.div key={f.id} whileHover={{ y: -4 }} transition={SPRING} className="group relative flex h-32 flex-col justify-between rounded-xl border border-line bg-card p-4">
                <button onClick={() => setOpenFolder(f.id)} className="absolute inset-0" aria-label={`Open folder ${f.name}`} />
                <Folder size={28} className="text-cyan" />
                <div>
                  <p className="line-clamp-1 font-semibold">{f.name}</p>
                  <p className="text-xs text-muted">
                    {count} design{count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => setFolderModal({ id: f.id, name: f.name })} aria-label="Rename folder" className="rounded-md p-1 text-muted hover:bg-hover hover:text-fg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => confirm(`Delete folder “${f.name}”? Designs inside are kept.`) && canva.deleteFolder(f.id)} aria-label="Delete folder" className="rounded-md p-1 text-muted hover:bg-hover hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'folders' && folder && (
        <button onClick={() => setOpenFolder(null)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowLeft size={15} /> All folders / <span className="font-semibold text-fg">{folder.name}</span>
        </button>
      )}

      {(tab !== 'folders' || openFolder) &&
        (list.length ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4' : 'space-y-2'}>
            {list.map((p) => (
              <ProjectCard key={p.id} project={p} view={view} selected={selected.includes(p.id)} onSelect={(v) => toggle(p.id, v)} onMove={(id) => setMoveIds([id])} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {tab === 'trash' ? 'Trash is empty.' : tab === 'starred' ? 'Star a design to find it here quickly.' : 'Nothing here yet.'}{' '}
            <Link href="/templates/" className="text-cyan hover:underline">
              Browse templates
            </Link>
          </p>
        ))}

      <MoveToFolderModal ids={moveIds} onClose={() => (setMoveIds([]), clear())} />
      <Modal open={!!folderModal} onClose={() => setFolderModal(null)} title={folderModal?.id ? 'Rename folder' : 'Create folder'}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = folderModal?.name.trim();
            if (!name) return;
            if (folderModal?.id) canva.renameFolder(folderModal.id, name);
            else canva.createFolder(name);
            setFolderModal(null);
          }}
          className="space-y-4"
        >
          <input autoFocus value={folderModal?.name ?? ''} onChange={(e) => setFolderModal((m) => m && { ...m, name: e.target.value })} placeholder="Folder name" className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm" />
          <button className="bg-brand-gradient w-full rounded-lg py-2 text-sm font-semibold text-white">{folderModal?.id ? 'Rename' : 'Create folder'}</button>
        </form>
      </Modal>
    </div>
  );
}

export function ProjectsManager({ route }: { route: 'projects' | 'starred' | 'trash' }) {
  return (
    <Suspense>
      <Manager route={route} />
    </Suspense>
  );
}
