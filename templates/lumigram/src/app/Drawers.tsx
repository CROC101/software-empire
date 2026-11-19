import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { I } from '../components/Icons';
import { Avatar, Media, Spinner, UserName } from '../components/ui';
import { ME } from '../data/mock';
import { fmt, timeAgo, useStore, userByName } from '../store';
import type { Notification } from '../types';
import { useUI } from '../ui-store';

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchDrawer() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim().toLowerCase());
  const pending = q.trim().toLowerCase() !== dq;
  const users = useStore((s) => s.users);
  const posts = useStore((s) => s.posts);
  const recent = useStore((s) => s.recentSearches);
  const { addRecent, removeRecent, clearRecent } = useStore();
  const { setDrawer, openPost } = useUI();
  const nav = useNavigate();

  const results = useMemo(() => {
    if (!dq) return null;
    const term = dq.replace(/^#/, '');
    const us = Object.values(users).filter((u) => u.id !== ME && (u.username.includes(term) || u.name.toLowerCase().includes(term))).slice(0, 8);
    const tagCounts = new Map<string, number>();
    Object.values(posts).forEach((p) => (p.caption.match(/#[\w]+/g) ?? []).forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
    const tags = [...tagCounts].filter(([t]) => t.slice(1).includes(term)).slice(0, 5);
    const ps = Object.values(posts).filter((p) => p.caption.toLowerCase().includes(term) || p.location?.toLowerCase().includes(term)).slice(0, 6);
    return { us, tags, ps };
  }, [dq, users, posts]);

  const goUser = (username: string) => { addRecent(username); nav(`/profile/${username}`); setDrawer(null); };
  const goTag = (tag: string) => { addRecent(tag); nav(`/explore?q=${encodeURIComponent(tag)}`); setDrawer(null); };

  return (
    <aside className="drawer slide-in" aria-label="Search">
      <h2 className="drawer-title">Search</h2>
      <div className="drawer-search">
        <input autoFocus placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search input" />
        {q && (pending ? <Spinner /> : <button className="clear-x" onClick={() => setQ('')} aria-label="Clear"><I.Close size={10} strokeWidth={3} /></button>)}
      </div>
      <div className="drawer-body">
        {!results && (
          <>
            <div className="row between drawer-sub">
              <b>Recent</b>
              {recent.length > 0 && <button className="link-btn" onClick={clearRecent}>Clear all</button>}
            </div>
            {recent.length === 0 && <p className="empty-note">No recent searches.</p>}
            {recent.map((r) => {
              const u = userByName(users, r);
              return (
                <div key={r} className="list-row hoverable" onClick={() => (r.startsWith('#') ? goTag(r) : goUser(r))}>
                  {u ? <Avatar user={u} size={44} /> : <span className="tag-circle">#</span>}
                  <div className="grow">
                    <div className="bold">{r}</div>
                    <div className="muted">{u ? `${u.name} • ${fmt(u.followers)} followers` : 'Hashtag'}</div>
                  </div>
                  <button className="plain muted" onClick={(e) => { e.stopPropagation(); removeRecent(r); }} aria-label={`Remove ${r}`}><I.Close size={16} /></button>
                </div>
              );
            })}
          </>
        )}
        {results && (
          <>
            {results.us.map((u) => (
              <div key={u.id} className="list-row hoverable" onClick={() => goUser(u.username)}>
                <Avatar user={u} size={44} />
                <div className="grow"><div className="bold">{u.username}{u.verified && <I.Verified className="verified" />}</div><div className="muted">{u.name} • {fmt(u.followers)} followers</div></div>
              </div>
            ))}
            {results.tags.map(([t, n]) => (
              <div key={t} className="list-row hoverable" onClick={() => goTag(t)}>
                <span className="tag-circle">#</span>
                <div className="grow"><div className="bold">{t}</div><div className="muted">{n} posts</div></div>
              </div>
            ))}
            {results.ps.length > 0 && <div className="drawer-sub"><b>Posts</b></div>}
            <div className="search-posts">
              {results.ps.map((p) => (
                <button key={p.id} className="plain" onClick={() => { addRecent(dq); openPost(p.id); }} aria-label="Open post">
                  <Media src={p.media[0].src} video={p.media[0].kind === 'video'} playing={false} />
                </button>
              ))}
            </div>
            {!results.us.length && !results.tags.length && !results.ps.length && <p className="empty-note">No results found.</p>}
          </>
        )}
      </div>
    </aside>
  );
}

const DAY = 86400_000;

function NotifRow({ n }: { n: Notification }) {
  const users = useStore((s) => s.users);
  const post = useStore((s) => (n.postId ? s.posts[n.postId] : undefined));
  const following = useStore((s) => s.following);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const openPost = useUI((s) => s.openPost);
  const first = users[n.from[0]];
  const others = n.from.length - 1;
  const verb = { like: 'liked your post.', follow: 'started following you.', comment: `commented: ${n.text}`, mention: `mentioned you in a comment: ${n.text}` }[n.type];
  return (
    <div className="list-row notif">
      <Avatar user={first} size={44} />
      <div className="grow notif-text">
        <UserName user={first} />{others > 0 && <> and <b>{others} other{others > 1 ? 's' : ''}</b></>} {verb} <span className="muted">{timeAgo(n.createdAt)}</span>
      </div>
      {n.type === 'follow' ? (
        <button className={`btn ${following.includes(first.id) ? 'btn-gray' : 'btn-blue'}`} onClick={() => toggleFollow(first.id)}>
          {following.includes(first.id) ? 'Following' : 'Follow'}
        </button>
      ) : post ? (
        <button className="plain notif-thumb" onClick={() => openPost(post.id)} aria-label="Open post"><Media src={post.media[0].src} /></button>
      ) : null}
    </div>
  );
}

export function NotificationsDrawer() {
  const notifs = useStore((s) => s.notifications);
  const now = Date.now();
  const groups: [string, Notification[]][] = [
    ['Today', notifs.filter((n) => now - n.createdAt < DAY)],
    ['This week', notifs.filter((n) => now - n.createdAt >= DAY && now - n.createdAt < 7 * DAY)],
    ['This month', notifs.filter((n) => now - n.createdAt >= 7 * DAY && now - n.createdAt < 30 * DAY)],
    ['Earlier', notifs.filter((n) => now - n.createdAt >= 30 * DAY)],
  ];
  return (
    <aside className="drawer slide-in" aria-label="Notifications">
      <h2 className="drawer-title">Notifications</h2>
      <div className="drawer-body">
        {groups.filter(([, l]) => l.length).map(([g, l]) => (
          <section key={g} className="notif-group">
            <h3>{g}</h3>
            {l.map((n) => <NotifRow key={n.id} n={n} />)}
          </section>
        ))}
        <Link to="/accounts/edit?section=notifications" className="drawer-foot muted">Notification settings</Link>
      </div>
    </aside>
  );
}
