import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { create } from 'zustand';
import { TITLES, type Title } from '../data/catalog';
import { useActiveProfile } from '../store';

export function useWindowWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}

/** Items per row, matching the browse grid breakpoints. */
export const perRow = (w: number) => (w >= 1400 ? 6 : w >= 1100 ? 5 : w >= 800 ? 4 : w >= 500 ? 3 : 2);

export function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** Title modal state lives in the URL (?jbv=<id>) so it survives reloads and back button. */
export function useModal() {
  const [params, setParams] = useSearchParams();
  const id = params.get('jbv');
  return {
    id,
    open: (titleId: string, rect?: DOMRect) => {
      modalOrigin.rect = rect ?? null;
      const p = new URLSearchParams(params);
      p.set('jbv', titleId);
      setParams(p);
    },
    close: () => {
      const p = new URLSearchParams(params);
      p.delete('jbv');
      setParams(p);
    },
  };
}
export const modalOrigin: { rect: DOMRect | null } = { rect: null };

/** Which card is expanded on hover (one at a time, rendered in a portal). */
interface HoverState {
  title: Title | null;
  rect: DOMRect | null;
  edge: 'left' | 'right' | 'mid';
  progress?: number;
  show: (t: Title, rect: DOMRect, edge: 'left' | 'right' | 'mid', progress?: number) => void;
  hide: () => void;
}
export const useHover = create<HoverState>((set) => ({
  title: null,
  rect: null,
  edge: 'mid',
  show: (title, rect, edge, progress) => set({ title, rect, edge, progress }),
  hide: () => set({ title: null, rect: null }),
}));

const ORDER = ['ทั่วไป', '7+', '13+', '16+', '18+'];
export const allowed = (limit: string, m: string) => ORDER.indexOf(m) <= ORDER.indexOf(limit);

/** Catalog filtered by the active profile's maturity setting. */
export function useCatalog(): Title[] {
  const p = useActiveProfile();
  const limit = p ? (p.kids ? '7+' : p.maturity) : '18+';
  return TITLES.filter((t) => allowed(limit, t.maturity));
}

export const fmtTime = (s: number) => {
  if (!isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};

/** Brief skeleton on first mount / route change. */
export function useFakeLoading(key: string, ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [key, ms]);
  return loading;
}
