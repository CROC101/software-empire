'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BrandKit, CanvasElement, DesignPage, DesignProject, FolderItem, WorkspaceSettings } from '@/types/canva';
import { TEMPLATES } from '@/data/seed-templates';
import { SEED_BRAND } from '@/data/assets';
import { DESIGN_SLOTS } from '@/lib/slots';
import { blankPage, clonePage, resizeProject, uid } from '@/lib/design';

const STORAGE_KEY = 'canvacraft:v1';
const HISTORY_LIMIT = 100;

interface Store {
  projects: DesignProject[];
  folders: FolderItem[];
  brand: BrandKit;
  settings: WorkspaceSettings;
}

const SEED_TIME = Date.UTC(2026, 10, 10, 9, 0, 0);

function fromTemplate(id: string, templateId: string, t: number): DesignProject {
  const tpl = TEMPLATES.find((x) => x.id === templateId)!;
  return {
    id, title: tpl.name, width: tpl.width, height: tpl.height, templateId,
    pages: structuredClone(tpl.pages), createdAt: t, updatedAt: t, starred: false, trashed: false, folderId: null,
  };
}

const SEED: Store = {
  projects: [
    { ...fromTemplate('d001', 'tpl-yt-tech', SEED_TIME + 3000), starred: true, folderId: 'fd-youtube' },
    fromTemplate('d002', 'tpl-ig-saas', SEED_TIME + 2000),
    fromTemplate('d003', 'tpl-pitch-title', SEED_TIME + 1000),
  ],
  folders: [
    { id: 'fd-youtube', name: 'YouTube', createdAt: SEED_TIME },
    { id: 'fd-clients', name: 'Client work', createdAt: SEED_TIME },
  ],
  brand: SEED_BRAND,
  settings: { theme: 'dark', snap: true, grid: false, exportScale: 2 },
};

interface History {
  past: DesignProject[];
  future: DesignProject[];
}

export interface NewDesignInput {
  width: number;
  height: number;
  title?: string;
  pages?: DesignPage[];
  templateId?: string;
}

interface CanvaApi extends Store {
  hydrated: boolean;
  saveState: 'saved' | 'saving' | 'error';
  getProject: (id: string) => DesignProject | undefined;
  createProject: (input: NewDesignInput) => string | null;
  createFromTemplate: (templateId: string) => string | null;
  duplicateProject: (id: string) => string | null;
  updateProject: (id: string, fn: (p: DesignProject) => DesignProject, opts?: { history?: boolean }) => void;
  checkpoint: (id: string) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  canUndo: (id: string) => boolean;
  canRedo: (id: string) => boolean;
  magicResize: (id: string, width: number, height: number) => void;
  insertElement: (id: string, el: CanvasElement, pageIndex?: number, atBack?: boolean) => void;
  setTrashed: (ids: string[], trashed: boolean) => void;
  deleteForever: (ids: string[]) => void;
  emptyTrash: () => void;
  setStarred: (ids: string[], starred: boolean) => void;
  moveToFolder: (ids: string[], folderId: string | null) => void;
  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setBrand: (fn: (b: BrandKit) => BrandKit) => void;
  setSettings: (patch: Partial<WorkspaceSettings>) => void;
}

const Ctx = createContext<CanvaApi | null>(null);

export function useCanva(): CanvaApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCanva must be used inside <CanvaProvider>');
  return v;
}

