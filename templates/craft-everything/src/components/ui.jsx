import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';
import { brand, nav, links, footer, appName } from '../brand.js';

// Internal paths use the router; everything else opens as a normal link.
export function L({ to, children, ...rest }) {
  if (to.startsWith('/')) return <Link to={to} {...rest}>{children}</Link>;
  const ext = /^https?:/.test(to);
  return <a href={to} {...(ext ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>{children}</a>;
}

export const Logo = (p) => (
  <svg viewBox={brand.logoViewBox} aria-label={brand.name} role="img" {...p}><path d={brand.logoPath} /></svg>
);

export function Btn({ to, dark, icon, children, className = '', ...rest }) {
  return (
    <L to={to} className={`btn ${dark ? 'btn-dark' : 'btn-line'} ${className}`} {...rest}>
      {icon && <Icon n={icon} />}
      {children}
    </L>
  );
}

export function AppIcon({ app, size = 80, style }) {
  const initials = (app.prefix || app.lead || 'W').slice(0, 2);
  return (
    <span className="aicon" style={{ width: size, height: size, fontSize: size, background: app.color, ...style }}>
      <b>{initials}</b>
    </span>
  );
}

// Neutral "app window" placeholder in place of product screenshots.
export function Shot({ color, light, style }) {
  return (
    <div className={`shot ${light ? 'light' : ''}`} style={style}>
      <div className="bar" />
      <div className="tools" />
      <div className="side" />
      <div className="canvas" style={{ background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 35%, #0d0d12))` }} />
    </div>
  );
}

// A framed section: full-width top hairline, 1280 column, optional header bar.
export function Sec({ n, title, right, spy, children, className = '', colClass = '', style }) {
  return (
    <section className={`sec ${className}`} data-spy={spy ?? undefined} style={style}>
      <div className={`col ${colClass}`}>
        {title && (
          <div className="shead">
            <p className="mono"><span className="n">{n} / </span><span className="t">{title}</span></p>
            {right && <p className="mono">{right}</p>}
          </div>
        )}
        {children}
      </div>
      <i className="xh l" aria-hidden="true" /><i className="xh r" aria-hidden="true" />
    </section>
  );
}

// Highlight words wrapped in [brackets] with the accent colour, {braces} in italic serif.
export function Rich({ text }) {
  return text.split(/(\[[^\]]+\]|\{[^}]+\})/).map((s, i) =>
    s.startsWith('[') ? <span key={i} className="accent">{s.slice(1, -1)}</span>
    : s.startsWith('{') ? <span key={i} className="serif">{s.slice(1, -1)}</span>
    : s);
}

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  return [dark, () => setDark((d) => !d)];
}

const isOn = (path, item) =>
  item.to === '/' ? path === '/' : item.to ? path.startsWith(item.to) : item.menu.some((m) => path === m.to || (m.to === '/studio' && path.startsWith('/studio')));

export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null); // open dropdown label
  const [mobile, setMobile] = useState(false);
  const [dark, toggleDark] = useTheme();
  const ref = useRef();

  useEffect(() => { setOpen(null); setMobile(false); }, [pathname]);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(null); };
    const esc = (e) => e.key === 'Escape' && (setOpen(null), setMobile(false));
    document.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); };
  }, []);

  const pill = (label, on) => <span className={on ? 'pill' : ''}>{label}</span>;

  return (
    <>
      <nav className="hdr" aria-label="Site" ref={ref}>
        <div className="hdr-l">
          <Link to="/" className="hdr-logo" aria-label={brand.name + ' home'}><Logo /></Link>
          <nav className="nav" aria-label="Main">
            {nav.main.map((it) =>
              it.menu ? (
                <div className="nav-item" key={it.label} onMouseEnter={() => setOpen(it.label)} onMouseLeave={() => setOpen(null)}>
                  <button className={`nav-a ${isOn(pathname, it) ? 'on' : ''}`} aria-expanded={open === it.label} aria-haspopup="true"
                    onClick={() => setOpen(open === it.label ? null : it.label)}>
                    {pill(it.label, isOn(pathname, it))}<Icon n="chev" />
                  </button>
                  <div className={`drop ${open === it.label ? 'open' : ''}`} role="menu">
                    {it.menu.map((m) => <L key={m.label} to={m.to} role="menuitem">{m.label}</L>)}
                  </div>
                </div>
              ) : (
                <div className="nav-item" key={it.label}>
                  <L to={it.to} className={`nav-a ${isOn(pathname, it) ? 'on' : ''}`}>{pill(it.label, isOn(pathname, it))}</L>
                </div>
              ))}
            <div className="nav-sep">
              <Link to={nav.apps.to} className={`nav-a ${pathname.startsWith('/apps') ? 'on' : ''}`}>{pill(nav.apps.label, pathname.startsWith('/apps'))}</Link>
            </div>
          </nav>
        </div>
        <div className="hdr-r">
          <Link to={nav.pricing.to} className="nav-a hdr-pricing">{nav.pricing.label}</Link>
          <L to={links.discord} className="icon-cell discord" aria-label="Discord"><Icon n="discord" /></L>
          <button className="icon-cell" aria-label="Toggle dark mode" onClick={toggleDark}><Icon n={dark ? 'sun' : 'moon'} /></button>
          <L to={links.launchApp} className="launch">Launch app</L>
          <button className="icon-cell burger" aria-label={mobile ? 'Close main menu' : 'Open main menu'} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>
            <Icon n={mobile ? 'x' : 'menu'} />
          </button>
        </div>
      </nav>
      <div className={`mmenu ${mobile ? 'open' : ''}`} aria-hidden={!mobile}>
        <div className="grp">
          {nav.main.map((it) =>
            it.menu ? (
              <div key={it.label}>
                <p className="lbl">{it.label}</p>
                {it.menu.map((m) => <L key={m.label} to={m.to} className="mi sub">{m.label}</L>)}
              </div>
            ) : (
              <L key={it.label} to={it.to} className={`mi ${isOn(pathname, it) ? 'on' : ''}`}><span>{it.label}</span></L>
            ))}
        </div>
        <Link to={nav.apps.to} className="mi apps">{nav.apps.label}</Link>
        <L to={links.launchApp} className="mlaunch">LAUNCH APP</L>
        <div className="duo">
          <Link to={nav.pricing.to}>PRICING</Link>
          <L to={links.discord}>DISCORD</L>
        </div>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="sec">
      <div className="col">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link to="/" aria-label={brand.name}><Logo /></Link>
            <p className="body">Capable open source tools: the Work Apps and {brand.name} Studio, our AI image and video app.</p>
            <a className="mono" href={'mailto:' + brand.email}>{brand.email}</a>
          </div>
          {footer.map((c) => (
            <nav className="foot-col" key={c.title} aria-label={c.title}>
              <h4 className="mono">{c.title}</h4>
              <ul>{c.links.map(([t, to]) => <li key={t}><L to={to}>{t}</L></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="foot-bot mono"><p>© {brand.year} {brand.name}</p><p>Free and open source</p></div>
      </div>
    </footer>
  );
}

// Right-edge ruler (1 tick per 1% of the page) + scroll-spy section index.
export function Ruler() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const read = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setPct(max > 0 ? Math.round((scrollY / max) * 100) : 0);
    };
    read();
    addEventListener('scroll', read, { passive: true });
    return () => removeEventListener('scroll', read);
  }, []);
  const ticks = [];
  for (let i = 0; i <= 100; i++)
    ticks.push(<i key={i} className={i % 5 ? '' : 'maj'} style={{ top: `calc(10px + ${i}% * .98)` }} />, i % 5 ? null : <b key={'b' + i} style={{ top: `calc(10px + ${i}% * .98)` }}>{i}</b>);
  // Rolling-digit readout of how far down the page you are (hundreds, tens, ones).
  const digits = [Math.floor(pct / 100), Math.floor(pct / 10) % 10, pct % 10];
  return (
    <div className="ruler" role="scrollbar" aria-orientation="vertical" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-controls="root">
      {ticks}
      <div className={`reading ${pct ? 'on' : ''}`} aria-hidden="true">
        {digits.map((d, k) => (
          <span key={k} className={`reel ${k === 0 && pct < 100 ? 'off' : ''}`}>
            <span style={{ transform: `translateY(${-d}em)` }}>{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <em key={n}>{n}</em>)}</span>
          </span>
        ))}
        <em>%</em>
      </div>
    </div>
  );
}

