import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { I } from '../components/Icons';
import { Modal, Toggle } from '../components/ui';
import { fmt, useMe, useStore } from '../store';
import type { Settings as S, ThemeMode } from '../types';
import { EditProfileForm } from './Profile';

const SECTIONS: [string, string, ReactNode][] = [
  ['profile', 'Edit profile', <I.User size={22} />],
  ['notifications', 'Notifications', <I.Bell size={22} />],
  ['privacy', 'Account privacy', <I.Lock size={22} />],
  ['messages', 'Messages and story replies', <I.Send size={22} />],
  ['appearance', 'Appearance', <I.Moon size={22} />],
  ['language', 'Language', <I.Globe size={22} />],
  ['activity', 'Your activity', <I.Activity size={22} />],
  ['help', 'Help', <I.Help size={22} />],
];

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="set-row">
      <div className="grow"><div>{title}</div>{desc && <div className="muted tiny-text">{desc}</div>}</div>
      {children}
    </div>
  );
}

export function Settings() {
  const [sp, setSp] = useSearchParams();
  const section = sp.get('section') ?? '';
  const settings = useStore((s) => s.settings);
  const theme = useStore((s) => s.theme);
  const { setSetting, setTheme, logout, resetDemo } = useStore();
  const me = useMe();
  const counts = {
    liked: useStore((s) => s.liked.length),
    saved: useStore((s) => s.saved.length),
    posts: useStore((s) => Object.values(s.posts).filter((p) => p.author === me.id).length),
  };
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const flag = (k: keyof S, title: string, desc?: string) => (
    <Row title={title} desc={desc}><Toggle on={settings[k] as boolean} onChange={(v) => setSetting(k, v as never)} label={title} /></Row>
  );
  const current = SECTIONS.find(([k]) => k === section);

  return (
    <div className={`settings ${section ? 'has-section' : ''}`}>
      <aside className="set-nav">
        <h1 className="set-title">Settings</h1>
        {SECTIONS.map(([k, label, icon]) => (
          <button key={k} className={`set-item ${section === k || (!section && k === 'profile') ? 'on' : ''}`} onClick={() => setSp({ section: k })}>
            {icon}<span>{label}</span><I.ChevronRight size={14} className="set-chev" />
          </button>
        ))}
        <button className="set-item danger" onClick={() => { logout(); nav('/'); }}><I.Logout size={22} /><span>Log out</span></button>
      </aside>
      <section className="set-main">
        <button className="plain set-back" onClick={() => setSp({})} aria-label="Back"><I.ArrowLeft /></button>
        <h2>{current?.[1] ?? 'Edit profile'}</h2>
        {(!section || section === 'profile') && <EditProfileForm />}
        {section === 'notifications' && (
          <>
            <h3>Push notifications</h3>
            {flag('pushLikes', 'Likes')}
            {flag('pushComments', 'Comments')}
            {flag('pushFollows', 'New followers')}
            {flag('pushMessages', 'Messages')}
            <h3>Email</h3>
            {flag('emailUpdates', 'Product updates', 'Get news and tips about Lumigram by email.')}
          </>
        )}
        {section === 'privacy' && (
          <>
            {flag('privateAccount', 'Private account', 'Only people you approve can see your photos and videos. Your existing followers won’t be affected.')}
            {flag('activityStatus', 'Show activity status', 'People you follow and message can see when you were last active.')}
            {flag('hideLikeCounts', 'Hide like counts', 'You won’t see the number of likes on posts in your feed.')}
          </>
        )}
        {section === 'messages' && (
          <fieldset className="set-radios">
            <legend>Allow story replies from</legend>
            {([['everyone', 'Everyone'], ['following', 'People you follow'], ['off', 'Off']] as [S['storyReplies'], string][]).map(([v, l]) => (
              <label key={v} className="set-row"><span className="grow">{l}</span><input type="radio" name="replies" checked={settings.storyReplies === v} onChange={() => setSetting('storyReplies', v)} /></label>
            ))}
          </fieldset>
        )}
        {section === 'appearance' && (
          <fieldset className="set-radios">
            <legend>Theme</legend>
            {([['light', 'Light'], ['dark', 'Dark'], ['system', 'Use device setting']] as [ThemeMode, string][]).map(([v, l]) => (
              <label key={v} className="set-row"><span className="grow">{l}</span><input type="radio" name="theme" checked={theme === v} onChange={() => setTheme(v)} /></label>
            ))}
          </fieldset>
        )}
        {section === 'language' && (
          <label className="edit-field"><span>App language</span>
            <select value={settings.language} onChange={(e) => setSetting('language', e.target.value)}>
              {['English', 'ไทย', 'Español', 'Français', 'Deutsch', '日本語', 'Bahasa Indonesia'].map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
        )}
        {section === 'activity' && (
          <>
            <Row title="Posts you shared"><b>{fmt(counts.posts)}</b></Row>
            <Row title="Posts you liked"><b>{fmt(counts.liked)}</b></Row>
            <Row title="Saved posts"><Link className="link-btn" to={`/profile/${me.username}?tab=saved`}>{fmt(counts.saved)}</Link></Row>
            <Row title="Reset demo data" desc="Bring back the sample people, posts and chats. Your uploads are removed from the feed.">
              <button className="btn btn-gray danger-text" onClick={() => setConfirm(true)}>Reset</button>
            </Row>
          </>
        )}
        {section === 'help' && (
          <>
            <Row title="Terms of use"><Link className="link-btn" to="/legal/terms/">Open</Link></Row>
            <Row title="Privacy policy"><Link className="link-btn" to="/legal/privacy/">Open</Link></Row>
            <Row title="Stored on this device" desc="Everything you do here is saved in this browser only, so it works offline."><I.Check /></Row>
          </>
        )}
      </section>
      {confirm && (
        <Modal onClose={() => setConfirm(false)} className="confirm" label="Reset demo?" closeButton={false}>
          <div className="confirm-text"><b className="big">Reset demo data?</b><p className="muted">Likes, saves, posts and messages you made will be cleared.</p></div>
          <button className="confirm-btn danger" onClick={() => { resetDemo(); setConfirm(false); nav('/'); }}>Reset</button>
          <button className="confirm-btn" onClick={() => setConfirm(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
