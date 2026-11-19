import { Sec, L } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { PageHero, useTitle } from './main.jsx';
import { brand, links } from '../brand.js';

const CHANNELS = [
  { icon: 'discord', title: 'Join our Discord', text: 'The fastest way to reach us. Quick replies from the team and credit refunds if something goes wrong.', go: 'Open Discord', to: links.discord },
  { icon: 'mail', title: 'Email us', text: brand.email, go: 'Write to us', to: 'mailto:' + brand.email, mail: true },
  { icon: 'help', title: 'Browse the FAQ', text: `Answers to common questions about ${brand.name}.`, go: 'Read the FAQ', to: '/faq' },
];

export default function Support() {
  useTitle(`Support - ${brand.name}`);
  return (
    <>
      <PageHero label="Support" title={['Get', 'help.']} lead="Find answers, join the community, or reach us directly." />
      <Sec n="02" title="Channels" right="Pick one" spy="Contact">
        <div className="grid3" style={{ borderTop: 0 }}>
          {CHANNELS.map((c, i) => (
            <div className="cell chan" key={c.title}>
              <div className="ib"><span className="ibox" style={{ color: 'var(--ink)' }}><Icon n={c.icon} /></span><span className="mono faint">{'ABC'[i]}</span></div>
              <h3 className="disp h3">{c.title}</h3>
              <p className="body" style={c.mail ? { color: 'var(--muted)' } : undefined}>{c.text}</p>
              <L to={c.to} className="go mono">{c.go}<Icon n="arrowR" /></L>
            </div>
          ))}
        </div>
      </Sec>
    </>
  );
}
