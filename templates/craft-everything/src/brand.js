// ─────────────────────────────────────────────────────────────
//  CROCWORK BRAND CONFIG — edit this one file to re-skin the site.
//  Name, logo, colours, fonts, navigation, apps, pricing and copy
//  all come from here. Plain JS (no JSX) so build scripts can read it.
// ─────────────────────────────────────────────────────────────

export const brand = {
  name: 'Crocwork',
  // Big hero wordmark: the logo mark replaces the first letter.
  wordmark: 'CROCWORK',
  suffix: 'Work', // app names are "<Prefix><suffix>", e.g. PhotoWork
  tagline: 'Capable open source tools.',
  email: 'hello@crocwork.example',
  year: 2026,
  // Logo mark: an angular "croc jaw" C. Any SVG path in a 0 0 40 34 box works.
  logoPath: 'M20 0 L40 0 L33 9 L23 9 L15 25 L33 25 L40 34 L10 34 L0 25 L12 3 Z',
  logoViewBox: '0 0 40 34',
};

// Theme tokens (exact values measured from the reference design).
export const theme = {
  light: {
    bg: '#f2f1ee', // page
    bgSunk: '#e9e8e4', // media wells / studio band
    bgNav: '#f2f1eef2',
    ink: '#101014', // primary text, dark buttons
    inkStrong: '#000000', // headings
    muted: '#1010149e', // body copy
    faint: '#1010146b', // labels
    line: '#10101429', // hairlines
    accent: '#1659c4', // highlighted words, links
    onInk: '#f2f1ee', // text on dark buttons
  },
  dark: {
    bg: '#121216',
    bgSunk: '#1a1a1f',
    bgNav: '#121216f2',
    ink: '#f2f1ee',
    inkStrong: '#ffffff',
    muted: '#f2f1eeb3',
    faint: '#f2f1ee80',
    line: '#f2f1ee29',
    accent: '#6d9bff',
    onInk: '#101014',
  },
  fonts: {
    display: '"Archivo Variable", Archivo, system-ui, sans-serif',
    body: '"Inter Variable", Inter, system-ui, sans-serif',
    mono: '"Geist Mono", "Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
    serif: '"Instrument Serif", Georgia, serif',
  },
};

// External destinations (placeholders — point them at your real accounts).
export const links = {
  launchApp: 'https://app.crocwork.example/',
  download: '/download',
  allDownloads: '/download',
  github: 'https://github.com/',
  discord: 'https://discord.com/',
  youtube: 'https://www.youtube.com/',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/',
  wiki: '/wiki',
};

