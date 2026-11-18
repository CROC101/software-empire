import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadAll, type Progress, type Video } from "./api";
import { useSession } from "./session";

type Data = {
  featured: Video[];
  mine: Video[];
  progress: Map<string, Progress>;
  loaded: boolean;
  error: string | null;
  refresh: () => void;
  /** Keep "continue watching" current without a round trip. */
  remember: (p: Progress) => void;
};

const DataContext = createContext<Data | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useSession();
  const [state, setState] = useState({
    featured: [] as Video[],
    mine: [] as Video[],
    progress: new Map<string, Progress>(),
    loaded: false,
    error: null as string | null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    loadAll(Boolean(user?.id)).then(
      ({ featured, mine, progress }) => {
        if (active)
          setState({
            featured,
            mine,
            progress: new Map(progress.map((p) => [p.youtube_id, p])),
            loaded: true,
            error: null,
          });
      },
      (e: unknown) => {
        console.error("โหลดชั้นวิดีโอไม่สำเร็จ", e);
        if (active)
          setState((s) => ({ ...s, loaded: true, error: "โหลดรายการไม่สำเร็จ ลองใหม่อีกครั้ง" }));
      },
    );
    return () => {
      active = false;
    };
  }, [ready, user?.id, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const remember = useCallback((p: Progress) => {
    setState((s) => {
      const progress = new Map(s.progress);
      progress.delete(p.youtube_id);
      // newest first, like the server's order
      return { ...s, progress: new Map([[p.youtube_id, p], ...progress]) };
    });
  }, []);

  const value = useMemo(() => ({ ...state, refresh, remember }), [state, refresh, remember]);
  return <DataContext value={value}>{children}</DataContext>;
}

export function useData() {
  const data = use(DataContext);
  if (!data) throw new Error("useData needs <DataProvider>");
  return data;
}

/** Every video once: the user's own first, then the featured ones they have not saved. */
export function allVideos(featured: Video[], mine: Video[]) {
  const seen = new Set(mine.map((v) => v.youtube_id));
  return [...mine, ...featured.filter((v) => !seen.has(v.youtube_id))];
}
