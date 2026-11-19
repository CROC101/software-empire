import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { I } from '../components/Icons';
import { Media } from '../components/ui';
import { exploreCategories } from '../data/mock';
import { fmt, useStore } from '../store';
import type { Post } from '../types';
import { useUI } from '../ui-store';

export function GridTile({ post, tall }: { post: Post; tall?: boolean }) {
  const openPost = useUI((s) => s.openPost);
  const comments = post.comments.length;
  return (
    <button className={`tile ${tall ? 'tall' : ''}`} onClick={() => openPost(post.id)} aria-label={`Open post: ${post.caption.slice(0, 40)}`}>
      <Media src={post.media[0].src} style={{ filter: post.media[0].filter }} video={post.media[0].kind === 'video'} playing={false} />
      {post.media.length > 1 && <span className="tile-badge"><I.Copy size={18} /></span>}
      {post.media[0].kind === 'video' && <span className="tile-badge"><I.Reels size={18} /></span>}
      <span className="tile-hover">
        <span><I.HeartFill size={19} /> {fmt(post.likes)}</span>
        <span><I.Comment size={19} /> {comments}</span>
      </span>
    </button>
  );
}

export function Explore() {
  const posts = useStore((s) => s.posts);
  const loadMore = useStore((s) => s.loadMorePosts);
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [cat, setCat] = useState('For you');
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(24);
  const sentinel = useRef<HTMLDivElement>(null);

  const list = useMemo(() => {
    let l = Object.values(posts).filter((p) => p.author !== 'me');
    if (cat !== 'For you') l = l.filter((p) => p.category === cat);
    if (q) l = l.filter((p) => p.caption.toLowerCase().includes(q.toLowerCase()));
    return l.sort((a, b) => b.likes - a.likes);
  }, [posts, cat, q]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [cat, q]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || loading) return;
      if (count >= list.length) loadMore(12);
      setCount((c) => c + 12);
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, count, list.length, loadMore]);

  return (
    <div className="explore">
      {q && (
        <div className="explore-q">
          <h1>{q}</h1>
          <span className="muted">{list.length} posts</span>
          <button className="link-btn" onClick={() => setSp({})}>Clear</button>
        </div>
      )}
      <div className="pills" role="tablist">
        {exploreCategories.map((c) => (
          <button key={c} role="tab" aria-selected={c === cat} className={`pill-tab ${c === cat ? 'on' : ''}`} onClick={() => { setCat(c); setCount(24); }}>{c}</button>
        ))}
      </div>
      <div className="bento">
        {loading
          ? Array.from({ length: 10 }, (_, i) => <div key={i} className={`tile skeleton ${i % 5 === 2 ? 'tall' : ''}`} />)
          : list.slice(0, count).map((p) => <GridTile key={p.id} post={p} tall={!!p.isReel} />)}
      </div>
      {!loading && list.length === 0 && <p className="empty-note center">No posts in this category yet.</p>}
      <div ref={sentinel} style={{ height: 1 }} />
    </div>
  );
}
