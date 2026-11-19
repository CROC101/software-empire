'use client';

import { createContext, useContext } from 'react';
import type { CanvasElement, DesignPage, DesignProject } from '@/types/canva';

export type NewElement = Partial<CanvasElement> & Pick<CanvasElement, 'type' | 'w' | 'h'>;
export type Arrange = 'forward' | 'backward' | 'front' | 'back';

export interface EditorApi {
  project: DesignProject;
  page: DesignPage;
  pageIndex: number;
  setPageIndex: (i: number) => void;
  selId: string | null;
  sel: CanvasElement | null;
  select: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  zoom: number;
  setZoom: (z: number) => void;
  fit: () => void;
  playKey: number;
  previewing: boolean;
  play: () => void;
  checkpoint: () => void;
  update: (fn: (p: DesignProject) => DesignProject, history?: boolean) => void;
  updatePage: (fn: (pg: DesignPage) => DesignPage, history?: boolean) => void;
  updateEl: (id: string, patch: Partial<CanvasElement> | ((e: CanvasElement) => CanvasElement), history?: boolean) => void;
  addEl: (el: NewElement) => void;
  removeSel: () => void;
  duplicateSel: () => void;
  arrange: (dir: Arrange) => void;
}

export const EditorCtx = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const v = useContext(EditorCtx);
  if (!v) throw new Error('useEditor must be used inside the editor');
  return v;
}

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 2.5;
export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));
