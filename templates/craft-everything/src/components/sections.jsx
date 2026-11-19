import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { Sec, Btn, AppIcon, Shot, Rich, L, Logo } from './ui.jsx';
import { brand, apps, appName, links, principles, counts } from '../brand.js';

const LIGHT_SHOTS = new Set(['pdfwork', 'designwork', 'wordwork', 'deckwork', 'gridwork']);
const dim = (c) => `color-mix(in srgb, ${c} 78%, #101014)`;

// Spiral + rings background (pure SVG, slowly rotating).
const spiral = (() => {
  let d = '';
  for (let t = 0; t <= 6 * Math.PI * 2; t += 0.05) {
    const r = 20 + 22 * t;
    d += `${t ? 'L' : 'M'}${(850 + r * Math.cos(t)).toFixed(1)} ${(850 + r * Math.sin(t)).toFixed(1)}`;
  }
  return d;
})();
export function Rings({ cy = '60%' }) {
  return (
    <div className="hero-bg" aria-hidden="true">
      <svg viewBox="0 0 1700 1700" style={{ top: cy }}>
        <g fill="none" stroke="var(--ink)">
          {[110, 190, 270, 360, 450, 540, 640, 740, 840].map((r, i) => (
            <circle key={r} cx="850" cy="850" r={r} strokeOpacity={0.1 + (i % 2) * 0.04} strokeWidth="1" />
          ))}
          {[270, 450, 640, 840].map((r) => (
            <circle key={'t' + r} cx="850" cy="850" r={r} strokeOpacity=".18" strokeWidth="10" strokeDasharray="1 58" />
          ))}
          <g className="spin"><path d={spiral} strokeOpacity=".45" strokeWidth="2.2" /></g>
        </g>
      </svg>
    </div>
  );
}

// Icons that float around the home hero (left %, top px, size px).
const FLOATS = [
  ['texturework', 3.2, 52, 90], ['photowork', 21.5, 57, 82], ['lightwork', 49.2, 59, 78], ['work-anything', 87.6, -8, 92],
  ['materialwork', 85, 152, 95], ['cadwork', 1.5, 509, 82], ['vectorwork', 59.2, 811, 88], ['filmwork', 98.6, 425, 70],
];
export function Hero() {
  const byslug = Object.fromEntries(apps.map((a) => [a.slug, a]));
  return (
    <section className="hero" data-spy="">
      <Rings />
      {FLOATS.map(([s, x, y, size]) => (
        <Link key={s} to={'/apps/' + s} className="float" style={{ left: x + '%', top: y }} aria-label={appName(byslug[s])} tabIndex={-1}>
          <AppIcon app={byslug[s]} size={size} />
        </Link>
      ))}
      <div className="hero-in">
        <div className="wordmark" aria-label={brand.name}><Logo />{brand.wordmark.slice(1)}</div>
        <h1 className="disp h1">{brand.tagline}</h1>
        <p className="lead">{brand.name} builds open source tools, free to use. We pride ourselves on freedom of control and expression.</p>
        <div className="btn-row">
          <Btn to={links.download} dark icon="download">Download launcher</Btn>
          <Btn to="/apps" icon="grid">Explore work apps</Btn>
        </div>
        <p className="mono note">For Windows · Installer (64-bit)</p>
        <L to={links.allDownloads} className="all ul-link">All launcher downloads (other architectures)</L>
        <p className="see">Looking for AI images and video? <Link to="/studio" className="ink-link">See {brand.name} Studio</Link>.</p>
        <div className="meta mono">
          <L to={links.github}><Icon n="github" />Open source on GitHub</L>
          <p>macOS · Windows · Linux</p>
          <p>No subscription required</p>
        </div>
      </div>
    </section>
  );
}

export function IconGrid() {
  return (
    <nav className="icons" aria-label="Work apps">
      {apps.map((a) => (
        <Link key={a.slug} to={'/apps/' + a.slug}>
          <AppIcon app={a} />
          <span>{appName(a)}</span>
        </Link>
      ))}
    </nav>
  );
}

export function CraftingApps({ n = '01' }) {
  return (
    <Sec n={n} title="Work apps" right={`${counts.appsWord} apps · Open source · Pure Rust`} spy="Work apps">
      <div className="intro">
        <div>
          <h2 className="disp h2"><Rich text={`${counts.appsWord} apps.\nOne [work].`} /></h2>
          <p className="lead">Image editing, vector illustration, video, photography, PDFs, motion graphics, 2D animation, page layout, interface design, 3D texture painting, procedural materials, word processing, audio, presentations, CAD and spreadsheets. Native, open-source apps from the {brand.name} team, built in Rust and free to use.</p>
          <div className="btn-row">
            <Btn to={links.download} dark icon="download">Download launcher</Btn>
            <Btn to={links.discord} icon="discord">Join the Discord</Btn>
            <Btn to={links.github} icon="github">Browse on GitHub</Btn>
          </div>
          <p className="mono note">For Windows · Installer (64-bit)</p>
          <L to={links.allDownloads} className="all ul-link">All launcher downloads (other architectures)</L>
          <p className="rec"><strong>Recommended:</strong> {brand.name} Launcher installs every app below and keeps them all up to date. Each app also has its own installers on its page. <L to={links.github} className="ink-link">Learn more</L></p>
          <div className="share">
            <span>Share</span>
            <button onClick={() => navigator.clipboard?.writeText(location.href)}><Icon n="copy" />Copy link</button>
            <a href="https://x.com/" target="_blank" rel="noreferrer">X</a>
            <a href="https://www.reddit.com/" target="_blank" rel="noreferrer">Reddit</a>
            <a href="https://bsky.app/" target="_blank" rel="noreferrer">Bluesky</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
        <IconGrid />
      </div>
    </Sec>
  );
}

