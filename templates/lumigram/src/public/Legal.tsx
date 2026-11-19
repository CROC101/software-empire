import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { brand } from '../brand.config';
import { Art } from '../components/Art';
import { I } from '../components/Icons';
import { CompanyMark, LogoMark } from '../components/ui';

const B = brand.name;
const C = brand.company;

/* ---------------- Terms of Use (help centre layout) ---------------- */

const helpNav: { t: string; icon: ReactNode; open?: boolean; children?: string[] }[] = [
  { t: `${B} Features`, icon: <I.Explore /> },
  { t: 'Login, Recovery and Security', icon: <I.Lock /> },
  { t: 'Manage Your Account', icon: <I.User /> },
  { t: 'Staying Safe', icon: <I.Shield /> },
  { t: 'Privacy and Reporting', icon: <I.Lock /> },
  {
    t: 'Terms and Policies', icon: <I.Info />, open: true,
    children: ['Community Guidelines', 'Privacy Policy', 'Terms of Use', 'Platform Policy', 'Cookies Policy', 'Transparency Center', 'Community Payments Terms', `${B} Purchase Protection Policy`],
  },
  { t: 'Circles', icon: <I.Globe /> },
];

// Each section: paragraphs (string) and bullet lists (string[]; "Lead|rest" renders the lead in bold).
type Block = string | string[];
const termsSections: [string, Block[]][] = [
  [`1. The ${B} Service`, [
    `We agree to provide you with the ${B} Service. The Service covers every ${B} app, feature, technology and piece of software we offer to help you share moments with the people and things you care about. It is made up of these parts:`,
    [
      `Personal ways to create, connect, talk, discover and share.|Everyone is different, so we offer different kinds of accounts and features to help you make things, share them, grow an audience and keep in touch with people on and off ${B}. Our systems try to learn what you and others are interested in, and use that to help you find and join experiences that matter to you. That includes suggesting posts, features, offers and accounts you might like, based on what you and others do.`,
      'A friendly, inclusive and safe place.|We build tools and share resources that help people have a good experience, including when someone may need support. Dedicated teams and systems work to stop abuse, rule-breaking and deceptive behaviour.',
      'Technology that keeps up with a growing community.|Organizing information for millions of people is central to what we do. Much of the Service is about building technology that lets us personalize, protect and improve it at a very large scale.',
      'A consistent experience across our apps.|Apps made by the same company share technology, systems and insights, including what we know about you, so that each of them can be better, safer and more secure.',
      'Dependable infrastructure around the world.|To run a global Service we need to store and move data between our systems in different countries, including outside the country where you live.',
      'Ways to reach the brands and products you like.|We use information from the Service and from partners to show you ads, offers and sponsored posts we think you will find useful.',
      'Research and new ideas.|We study how the Service is used, and work with others on research, to make it better and to support the well-being of our community.',
    ],
  ]],
  ['2. How Our Service Is Funded', [
    `Rather than charging you to use ${B}, we show you ads that businesses and organizations pay us to promote on and off the Service. By using the Service you accept this. We use information such as your activity and interests to make those ads more relevant to you.`,
    `We show you useful ads without telling advertisers who you are, and we never sell your personal data. Advertisers tell us what they want to achieve and what kind of audience they want to reach, and we show their ad to people who are likely to be interested.`,
    `We also send advertisers reports on how their ads are doing so they can see how people react to their content. For example, we share broad age and interest trends about their audience. We do not share anything that identifies you directly unless you give us clear permission.`,
    'You may also see branded posts from accounts that are paid or otherwise rewarded by the business they mention. Those posts are labelled so you know about the relationship.',
  ]],
  ['3. The Privacy Policy', [
    `Running the Service means collecting and using information about you. The Privacy Policy explains what we collect, how we use it and when we share it. It also explains the many ways you can control your information, including through the ${B} privacy and security settings. You need to accept the Privacy Policy to use ${B}.`,
  ]],
  ['4. Your Commitments', [
    'In return for our promise to provide the Service, we ask you to make the promises below.',
    `4.1 Who Can Use ${B}.|We want the Service to be open to as many people as possible, while keeping it safe, secure and lawful. To be part of the community you must meet a few conditions.`,
    [
      'You are at least 13 years old, or the minimum age required in your country.',
      'You are not barred from using any part of the Service under the laws that apply to you, and not on a sanctions list that stops you from using payment features.',
      'We have not previously disabled your account for breaking the law or our policies.',
      'You have not been convicted of a sexual offence.',
    ],
    `4.2 How You Can't Use ${B}.|A safe and open Service for everyone depends on all of us doing our part.`,
    [
      "Don't pretend to be someone else or give false information.|You don't have to say who you are, but the details you give us must be accurate and current. You may not pose as a person or organization you are not, and you may not create an account for someone else without their clear permission.",
      "Don't do anything illegal, misleading or fraudulent, or use the Service for an unlawful purpose.",
      "Don't break these Terms or our policies.|That includes the Community Guidelines, the platform and developer rules and the music guidelines. If you post branded content, follow our branded content rules too.",
      "Don't disrupt or damage how the Service works.|That includes abusing reporting, dispute or appeal tools, for example by filing false or baseless reports.",
      "Don't create accounts or gather information in ways we have not allowed.|That includes using automated tools to sign up or to collect information without our written permission.",
      "Don't sell, license or buy accounts or data that came from us.|That includes trying to trade any part of an account, asking other people for their login details or badges, and collecting usernames, passwords or access tokens.",
      "Don't post someone else's private or confidential information without permission, or do anything that breaks another person's rights, including their intellectual property.",
      "Don't copy, change, translate or take apart our products or any part of them.",
      "Don't put a web address or domain name in your username without our written consent.",
    ],
    '4.3 Permissions You Give to Us.|As part of this agreement, you also give us the permissions we need to run the Service.',
    [
      `Your content stays yours, but you give us a licence to use it.|Nothing about your rights in your content changes. We do not own what you post, and you can share it with anyone, anywhere. We do need a legal permission, called a licence, to run the Service. When you share content protected by intellectual property rights, you give us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide licence to host, use, distribute, change, run, copy, show, translate and adapt it, in line with your privacy and app settings. You can end this licence at any time by removing the content or your account.`,
      'Permission to show your username, profile picture and activity alongside ads and sponsored content.|You let us show your username, profile picture and things you do, such as likes and follows, next to accounts, ads and sponsored posts you follow or interact with, without paying you.',
      'You agree that we may download and install updates to the Service on your device.',
    ],
  ]],
  ['5. Additional Rights We Retain', [
    [
      "If you pick a username or similar handle, we may change it when we think it is necessary, for example if it uses someone else's trademark or pretends to be another person.",
      'If you use material we provide, such as images, designs, videos or sounds that you add to your own posts, we keep all rights to that material, but not to your content.',
      'You may only use our trademarks and other brand features as our brand guidelines allow, or with our written permission.',
      'You need our written permission, or an open source licence, to change, adapt, decompile or otherwise try to get source code from us.',
    ],
  ]],
  ['6. Content Removal and Disabling or Terminating Your Account', [
    [
      'We can take down or limit access to content that breaks these rules.',
      'If we take down something you shared because it breaks the Community Guidelines, we will tell you and explain how to ask for another review, unless you have broken these Terms seriously or repeatedly, or telling you could expose us or others to legal risk, harm our community, put our systems at risk, or is not possible for technical or legal reasons.',
      "We can stop providing all or part of the Service to you, including disabling your account, straight away to protect our community or services, if you create risk or legal exposure for us, break these Terms or our policies, repeatedly infringe other people's intellectual property, or where the law allows or requires it.",
      'If you think your account was disabled by mistake, or you want to close or permanently remove your account, visit the Help Center. Once you ask us to remove content or your account, the process starts within 30 days and can take up to 90 days to finish.',
      'Some content may stay longer than 90 days: when other people have used it under this licence and still have it, when removing it would block an investigation into illegal activity, or when we must keep it to meet a legal obligation.',
    ],
  ]],
  ['7. Our Agreement and What Happens if We Disagree', [
    '7.1 Our Agreement.|If part of this agreement cannot be enforced, the rest still applies. Any change or waiver must be in writing and signed by us. If we do not enforce part of this agreement, that is not a waiver. We keep all rights we have not expressly given you.',
    "7.2 Who Has Rights Under this Agreement.|Our past, present and future affiliates and agents can rely on our rights here if they become part of a dispute. Otherwise, this agreement gives no rights to anyone else. You may not transfer your rights or duties under it without our consent. We may transfer ours, for example if our ownership changes or the law requires it.",
    "7.3 Who Is Responsible if Something Happens.|The Service is provided as it is, and we cannot promise it will always be safe, secure or work perfectly. As far as the law allows, we disclaim all warranties, express or implied, including fitness for a particular purpose, title and non-infringement.",
    "We do not control what people say or do, and we are not responsible for their conduct or yours, online or offline, or for their content, including content that is unlawful or offensive. We are also not responsible for services offered by other people or companies, even if you reach them through the Service.",
    '7.4 How We Will Handle Disputes.|If you are a consumer, the laws of the country where you live apply to any claim you bring against us about these Terms, and you can take that claim to any court in that country that has jurisdiction over it.',
    '7.5 Unsolicited Material.|We welcome feedback and suggestions, but we may use them without restriction, without paying you and without keeping them confidential.',
  ]],
  ['8. Updating These Terms', [
    'We may change the Service and our policies, and we may need to update these Terms so they stay accurate. Unless the law requires otherwise, we will let you know before we change these Terms, for example through the Service, and give you a chance to read the changes before they take effect. If you keep using the Service after that, the updated Terms apply to you. If you do not agree with them, you can remove your account.',
    'Revised: November 15, 2026',
  ]],
];

