import { Link } from 'react-router-dom';
import { Sec, Btn, L, Logo, AppIcon } from '../components/ui.jsx';
import { Rings } from '../components/sections.jsx';
import Icon from '../components/Icon.jsx';
import { useTitle } from './main.jsx';
import { brand, apps, links, studioFeatures } from '../brand.js';

// Floating media cards in the hero (left %, top px, width, height, gradient).
const CARDS = [
  [4, 70, 190, 130, '#b7a58c,#3d3328'], [24, 40, 150, 110, '#8fb1d9,#2a3d5c'], [74, 60, 210, 140, '#d98f6b,#5c2a2a'],
  [88, 300, 150, 200, '#9ad1b5,#24453a'], [2, 420, 170, 220, '#c9b3e6,#3a2a5c'], [70, 600, 230, 150, '#e6d29a,#5c4a24'],
];
const GHOSTS = [[16, 230, 120, 90], [80, 450, 110, 140], [12, 680, 160, 100]];
const RIBBON = ['Image to location', '3D compositing', 'Character posing', 'Image to 3D mesh', 'Background removal', '2D compositing', 'Mixed assets'];
const grad = (t = ['#2a2a2e', '#55555c']) => ({ background: `linear-gradient(135deg, ${t[0]}, ${t[1]})` });

const DownloadStudio = () => (
  <Btn to={links.download} dark>Download the studio<span className="os"><Icon n="apple" /><Icon n="windows" /><Icon n="linux" /></span></Btn>
);

