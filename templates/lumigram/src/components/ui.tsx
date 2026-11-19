import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { brand } from '../brand.config';
import { useMediaUrl } from '../lib/idb';
import { fmt, useStore } from '../store';
import type { User } from '../types';
import { Art } from './Art';
import { I } from './Icons';

let gid = 0;
export function LogoMark({ size = 60 }: { size?: number }) {
  const [id] = useState(() => `lg${gid++}`);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`${brand.name} logo`}>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          {brand.logoGradient.map((c, i) => (
            <stop key={c} offset={i / (brand.logoGradient.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="none" stroke={`url(#${id})`} strokeWidth="4.4" />
      <circle cx="24" cy="25" r="8.5" fill="none" stroke={`url(#${id})`} strokeWidth="4.4" />
      <path d="M34.5 9.5l1.3 2.9 2.9 1.3-2.9 1.3-1.3 2.9-1.3-2.9-2.9-1.3 2.9-1.3z" fill={`url(#${id})`} />
    </svg>
  );
}

export const Wordmark = ({ size = 28 }: { size?: number }) => (
  <span className="wordmark" style={{ fontSize: size }}>{brand.name}</span>
);

/** Small company mark shown under the login form (where the parent company mark sits on the original). */
export const CompanyMark = () => (
  <span className="company-mark" aria-label={brand.company}>
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M4.5 1C2.3 1 1 3.4 1 6s1.3 5 3.5 5S8 8 9 6s2.3-5 4.5-5S17 3.4 17 6s-1.3 5-3.5 5S10 8 9 6 6.7 1 4.5 1z" fill="none" stroke="var(--accent)" strokeWidth="1.8" /></svg>
    {brand.company}
  </span>
);

export function Media({ src, alt = '', className, style, video, playing = true, muted = true, variant }: {
  src: string; alt?: string; className?: string; style?: CSSProperties; video?: boolean; playing?: boolean; muted?: boolean; variant?: 'portrait';
}) {
  const url = useMediaUrl(src);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => undefined);
    else v.pause();
  }, [playing, url]);
  if (src.startsWith('art:')) {
    return (
      <div className={`media ${video ? 'media-anim' : ''} ${video && !playing ? 'paused' : ''} ${className ?? ''}`} style={style} role="img" aria-label={alt}>
        <Art seed={Number(src.slice(4))} variant={variant} />
      </div>
    );
  }
  if (!url) return <div className={`media skeleton ${className ?? ''}`} style={style} />;
  return video ? (
    <video ref={ref} className={`media ${className ?? ''}`} style={style} src={url} loop muted={muted} playsInline aria-label={alt} />
  ) : (
    <img className={`media ${className ?? ''}`} style={style} src={url} alt={alt} draggable={false} />
  );
}

export function Avatar({ user, size = 32, ring, seen, onClick }: { user?: User; size?: number; ring?: boolean; seen?: boolean; onClick?: () => void }) {
  if (!user) return <span className="avatar" style={{ width: size, height: size }} />;
  const inner = (
    <span className="avatar" style={{ width: size, height: size }}>
      <Media src={user.avatar} alt={`${user.username}'s profile picture`} variant="portrait" />
    </span>
  );
  if (!ring) return onClick ? <button className="plain" onClick={onClick} aria-label={`Open ${user.username}`}>{inner}</button> : inner;
  return (
    <button type="button" className={`ring ${seen ? 'seen' : ''}`} onClick={onClick} style={{ padding: size > 60 ? 4 : 3 }} aria-label={`Story by ${user.username}`}>
      <span className="ring-gap">{inner}</span>
    </button>
  );
}

export function UserName({ user, children }: { user?: User; children?: ReactNode }) {
  const [show, setShow] = useState(false);
  const t = useRef<number>();
  if (!user) return null;
  return (
    <span
      className="uname-wrap"
      onMouseEnter={() => (t.current = window.setTimeout(() => setShow(true), 450))}
      onMouseLeave={() => { clearTimeout(t.current); setShow(false); }}
    >
      <Link className="uname" to={`/profile/${user.username}`}>
        {children ?? user.username}
        {user.verified && <I.Verified className="verified" />}
      </Link>
      {show && <HoverCard user={user} />}
    </span>
  );
}

function HoverCard({ user }: { user: User }) {
  const posts = useStore((s) => Object.values(s.posts).filter((p) => p.author === user.id).slice(0, 3));
  const following = useStore((s) => s.following.includes(user.id));
  const toggleFollow = useStore((s) => s.toggleFollow);
  return (
    <div className="hovercard pop-in" role="dialog" aria-label={`${user.username} preview`}>
      <div className="row gap12">
        <Avatar user={user} size={56} />
        <div>
          <div className="bold">{user.username}</div>
          <div className="muted">{user.name}</div>
        </div>
      </div>
      <div className="hc-stats">
        <div><b>{posts.length ? fmt(posts.length * 7 + 3) : 0}</b><span>posts</span></div>
        <div><b>{fmt(user.followers)}</b><span>followers</span></div>
        <div><b>{fmt(user.following)}</b><span>following</span></div>
      </div>
      <div className="hc-grid">
        {posts.map((p) => <Media key={p.id} src={p.media[0].src} />)}
      </div>
      {user.id !== 'me' && (
        <button className={`btn ${following ? 'btn-gray' : 'btn-blue'} w100`} onClick={() => toggleFollow(user.id)}>
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}

export function Modal({ onClose, children, className, label, closeButton = true }: {
  onClose: () => void; children: ReactNode; className?: string; label: string; closeButton?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="overlay fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      {closeButton && (
        <button className="overlay-close" onClick={onClose} aria-label="Close">
          <I.Close size={26} />
        </button>
      )}
      <div className={`modal pop-in ${className ?? ''}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return createPortal(<div className="toast slide-up" role="status">{text}</div>, document.body);
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export const Spinner = () => <div className="spinner" aria-label="Loading" />;
