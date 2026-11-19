import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { I } from '../components/Icons';
import { Avatar, Media, Toast, Wordmark } from '../components/ui';
import { ME } from '../data/mock';
import { timeAgo, useStore, userByName } from '../store';
import type { StorySet } from '../types';

const DURATION = 5000;

export function Stories() {
  const { username = '' } = useParams();
  const [sp] = useSearchParams();
  const highlightId = sp.get('h');
  const nav = useNavigate();
  const users = useStore((s) => s.users);
  const stories = useStore((s) => s.stories);
  const highlights = useStore((s) => s.highlights);
  const markSeen = useStore((s) => s.markStorySeen);
  const { openThreadWith, sendMessage } = useStore();

  const sets: StorySet[] = useMemo(() => {
    if (highlightId) {
      const h = highlights.find((x) => x.id === highlightId);
      return h ? [{ user: h.user, items: h.items }] : [];
    }
    const mine = stories.filter((s) => s.user === ME);
    return [...mine, ...stories.filter((s) => s.user !== ME)];
  }, [highlightId, highlights, stories]);

  const startUser = userByName(users, username)?.id;
  const [setIdx, setSetIdx] = useState(() => Math.max(0, sets.findIndex((s) => s.user === startUser)));
  const [itemIdx, setItemIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reply, setReply] = useState('');
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const holdTimer = useRef<number>();

  const set = sets[setIdx];
  const item = set?.items[itemIdx];
  const user = set ? users[set.user] : undefined;
  const stopped = paused || held || reply.length > 0;

  useEffect(() => {
    if (set && !highlightId) markSeen(set.user);
  }, [set, highlightId, markSeen]);

  // Keep the address in sync with whose story is showing.
  useEffect(() => {
    if (user && user.username !== username && !highlightId) nav(`/stories/${user.username}`, { replace: true });
  }, [user, username, highlightId, nav]);

  const close = useCallback(() => (window.history.length > 1 ? nav(-1) : nav('/')), [nav]);
  const next = useCallback(() => {
    setElapsed(0);
    setLiked(false);
    if (!set) return close();
    if (itemIdx < set.items.length - 1) return setItemIdx(itemIdx + 1);
    if (setIdx < sets.length - 1) {
      setSetIdx(setIdx + 1);
      setItemIdx(0);
    } else close();
  }, [set, itemIdx, setIdx, sets.length, close]);
  const prev = useCallback(() => {
    setElapsed(0);
    if (itemIdx > 0) return setItemIdx(itemIdx - 1);
    if (setIdx > 0) {
      setSetIdx(setIdx - 1);
      setItemIdx(0);
    }
  }, [itemIdx, setIdx]);

  useEffect(() => {
    if (stopped) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      setElapsed((e) => e + (t - last));
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stopped, setIdx, itemIdx]);

  useEffect(() => {
    if (elapsed >= DURATION) next();
  }, [elapsed, next]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') close();
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [next, prev, close]);

  if (!set || !item || !user) {
    return (
      <div className="stories-page center-col">
        <p>This story is no longer available.</p>
        <Link to="/" className="link-btn">Go home</Link>
      </div>
    );
  }

  const sendReply = () => {
    if (!reply.trim() || set.user === ME) return;
    const t = openThreadWith(set.user);
    sendMessage(t, { text: `Replied to your story: ${reply.trim()}`, image: item.src });
    setReply('');
    setToast('Message sent');
  };

  return (
    <div className="stories-page">
      <Link to="/" className="stories-logo" aria-label="Home"><Wordmark size={26} /></Link>
      <button className="stories-close" onClick={close} aria-label="Close"><I.Close size={28} /></button>
      {setIdx > 0 && <button className="story-nav left" onClick={prev} aria-label="Previous"><I.ChevronLeft size={16} strokeWidth={3} /></button>}
      <div
        className="story-card"
        onPointerDown={() => (holdTimer.current = window.setTimeout(() => setHeld(true), 180))}
        onPointerUp={(e) => {
          clearTimeout(holdTimer.current);
          if (held) return setHeld(false);
          const r = e.currentTarget.getBoundingClientRect();
          if ((e.target as HTMLElement).closest('button, input, form')) return;
          if (e.clientX - r.left < r.width / 3) prev();
          else next();
        }}
        onPointerLeave={() => { clearTimeout(holdTimer.current); setHeld(false); }}
      >
        <Media src={item.src} className="story-media" video playing={!stopped} />
        <div className="story-top">
          <div className="story-bars">
            {set.items.map((it, k) => (
              <span key={it.id}><i style={{ width: `${k < itemIdx ? 100 : k > itemIdx ? 0 : Math.min(100, (elapsed / DURATION) * 100)}%` }} /></span>
            ))}
          </div>
          <div className="story-head">
            <Avatar user={user} size={32} />
            <Link to={`/profile/${user.username}`} className="bold">{user.username}</Link>
            <span className="story-time">{item.createdAt ? timeAgo(item.createdAt) : ''}</span>
            <span className="grow" />
            <button className="plain" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play' : 'Pause'}>{stopped ? <I.Play size={20} /> : <I.Pause size={20} />}</button>
            <button className="plain" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <I.Mute size={20} /> : <I.Sound size={20} />}</button>
            <button className="plain" aria-label="More"><I.More size={20} /></button>
          </div>
        </div>
        {set.user !== ME && (
          <form className="story-reply" onSubmit={(e) => { e.preventDefault(); sendReply(); }}>
            <input placeholder={`Reply to ${user.username}...`} value={reply} onChange={(e) => setReply(e.target.value)} aria-label="Reply to story" />
            {reply ? <button className="link-btn light">Send</button> : (
              <>
                <button type="button" className={`plain ${liked ? 'liked' : ''}`} onClick={() => setLiked(!liked)} aria-label="Like story">{liked ? <I.HeartFill /> : <I.Heart />}</button>
                <button type="button" className="plain" onClick={() => setReply('🔥')} aria-label="Quick reaction"><I.Send /></button>
              </>
            )}
          </form>
        )}
      </div>
      {(setIdx < sets.length - 1 || itemIdx < set.items.length - 1) && <button className="story-nav right" onClick={next} aria-label="Next"><I.ChevronRight size={16} strokeWidth={3} /></button>}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
