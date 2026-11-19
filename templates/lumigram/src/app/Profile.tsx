import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { I } from '../components/Icons';
import { Avatar, Media, Modal } from '../components/ui';
import { ME } from '../data/mock';
import { putFile } from '../lib/idb';
import { fmt, useMe, useStore, userByName } from '../store';
import type { User } from '../types';
import { useUI } from '../ui-store';
import { GridTile } from './Explore';

export function EditProfileForm({ onDone }: { onDone?: () => void }) {
  const me = useMe();
  const users = useStore((s) => s.users);
  const updateProfile = useStore((s) => s.updateProfile);
  const showToast = useUI((s) => s.showToast);
  const [f, setF] = useState({ name: me.name, username: me.username, website: me.website ?? '', bio: me.bio, gender: me.gender ?? 'Prefer not to say' });
  const [avatar, setAvatar] = useState(me.avatar);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const username = f.username.trim().toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(username)) return setErr('Usernames can only use letters, numbers, underscores and periods.');
    if (Object.values(users).some((u) => u.id !== ME && u.username === username)) return setErr('This username isn’t available.');
    updateProfile({ ...f, username, avatar });
    setErr('');
    showToast('Profile saved.');
    if (username !== me.username && location.pathname.startsWith('/profile/')) nav(`/profile/${username}`, { replace: true });
    onDone?.();
  };
  return (
    <form className="edit-form" onSubmit={submit}>
      <div className="edit-photo">
        <Avatar user={{ ...me, avatar }} size={56} />
        <div className="grow"><b>{me.username}</b><div className="muted">{me.name}</div></div>
        <button type="button" className="btn btn-blue" onClick={() => file.current?.click()}>Change photo</button>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const x = e.target.files?.[0]; if (x) setAvatar(await putFile(x)); }} />
      </div>
      <label className="edit-field"><span>Name</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={64} /></label>
      <label className="edit-field"><span>Username</span><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} maxLength={30} /></label>
      <label className="edit-field"><span>Website</span><input value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} placeholder="Website" /></label>
      <label className="edit-field"><span>Bio</span><textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={150} /><small className="muted">{f.bio.length} / 150</small></label>
      <label className="edit-field"><span>Gender</span>
        <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
          {['Prefer not to say', 'Female', 'Male', 'Custom'].map((g) => <option key={g}>{g}</option>)}
        </select>
      </label>
      {err && <p className="form-error" role="alert">{err}</p>}
      <div className="right"><button className="pill pill-primary submit-sm">Submit</button></div>
    </form>
  );
}

function PeopleModal({ title, ids, onClose }: { title: string; ids: string[]; onClose: () => void }) {
  const users = useStore((s) => s.users);
  const following = useStore((s) => s.following);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  return (
    <Modal onClose={onClose} className="share-modal" label={title} closeButton={false}>
      <header className="modal-head"><span /><b>{title}</b><button className="plain" onClick={onClose} aria-label="Close"><I.Close /></button></header>
      <div className="share-search"><I.Search size={16} /><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" /></div>
      <div className="nm-list">
        {ids.map((id) => users[id]).filter((u) => u && u.username.includes(q.toLowerCase())).map((u) => (
          <div key={u.id} className="list-row">
            <button className="plain" onClick={() => { onClose(); nav(`/profile/${u.username}`); }}><Avatar user={u} size={44} /></button>
            <div className="grow"><div className="bold">{u.username}</div><div className="muted">{u.name}</div></div>
            {u.id !== ME && <button className={`btn ${following.includes(u.id) ? 'btn-gray' : 'btn-blue'}`} onClick={() => toggleFollow(u.id)}>{following.includes(u.id) ? 'Following' : 'Follow'}</button>}
          </div>
        ))}
      </div>
    </Modal>
  );
}

type Tab = 'posts' | 'reels' | 'saved' | 'tagged';

