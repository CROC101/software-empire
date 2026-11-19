import { useEffect, useMemo, useRef, useState } from 'react';
import { I } from '../components/Icons';
import { Avatar, Media, UserName } from '../components/ui';
import { fmt, useStore } from '../store';
import type { Post } from '../types';
import { useUI } from '../ui-store';
import { CommentThread } from './PostCard';

function Reel({ post, active, muted, setMuted, onComments }: { post: Post; active: boolean; muted: boolean; setMuted: (m: boolean) => void; onComments: () => void }) {
  const author = useStore((s) => s.users[post.author]);
  const liked = useStore((s) => s.liked.includes(post.id));
  const saved = useStore((s) => s.saved.includes(post.id));
  const following = useStore((s) => s.following.includes(post.author));
  const { toggleLike, toggleSave, toggleFollow } = useStore();
  const openShare = useUI((s) => s.openShare);
  const [playing, setPlaying] = useState(true);
  const [burst, setBurst] = useState(0);
  const [more, setMore] = useState(false);
  const total = post.comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  useEffect(() => setPlaying(active), [active]);
  return (
    <section className="reel" data-id={post.id}>
      <div className="reel-card" onClick={() => setPlaying(!playing)} onDoubleClick={() => { toggleLike(post.id, true); setBurst(burst + 1); }}>
        <Media src={post.media[0].src} video playing={playing && active} muted={muted} style={{ filter: post.media[0].filter }} />
        {!playing && <span className="play-badge big"><I.Play size={56} /></span>}
        {burst > 0 && <I.HeartFill key={burst} className="heart-burst" size={110} />}
        <button className="reel-mute" onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} aria-label={muted ? 'Unmute' : 'Mute'}>
          {muted ? <I.Mute size={16} /> : <I.Sound size={16} />}
        </button>
        <div className="reel-info" onClick={(e) => e.stopPropagation()}>
          <div className="row gap8">
            <Avatar user={author} size={32} />
            <UserName user={author} />
            {post.author !== 'me' && <button className="reel-follow" onClick={() => toggleFollow(post.author)}>{following ? 'Following' : 'Follow'}</button>}
          </div>
          <p className={`reel-cap ${more ? 'open' : ''}`} onClick={() => setMore(!more)}>{post.caption}</p>
          <div className="reel-audio"><I.Music size={12} /><div className="ticker"><span>{post.audio ?? 'Original audio'} · {author.username} · {post.audio ?? 'Original audio'} · </span></div></div>
        </div>
      </div>
      <div className="reel-actions">
        <button className={`ra ${liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)} aria-label="Like">{liked ? <I.HeartFill /> : <I.Heart />}<span>{fmt(post.likes)}</span></button>
        <button className="ra" onClick={onComments} aria-label="Comments"><I.Comment /><span>{total}</span></button>
        <button className="ra" onClick={() => openShare(post.id)} aria-label="Share"><I.Send /></button>
        <button className="ra" onClick={() => toggleSave(post.id)} aria-label="Save">{saved ? <I.BookmarkFill /> : <I.Bookmark />}</button>
        <button className="ra" aria-label="More"><I.More /></button>
        <span className="ra-audio"><Media src={author.avatar} variant="portrait" /></span>
      </div>
    </section>
  );
}

export function Reels() {
  const posts = useStore((s) => s.posts);
  const reels = useMemo(() => Object.values(posts).filter((p) => p.isReel || p.media[0].kind === 'video').sort((a, b) => b.createdAt - a.createdAt), [posts]);
  const [active, setActive] = useState<string | undefined>(reels[0]?.id);
  const [muted, setMuted] = useState(true);
  const [comments, setComments] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.id)), { root, threshold: 0.6 });
    root.querySelectorAll('.reel').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reels.length]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const i = reels.findIndex((r) => r.id === active);
      const n = reels[Math.max(0, Math.min(reels.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      box.current?.querySelector(`[data-id="${n.id}"]`)?.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [active, reels]);

  const go = (d: number) => window.dispatchEvent(new KeyboardEvent('keydown', { key: d > 0 ? 'ArrowDown' : 'ArrowUp' }));
  const cPost = comments ? posts[comments] : undefined;

  return (
    <div className="reels-page">
      <div className="reels" ref={box}>
        {reels.map((p) => <Reel key={p.id} post={p} active={p.id === active} muted={muted} setMuted={setMuted} onComments={() => setComments(p.id)} />)}
      </div>
      <div className="reels-arrows">
        <button onClick={() => go(-1)} aria-label="Previous reel"><I.ChevronUp size={20} /></button>
        <button onClick={() => go(1)} aria-label="Next reel"><I.ChevronDown size={20} /></button>
      </div>
      {cPost && (
        <>
          <div className="sheet-scrim" onClick={() => setComments(null)} />
          <aside className="reel-comments slide-up" aria-label="Comments">
            <header className="modal-head"><span /><b>Comments</b><button className="plain" onClick={() => setComments(null)} aria-label="Close"><I.Close /></button></header>
            <CommentThread post={cPost} showCaption={false} />
          </aside>
        </>
      )}
    </div>
  );
}
