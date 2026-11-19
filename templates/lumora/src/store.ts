import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Rating = 'down' | 'up' | 'love';
export interface Profile {
  id: string;
  name: string;
  avatar: number;
  kids: boolean;
  maturity: 'ทั่วไป' | '7+' | '13+' | '16+' | '18+';
  autoplayNext: boolean;
  autoplayPreviews: boolean;
}
export interface Progress {
  t: number; // seconds watched
  d: number; // media duration
  at: number; // last update (ms)
  episodeId?: string;
}
interface ProfileData {
  myList: string[];
  ratings: Record<string, Rating>;
  /** keyed by title id (last watched position incl. which episode) */
  progress: Record<string, Progress>;
  /** keyed by episode id, for per-episode bars */
  episodes: Record<string, Progress>;
}
export interface Settings {
  speed: number;
  subtitles: string;
  audio: string;
  volume: number;
  muted: boolean;
}

interface State {
  signedIn: boolean;
  email: string;
  lang: 'th' | 'en';
  profiles: Profile[];
  activeId: string | null;
  data: Record<string, ProfileData>;
  settings: Settings;
  signIn: (email: string) => void;
  signOut: () => void;
  setLang: (l: 'th' | 'en') => void;
  selectProfile: (id: string | null) => void;
  upsertProfile: (p: Profile) => void;
  deleteProfile: (id: string) => void;
  toggleList: (titleId: string) => void;
  rate: (titleId: string, r: Rating | null) => void;
  saveProgress: (titleId: string, p: Progress) => void;
  clearProgress: (titleId: string) => void;
  setSettings: (s: Partial<Settings>) => void;
}

const empty = (): ProfileData => ({ myList: [], ratings: {}, progress: {}, episodes: {} });
const DEFAULT_PROFILES: Profile[] = [
  { id: 'p1', name: 'ภูมิ', avatar: 0, kids: false, maturity: '18+', autoplayNext: true, autoplayPreviews: true },
  { id: 'p2', name: 'มายด์', avatar: 1, kids: false, maturity: '18+', autoplayNext: true, autoplayPreviews: true },
  { id: 'p3', name: 'คุณแม่', avatar: 3, kids: false, maturity: '16+', autoplayNext: true, autoplayPreviews: true },
  { id: 'kids', name: 'เด็กๆ', avatar: 5, kids: true, maturity: '7+', autoplayNext: true, autoplayPreviews: true },
];

// Seed a little history so "Continue Watching" isn't empty on first run.
const seeded = (): Record<string, ProfileData> => {
  const now = Date.now();
  const d = empty();
  d.progress = {
    '81000': { t: 14, d: 60, at: now - 1000, episodeId: '81000-s1e2' },
    '81037': { t: 40, d: 60, at: now - 2000 },
    '81148': { t: 8, d: 60, at: now - 3000, episodeId: '81148-s1e1' },
    '81259': { t: 50, d: 60, at: now - 4000 },
  };
  d.episodes = { '81000-s1e1': { t: 60, d: 60, at: now - 5000 }, '81000-s1e2': { t: 14, d: 60, at: now - 1000 }, '81148-s1e1': { t: 8, d: 60, at: now - 3000 } };
  d.myList = ['81074', '81185'];
  return { p1: d };
};

const mut = (s: State, f: (d: ProfileData) => ProfileData): Partial<State> => {
  if (!s.activeId) return {};
  return { data: { ...s.data, [s.activeId]: f(s.data[s.activeId] ?? empty()) } };
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      signedIn: false,
      email: '',
      lang: 'th',
      profiles: DEFAULT_PROFILES,
      activeId: null,
      data: seeded(),
      settings: { speed: 1, subtitles: 'ปิด', audio: 'ไทย [ต้นฉบับ]', volume: 0.8, muted: false },
      signIn: (email) => set({ signedIn: true, email }),
      signOut: () => set({ signedIn: false, activeId: null }),
      setLang: (lang) => set({ lang }),
      selectProfile: (activeId) => set({ activeId }),
      upsertProfile: (p) =>
        set((s) => ({
          profiles: s.profiles.some((x) => x.id === p.id) ? s.profiles.map((x) => (x.id === p.id ? p : x)) : [...s.profiles, p],
        })),
      deleteProfile: (id) => set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id), activeId: s.activeId === id ? null : s.activeId })),
      toggleList: (tid) => set((s) => mut(s, (d) => ({ ...d, myList: d.myList.includes(tid) ? d.myList.filter((x) => x !== tid) : [tid, ...d.myList] }))),
      rate: (tid, r) =>
        set((s) =>
          mut(s, (d) => {
            const ratings = { ...d.ratings };
            if (r) ratings[tid] = r;
            else delete ratings[tid];
            return { ...d, ratings };
          }),
        ),
      saveProgress: (tid, p) =>
        set((s) =>
          mut(s, (d) => ({
            ...d,
            progress: { ...d.progress, [tid]: p },
            episodes: p.episodeId ? { ...d.episodes, [p.episodeId]: p } : d.episodes,
          })),
        ),
      clearProgress: (tid) =>
        set((s) =>
          mut(s, (d) => {
            const progress = { ...d.progress };
            delete progress[tid];
            return { ...d, progress };
          }),
        ),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
    }),
    { name: 'lumora-state', version: 1 },
  ),
);

export const useActiveProfile = () => useStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? null);
const EMPTY = empty();
export const useProfileData = () => useStore((s) => (s.activeId ? s.data[s.activeId] ?? EMPTY : EMPTY));
