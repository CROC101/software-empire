import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { I } from '../components/Icons';
import { Avatar, Media, Modal, UserName } from '../components/ui';
import { ME } from '../data/mock';
import { fmt, timeAgo, useStore } from '../store';
import type { Comment, Post } from '../types';
import { useUI } from '../ui-store';

const countComments = (list: Comment[]): number => list.reduce((n, c) => n + 1 + countComments(c.replies), 0);

/** Media with swipe/arrow paging, double-tap like and a heart burst. */
export function Carousel({ post, onDoubleLike, fit }: { post: Post; onDoubleLike?: () => void; fit?: boolean }) {
  const [i, setI] = useState(0);
  const [burst, setBurst] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const lastTap = useRef(0);
  const m = post.media[i];
  const n = post.media.length;
  const tap = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleLike?.();
      setBurst((b) => b + 1);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      if (m.kind === 'video') {
        const t = e.currentTarget;
        setTimeout(() => lastTap.current && t && setPlaying((p) => !p), 310);
      }
    }
  };
  const aspect = fit ? undefined : Math.max(m.aspect ?? 1, 4 / 5);
  return (
    <div className="carousel" style={aspect ? { aspectRatio: String(aspect) } : undefined} onClick={tap}>
      <div className="carousel-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {post.media.map((x, k) => (
          <Media key={k} src={x.src} video={x.kind === 'video'} playing={playing && k === i} muted={muted} style={{ filter: x.filter }} alt={`Photo by ${post.author}`} />
        ))}
      </div>
      {burst > 0 && <I.HeartFill key={burst} className="heart-burst" size={96} />}
      {m.kind === 'video' && (
        <>
          {!playing && <span className="play-badge"><I.Play size={40} /></span>}
          <button className="mute-btn" onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <I.Mute size={14} /> : <I.Sound size={14} />}
          </button>
        </>
      )}
      {i > 0 && <button className="car-arrow left" onClick={(e) => { e.stopPropagation(); setI(i - 1); }} aria-label="Previous"><I.ChevronLeft size={16} strokeWidth={3} /></button>}
      {i < n - 1 && <button className="car-arrow right" onClick={(e) => { e.stopPropagation(); setI(i + 1); }} aria-label="Next"><I.ChevronRight size={16} strokeWidth={3} /></button>}
      {n > 1 && <div className="car-dots">{post.media.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>}
    </div>
  );
}

function SaveButton({ postId }: { postId: string }) {
  const saved = useStore((s) => s.saved.includes(postId));
  const collections = useStore((s) => s.collections);
  const { toggleSave, addToCollection, createCollection } = useStore();
  const [menu, setMenu] = useState(false);
  const [name, setName] = useState('');
  return (
    <span className="save-wrap">
      <button className="icon-btn" onClick={() => { toggleSave(postId); setMenu(!saved); }} aria-label={saved ? 'Remove' : 'Save'}>
        {saved ? <I.BookmarkFill /> : <I.Bookmark />}
      </button>
      {menu && (
        <div className="save-menu pop-in" role="dialog" aria-label="Save to collection">
          <div className="row between"><b>Save to collection</b><button className="plain" onClick={() => setMenu(false)} aria-label="Close"><I.Close size={16} /></button></div>
          {collections.map((c) => (
            <label key={c.id} className="row gap8 save-col">
              <input type="checkbox" checked={c.postIds.includes(postId)} onChange={() => addToCollection(c.id, postId)} />{c.name}
            </label>
          ))}
          <form className="row gap8" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { createCollection(name.trim(), postId); setName(''); } }}>
            <input className="input-sm" placeholder="New collection" value={name} onChange={(e) => setName(e.target.value)} aria-label="New collection name" />
            <button className="link-btn" disabled={!name.trim()}>Add</button>
          </form>
        </div>
      )}
    </span>
  );
}

export function ActionBar({ post, onComment }: { post: Post; onComment: () => void }) {
  const liked = useStore((s) => s.liked.includes(post.id));
  const toggleLike = useStore((s) => s.toggleLike);
  const openShare = useUI((s) => s.openShare);
  return (
    <div className="actions">
      <button className={`icon-btn ${liked ? 'liked pulse' : ''}`} onClick={() => toggleLike(post.id)} aria-label={liked ? 'Unlike' : 'Like'}>
        {liked ? <I.HeartFill /> : <I.Heart />}
      </button>
      <button className="icon-btn" onClick={onComment} aria-label="Comment"><I.Comment /></button>
      <button className="icon-btn" onClick={() => openShare(post.id)} aria-label="Share"><I.Send /></button>
      <span className="grow" />
      <SaveButton postId={post.id} />
    </div>
  );
}

function Likes({ post }: { post: Post }) {
  const hide = useStore((s) => s.settings.hideLikeCounts);
  if (hide && post.author !== ME) return <div className="likes">Liked by others</div>;
  return <div className="likes">{fmt(post.likes)} likes</div>;
}