export function CanvaProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(SEED);
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [historyVersion, setHistoryVersion] = useState(0);
  const history = useRef(new Map<string, History>());
  const storeRef = useRef(store);
  storeRef.current = store;

  // Load once on the client (SSR renders the seed).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Store>;
        setStore({
          projects: saved.projects ?? SEED.projects,
          folders: saved.folders ?? SEED.folders,
          brand: { ...SEED.brand, ...saved.brand },
          settings: { ...SEED.settings, ...saved.settings },
        });
      }
    } catch {
      // corrupt storage: keep seed, it will be overwritten on next save
    }
    setHydrated(true);
  }, []);

  // Debounced persist.
  useEffect(() => {
    if (!hydrated) return;
    setSaveState('saving');
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        setSaveState('saved');
      } catch {
        setSaveState('error'); // usually quota exceeded by large uploaded images
      }
    }, 400);
    return () => clearTimeout(t);
  }, [store, hydrated]);

  useEffect(() => {
    document.documentElement.dataset.theme = store.settings.theme;
  }, [store.settings.theme]);

  const hist = (id: string) => {
    let h = history.current.get(id);
    if (!h) history.current.set(id, (h = { past: [], future: [] }));
    return h;
  };

  const getProject = useCallback((id: string) => storeRef.current.projects.find((p) => p.id === id), []);

  const checkpoint = useCallback((id: string) => {
    const p = storeRef.current.projects.find((x) => x.id === id);
    if (!p) return;
    const h = hist(id);
    h.past.push(p);
    if (h.past.length > HISTORY_LIMIT) h.past.shift();
    h.future = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const updateProject = useCallback<CanvaApi['updateProject']>((id, fn, opts) => {
    if (opts?.history !== false) checkpoint(id);
    setStore((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p)),
    }));
  }, [checkpoint]);

  const travel = useCallback((id: string, dir: 'undo' | 'redo') => {
    const h = hist(id);
    const from = dir === 'undo' ? h.past : h.future;
    const to = dir === 'undo' ? h.future : h.past;
    const target = from.pop();
    const current = storeRef.current.projects.find((p) => p.id === id);
    if (!target || !current) return;
    to.push(current);
    setStore((s) => ({ ...s, projects: s.projects.map((p) => (p.id === id ? target : p)) }));
    setHistoryVersion((v) => v + 1);
  }, []);

  const nextSlot = () => {
    const used = new Set(storeRef.current.projects.map((p) => p.id));
    const free = DESIGN_SLOTS.find((s) => !used.has(s));
    if (!free) window.alert('You have reached 200 designs. Empty the trash to make room for new ones.');
    return free ?? null;
  };

  const addProject = (p: DesignProject) => {
    storeRef.current = { ...storeRef.current, projects: [p, ...storeRef.current.projects] };
    setStore((s) => ({ ...s, projects: [p, ...s.projects] }));
  };

  const createProject = useCallback<CanvaApi['createProject']>((input) => {
    const id = nextSlot();
    if (!id) return null;
    const now = Date.now();
    addProject({
      id, title: input.title ?? `Untitled design · ${input.width}×${input.height}`, width: input.width, height: input.height,
      pages: input.pages ?? [blankPage()], createdAt: now, updatedAt: now, starred: false, trashed: false, folderId: null,
      templateId: input.templateId,
    });
    return id;
  }, []);

  const createFromTemplate = useCallback<CanvaApi['createFromTemplate']>((templateId) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return null;
    return createProject({ width: tpl.width, height: tpl.height, title: tpl.name, pages: tpl.pages.map(clonePage), templateId });
  }, [createProject]);

  const duplicateProject = useCallback<CanvaApi['duplicateProject']>((id) => {
    const src = storeRef.current.projects.find((p) => p.id === id);
    const nid = src ? nextSlot() : null;
    if (!src || !nid) return null;
    const now = Date.now();
    addProject({ ...src, id: nid, title: `${src.title} (copy)`, pages: src.pages.map(clonePage), createdAt: now, updatedAt: now, trashed: false, starred: false });
    return nid;
  }, []);

  const patchMany = (ids: string[], patch: Partial<DesignProject>) =>
    setStore((s) => ({ ...s, projects: s.projects.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)) }));

  const api: CanvaApi = useMemo(() => ({
    ...store,
    hydrated,
    saveState,
    getProject,
    createProject,
    createFromTemplate,
    duplicateProject,
    updateProject,
    checkpoint,
    undo: (id) => travel(id, 'undo'),
    redo: (id) => travel(id, 'redo'),
    canUndo: (id) => (history.current.get(id)?.past.length ?? 0) > 0,
    canRedo: (id) => (history.current.get(id)?.future.length ?? 0) > 0,
    magicResize: (id, w, h) => updateProject(id, (p) => resizeProject(p, w, h)),
    insertElement: (id, el, pageIndex = 0, atBack = false) =>
      updateProject(id, (p) => ({
        ...p,
        pages: p.pages.map((pg, i) => (i === Math.min(pageIndex, p.pages.length - 1) ? { ...pg, elements: atBack ? [{ ...el, id: uid() }, ...pg.elements] : [...pg.elements, { ...el, id: uid() }] } : pg)),
      })),
    setTrashed: (ids, trashed) => patchMany(ids, { trashed }),
    deleteForever: (ids) => setStore((s) => ({ ...s, projects: s.projects.filter((p) => !ids.includes(p.id)) })),
    emptyTrash: () => setStore((s) => ({ ...s, projects: s.projects.filter((p) => !p.trashed) })),
    setStarred: (ids, starred) => patchMany(ids, { starred }),
    moveToFolder: (ids, folderId) => patchMany(ids, { folderId }),
    createFolder: (name) => {
      const id = uid('fd');
      setStore((s) => ({ ...s, folders: [...s.folders, { id, name, createdAt: Date.now() }] }));
      return id;
    },
    renameFolder: (id, name) => setStore((s) => ({ ...s, folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)) })),
    deleteFolder: (id) =>
      setStore((s) => ({
        ...s,
        folders: s.folders.filter((f) => f.id !== id),
        projects: s.projects.map((p) => (p.folderId === id ? { ...p, folderId: null } : p)),
      })),
    setBrand: (fn) => setStore((s) => ({ ...s, brand: fn(s.brand) })),
    setSettings: (patch) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
  }), [store, hydrated, saveState, historyVersion, getProject, createProject, createFromTemplate, duplicateProject, updateProject, checkpoint, travel]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