export default function Studio() {
  useTitle(`${brand.name} Studio - AI images and video`);
  return (
    <>
      <section className="hero" data-spy="" style={{ minHeight: 852 }}>
        <Rings />
        {GHOSTS.map(([x, y, w, h], i) => <div key={'g' + i} className="ghost" style={{ left: x + '%', top: y, width: w, height: h }} aria-hidden="true" />)}
        {CARDS.map(([x, y, w, h, g], i) => (
          <div key={i} className="media-card" aria-hidden="true" style={{ left: x + '%', top: y, width: w, height: h, background: `linear-gradient(135deg, ${g})`, animationDelay: `${-i * 1.4}s` }} />
        ))}
        <div className="hero-in">
          <div className="wordmark" aria-label={brand.name}><Logo />{brand.wordmark.slice(1)}</div>
          <h1 className="disp h1">Capable tools <span className="serif">for artists</span>.</h1>
          <p className="lead">{brand.name} Studio lets you compose scenes yourself, then render them with the latest image and video models. On your desktop or in the browser.</p>
          <div className="btn-row">
            <DownloadStudio />
            <Btn to={links.launchApp} icon="globe">Use on web</Btn>
          </div>
          <p className="see">Looking for native desktop apps? <Link to="/apps" className="ink-link">See the Work Apps</Link>.</p>
          <div className="meta mono">
            <L to={links.github}><Icon n="github" />Open source on GitHub</L>
            <p>macOS · Windows · Linux · Web</p>
            <p>No subscription required</p>
          </div>
        </div>
      </section>

      <div className="marquee mono" aria-hidden="true">
        {[0, 1].map((k) => <ul key={k}>{RIBBON.map((r) => <li key={r}><i />{r}</li>)}</ul>)}
      </div>

      <Sec n="01" title="Studio features" right={`Real footage — captured in ${brand.name}`} spy="Features">
        <div className="big-intro">
          <h2 className="disp h2">The control that mere <span className="serif">words</span> cannot buy.</h2>
          <p className="lead">Compose every shot with real tools instead of hoping a prompt lands. Then render it with the model of your choice.</p>
        </div>
        <div className="grid2">
          {studioFeatures.map((f, i) => (
            <article key={f.title}>
              <div className="feat-h mono"><p>{f.tag}</p><p>{String(i + 1).padStart(2, '0')}</p></div>
              <div className="feat-m" style={grad(f.tint)} />
              <h3 className="disp h3 feat-t">{f.title}</h3><p className="body feat-d">{f.text}</p>
            </article>
          ))}
          <L to={links.launchApp}>
            <div className="feat-h mono"><p>Get started</p><p>08</p></div>
            <div className="feat-m launch-m"><span><Icon n="arrowUR" /></span><p className="mono">{links.launchApp.replace(/^https?:\/\/|\/$/g, '')}</p></div>
            <h3 className="disp h3 feat-t">Launch the studio</h3><p className="body feat-d">Open {brand.name} Studio in your browser. Nothing to install.</p>
          </L>
        </div>
      </Sec>

      <Sec n="02" title="Ownership" right="Free & open source" spy="Ownership">
        <div className="big-intro">
          <h2 className="disp h2">Stop <span className="serif">renting</span> from websites.</h2>
          <p className="lead">{brand.name} Studio is yours to own and keep, forever. No subscriptions needed, no aggregator middleman, no rent payments.</p>
        </div>
        <div className="grid3">
          {[
            ['code', 'Open source', 'Every line of the studio is public. Read it, build it, change it.', true],
            ['drive', 'Yours forever', 'Install it once and keep it. Your projects stay on your machine.'],
            ['globe', 'No middleman', 'Bring your own compute or subscriptions and pay providers directly.'],
          ].map(([icon, t, txt, src], i) => (
            <article className="cell" key={t}>
              <div className="ib"><span className="ibox"><Icon n={icon} /></span><span className="mono faint">{'ABC'[i]}</span></div>
              <h3 className="disp h3">{t}</h3>
              <p className="body">{txt}</p>
              {src && <Btn to={links.github} icon="github" className="btn-sm" style={{ marginTop: 24 }}>View source</Btn>}
            </article>
          ))}
        </div>
      </Sec>

      <Sec n="03" title="Proof" right="From the community" spy="Community">
        <div className="big-intro">
          <h2 className="disp h2">Made <span className="serif">with</span> {brand.name}.</h2>
        </div>
        <div className="films">
          {['#3d3328,#b7a58c', '#1d2b45,#8fb1d9', '#45241d,#d98f6b'].map((g, i) => (
            <article key={g}>
              <div className="feat-h mono"><p>Community film</p><p>0{i + 1}</p></div>
              <div className="film-m" style={{ background: `linear-gradient(135deg, ${g})` }}>
                <L to={links.youtube} className="play"><Icon n="play" />Play</L>
              </div>
            </article>
          ))}
        </div>
      </Sec>

      <Sec spy="Get started">
        <div className="band with-us">
          <p className="mono faint">Free · Open source · No subscription</p>
          <h2 className="disp h2xl">Start <span className="serif">crafting</span>.</h2>
          <p className="lead">Pick the native desktop apps, the generative studio, or both.</p>
        </div>
        <div className="two">
          <article>
            <div className="feat-h mono"><p>Work Apps</p><p>Native desktop apps</p></div>
            <div className="two-b">
              <div className="stack">{apps.slice(0, 6).map((a) => <AppIcon key={a.slug} app={a} size={36} />)}<span className="plus">+{apps.length - 6}</span></div>
              <h3 className="disp h3l">Desktop apps for every craft.</h3>
              <p className="body">Open-source apps for images, vectors, video, documents and more, built in Rust and free to use.</p>
              <div className="btn-row">
                <Btn to={links.download} dark icon="download">Download launcher</Btn>
                <Btn to="/apps" icon="grid">Explore the apps</Btn>
              </div>
              <p className="mono note">For Windows · Installer (64-bit)</p>
              <L to={links.allDownloads} className="all ul-link">All launcher downloads (other architectures)</L>
            </div>
          </article>
          <article>
            <div className="feat-h mono"><p>{brand.name} Studio</p><p>Generative AI</p></div>
            <div className="two-b">
              <span className="ibox" style={{ width: 36, height: 36 }}><Logo /></span>
              <h3 className="disp h3l">Generative AI for images and video.</h3>
              <p className="body">Compose scenes with real tools, then render them with the latest image and video models.</p>
              <div className="btn-row">
                <DownloadStudio />
                <Btn to={links.launchApp} icon="globe">Use on web</Btn>
              </div>
              <p className="mono note">macOS · Windows · Linux · Web</p>
            </div>
          </article>
        </div>
      </Sec>
    </>
  );
}