export function PostCard({ post }: { post: Post }) {
  const author = useStore((s) => s.users[post.author]);
  const hasStory = useStore((s) => s.stories.some((x) => x.user === post.author));
  const seen = useStore((s) => s.seenStories.includes(post.author));
  const toggleLike = useStore((s) => s.toggleLike);
  const addComment = useStore((s) => s.addComment);
  const openPost = useUI((s) => s.openPost);
  const [more, setMore] = useState(false);
  const [text, setText] = useState('');
  const [mine, setMine] = useState<string[]>([]);
  const total = countComments(post.comments);
  const long = post.caption.length > 60;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(post.id, text.trim());
    setMine([...mine, text.trim()]);
    setText('');
  };
  return (
    <article className="post">
      <header className="post-head">
        {hasStory ? (
          <Link to={`/stories/${author.username}`}><Avatar user={author} size={32} ring seen={seen} /></Link>
        ) : <Avatar user={author} size={32} />}
        <div className="grow post-who">
          <div><UserName user={author} /> <span className="muted">• {timeAgo(post.createdAt)}</span></div>
          {post.location && <div className="post-loc">{post.location}</div>}
          {post.audio && !post.location && <div className="post-loc">♫ {post.audio}</div>}
        </div>
        <button className="icon-btn" aria-label="More options" onClick={() => openPost(post.id)}><I.More /></button>
      </header>
      <Carousel post={post} onDoubleLike={() => toggleLike(post.id, true)} />
      <ActionBar post={post} onComment={() => openPost(post.id)} />
      <Likes post={post} />
      <div className="caption">
        <UserName user={author} />{' '}
        {long && !more ? <>{post.caption.slice(0, 60)}… <button className="link-muted" onClick={() => setMore(true)}>more</button></> : post.caption}
      </div>
      {total > 0 && <button className="link-muted" onClick={() => openPost(post.id)}>View all {total} comments</button>}
      {mine.map((m, k) => <div key={k} className="caption"><b>{useStore.getState().users[ME].username}</b> {m}</div>)}
      <form className="add-comment" onSubmit={submit}>
        <input placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Add a comment" />
        {text && <button className="link-btn">Post</button>}
      </form>
    </article>
  );
}

function CommentItem({ c, onReply, depth = 0 }: { c: Comment; onReply: (c: Comment) => void; depth?: number }) {
  const author = useStore((s) => s.users[c.author]);
  const liked = useStore((s) => s.likedComments.includes(c.id));
  const toggle = useStore((s) => s.toggleCommentLike);
  const [open, setOpen] = useState(c.author === ME || c.replies.some((r) => r.author === ME));
  return (
    <div className="comment">
      <Avatar user={author} size={32} />
      <div className="grow">
        <div><UserName user={author} /> {c.text}</div>
        <div className="comment-meta">
          <span>{timeAgo(c.createdAt)}</span>
          {c.likes + (liked ? 1 : 0) > 0 && <span>{c.likes + (liked ? 1 : 0)} likes</span>}
          <button className="link-muted" onClick={() => onReply(c)}>Reply</button>
        </div>
        {c.replies.length > 0 && (
          <button className="link-muted view-replies" onClick={() => setOpen(!open)}>
            <i /> {open ? 'Hide replies' : `View replies (${c.replies.length})`}
          </button>
        )}
        {open && c.replies.map((r) => <CommentItem key={r.id} c={r} onReply={() => onReply(c)} depth={depth + 1} />)}
      </div>
      <button className={`icon-btn tiny ${liked ? 'liked' : ''}`} onClick={() => toggle(c.id)} aria-label="Like comment">
        {liked ? <I.HeartFill size={12} /> : <I.Heart size={12} />}
      </button>
    </div>
  );
}

/** Comment list + reply box, shared by the post lightbox and the reels drawer. */
export function CommentThread({ post, showCaption = true }: { post: Post; showCaption?: boolean }) {
  const author = useStore((s) => s.users[post.author]);
  const users = useStore((s) => s.users);
  const addComment = useStore((s) => s.addComment);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(post.id, text.trim(), replyTo?.id);
    setText('');
    setReplyTo(null);
  };
  return (
    <>
      <div className="comments">
        {showCaption && (
          <div className="comment">
            <Avatar user={author} size={32} />
            <div className="grow"><UserName user={author} /> {post.caption}<div className="comment-meta"><span>{timeAgo(post.createdAt)}</span></div></div>
          </div>
        )}
        {post.comments.map((c) => (
          <CommentItem key={c.id} c={c} onReply={(x) => { setReplyTo(x); setText(`@${users[x.author].username} `); input.current?.focus(); }} />
        ))}
        {post.comments.length === 0 && <p className="empty-note center">No comments yet. Start the conversation.</p>}
      </div>
      <form className="add-comment boxed" onSubmit={submit}>
        <I.Smile />
        {replyTo && <button type="button" className="reply-chip" onClick={() => { setReplyTo(null); setText(''); }}>Replying to @{users[replyTo.author].username} ✕</button>}
        <input ref={input} placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Add a comment" />
        <button className="link-btn" disabled={!text.trim()}>Post</button>
      </form>
    </>
  );
}

