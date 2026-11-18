import { cn } from "@empire/ui";
import {
  ChevronDown,
  ExternalLink,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  SkipForward,
  Users,
  X,
} from "lucide-react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { openRoom, saveProgress, type Video } from "@/lib/api";
import { useData } from "@/lib/data";
import { useSession } from "@/lib/session";
import { STATE, loadYouTube, type YTPlayer } from "@/lib/yt";
import { thumb, watchUrl } from "@/lib/youtube";

/** What a watch-together host broadcasts, and what guests follow. */
export type PlayState = { id: string; t: number; playing: boolean };

type Player = {
  current: Video | null;
  queue: Video[];
  playing: boolean;
  expanded: boolean;
  play: (video: Video, queue?: Video[], start?: number) => void;
  next: () => void;
  setExpanded: (open: boolean) => void;
  close: () => void;
  /** For rooms: read and steer the one player. */
  now: () => PlayState | null;
  seek: (t: number) => void;
  pause: () => void;
  resume: () => void;
  /** Called on every play / pause / seek / change of video; returns an unsubscribe. */
  watch: (fn: (s: PlayState) => void) => () => void;
};

const PlayerContext = createContext<Player | null>(null);

export function usePlayer() {
  const player = use(PlayerContext);
  if (!player) throw new Error("usePlayer needs <PlayerProvider>");
  return player;
}

/** Start where the viewer stopped, unless they had reached the credits. */
export function resumeAt(seconds: number, duration: number) {
  return duration > 0 && seconds > 5 && seconds < duration - 15 ? Math.floor(seconds) : 0;
}

const AUTOSAVE_MS = 10_000;