export function Profile() {
  const { username = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const users = useStore((s) => s.users);
  const user: User | undefined = userByName(users, username);
  const posts = useStore((s) => s.posts);
  const saved = useStore((s) => s.saved);
  const collections = useStore((s) => s.collections);
  const following = useStore((s) => s.following);
  const highlights = useStore((s) => s.highlights);
  const hasStory = useStore((s) => s.stories.some((x) => x.user === user?.id));
  const seen = useStore((s) => (user ? s.seenStories.includes(user.id) : false));
  const { toggleFollow, openThreadWith } = useStore();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [people, setPeople] = useState<null | 'followers' | 'following'>(null);
  const [col, setCol] = useState<string | null>(null);
  const tab = (sp.get('tab') as Tab) || 'posts';

  const mine = useMemo(() => (user ? Object.values(posts).filter((p) => p.author === user.id).sort((a, b) => b.createdAt - a.createdAt) : []), [posts, user]);
  if (!user) {
    return (
      <div className="center-col page-pad">
        <h2>Sorry, this page isn't available.</h2>
        <p className="muted">The link you followed may be broken, or the page may have been removed. <Link to="/" className="link-btn">Go back home</Link>.</p>
      </div>
    );
  }
  const isMe = user.id === ME;
  const isFollowing = following.includes(user.id);
  const followerIds = Object.keys(users).filter((id) => id !== user.id).slice(0, 12);
  const followingIds = isMe ? following : Object.keys(users).filter((id) => id !== user.id).slice(3, 11);
  const grid =
    tab === 'reels' ? mine.filter((p) => p.isReel)
      : tab === 'saved' ? (col ? collections.find((c) => c.id === col)?.postIds ?? [] : saved).map((id) => posts[id]).filter(Boolean)
        : tab === 'tagged' ? Object.values(posts).filter((p) => p.tagged?.includes(user.id))
          : mine;
  const postCount = mine.length;
  const tabs: [Tab, string, JSX.Element][] = [
    ['posts', 'Posts', <I.Grid size={12} />], ['reels', 'Reels', <I.Reels size={12} />],
    ...(isMe ? [['saved', 'Saved', <I.Bookmark size={12} />] as [Tab, string, JSX.Element]] : []), ['tagged', 'Tagged', <I.Tag size={12} />],
  ];
  const userHl = highlights.filter((h) => h.user === user.id);

  return (
    <div className="profile">
      <header className="prof-head">
        <div className="prof-av">
          {hasStory ? <Avatar user={user} size={150} ring seen={seen} onClick={() => nav(`/stories/${user.username}`)} /> : <Avatar user={user} size={150} />}
        </div>
        <section className="prof-info">
          <div className="prof-row1">
            <h1 className="prof-name">{user.username}{user.verified && <I.Verified size={18} className="verified" />}</h1>
            <div className="prof-btns">
              {isMe ? (
                <>
                  <button className="btn btn-gray" onClick={() => setEdit(true)}>Edit profile</button>
                  <Link className="btn btn-gray" to="/accounts/edit?section=activity">View archive</Link>
                  <Link className="plain" to="/accounts/edit" aria-label="Settings"><I.Settings /></Link>
                </>
              ) : (
                <>
                  <button className={`btn ${isFollowing ? 'btn-gray' : 'btn-blue'}`} onClick={() => toggleFollow(user.id)}>
                    {isFollowing ? <>Following <I.ChevronDown size={12} /></> : 'Follow'}
                  </button>
                  <button className="btn btn-gray" onClick={() => nav(`/direct/t/${openThreadWith(user.id)}`)}>Message</button>
                  <button className="plain" aria-label="Options"><I.More /></button>
                </>
              )}
            </div>
          </div>
          <ul className="prof-stats">
            <li><b>{fmt(postCount)}</b> posts</li>
            <li><button className="plain" onClick={() => setPeople('followers')}><b>{fmt(user.followers)}</b> followers</button></li>
            <li><button className="plain" onClick={() => setPeople('following')}><b>{fmt(user.following)}</b> following</button></li>
          </ul>
          <div className="prof-bio">
            <b>{user.name}</b>
            {user.category && <div className="muted">{user.category}</div>}
            <p>{user.bio}</p>
            {user.website && <a className="prof-link" href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer"><I.Link size={12} /> {user.website}</a>}
          </div>
        </section>
      </header>

      <div className="highlights">
        {userHl.map((h) => (
          <button key={h.id} className="hl" onClick={() => nav(`/stories/${user.username}?h=${h.id}`)}>
            <span className="hl-ring"><Media src={h.items[0].src} /></span>
            <span className="hl-name">{h.title}</span>
          </button>
        ))}
        {isMe && (
          <button className="hl" onClick={() => useUI.getState().setCreate(true)}>
            <span className="hl-ring new"><I.Plus size={40} strokeWidth={1} /></span>
            <span className="hl-name">New</span>
          </button>
        )}
      </div>

      <ul className="prof-stats mobile">
        <li><b>{fmt(postCount)}</b><span>posts</span></li>
        <li><button className="plain" onClick={() => setPeople('followers')}><b>{fmt(user.followers)}</b><span>followers</span></button></li>
        <li><button className="plain" onClick={() => setPeople('following')}><b>{fmt(user.following)}</b><span>following</span></button></li>
      </ul>

      <nav className="prof-tabs" role="tablist">
        {tabs.map(([k, label, icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => { setSp(k === 'posts' ? {} : { tab: k }); setCol(null); }}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </nav>

      {tab === 'saved' && (
        <div className="collections">
          <button className={`col-chip ${col === null ? 'on' : ''}`} onClick={() => setCol(null)}>All posts ({saved.length})</button>
          {collections.map((c) => <button key={c.id} className={`col-chip ${col === c.id ? 'on' : ''}`} onClick={() => setCol(c.id)}>{c.name} ({c.postIds.length})</button>)}
        </div>
      )}

      {grid.length > 0 ? (
        <div className="prof-grid">{grid.map((p) => <GridTile key={p.id} post={p} />)}</div>
      ) : (
        <div className="prof-empty">
          <span className="empty-ic">{tab === 'saved' ? <I.Bookmark size={34} /> : tab === 'tagged' ? <I.Tag size={34} /> : <I.Image size={34} />}</span>
          <h2>{tab === 'saved' ? 'Save' : tab === 'tagged' ? 'Photos of you' : isMe ? 'Share photos' : 'No posts yet'}</h2>
          <p className="muted">{tab === 'saved' ? 'Save photos and videos that you want to see again.' : tab === 'tagged' ? 'When people tag you in photos, they’ll appear here.' : isMe ? 'When you share photos, they will appear on your profile.' : ''}</p>
          {isMe && tab === 'posts' && <button className="link-btn" onClick={() => useUI.getState().setCreate(true)}>Share your first photo</button>}
        </div>
      )}

      {edit && (
        <Modal onClose={() => setEdit(false)} className="edit-modal" label="Edit profile" closeButton={false}>
          <header className="modal-head"><span /><b>Edit profile</b><button className="plain" onClick={() => setEdit(false)} aria-label="Close"><I.Close /></button></header>
          <EditProfileForm onDone={() => setEdit(false)} />
        </Modal>
      )}
      {people && <PeopleModal title={people === 'followers' ? 'Followers' : 'Following'} ids={people === 'followers' ? followerIds : followingIds} onClose={() => setPeople(null)} />}
    </div>
  );
}
