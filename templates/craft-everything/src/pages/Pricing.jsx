import { useState } from 'react';
import { Sec, Btn, L } from '../components/ui.jsx';
import Icon from '../components/Icon.jsx';
import { PageHero, useTitle } from './main.jsx';
import { brand, pricing, links } from '../brand.js';

const Feats = ({ list }) => (
  <ul className="feats">{list.map((f) => <li key={f}><i><Icon n="check" /></i>{f}</li>)}</ul>
);

export default function Pricing() {
  useTitle(`Pricing - ${brand.name}`);
  const [yearly, setYearly] = useState(true);
  const e = pricing.enterprise;
  return (
    <>
      <div className="offer">
        <p className="mono"><Icon n="tag" />Limited-time offer</p>
        <p>{pricing.offer}</p>
      </div>
      <PageHero label="Pricing" right="Free & open source · Subscriptions fund development" title={['Create without', 'limits.']}
        lead={`Get a ton of generations and invest in a tool you'll always own. Your subscription helps keep ${brand.name} free and open for everyone.`} />
      <Sec n="02" title="Choose your plan" right="Every paid plan includes video credits" spy="Plans">
        <div className="ptools">
          <div className="seg" role="group" aria-label="Billing period">
            <button className={yearly ? 'on' : ''} onClick={() => setYearly(true)}>Yearly</button>
            <button className={yearly ? '' : 'on'} onClick={() => setYearly(false)}>Monthly</button>
          </div>
          <span className="chip">20% off · Ends soon</span>
          {yearly && <p className="mono accent">2 months free</p>}
          <p className="mono faint" style={{ marginLeft: 'auto' }}>Prices in USD</p>
        </div>
        <div className="plans">
          {pricing.plans.map((p, i) => (
            <article key={p.id} className={`plan ${p.icon ? 'hl' : ''}`} style={{ '--c': p.color, '--tint': p.tint }}>
              <div className="plan-h"><p className="mono">{p.icon && <Icon n={p.icon} />}{p.label}</p><p className="mono">0{i + 1}</p></div>
              <div className="plan-b">
                <div className="plan-t"><h3 className="disp h3">{p.name}</h3><span className="off">20% OFF</span></div>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{p.sub}</p>
                {/* shortcut: monthly mode shows list price without a yearly bundle; real monthly discount rules unknown */}
                <div className="price">
                  {yearly && <s>${p.was}</s>}
                  <span className="num">${yearly ? p.price : p.was}</span><span className="per">/mo</span>
                </div>
                <p className="billed mono">{yearly ? <>${p.price * 12} billed yearly · <em>Save ${(p.was - p.price) * 12}</em></> : 'Billed monthly · cancel anytime'}</p>
                <Btn to={links.launchApp} className="pbtn">Get {p.name}<Icon n="arrowR" /></Btn>
                <p className="feat-l mono">What you get</p>
                <Feats list={p.features} />
              </div>
            </article>
          ))}
          <article className="plan" style={{ '--c': e.color, '--tint': e.tint }} data-spy="Enterprise">
            <div className="plan-h"><p className="mono">{e.label}</p><p className="mono">04</p></div>
            <div className="plan-b">
              <h3 className="disp h3">{e.name}</h3>
              <p className="custom">Custom</p>
              <p className="billed mono">Bespoke volume & terms</p>
              <div className="ent-btns">
                <L to={'mailto:' + brand.email} className="btn"><Icon n="mail" />Contact us</L>
                <button className="btn" aria-label="Copy email address" onClick={() => navigator.clipboard?.writeText(brand.email)}><Icon n="copy" /></button>
              </div>
              <p className="feat-l mono">Everything in Max, plus</p>
              <Feats list={e.features} />
            </div>
          </article>
        </div>
        <ul className="guar mono">{pricing.guarantees.map((g) => <li key={g}><Icon n="check" />{g}</li>)}</ul>
      </Sec>
      <Sec spy="Credits">
        <div className="split">
          <div>
            <p className="mono faint">Already have an account?</p>
            <h2 className="disp h3">One-time credit packs</h2>
            <p className="body">Top up without changing your plan. Credit packs never expire.</p>
            <Btn to={links.launchApp}>Sign in to buy credits</Btn>
          </div>
          <div>
            <p className="mono faint">† Footnote</p>
            <p className="body" style={{ marginTop: 16 }}>{brand.name} can be used without paying for a subscription. You can bring your own compute and third-party subscriptions. We hope you’ll subscribe, though, as that helps accelerate our development.</p>
          </div>
        </div>
      </Sec>
    </>
  );
}
