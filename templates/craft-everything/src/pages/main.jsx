import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Hero, CraftingApps, Lineup, Principles, StudioBand, WithUs } from '../components/sections.jsx';
import { Sec, Btn, AppIcon, Shot } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { brand, apps, appName, links, simplePages } from '../brand.js';

export const useTitle = (t) => useEffect(() => { document.title = t; }, [t]);

export function Home() {
  useTitle(`${brand.name} - ${brand.tagline.replace(/\.$/, '')}`);
  return (<><Hero /><CraftingApps /><Lineup /><Principles /><StudioBand /><WithUs /></>);
}

export function Apps() {
  useTitle(`Work Apps: open-source creative tools - ${brand.name}`);
  return (<><CraftingApps /><Lineup /><Principles /><WithUs /></>);
}

// Big page heading: words in title[1] render in italic serif.
export const PageHero = ({ n = '01', label, right, title, lead, spy, children }) => (
  <Sec n={n} title={label} right={right} spy={spy ?? label}>
    <div className="page-hero">
      <h1 className="disp h2">{title[0]} <span className="serif">{title[1].replace(/\.$/, '')}</span>{title[1].endsWith('.') && '.'}</h1>
      <p className="lead">{lead}</p>
      {children}
    </div>
  </Sec>
);

export function AppDetail() {
  const { slug } = useParams();
  const i = apps.findIndex((x) => x.slug === slug);
  const a = apps[i];
  useTitle(a ? `${appName(a)} - ${brand.name}` : `Not found - ${brand.name}`);
  if (!a) return <NotFound />;
  const next = apps[(i + 1) % apps.length];
  return (
    <>
      <Sec n="01" title={appName(a)} right={a.kind} spy={appName(a)}>
        <div className="intro">
          <div>
            <AppIcon app={a} size={96} />
            <h1 className="disp h2" style={{ marginTop: 32 }}>{appName(a)}</h1>
            <p className="lead">{a.desc}</p>
            <div className="btn-row">
              <Btn to={links.download} dark icon="download">Download {appName(a)}</Btn>
              {a.web && <Btn to={links.launchApp} icon="globe">Use on web</Btn>}
            </div>
            <p className="mono note">{a.status} · Installers ready · macOS · Windows · Linux{a.web ? ' · Web' : ''}</p>
          </div>
          <Shot color={a.color} style={{ height: 360, alignSelf: 'center' }} />
        </div>
      </Sec>
      <Sec n="02" title="Next app" spy="Next">
        <Link to={'/apps/' + next.slug} className="card" style={{ minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 24, padding: 40 }}>
          <AppIcon app={next} size={64} />
          <div><p className="mono faint">{next.kind}</p><h2 className="disp h3l">{appName(next)}</h2></div>
          <span className="explore mono" style={{ marginLeft: 'auto', paddingTop: 0 }}>Explore<Icon n="arrowR" /></span>
        </Link>
      </Sec>
      <WithUs />
    </>
  );
}

// Every remaining link (downloads, FAQ, news...) lands on a page built from brand.simplePages.
export function Simple() {
  const { pathname } = useLocation();
  const p = simplePages[pathname.replace(/\/$/, '')];
  useTitle(p ? `${p.label} - ${brand.name}` : `Not found - ${brand.name}`);
  if (!p) return <NotFound />;
  return (
    <>
      <PageHero label={p.label} title={p.title} lead={p.lead} />
      <Sec n="02" title="Start here" spy="Start here">
        <div className="grid3" style={{ borderTop: 0 }}>
          {['Getting started', 'Guides', 'Get help'].map((t, i) => (
            <div className="cell" key={t}>
              <div className="ib"><span className="ibox"><Icon n={['download', 'code', 'help'][i]} /></span><span className="mono faint">0{i + 1}</span></div>
              <h3 className="disp h3">{t}</h3>
              <p className="body">Sample copy for this block. Replace it with your own content in the brand config.</p>
            </div>
          ))}
        </div>
      </Sec>
      <WithUs />
    </>
  );
}

export function NotFound() {
  return (
    <PageHero label="404" title={['Page', 'not found.']} lead="That page doesn’t exist. Head back home or explore the apps.">
      <div className="btn-row" style={{ marginTop: 32 }}><Btn to="/" dark>Go home</Btn><Btn to="/apps">Work apps</Btn></div>
    </PageHero>
  );
}