/**
 * One official YouTube player for the whole app. It lives in the shell, so it keeps playing while
 * people move between pages; it opens full screen or folds into a mini card above the tab bar.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { progress, remember } = useData();
  const [current, setCurrent] = useState<Video | null>(null);
  const [queue, setQueue] = useState<Video[]>([]);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const listeners = useRef(new Set<(s: PlayState) => void>());
  const currentRef = useRef<Video | null>(null);
  const queueRef = useRef<Video[]>([]);
  const userRef = useRef(user);
  const progressRef = useRef(progress);
  const playingRef = useRef(false);
  // the YouTube player keeps its first callbacks, so it reaches the latest start through a ref
  const startRef = useRef<(video: Video) => void>(() => undefined);

  useEffect(() => {
    userRef.current = user;
    progressRef.current = progress;
  }, [user, progress]);

  const now = useCallback((): PlayState | null => {
    const v = currentRef.current;
    const p = yt.current;
    if (!v || !p) return null;
    return { id: v.youtube_id, t: p.getCurrentTime(), playing: playingRef.current };
  }, []);

  const emit = useCallback(() => {
    const s = now();
    if (s) for (const fn of listeners.current) fn(s);
  }, [now]);

  /** Autosave the position (signed-in viewers only; the Worker gate already asks for sign-in). */
  const save = useCallback(() => {
    const v = currentRef.current;
    const p = yt.current;
    if (!v || !p || !userRef.current) return;
    const seconds = p.getCurrentTime();
    const duration = p.getDuration();
    if (!(seconds > 0)) return;
    remember({ youtube_id: v.youtube_id, seconds, duration });
    saveProgress(v.youtube_id, seconds, duration).catch((e: unknown) => {
      console.error("บันทึกตำแหน่งไม่สำเร็จ", e);
    });
  }, [remember]);

  const advance = useCallback(() => {
    const at = queueRef.current.findIndex((v) => v.youtube_id === currentRef.current?.youtube_id);
    const following = queueRef.current[at + 1];
    if (following) startRef.current(following);
  }, []);

  const start = useCallback(
    (video: Video, at?: number) => {
      const seen = progressRef.current.get(video.youtube_id);
      const from = at ?? (seen ? resumeAt(seen.seconds, seen.duration) : 0);
      currentRef.current = video;
      setCurrent(video);
      setFailed(null);
      if (yt.current) {
        yt.current.loadVideoById({ videoId: video.youtube_id, startSeconds: from });
        return;
      }
      loadYouTube().then(
        (YT) => {
          const box = host.current;
          if (!box || yt.current) return;
          // YouTube swaps this child for its iframe; React never touches it
          const el = document.createElement("div");
          box.replaceChildren(el);
          yt.current = new YT.Player(el, {
            host: "https://www.youtube-nocookie.com",
            videoId: video.youtube_id,
            width: "100%",
            height: "100%",
            playerVars: { autoplay: 1, playsinline: 1, rel: 0, start: from },
            events: {
              onStateChange: (e) => {
                const on = e.data === STATE.PLAYING;
                playingRef.current = on;
                setPlaying(on);
                if (e.data === STATE.PAUSED || e.data === STATE.ENDED) save();
                if (e.data === STATE.ENDED) advance();
                if (e.data === STATE.PLAYING || e.data === STATE.PAUSED) emit();
              },
              onError: () => {
                setFailed("คลิปนี้เล่นในเว็บอื่นไม่ได้ (เจ้าของปิดการฝัง) เปิดดูบน YouTube แทนได้");
              },
            },
          });
        },
        (e: unknown) => {
          setFailed(e instanceof Error ? e.message : "โหลดเครื่องเล่นไม่สำเร็จ");
        },
      );
    },
    [advance, emit, save],
  );

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  const play = useCallback(
    (video: Video, list?: Video[], at?: number) => {
      save();
      const q = list ?? [video];
      queueRef.current = q;
      setQueue(q);
      start(video, at);
    },
    [save, start],
  );

  // autosave every few seconds while playing, and when the tab is hidden or closed
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(save, AUTOSAVE_MS);
    const hide = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", save);
    };
  }, [playing, save]);

  // lock screen / headset: title, channel and artwork while the page plays
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.author,
      artwork: [{ src: thumb(current.youtube_id), sizes: "480x360", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("play", () => yt.current?.playVideo());
    navigator.mediaSession.setActionHandler("pause", () => yt.current?.pauseVideo());
    navigator.mediaSession.setActionHandler("nexttrack", queue.length > 1 ? advance : null);
  }, [current, queue.length, advance]);

  const close = useCallback(() => {
    save();
    yt.current?.destroy();
    yt.current = null;
    currentRef.current = null;
    playingRef.current = false;
    setCurrent(null);
    setPlaying(false);
    setExpanded(false);
    host.current?.replaceChildren();
  }, [save]);

  const value = useMemo<Player>(
    () => ({
      current,
      queue,
      playing,
      expanded,
      play,
      next: advance,
      setExpanded,
      close,
      now,
      seek: (t) => {
        yt.current?.seekTo(t, true);
        emit();
      },
      pause: () => yt.current?.pauseVideo(),
      resume: () => yt.current?.playVideo(),
      watch: (fn) => {
        listeners.current.add(fn);
        return () => listeners.current.delete(fn);
      },
    }),
    [current, queue, playing, expanded, play, advance, close, now, emit],
  );

  return (
    <PlayerContext value={value}>
      {children}
      <Dock host={host} failed={failed} />
    </PlayerContext>
  );
}

