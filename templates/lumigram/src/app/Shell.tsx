import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { brand } from '../brand.config';
import { I } from '../components/Icons';
import { Avatar, LogoMark, Toast, Wordmark } from '../components/ui';
import { ME } from '../data/mock';
import { useMe, useStore } from '../store';
import { useUI } from '../ui-store';
import { CreateModal } from './Create';
import { NotificationsDrawer, SearchDrawer } from './Drawers';
import { PostModal, ShareModal } from './PostCard';

function NavItem({ to, onClick, icon, activeIcon, label, active, badge }: {
  to?: string; onClick?: () => void; icon: ReactNode; activeIcon?: ReactNode; label: string; active?: boolean; badge?: number;
}) {
  const body = (isActive: boolean) => (
    <>
      <span className="nav-ic">
        {isActive && activeIcon ? activeIcon : icon}
        {badge ? <span className="nav-badge">{badge}</span> : null}
      </span>
      <span className={`nav-label ${isActive ? 'bold' : ''}`}>{label}</span>
    </>
  );
  if (to) {
    return (
      <NavLink to={to} end className={({ isActive }) => `nav-item ${isActive && active !== false ? 'active' : ''}`} onClick={onClick} aria-label={label}>
        {({ isActive }) => body(isActive && active !== false)}
      </NavLink>
    );
  }
  return (
    <button type="button" className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} aria-label={label}>
      {body(!!active)}
    </button>
  );
}

function MoreMenu({ onClose }: { onClose: () => void }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    setTimeout(() => document.addEventListener('mousedown', h));
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <div className="more-menu pop-in" ref={ref} role="menu">
      <Link to="/accounts/edit" className="menu-item" onClick={onClose}><I.Settings />Settings</Link>
      <Link to="/accounts/edit?section=activity" className="menu-item" onClick={onClose}><I.Activity />Your activity</Link>
      <Link to={`/profile/${useStore.getState().users[ME].username}?tab=saved`} className="menu-item" onClick={onClose}><I.Bookmark />Saved</Link>
      <button className="menu-item" onClick={() => setTheme(dark ? 'light' : 'dark')}>{dark ? <I.Sun /> : <I.Moon />}Switch appearance</button>
      <div className="menu-sep" />
      <button className="menu-item" onClick={() => { logout(); nav('/'); }}>Log out</button>
    </div>
  );
}

export function Shell({ children }: { children?: ReactNode }) {
  const me = useMe();
  const { drawer, setDrawer, setCreate, createOpen, postModal, shareModal, toast, showToast } = useUI();
  const unread = useStore((s) => s.threads.filter((t) => t.unread).length);
  const [more, setMore] = useState(false);
  const loc = useLocation();
  const slim = drawer !== null || loc.pathname.startsWith('/direct');
  const isHome = loc.pathname === '/';
  useEffect(() => setDrawer(null), [loc.pathname, setDrawer]);
  const toggleDrawer = (d: 'search' | 'notifications') => setDrawer(drawer === d ? null : d);
  const noDrawer = drawer === null;

  return (
    <div className={`shell ${slim ? 'slim' : ''}`}>
      <nav className="sidenav" aria-label="Main">
        <Link to="/" className="side-logo" aria-label={brand.name}>
          <span className="logo-word"><Wordmark size={26} /></span>
          <span className="logo-icon"><LogoMark size={26} /></span>
        </Link>
        <div className="side-items">
          <NavItem to="/" icon={<I.Home />} activeIcon={<I.HomeFill />} label="Home" active={noDrawer} />
          <NavItem onClick={() => toggleDrawer('search')} icon={<I.Search />} label="Search" active={drawer === 'search'} />
          <NavItem to="/explore" icon={<I.Explore />} activeIcon={<I.Explore strokeWidth={3} />} label="Explore" active={noDrawer} />
          <NavItem to="/reels" icon={<I.Reels />} activeIcon={<I.Reels strokeWidth={3} />} label="Reels" active={noDrawer} />
          <NavItem to="/direct/inbox" icon={<I.Send />} activeIcon={<I.Send strokeWidth={3} />} label="Messages" badge={unread} active={noDrawer} />
          <NavItem onClick={() => toggleDrawer('notifications')} icon={<I.Heart />} activeIcon={<I.HeartFill />} label="Notifications" active={drawer === 'notifications'} />
          <NavItem onClick={() => setCreate(true)} icon={<I.Create />} label="Create" active={createOpen} />
          <NavItem to={`/profile/${me.username}`} icon={<Avatar user={me} size={24} />} label="Profile" active={noDrawer} />
        </div>
        <div className="side-bottom">
          {more && <MoreMenu onClose={() => setMore(false)} />}
          <NavItem onClick={() => setMore(!more)} icon={<I.Menu />} label="More" active={more} />
        </div>
      </nav>

      {drawer === 'search' && <SearchDrawer />}
      {drawer === 'notifications' && <NotificationsDrawer />}
      {drawer && <div className="drawer-scrim" onClick={() => setDrawer(null)} />}

      {isHome && (
        <header className="mobile-top">
          <Link to="/" aria-label={brand.name}><Wordmark size={24} /></Link>
          <div className="row gap16">
            <button className="plain" onClick={() => toggleDrawer('search')} aria-label="Search"><I.Search /></button>
            <button className="plain" onClick={() => toggleDrawer('notifications')} aria-label="Notifications"><I.Heart /></button>
          </div>
        </header>
      )}

      <main className="shell-main">{children ?? <Outlet />}</main>

      <nav className="bottomnav" aria-label="Bottom">
        <NavLink to="/" end aria-label="Home">{({ isActive }) => (isActive ? <I.HomeFill /> : <I.Home />)}</NavLink>
        <NavLink to="/explore" aria-label="Explore">{({ isActive }) => <I.Explore strokeWidth={isActive ? 3 : 2} />}</NavLink>
        <NavLink to="/reels" aria-label="Reels">{({ isActive }) => <I.Reels strokeWidth={isActive ? 3 : 2} />}</NavLink>
        <button className="plain" onClick={() => setCreate(true)} aria-label="Create"><I.Create /></button>
        <NavLink to="/direct/inbox" aria-label="Messages" className="bn-msg">{({ isActive }) => <><I.Send strokeWidth={isActive ? 3 : 2} />{unread > 0 && <span className="nav-badge">{unread}</span>}</>}</NavLink>
        <NavLink to={`/profile/${me.username}`} aria-label="Profile">{() => <Avatar user={me} size={24} />}</NavLink>
      </nav>

      {createOpen && <CreateModal onClose={() => setCreate(false)} />}
      {postModal && <PostModal postId={postModal} />}
      {shareModal && <ShareModal postId={shareModal} />}
      {toast && <Toast text={toast} onDone={() => showToast(null)} />}
    </div>
  );
}