export const nav = {
  main: [
    { label: 'Home', to: '/' },
    {
      label: 'Studio',
      menu: [
        { label: 'Overview', to: '/studio' },
        { label: 'Image', to: '/studio/image' },
        { label: 'Video', to: '/studio/video' },
        { label: 'Download', to: '/download' },
      ],
    },
    {
      label: 'Resources',
      menu: [
        { label: 'Tutorials', to: '/tutorials' },
        { label: 'News', to: '/news' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Press Kit', to: '/press-kit' },
      ],
    },
    { label: 'Wiki', to: '/wiki' },
    { label: 'Support', to: '/support' },
  ],
  apps: { label: 'Work Apps', to: '/apps' },
  pricing: { label: 'Pricing', to: '/pricing' },
};

// The app lineup. color = icon/badge colour, status = tag row.
export const apps = [
  { slug: 'photowork', prefix: 'Photo', kind: 'Image editor', color: '#2f7bf5', status: 'Early alpha', desc: 'The open-source image editor you already know how to use.', web: true },
  { slug: 'vectorwork', prefix: 'Vector', kind: 'Vector illustration', color: '#e8573f', status: 'In development', desc: 'Fast, open-source vector illustration, reimagined in pure Rust.', web: true },
  { slug: 'filmwork', prefix: 'Film', kind: 'Video editor', color: '#8b5cf6', status: 'In development', desc: 'Professional, open-source video editing, rebuilt from scratch in Rust.', web: false },
  { slug: 'lightwork', prefix: 'Light', kind: 'Photo library & raw developer', color: '#f2a516', status: 'In development', desc: 'An open-source photo library and raw developer that runs on your machine.', web: true },
  { slug: 'pdfwork', prefix: 'Pdf', kind: 'PDF workbench', color: '#e8204f', status: 'Early alpha', desc: 'The open-source PDF workbench: read, organize, combine, split and secure.', web: true },
  { slug: 'effectwork', prefix: 'Effect', kind: 'Motion graphics & VFX', color: '#e0368f', status: 'In development', desc: 'Open-source motion graphics and visual effects, built in pure Rust.', web: true },
  { slug: 'aniwork', prefix: 'Ani', kind: '2D vector animation', color: '#dac604', status: 'Early alpha', desc: 'Open-source 2D vector animation, built in pure Rust.', web: true },
  { slug: 'designwork', prefix: 'Design', kind: 'Page layout & publishing', color: '#7bb51c', status: 'In development', desc: 'Open-source page layout and publishing, rebuilt in pure Rust.', web: true },
  { slug: 'figwork', prefix: 'Fig', kind: 'Interface design', color: '#02da96', status: 'Early alpha', desc: 'Open-source interface design and prototyping, rebuilt in pure Rust.', web: true },
  { slug: 'texturework', prefix: 'Texture', kind: '3D texture painting', color: '#c2672b', status: 'In development', desc: 'Open-source 3D texture painting, rebuilt in pure Rust.', web: true },
  { slug: 'materialwork', prefix: 'Material', kind: 'Procedural materials', color: '#178a9c', status: 'In development', desc: 'Open-source, node-based procedural materials, built in pure Rust.', web: true },
  { slug: 'soundwork', prefix: 'Sound', kind: 'Digital audio workstation', color: '#14a9c4', status: 'In development', desc: 'Professional audio recording, editing and mixing in pure Rust.', web: true },
  { slug: 'wordwork', prefix: 'Word', kind: 'Word processing', color: '#4c6ef5', status: 'In development', desc: 'Fast, open-source word processing, rebuilt in pure Rust.', web: true },
  { slug: 'deckwork', prefix: 'Deck', kind: 'Presentations & slide shows', color: '#f26b1d', status: 'In development', desc: 'Build and deliver dynamic slide presentations, in pure Rust.', web: true },
  { slug: 'cadwork', prefix: 'CAD', kind: 'Computer-aided design & drafting', color: '#14a3c7', status: 'In development', desc: 'Fast, open-source computer-aided design and drafting in pure Rust.', web: true },
  { slug: 'gridwork', prefix: 'Grid', kind: 'Spreadsheets & data analysis', color: '#1f9d55', status: 'In development', desc: 'Fast, open-source spreadsheets and data analysis, rebuilt in pure Rust.', web: true },
  { slug: 'work-anything', name: 'Work Anything', lead: 'Work', rest: ' Anything', kind: 'Software exploration & cloning', color: '#4e7bfb', status: 'Early alpha', desc: 'Explore how software works and build your own version.', web: true },
];
export const appName = (a) => a.name || a.prefix + brand.suffix;

export const counts = { appsWord: 'Seventeen' };

export const principles = [
  { icon: 'code', title: 'Open source', text: 'Every line is on GitHub under permissive licenses. Read it, fork it, build on it.' },
  { icon: 'cpu', title: 'Native, not wrapped', text: 'Pure Rust compiled to real desktop apps for macOS, Windows and Linux. No Electron, no web views.' },
  { icon: 'keyboard', title: 'Familiar from day one', text: "Layouts, tools and shortcuts that working professionals already know, so there's nothing to relearn." },
  { icon: 'drive', title: 'Your files, your machine', text: 'Everything runs locally on your own files. No cloud round-trips between you and your work.' },
  { icon: 'bot', title: 'Agent-ready', text: 'Drive every app from a CLI, a JSON control channel or an MCP server, built for automation and AI agents.' },
  { icon: 'globe', title: 'Also in your browser', text: 'Most of the lineup also compiles to WebAssembly and runs in a browser tab, with the same tools and the same files.' },
];

export const studioFeatures = [
  { tag: 'Worlds', title: 'Image to Location', text: 'Place virtual actors into physical environments. Establish single-location consistency and film multiple shots in a room without things disappearing.', tint: ['#2a2a2e', '#b7a58c'] },
  { tag: '3D Compositing', title: 'Build scenes with depth', text: 'Use images, backdrops, foreground elements, and props in scenes with real depth. A couple of images blends naturally into a finished composition.', tint: ['#232326', '#3c3c40'] },
  { tag: '2D Compositing', title: 'Precise layered control', text: 'Combine images, background removal, layers, and simple drawing tools to compose a scene exactly the way you imagined it.' },
  { tag: '3D Mesh', title: 'Image to 3D Mesh', text: 'Turning images into 3D helps position elements exactingly. Block complex scenes with intentional geometry instead of fighting prompts.' },
  { tag: 'Mixed Assets', title: 'Mix every kind of asset', text: 'Combine image cutouts, worlds, and 3D meshes in one canvas to lay out scenes with precision and intention.' },
  { tag: 'Posing', title: 'Character Posing', text: 'Dynamically pose your characters to nail the precise character, scene, and camera blocking before calling "action".' },
  { tag: 'Cutouts', title: 'Background Removal', text: 'Instantly remove backgrounds from images to create assets for your scenes. Clean, precise, and ready for compositing.' },
];

export const pricing = {
  offer: 'Save 20% on every plan, monthly or yearly — lock in the lowest price today.',
  plans: [
    { id: 'basic', label: 'Plan', name: 'Basic', sub: 'For getting started', was: 10, price: 8, color: '#00a870', tint: '#00a87029', features: ['1,000 credits / month', '~250 standard images', '~67 pro images', '~33 pro 4K images', '~200 photoreal images', '~63 seconds standard video', '~45 seconds pro video', 'You own Crocwork forever'] },
    { id: 'pro', label: 'Most popular', icon: 'star', name: 'Pro', sub: 'For serious creators', was: 35, price: 28, color: '#9b4bff', tint: '#9b4bff29', features: ['3,750 credits / month', '~938 standard images', '~250 pro images', '~125 pro 4K images', '~750 photoreal images', '~234 seconds standard video', '~167 seconds pro video', 'You own Crocwork forever'] },
    { id: 'max', label: 'Best value', icon: 'gem', name: 'Max', sub: 'For studios and power users', was: 60, price: 48, color: '#da7600', tint: '#da760029', features: ['6,600 credits / month', '~1,650 standard images', '~440 pro images', '~220 pro 4K images', '~1,320 photoreal images', '~413 seconds standard video', '~295 seconds pro video', 'You own Crocwork forever'] },
  ],
  enterprise: { label: 'For teams', name: 'Enterprise', color: '#3568c9', tint: '#e0e4ea', features: ['Bespoke credit allocation', 'Secure models', 'Support SLAs', 'Custom integrations'] },
  guarantees: ['Cancel anytime', 'Secure checkout via Stripe', 'Credits refunded if a generation fails', 'Open source — yours forever'],
};

export const footer = [
  { title: 'Crocwork Studio', links: [['Overview', '/studio'], ['Download', '/download'], ['Pricing', '/pricing'], ['Use on web', links.launchApp]] },
  { title: 'Work Apps', links: [['All Work Apps', '/apps'], ...apps.map((a) => [appName(a), '/apps/' + a.slug])] },
  { title: 'Resources', links: [['Linux Repositories', '/linux'], ['Wiki', '/wiki'], ['Tutorials', '/tutorials'], ['News', '/news'], ['FAQ', '/faq'], ['Press Kit', '/press-kit'], ['Support', '/support']] },
  { title: 'Community', links: [['Discord', links.discord], ['GitHub', links.github], ['YouTube', links.youtube], ['Instagram', links.instagram], ['TikTok', links.tiktok]] },
];

// Simple pages that every remaining link lands on (title, lead, sample blocks).
export const simplePages = {
  '/studio/image': { label: 'Studio · Image', title: ['Images,', 'composed.'], lead: 'Compose scenes on the canvas, then render stills with the latest image models.' },
  '/studio/video': { label: 'Studio · Video', title: ['Video,', 'directed.'], lead: 'Block shots in 3D, pose characters and render motion with the latest video models.' },
  '/download': { label: 'Download', title: ['Get', 'Crocwork.'], lead: 'One launcher installs every Work App and keeps them up to date. Pick your platform.' },
  '/linux': { label: 'Linux', title: ['Linux', 'repositories.'], lead: 'Install and update every app with your system package manager.' },
  '/tutorials': { label: 'Tutorials', title: ['Learn the', 'craft.'], lead: 'Short, practical walkthroughs for every app in the lineup.' },
  '/news': { label: 'News', title: ['What’s', 'new.'], lead: 'Release notes, roadmaps and stories from the team.' },
  '/faq': { label: 'FAQ', title: ['Common', 'questions.'], lead: 'Answers to the things people ask us most.' },
  '/press-kit': { label: 'Press Kit', title: ['Press', 'kit.'], lead: 'Logos, screenshots and boilerplate for writing about Crocwork.' },
  '/wiki': { label: 'Wiki', title: ['The', 'wiki.'], lead: 'Community-written guides, references and tips.' },
};
