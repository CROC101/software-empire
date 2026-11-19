import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { brand } from '../brand.config';
import { I } from '../components/Icons';
import { Avatar, UserName } from '../components/ui';
import { ME } from '../data/mock';
import { fmt, useMe, useStore } from '../store';
import type { Post } from '../types';
import { PostCard } from './PostCard';

export function StoryTray() {
  const stories = useStore((s) => s.stories);
  const users = useStore((s) => s.users);
  const seen = useStore((s) => s.seenStories);
  const me = useMe();
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const hasMine = stories.some((s) => s.user === ME);
  // Unseen first, like the real tray.
  const ordered = [...stories.filter((s) => s.user !== ME)].sort((a, b) => Number(seen.includes(a.user)) - Number(seen.includes(b.user)));
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 320, behavior: 'smooth' });
  return (
    <div className="tray-wrap">
      <div className="tray" ref={ref}>
        <div className="tray-item">
          {hasMine ? <Avatar user={me} size={56} ring seen={seen.includes(ME)} onClick={() => nav(`/stories/${me.username}`)} /> : (
            <span className="tray-mine"><Avatar user={me} size={62} /><span className="tray-plus"><I.Plus size={12} strokeWidth={3} /></span></span>
          )}
          <span className="tray-name">Your story</span>
        </div>
        {ordered.map((s) => (
          <div key={s.user} className="tray-item">
            <Avatar user={users[s.user]} size={56} ring seen={seen.includes(s.user)} onClick={() => nav(`/stories/${users[s.user].username}`)} />
            <span className={`tray-name ${seen.includes(s.user) ? 'muted' : ''}`}>{users[s.user].username}</span>
          </div>
        ))}
      </div>
      <button className="tray-arrow left" onClick={() => scroll(-1)} aria-label="Scroll stories left"><I.ChevronLeft size={14} strokeWidth={3} /></button>
      <button className="tray-arrow right" onClick={() => scroll(1)} aria-label="Scroll stories right"><I.ChevronRight size={14} strokeWidth={3} /></button>
    </div>
  );
}

export const PostSkeleton = () => (
  <div className="post skel-post" aria-hidden="true">
    <div className="row gap12"><span className="skeleton circle" style={{ width: 32, height: 32 }} /><span className="skeleton line" style={{ width: 140 }} /></div>
    <div className="skeleton" style={{ aspectRatio: '1', margin: '12px 0', borderRadius: 4 }} />
    <span className="skeleton line" style={{ width: '60%' }} />
    <span className="skeleton line" style={{ width: '40%' }} />
  </div>
);

function Suggestions() {
  const me = useMe();
  const users = useStore((s) => s.users);
  const following = useStore((s) => s.following);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const logout = useStore((s) => s.logout);
  const [shown] = useState(() => Object.values(users).filter((u) => u.id !== ME && !following.includes(u.id)).slice(0, 5).map((u) => u.id));
  return (
    <aside className="suggest">
      <div className="list-row">
        <Link to={`/profile/${me.username}`}><Avatar user={me} size={44} /></Link>
        <div className="grow"><div className="bold">{me.username}</div><div className="muted">{me.name}</div></div>
        <button className="link-btn" onClick={logout}>Switch</button>
      </div>
      <div className="row between suggest-head"><span className="muted bold">Suggested for you</span><Link to="/explore" className="link-plain">See All</Link></div>
      {shown.map((id) => {
        const u = users[id];
        const on = following.includes(id);
        return (
          <div key={id} className="list-row">
            <Avatar user={u} size={44} />
            <div className="grow"><UserName user={u} /><div className="muted tiny-text">Suggested for you · {fmt(u.followers)} followers</div></div>
            <button className={on ? 'link-plain' : 'link-btn'} onClick={() => toggleFollow(id)}>{on ? 'Following' : 'Follow'}</button>
          </div>
        );
      })}
      <nav className="suggest-links">
        {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', `${brand.company} Verified`].map((t) => (
          <Link key={t} to={t === 'Privacy' ? '/legal/privacy/' : '/legal/terms/'}>{t}</Link>
        ))}
      </nav>
      <p className="muted tiny-text upper">© {brand.year} {brand.name.toUpperCase()} FROM {brand.company.toUpperCase()}</p>
    </aside>
  );
}

/** "For you" ranks by engagement + freshness + whether you follow the author; "Following" is newest-first from people you follow. */
export function rankFeed(posts: Post[], following: string[], tab: 'foryou' | 'following', now = Date.now()): Post[] {
  if (tab === 'following') return posts.filter((p) => following.includes(p.author) || p.author === ME).sort((a, b) => b.createdAt - a.createdAt);
  const score = (p: Post) => Math.log10(p.likes + 10) * 2 + (following.includes(p.author) ? 1.5 : 0) + (p.author === ME ? 50 : 0) - (now - p.createdAt) / 3.6e6 / 24;
  return [...posts].sort((a, b) => score(b) - score(a));
}

export function Home() {
  const posts = useStore((s) => s.posts);
  const following = useStore((s) => s.following);
  const loadMore = useStore((s) => s.loadMorePosts);
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const sentinel = useRef<HTMLDivElement>(null);
  const feed = useMemo(() => rankFeed(Object.values(posts), following, tab), [posts, following, tab]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [tab]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || loading) return;
      setLoading(true);
      setTimeout(() => {
        if (count + 6 > feed.length) loadMore(12);
        setCount((c) => c + 6);
        setLoading(false);
      }, 700);
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, count, feed.length, loadMore]);

  return (
    <div className="home">
      <div className="feed-col">
        <StoryTray />
        <div className="feed-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'foryou'} className={tab === 'foryou' ? 'on' : ''} onClick={() => { setTab('foryou'); setCount(6); }}>For you</button>
          <button role="tab" aria-selected={tab === 'following'} className={tab === 'following' ? 'on' : ''} onClick={() => { setTab('following'); setCount(6); }}>Following</button>
        </div>
        {feed.slice(0, count).map((p) => <PostCard key={p.id} post={p} />)}
        {loading && <><PostSkeleton /><PostSkeleton /></>}
        {!loading && count >= feed.length && tab === 'following' && <p className="empty-note center">You're all caught up ✓</p>}
        <div ref={sentinel} style={{ height: 1 }} />
      </div>
      <Suggestions />
    </div>
  );
}