export function Terms() {
  const [navOpen, setNavOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(true);
  const [assistOpen, setAssistOpen] = useState(true);
  const [q, setQ] = useState('');
  const [helpful, setHelpful] = useState<null | boolean>(null);
  const [copied, setCopied] = useState(false);
  return (
    <div className="help-page">
      <header className="help-top">
        <button className="plain help-menu" onClick={() => setNavOpen(!navOpen)} aria-label="Menu"><I.Menu /></button>
        <Link to="/" className="help-brand"><LogoMark size={40} /><span>Help Center</span></Link>
        <label className="help-search"><I.Search size={16} /><input placeholder="Search help articles..." aria-label="Search help articles" /></label>
        <span className="help-lang">English (US)</span>
      </header>
      <nav aria-label="Help Center" className={`help-nav ${navOpen ? 'open' : ''}`}>
        {helpNav.map((n) => (
          <div key={n.t}>
            <div className="help-nav-item">{n.icon}<span>{n.t}</span>{n.open ? <I.ChevronUp size={14} /> : <I.ChevronDown size={14} />}</div>
            {n.children?.map((c) => (
              <Link key={c} to={c === 'Privacy Policy' ? '/legal/privacy/' : '/legal/terms/'} className={`help-nav-sub ${c === 'Terms of Use' ? 'active' : ''}`}>
                <span className="help-sub-ic">{c === 'Terms of Use' ? <I.Info size={20} /> : <I.Shield size={22} />}</span>{c}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <main className="help-main">
        <h1 className="help-crumb">Terms and Policies</h1>
        <div className="help-h1row">
          <h3 className="help-title">Terms of Use</h3>
          <button className="plain help-copy" onClick={() => { navigator.clipboard?.writeText(location.href); setCopied(true); }}>
            <I.Link size={16} /> {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="help-chips">
          {[`What is the ${B} Service?`, `How is ${B} funded?`, `What is the ${B} Privacy Policy?`, 'Your commitments'].map((c, i) => (
            <a key={c} href={`#s${i}`} className="help-chip">{c}</a>
          ))}
        </div>
        <hr />
        <div className="help-notice">
          <p>We’re updating our Terms of Use. The updates take effect on January 20, 2027. By using our products after that date, you agree to the updated Terms of Use.</p>
          <a href="#s0">Read New Terms</a>
        </div>
        <p>Welcome to {B}!</p>
        <p>These Terms of Use govern your use of {B} and explain how the {B} Service (the “Service”) works. Other terms may apply to specific features; when they do, we say so.</p>
        <p>The {B} Service is one of the {C} products, provided to you by {C}. These Terms of Use form an agreement between you and {C}. If you do not agree to these Terms, please do not use {B}.</p>
        {termsSections.map(([h, blocks], i) => (
          <section key={h} id={`s${i}`}>
            <h2>{h}</h2>
            {blocks.map((bl, k) => typeof bl === 'string' ? <p key={k}>{bl.includes('|') ? <><b>{bl.split('|')[0]}</b> {bl.split('|')[1]}</> : bl}</p> : (
              <ul key={k}>{bl.map((it) => { const [lead, rest] = it.split('|'); return <li key={it}>{rest === undefined ? lead : <><b>{lead}</b> {rest}</>}</li>; })}</ul>
            ))}
          </section>
        ))}
        <section id="help-more">
          <h2>Other ways to get help</h2>
          <ul className="help-related">
            <li><Link to="/accounts/password/reset/">Trouble logging in</Link></li>
            <li><Link to="/legal/privacy/">Privacy Center</Link></li>
            <li><Link to="/legal/terms/">Report something</Link></li>
          </ul>
        </section>
        <div className="help-feedback">
          <h3>Was this helpful?</h3>
          {helpful === null ? (
            <div className="row gap8"><button className="btn btn-gray" onClick={() => setHelpful(true)}>Yes</button><button className="btn btn-gray" onClick={() => setHelpful(false)}>No</button></div>
          ) : <p>Thanks for your feedback.</p>}
        </div>
        <h3>Related Articles</h3>
        <ul className="help-related">
          <li><Link to="/legal/privacy/">{B} Privacy Policy</Link></li>
          <li><Link to="/legal/terms/">Community Guidelines</Link></li>
          <li><Link to="/legal/terms/">Cookies Policy</Link></li>
        </ul>
      </main>
      {assistOpen && <aside className="help-assist" aria-label={`${C} AI support assistant`}>
        <div className="help-assist-top">
          <span className="help-flower sm" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 51}deg) translateY(-7px)` }} />)}</span>
          <b className="grow">{C} AI support assistant</b>
          <button className="plain" onClick={() => setQ('')} aria-label="New chat"><I.Edit size={22} /></button>
          <button className="plain" onClick={() => setAssistOpen(false)} aria-label="Close assistant"><I.Close size={22} /></button>
        </div>
        {supportOpen && (
          <div className="help-support">
            <div className="row between"><b>Want personalized support?</b><button className="plain round-x" onClick={() => setSupportOpen(false)} aria-label="Dismiss"><I.Close size={14} /></button></div>
            <Link to="/" className="help-login">Log in</Link>
          </div>
        )}
        <div className="help-assist-body">
          <div className="help-flower" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} style={{ transform: `rotate(${i * 51}deg) translateY(-22px)` }} />)}</div>
          <h2>Hey, how can I help?</h2>
          {['How can I report a post or reel?', 'How can I reset my password?', 'Read more about this topic on Help Center'].map((t, i) => (
            <button key={t} className="help-suggest" onClick={() => setQ(t)}><span className="help-spark">{i < 2 ? '✦' : <I.Grid size={16} />}</span><span className="grow">{t}</span>{i === 2 && <span className="help-ext"><I.ArrowLeft size={18} /></span>}</button>
          ))}
        </div>
        <p className="help-disclaimer">By using this service, you agree to {C}'s <a>AI terms</a>. Your interactions with AIs may be used to improve <a>AI at {C}</a>.</p>
        <label className="help-ask">
          <textarea placeholder="Ask a question..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Ask a question" />
          <span className="help-send"><I.Send size={18} /></span>
        </label>
      </aside>}
      <button className="help-feedback-tab">Feedback</button>
    </div>
  );
}

/* ---------------- Privacy Policy (privacy centre layout) ---------------- */

const privacySections = [
  'What is the Privacy Policy and what does it cover?',
  'What information do we collect?',
  'How do we use your information?',
  `How is your information shared on ${C} Products or with integrated partners?`,
  'How do we share information with third parties?',
  `How do the ${C} Companies work together?`,
  'How can you manage or delete your information and exercise your rights?',
  'How long do we keep your information?',
  'How do we transfer information?',
  'How do we respond to legal requests, comply with applicable law and prevent harm?',
  'How will you know the Policy has changed?',
  `How to contact ${C} with questions`,
  'Why and how we process your data',
];

const rows = ['Your activity and information you provide', 'Friends, followers and other connections', 'App, browser and device information', 'Information from partners, vendors and third parties'];

// Per-section layout, sized to the original's section heights at 1440 px (521, 1238, 1896, 1209, 1383, 1003, 967, 464, 349).
const pvShape = ['intro', 'illus', 'full', 'illus', 'illus', 'plain', 'plain', 'short', 'short', 'illus', 'plain', 'short', 'plain'] as const;

const mediaRows = ['How we show ads and sponsored content', 'How we use information to improve our products', 'How we personalize features for you', 'How we use location-related information'];

function PrivacySection({ title, i }: { title: string; i: number }) {
  const [hl, setHl] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const shape = pvShape[i] ?? 'plain';
  const links = i === 0 ? ['What products does this Policy cover?', 'Learn more in Privacy Center about managing your privacy'] : rows;
  return (
    <section className="pv-section" id={`pv${i}`}>
      <div className="pv-h2" role="heading" aria-level={2}>{title}</div>
      {i === 0 && <p className="pv-sub">Effective November 15, 2026 | <Link to="/legal/privacy/">View printable version</Link> | <Link to="/legal/privacy/">See previous versions</Link></p>}
      <h3 className="pv-hl-h">
        <button className={`pv-highlights ${hl ? 'open' : ''}`} onClick={() => setHl(!hl)} aria-expanded={hl}>
          <span className="pv-hl-ic" aria-hidden="true" /><span>Highlights</span>{hl ? <I.ChevronUp size={18} /> : <I.ChevronDown size={18} />}
        </button>
      </h3>
      {hl && (
        <ul className="pv-hl-list">
          <li>We explain what we do in plain language and keep it short.</li>
          <li>You can review and change your choices at any time in Settings.</li>
          <li>We never sell your personal information.</li>
        </ul>
      )}
      {(shape === 'illus' || shape === 'full') && <div className="pv-illus"><Art seed={i * 5 + 2} /></div>}
      <p>
        This section explains {title.toLowerCase().replace('?', '')} for {B} and other {C} products. We wrote it to be easy to read, with examples where they help.
        You can learn more about your choices in the <Link to="/accounts/edit">Settings</Link> of each product.
      </p>
      {shape !== 'short' && <><p>
        The information we handle depends on how you use our products. For example, we handle different information when you share a post than when you only browse.
        Where this section uses words like “you” and “your”, it means people who use {B}.
      </p>
      <p>We also use this information to keep our products safe, to understand how they are used, and to build new features.</p>
      <p>{i === 0 ? 'Read the full Policy below.' : 'Here is more detail:'}</p></>}
      <ul className="pv-rows">
        {links.map((r, k) => (
          <li key={r} className="pv-row">
            <button onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k}>
              <span>{r}</span><span className={`pv-row-chev ${open === k ? 'open' : ''}`}><I.ChevronRight size={18} /></span>
            </button>
            {open === k && <p>Short sample text: details about “{r.toLowerCase()}” would appear here, with links to the related controls.</p>}
          </li>
        ))}
      </ul>
      {i > 0 && shape !== 'short' && <>
        <div className="pv-h3" role="heading" aria-level={3}>What if you don’t want to share this?</div>
        <p>Some information is needed for our products to work. Other information is optional, but without it the experience may be less useful.</p>
        <Link className="pv-more" to="/legal/privacy/">Learn more</Link>
        <div className="pv-h3" role="heading" aria-level={3}>What if the information doesn’t identify you?</div>
        <p>Sometimes information is de-identified, combined with other people’s information, or anonymized so it no longer identifies you. We use it in the same ways described in this section.</p>
        {shape === 'full' && <>
          <p className="pv-h4">To provide, personalize and improve our products</p>
          <p>We use information to deliver the features you rely on, such as:</p>
          <ul className="pv-bullets">
            <li>Seeing whether our products work correctly, for example when troubleshooting or testing new features.</li>
            <li>Personalizing features, content and recommendations, such as your feed, stories and suggestions.</li>
          </ul>
          <ul className="pv-rows pv-media">
            {mediaRows.map((r, k) => (
              <li key={r} className="pv-row"><Link to="/legal/privacy/"><span className="pv-thumb"><Art seed={i * 7 + k} /></span><span className="grow">{r}</span><I.ChevronRight size={18} /></Link></li>
            ))}
          </ul>
        </>}
        <p className="pv-h4">Take control</p>
        <Link className="pv-card" to="/accounts/edit">
          <span className="pv-card-ic"><I.Settings size={22} /></span>
          <span><b>Manage the information we collect about you</b><span className="pv-card-sub">Privacy Center</span></span>
        </Link>
        {shape === 'full' && <Link className="pv-cta" to="/accounts/edit">Manage apps and websites</Link>}
      </>}
    </section>
  );
}

export function Privacy() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="pv-page">
      <aside className={`pv-aside ${menu ? 'open' : ''}`}>
        <header className="pv-brand"><CompanyMark /><h1 className="pv-mark"><span className="pv-brand-title">Privacy Center</span></h1></header>
        <nav aria-label="Privacy Center">
          <Link to="/legal/privacy/" className="pv-nav"><I.Home size={22} />Privacy Center home</Link>
          <Link to="/legal/privacy/" className="pv-nav"><I.Search size={22} />Search</Link>
          <Link to="/legal/terms/" className="pv-nav"><I.Shield size={22} />Privacy topics</Link>
          <Link to="/legal/terms/" className="pv-nav"><I.Globe size={22} />More privacy resources</Link>
          <span className="pv-nav active"><I.Lock size={22} />Privacy Policy<span className="pv-chev"><I.ChevronUp size={18} /></span></span>
          <ul className="pv-subs">{privacySections.map((t, i) => <li key={t}><a className="pv-nav sub" href={`#pv${i}`} onClick={() => setMenu(false)}>{t}</a></li>)}</ul>
        </nav>
      </aside>
      <header className="pv-mobile-top">
        <CompanyMark />
        <span className="row gap8"><Link to="/legal/privacy/" aria-label="Search" className="pv-icon-btn"><I.Search /></Link><button className="plain pv-icon-btn" onClick={() => setMenu(!menu)} aria-label="Menu"><I.Menu /></button></span>
      </header>
      <Link to="/" className="pv-close" aria-label="Close"><I.Close size={22} /></Link>
      <main className="pv-main">
        <h2 className="pv-title"><span>Privacy Policy</span></h2>
        {privacySections.map((t, i) => <PrivacySection key={t} title={t} i={i} />)}
      </main>
    </div>
  );
}