export function Spy() {
  const { pathname } = useLocation();
  const [state, setState] = useState({ labels: [], cur: -1 });
  useEffect(() => {
    const read = () => {
      const els = [...document.querySelectorAll('[data-spy]')];
      const H = document.documentElement.scrollHeight;
      let cur = -1;
      els.forEach((el, i) => { if (el.getBoundingClientRect().top <= 120) cur = i; });
      setState({ labels: els.map((e) => e.dataset.spy), tops: els.map((e) => (e.getBoundingClientRect().top + scrollY) / H), els, cur });
    };
    read();
    const t = setTimeout(read, 50);
    window.addEventListener('scroll', read, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', read); };
  }, [pathname]);
  const { labels, tops = [], els = [], cur } = state;
  const current = cur >= 0 ? labels[cur] : '';
  const letters = (s) => [...s].map((c, i) => <span key={i}>{c}</span>);
  if (!labels.length) return null;
  return (
    <>
      <p className="spy-cur" aria-hidden="true">{letters(current)}</p>
      {/* same box as the ruler, so a label's top % lines up with the ticks */}
      <div className="spy-rail">
        {labels.map((l, i) => i > cur && l && (
          <a key={l} className="spy-at" href={'#' + l} aria-label={'Jump to ' + l} style={{ top: `calc(10px + ${tops[i] * 100}% * .98 + 58px)` }}
            onClick={(e) => { e.preventDefault(); els[i].scrollIntoView({ behavior: 'smooth' }); }}>{letters(l)}</a>
        ))}
      </div>
    </>
  );
}

export { appName };