/** Full screen when open, a mini card above the tab bar when folded. The iframe never moves. */
function Dock({
  host,
  failed,
}: {
  host: React.RefObject<HTMLDivElement | null>;
  failed: string | null;
}) {
  const p = usePlayer();
  const { user } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const v = p.current;

  // Escape folds the full-screen player
  useEffect(() => {
    if (!p.expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") p.setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  const together = async () => {
    if (!v) return;
    setBusy(true);
    try {
      const id = await openRoom(v.youtube_id);
      p.setExpanded(false);
      void navigate(`/room/${id}`);
    } catch (e) {
      console.error("เปิดห้องไม่สำเร็จ", e);
    } finally {
      setBusy(false);
    }
  };

  const index = v ? p.queue.findIndex((q) => q.youtube_id === v.youtube_id) : -1;
  const upNext = p.queue.slice(index + 1, index + 11);

  return (
    <section
      aria-label="เครื่องเล่น"
      hidden={!v}
      className={cn(
        "vt-top fixed z-40 text-[var(--em-ink-50)]",
        p.expanded
          ? "inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--em-ink-975)]"
          : "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-2 w-[min(22.25rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] shadow-2xl",
      )}
    >
      {p.expanded && (
        <header className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => p.setExpanded(false)}
            className="grid size-11 place-items-center rounded-md hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
            aria-label="ย่อเครื่องเล่น"
          >
            <ChevronDown className="size-6" aria-hidden />
          </button>
          <p className="min-w-0 flex-1 truncate font-heading text-sm font-bold">{v?.title}</p>
        </header>
      )}
      {/* YouTube's terms: the player stays visible and at least 200px tall, folded too */}
      <div
        className={cn(
          "relative aspect-video w-full bg-black",
          p.expanded && "mx-auto max-h-[70dvh] max-w-5xl",
        )}
      >
        <div ref={host} className="absolute inset-0 [&>iframe]:size-full" />
        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-[var(--em-ink-975)] p-4 text-center text-sm">
            <p>
              {failed}
              {v && (
                <a
                  href={watchUrl(v.youtube_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-1 text-[var(--em-blue-300)] underline"
                >
                  เปิดบน YouTube <ExternalLink className="size-4" aria-hidden />
                </a>
              )}
            </p>
          </div>
        )}
      </div>

      {v && !p.expanded && (
        <div className="flex items-center gap-1 px-2 py-1.5">
          <button
            type="button"
            onClick={() => p.setExpanded(true)}
            className="min-w-0 flex-1 rounded-md px-1 text-left"
            aria-label={`ขยาย ${v.title}`}
          >
            <span className="block truncate text-sm font-semibold">{v.title}</span>
            <span className="block truncate text-xs text-[var(--em-ink-300)]">{v.author}</span>
          </button>
          <IconButton label={p.playing ? "หยุด" : "เล่น"} onClick={p.playing ? p.pause : p.resume}>
            {p.playing ? (
              <Pause className="size-5" aria-hidden />
            ) : (
              <Play className="size-5" aria-hidden />
            )}
          </IconButton>
          {upNext.length > 0 && (
            <IconButton label="ถัดไป" onClick={p.next}>
              <SkipForward className="size-5" aria-hidden />
            </IconButton>
          )}
          <IconButton label="ขยาย" onClick={() => p.setExpanded(true)}>
            <Maximize2 className="size-4" aria-hidden />
          </IconButton>
          <IconButton label="ปิดเครื่องเล่น" onClick={p.close}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </div>
      )}

      {v && p.expanded && (
        <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-4">
          <div>
            <h2 className="font-heading text-xl font-black text-[var(--em-ink-0)]">{v.title}</h2>
            <p className="text-sm text-[var(--em-ink-300)]">{v.author}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={p.playing ? p.pause : p.resume}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--em-blue-600)] px-4 font-semibold text-[var(--em-ink-0)] hover:bg-[var(--em-blue-500)]"
            >
              {p.playing ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              {p.playing ? "หยุด" : "เล่น"}
            </button>
            {user && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void together()}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] px-4 hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)] disabled:opacity-60"
              >
                <Users className="size-4" aria-hidden />
                ดูพร้อมเพื่อน
              </button>
            )}
            <a
              href={watchUrl(v.youtube_id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] px-4 hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
            >
              <ExternalLink className="size-4" aria-hidden />
              เปิดบน YouTube
            </a>
          </div>
          {upNext.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-heading font-bold">
                <ListMusic className="size-4" aria-hidden /> ถัดไป
              </h3>
              <ol className="grid gap-1">
                {upNext.map((q) => (
                  <li key={q.youtube_id}>
                    <button
                      type="button"
                      onClick={() => p.play(q, p.queue)}
                      className="flex w-full items-center gap-3 rounded-md p-1.5 text-left hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
                    >
                      <img
                        src={thumb(q.youtube_id)}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-24 rounded object-cover"
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm font-semibold">{q.title}</span>
                        <span className="block truncate text-xs text-[var(--em-ink-300)]">
                          {q.author}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
    >
      {children}
    </button>
  );
}