const STATUS_PLATFORMS = (a) => ['macOS', 'Windows', 'Linux', ...(a.web ? ['Web'] : [])];
export function AppCard({ a, i }) {
  const name = appName(a);
  const c = dim(a.color);
  return (
    <Link to={'/apps/' + a.slug} className="card">
      <div className="card-h">
        <span className="badge" style={{ background: a.color }}>{String(i + 1).padStart(2, '0')}</span>
        <p className="mono">{a.kind}</p>
      </div>
      <Shot color={a.color} light={LIGHT_SHOTS.has(a.slug)} />
      <div className="card-b">
        <AppIcon app={a} size={72} />
        <h3 className="disp h3l">
          {a.lead ? <><span style={{ color: c }}>{a.lead}</span>{a.rest}</> : <>{a.prefix}<span style={{ color: c }}>{brand.suffix}</span></>}
        </h3>
        <p className="body">{a.desc}</p>
        <div className="tags">
          <span className="tag" style={{ color: c, borderColor: `color-mix(in srgb, ${a.color} 45%, transparent)` }}>{a.status}</span>
          <span className="tag" style={{ color: c, borderColor: `color-mix(in srgb, ${a.color} 45%, transparent)` }}>Installers ready</span>
          {STATUS_PLATFORMS(a).map((p) => <span key={p} className="tag">{p}</span>)}
        </div>
        <p className="explore mono">Explore {name}<Icon n="arrowUR" /></p>
      </div>
    </Link>
  );
}

export function Lineup({ n = '02' }) {
  return (
    <Sec n={n} title="The lineup" right="Pick an app to explore" spy="Lineup">
      <div className="grid4">
        {apps.map((a, i) => <AppCard key={a.slug} a={a} i={i} />)}
        <div className="more">
          <div>
            <p className="mono faint">Next up</p>
            <h3 className="disp h3l"><Rich text="More apps [on the way]." /></h3>
            <p className="body">Tell us what to rebuild next, test early builds and follow development with the team in the {brand.name} Discord.</p>
          </div>
          <Btn to={links.discord} dark icon="discord" className="btn-sm">Join Discord</Btn>
        </div>
      </div>
    </Sec>
  );
}

export function Principles({ n = '03' }) {
  return (
    <Sec n={n} title="Principles" right="Shared by every app" spy="Principles">
      <div className="big-intro">
        <h2 className="disp h2"><Rich text="Built the [hard] way." /></h2>
        <p className="lead">Every Work App is written from scratch in Rust and held to the same rules.</p>
      </div>
      <div className="grid3">
        {principles.map((p, i) => (
          <div className="cell" key={p.title}>
            <div className="ib"><span className="ibox"><Icon n={p.icon} /></span><span className="mono faint">{String(i + 1).padStart(2, '0')}</span></div>
            <h3 className="disp h3">{p.title}</h3>
            <p className="body">{p.text}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

export function StudioBand({ n = '04' }) {
  return (
    <Sec n={n} title={`${brand.name} Studio`} right="Generative images & video" spy={`${brand.name} Studio`}>
      <div className="band studio-band">
        <p className="mono accent">Also from {brand.name}</p>
        <h2 className="disp h2">The AI studio<br />for <span className="serif">images and video</span>.</h2>
        <p className="lead">{brand.name} Studio is our generative app: compose scenes yourself, then render them with the latest image and video models. On your desktop or in the browser.</p>
        <div className="btn-row">
          <Btn to="/studio" dark>Explore the studio</Btn>
          <Btn to={links.launchApp}>Use on web</Btn>
        </div>
      </div>
    </Sec>
  );
}

export function WithUs() {
  return (
    <Sec spy="Get started">
      <div className="band with-us">
        <p className="mono faint">Open source · Free</p>
        <h2 className="disp h2xl"><Rich text="Build it [with us]." /></h2>
        <p className="lead">Early builds, roadmaps and the people making the Work Apps all live in the {brand.name} Discord.</p>
        <div className="btn-row"><Btn to={links.discord} dark icon="discord">Join the Discord</Btn></div>
      </div>
    </Sec>
  );
}