export function PostModal({ postId }: { postId: string }) {
  const post = useStore((s) => s.posts[postId]);
  const author = useStore((s) => (post ? s.users[post.author] : undefined));
  const toggleLike = useStore((s) => s.toggleLike);
  const following = useStore((s) => (post ? s.following.includes(post.author) : false));
  const toggleFollow = useStore((s) => s.toggleFollow);
  const openPost = useUI((s) => s.openPost);
  const ids = useStore((s) => Object.keys(s.posts));
  if (!post || !author) return null;
  const idx = ids.indexOf(postId);
  return (
    <Modal onClose={() => openPost(null)} className="post-modal" label="Post">
      <div className="pm-media"><Carousel post={post} fit onDoubleLike={() => toggleLike(post.id, true)} /></div>
      <div className="pm-side">
        <header className="post-head bordered">
          <Avatar user={author} size={32} />
          <div className="grow"><UserName user={author} />{post.author !== ME && <> • <button className="link-btn" onClick={() => toggleFollow(post.author)}>{following ? 'Following' : 'Follow'}</button></>}
            {post.location && <div className="post-loc">{post.location}</div>}
          </div>
        </header>
        <CommentThread post={post} />
        <div className="pm-foot">
          <ActionBar post={post} onComment={() => (document.querySelector('.post-modal .add-comment input') as HTMLInputElement | null)?.focus()} />
          <Likes post={post} />
          <div className="muted tiny-text">{timeAgo(post.createdAt, true)}</div>
        </div>
      </div>
      {idx > 0 && <button className="pm-nav left" onClick={() => openPost(ids[idx - 1])} aria-label="Previous post"><I.ChevronLeft size={18} strokeWidth={3} /></button>}
      {idx < ids.length - 1 && <button className="pm-nav right" onClick={() => openPost(ids[idx + 1])} aria-label="Next post"><I.ChevronRight size={18} strokeWidth={3} /></button>}
    </Modal>
  );
}

export function ShareModal({ postId }: { postId: string }) {
  const users = useStore((s) => s.users);
  const following = useStore((s) => s.following);
  const { openThreadWith, sendMessage } = useStore();
  const { openShare, showToast } = useUI();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const list = Object.values(users).filter((u) => u.id !== ME && (!q || u.username.includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase())));
  list.sort((a, b) => Number(following.includes(b.id)) - Number(following.includes(a.id)));
  const send = () => {
    sel.forEach((uid) => {
      const t = openThreadWith(uid);
      sendMessage(t, { postId });
      if (note.trim()) sendMessage(t, { text: note.trim() });
    });
    openShare(null);
    showToast(`Sent to ${sel.length} ${sel.length > 1 ? 'people' : 'person'}`);
  };
  return (
    <Modal onClose={() => openShare(null)} className="share-modal" label="Share" closeButton={false}>
      <header className="modal-head"><span /><b>Share</b><button className="plain" onClick={() => openShare(null)} aria-label="Close"><I.Close /></button></header>
      <div className="share-search"><I.Search size={16} /><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" autoFocus /></div>
      <div className="share-grid">
        {list.map((u) => (
          <button key={u.id} className={`share-person ${sel.includes(u.id) ? 'on' : ''}`} onClick={() => setSel(sel.includes(u.id) ? sel.filter((x) => x !== u.id) : [...sel, u.id])}>
            <span className="share-av"><Avatar user={u} size={64} />{sel.includes(u.id) && <span className="share-check"><I.Check size={12} strokeWidth={4} /></span>}</span>
            <span className="share-name">{u.name}</span>
          </button>
        ))}
      </div>
      <div className="share-foot">
        {sel.length > 0 ? (
          <>
            <input className="share-note" placeholder="Write a message..." value={note} onChange={(e) => setNote(e.target.value)} aria-label="Message" />
            <button className="pill pill-primary w100" onClick={send}>Send{sel.length > 1 ? ' separately' : ''}</button>
          </>
        ) : (
          <div className="share-actions">
            <button className="share-act" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/?post=${postId}`); showToast('Link copied to clipboard'); openShare(null); }}>
              <span><I.Link /></span>Copy link
            </button>
            <button className="share-act" onClick={() => { useStore.getState().addStory(useStore.getState().posts[postId].media[0].src); showToast('Added to your story'); openShare(null); }}>
              <span><I.Plus /></span>Add to story
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
