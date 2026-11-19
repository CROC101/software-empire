import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { I } from '../components/Icons';
import { Avatar, Media, Modal } from '../components/ui';
import { ME } from '../data/mock';
import { putFile } from '../lib/idb';
import { timeAgo, useMe, useStore } from '../store';
import type { Message, Thread } from '../types';
import { useUI } from '../ui-store';

const EMOJI = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function preview(t: Thread) {
  const m = t.messages[t.messages.length - 1];
  if (!m) return 'Start a conversation';
  const who = m.from === ME ? 'You: ' : '';
  return who + (m.text ?? (m.postId ? 'Sent a post' : m.image ? 'Sent a photo' : ''));
}

function NewMessage({ onClose }: { onClose: () => void }) {
  const users = useStore((s) => s.users);
  const openThreadWith = useStore((s) => s.openThreadWith);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const list = Object.values(users).filter((u) => u.id !== ME && (u.username.includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <Modal onClose={onClose} className="share-modal" label="New message" closeButton={false}>
      <header className="modal-head"><span /><b>New message</b><button className="plain" onClick={onClose} aria-label="Close"><I.Close /></button></header>
      <div className="share-search"><b>To:</b><input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus aria-label="Search people" /></div>
      <div className="nm-list">
        {list.map((u) => (
          <button key={u.id} className="list-row hoverable w100" onClick={() => { nav(`/direct/t/${openThreadWith(u.id)}`); onClose(); }}>
            <Avatar user={u} size={44} /><div className="grow left"><div className="bold">{u.name}</div><div className="muted">{u.username}</div></div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Bubble({ m, threadId, mine, showAvatar }: { m: Message; threadId: string; mine: boolean; showAvatar: boolean }) {
  const users = useStore((s) => s.users);
  const post = useStore((s) => (m.postId ? s.posts[m.postId] : undefined));
  const react = useStore((s) => s.reactToMessage);
  const openPost = useUI((s) => s.openPost);
  const [picker, setPicker] = useState(false);
  const from = users[m.from];
  return (
    <div className={`msg ${mine ? 'mine' : ''}`} onDoubleClick={() => react(threadId, m.id, '❤️')}>
      {!mine && <span className="msg-av">{showAvatar && <Avatar user={from} size={28} />}</span>}
      <div className="msg-body">
        {post && (
          <button className="msg-post" onClick={() => openPost(post.id)}>
            <span className="row gap8 msg-post-head"><Avatar user={users[post.author]} size={24} /><b>{users[post.author].username}</b></span>
            <Media src={post.media[0].src} style={{ filter: post.media[0].filter }} />
            <span className="msg-post-cap">{post.caption}</span>
          </button>
        )}
        {m.image && !post && <Media src={m.image} className="msg-img" />}
        {m.text && <div className="bubble">{m.text}</div>}
        {m.reactions.length > 0 && <span className="msg-reacts" onClick={() => react(threadId, m.id, m.reactions[0])}>{m.reactions.join('')}</span>}
      </div>
      <div className="msg-tools">
        <button className="plain" onClick={() => setPicker(!picker)} aria-label="React"><I.Smile size={16} /></button>
        {picker && (
          <div className="emoji-picker pop-in">
            {EMOJI.map((e) => <button key={e} onClick={() => { react(threadId, m.id, e); setPicker(false); }}>{e}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Chat({ thread }: { thread: Thread }) {
  const user = useStore((s) => s.users[thread.with]);
  const typing = useStore((s) => s.typing[thread.id]);
  const { sendMessage, markThreadRead } = useStore();
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => markThreadRead(thread.id), [thread.id, markThreadRead]);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [thread.messages.length, typing]);
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    sendMessage(thread.id, { text: text.trim() });
    setText('');
  };
  const sendImage = async (f?: File) => {
    if (!f) return;
    sendMessage(thread.id, { image: await putFile(f) });
  };
  return (
    <section className="chat">
      <header className="chat-head">
        <Link to="/direct/inbox" className="plain chat-back" aria-label="Back"><I.ChevronLeft /></Link>
        <span className="presence"><Avatar user={user} size={44} />{user.active && <i className="dot" />}</span>
        <div className="grow">
          <Link to={`/profile/${user.username}`} className="bold">{user.name}</Link>
          <div className="muted tiny-text">{user.active ? 'Active now' : `Active ${timeAgo(Date.now() - 3 * 3600_000)} ago`}</div>
        </div>
        <button className="icon-btn" aria-label="Audio call"><I.Phone /></button>
        <button className="icon-btn" aria-label="Video call"><I.Video /></button>
        <button className="icon-btn" aria-label="Conversation information"><I.Info /></button>
      </header>
      <div className="chat-body">
        <div className="chat-intro">
          <Avatar user={user} size={96} />
          <b className="big">{user.name}</b>
          <span className="muted">{user.username} · Lumigram</span>
          <Link to={`/profile/${user.username}`} className="btn btn-gray">View profile</Link>
        </div>
        {thread.messages.map((m, i) => {
          const nextMsg = thread.messages[i + 1];
          const gap = i === 0 || m.createdAt - thread.messages[i - 1].createdAt > 3600_000;
          return (
            <div key={m.id}>
              {gap && <div className="chat-time">{new Date(m.createdAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</div>}
              <Bubble m={m} threadId={thread.id} mine={m.from === ME} showAvatar={!nextMsg || nextMsg.from !== m.from} />
            </div>
          );
        })}
        {typing && (
          <div className="msg"><span className="msg-av"><Avatar user={user} size={28} /></span><div className="bubble typing" aria-label="typing"><i /><i /><i /></div></div>
        )}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={send}>
        <button type="button" className="plain" onClick={() => setText(text + '😊')} aria-label="Emoji"><I.Smile /></button>
        <input placeholder="Message..." value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
        {text.trim() ? <button className="link-btn">Send</button> : (
          <>
            <button type="button" className="plain" onClick={() => file.current?.click()} aria-label="Send photo"><I.Image /></button>
            <button type="button" className="plain" onClick={() => sendMessage(thread.id, { text: '❤️' })} aria-label="Send a like"><I.Heart /></button>
          </>
        )}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => sendImage(e.target.files?.[0])} />
      </form>
    </section>
  );
}

export function Direct() {
  const { threadId } = useParams();
  const me = useMe();
  const threads = useStore((s) => s.threads);
  const users = useStore((s) => s.users);
  const [compose, setCompose] = useState(false);
  const [tab, setTab] = useState<'primary' | 'requests'>('primary');
  const thread = threads.find((t) => t.id === threadId);
  const sorted = [...threads].sort((a, b) => (b.messages.at(-1)?.createdAt ?? Infinity) - (a.messages.at(-1)?.createdAt ?? Infinity));
  return (
    <div className={`direct ${thread ? 'has-thread' : ''}`}>
      <aside className="inbox">
        <header className="inbox-head">
          <b className="big">{me.username} <I.ChevronDown size={14} /></b>
          <button className="plain" onClick={() => setCompose(true)} aria-label="New message"><I.Edit /></button>
        </header>
        <div className="inbox-notes">
          <div className="tray-item"><Avatar user={me} size={64} /><span className="tray-name muted">Your note</span></div>
          {threads.slice(0, 4).map((t) => (
            <div key={t.id} className="tray-item"><span className="presence"><Avatar user={users[t.with]} size={64} />{users[t.with].active && <i className="dot" />}</span><span className="tray-name">{users[t.with].username}</span></div>
          ))}
        </div>
        <div className="inbox-tabs">
          <button className={tab === 'primary' ? 'on' : ''} onClick={() => setTab('primary')}>Messages</button>
          <button className={tab === 'requests' ? 'on' : ''} onClick={() => setTab('requests')}>Requests</button>
        </div>
        {tab === 'requests' ? <p className="empty-note center">No message requests.</p> : sorted.map((t) => {
          const u = users[t.with];
          return (
            <Link key={t.id} to={`/direct/t/${t.id}`} className={`list-row hoverable thread-row ${t.id === threadId ? 'sel' : ''} ${t.unread ? 'unread' : ''}`}>
              <span className="presence"><Avatar user={u} size={56} />{u.active && <i className="dot" />}</span>
              <div className="grow ellipsis">
                <div>{u.name}</div>
                <div className="muted ellipsis">{preview(t)}{t.messages.length > 0 && ` · ${timeAgo(t.messages[t.messages.length - 1].createdAt)}`}</div>
              </div>
              {t.unread && <i className="unread-dot" />}
            </Link>
          );
        })}
      </aside>
      {thread ? <Chat key={thread.id} thread={thread} /> : (
        <section className="chat empty">
          <span className="empty-ic"><I.Send size={48} strokeWidth={1.4} /></span>
          <h2>Your messages</h2>
          <p className="muted">Send a message to start a chat.</p>
          <button className="pill pill-primary" onClick={() => setCompose(true)}>Send message</button>
        </section>
      )}
      {compose && <NewMessage onClose={() => setCompose(false)} />}
    </div>
  );
}
