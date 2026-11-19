import type { Category, Channel, Comment, Playlist, Poll, Video } from '@/types/youtube';

const BUCKET = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

export const SAMPLE_SOURCES = [
  { label: 'Big Buck Bunny', src: `${BUCKET}BigBuckBunny.mp4`, duration: 596 },
  { label: 'Elephants Dream', src: `${BUCKET}ElephantsDream.mp4`, duration: 653 },
  { label: 'Sintel', src: `${BUCKET}Sintel.mp4`, duration: 888 },
  { label: 'Tears of Steel', src: `${BUCKET}TearsOfSteel.mp4`, duration: 734 },
  { label: 'Subaru Outback', src: `${BUCKET}SubaruOutbackOnStreetAndDirt.mp4`, duration: 594 },
  { label: 'What Car For A Grand', src: `${BUCKET}WhatCarCanYouGetForAGrand.mp4`, duration: 567 },
  { label: 'For Bigger Fun', src: `${BUCKET}ForBiggerFun.mp4`, duration: 60 },
] as const;

const S = Object.fromEntries(SAMPLE_SOURCES.map((s) => [s.label, s])) as Record<
  (typeof SAMPLE_SOURCES)[number]['label'],
  (typeof SAMPLE_SOURCES)[number]
>;

export const CATEGORIES: Category[] = [
  'Coding',
  'Next.js',
  'System Design',
  'AI Agents',
  'Gaming',
  'Lo-Fi Music',
  'Hardware',
];

export const THUMB_PRESETS: { from: string; to: string; glyph: string }[] = [
  { from: '#00c896', to: '#035c4a', glyph: '</>' },
  { from: '#ff6a00', to: '#7a1500', glyph: '⚡' },
  { from: '#7f5cff', to: '#1d0f5c', glyph: '◆' },
  { from: '#ff2e88', to: '#3a0a5c', glyph: '♫' },
  { from: '#3ea6ff', to: '#0b2d5c', glyph: '▲' },
  { from: '#ffd400', to: '#6b3b00', glyph: '★' },
];

export const MUSIC_CHANNEL_ID = 'UC-9-kyTW8ZkZNDHQJ6FgpwQ';

export const CHANNELS: Channel[] = [
  {
    id: 'CrocByteDev',
    handle: 'CrocByteDev',
    name: 'CrocByte Dev',
    subscribers: 482_000,
    verified: true,
    bio: 'Full-stack tutorials, Next.js deep dives and honest code reviews. New video every Tuesday.',
    avatar: ['#00c896', '#035c4a'],
    banner: ['#003d30', '#00c896'],
    initials: 'CB',
  },
  {
    id: 'fireship_clone',
    handle: 'fireship_clone',
    name: 'Flashfire Code',
    subscribers: 1_870_000,
    verified: true,
    bio: 'High-intensity code tutorials. Complex topics explained in a hundred seconds or less.',
    avatar: ['#ff6a00', '#7a1500'],
    banner: ['#2a0a00', '#ff6a00'],
    initials: 'FF',
  },
  {
    id: 'DesignSystemsLab',
    handle: 'DesignSystemsLab',
    name: 'Design Systems Lab',
    subscribers: 214_000,
    verified: false,
    bio: 'Scalable architecture, distributed systems and interview prep for senior engineers.',
    avatar: ['#7f5cff', '#1d0f5c'],
    banner: ['#120838', '#7f5cff'],
    initials: 'DS',
  },
  {
    id: 'SynthWaveRadio',
    handle: 'SynthWaveRadio',
    name: 'SynthWave Radio',
    subscribers: 3_400_000,
    verified: true,
    bio: 'Lo-fi beats and retro synthwave to code, study and relax to. Live 24/7.',
    avatar: ['#ff2e88', '#3a0a5c'],
    banner: ['#1a0533', '#ff2e88'],
    initials: 'SW',
  },
  {
    id: MUSIC_CHANNEL_ID,
    handle: 'music',
    name: 'Music',
    subscribers: 128_000_000,
    verified: true,
    bio: 'The hottest new releases and all-time favourites, collected in one place.',
    avatar: ['#ff0033', '#ff4d6d'],
    banner: ['#000000', '#26262e'],
    initials: '♪',
  },
];

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 15)).toISOString();

const v = (
  id: string,
  title: string,
  channelId: string,
  category: Category,
  source: (typeof SAMPLE_SOURCES)[number],
  thumb: Video['thumb'],
  views: number,
  likes: number,
  publishedAt: string,
  chapters: [number, string][],
  hashtags: string[],
  description: string,
  extra: Partial<Video> = {},
): Video => ({
  id,
  title,
  channelId,
  category,
  src: source.src,
  duration: source.duration,
  thumb,
  views,
  likes,
  publishedAt,
  chapters: chapters.map(([time, t]) => ({ time, title: t })),
  hashtags,
  description,
  visibility: 'Public',
  ...extra,
});

export const SEED_VIDEOS: Video[] = [
  v('nxt15course', 'Build a Full-Stack App with the Next.js App Router — Complete Course', 'CrocByteDev', 'Next.js', S['Big Buck Bunny'],
    { from: '#00c896', to: '#022c22', glyph: 'N' }, 1_284_331, 48_200, iso(2026, 11, 3),
    [[0, 'Intro'], [62, 'Project setup'], [180, 'Layouts & routing'], [330, 'Server components'], [470, 'Deploying']],
    ['nextjs', 'react', 'typescript'],
    'Everything you need to ship a production Next.js app: routing, layouts, data fetching, caching and deployment.\n\nSource code is linked in the pinned comment.'),
  v('tsstrict101', 'TypeScript Strict Mode: 12 Errors You Will Hit (and How to Fix Them)', 'CrocByteDev', 'Coding', S['Elephants Dream'],
    { from: '#3178c6', to: '#0a1f3c', glyph: 'TS' }, 412_907, 19_400, iso(2026, 10, 20),
    [[0, 'Why strict?'], [95, 'Null checks'], [240, 'Index access'], [400, 'Generics'], [560, 'Wrap-up']],
    ['typescript', 'coding'],
    'Turning on strict mode feels painful at first. Here are the twelve errors you will meet and the cleanest fix for each.'),
  v('agentloop', 'I Built an AI Agent That Fixes Its Own Bugs', 'CrocByteDev', 'AI Agents', S['Tears of Steel'],
    { from: '#a855f7', to: '#1e0b3a', glyph: 'AI' }, 2_051_774, 97_300, iso(2026, 11, 12),
    [[0, 'The idea'], [120, 'Tool calling'], [300, 'Self-repair loop'], [520, 'Results'], [680, 'Outro']],
    ['ai', 'agents', 'llm'],
    'An agent loop with tools, tests and a feedback cycle. Watch it debug itself in real time.'),
  v('rust100s', 'Rust in 100 Seconds… Plus the Parts Nobody Talks About', 'fireship_clone', 'Coding', S['Subaru Outback'],
    { from: '#ff6a00', to: '#3a0a00', glyph: 'Rs' }, 3_920_118, 211_000, iso(2026, 9, 28),
    [[0, '100 seconds'], [100, 'Ownership'], [260, 'Borrow checker'], [430, 'Cargo tricks']],
    ['rust', 'programming'],
    'The fastest overview of Rust you will find, followed by the gotchas that bite real projects.'),
  v('gamejam48', 'Making a Game in 48 Hours with Zero Game Dev Experience', 'fireship_clone', 'Gaming', S['Sintel'],
    { from: '#22c55e', to: '#062e12', glyph: '🎮' }, 5_402_660, 302_000, iso(2026, 8, 14),
    [[0, 'The challenge'], [140, 'Prototype'], [380, 'Art & sound'], [640, 'Shipping it'], [820, 'Final score']],
    ['gamedev', 'gaming', 'gamejam'],
    'Forty-eight hours, one engine and way too much coffee. Did it actually work?'),
  v('gpu2026', 'Every GPU Benchmarked for Local AI — The 2026 Buyer\'s Guide', 'fireship_clone', 'Hardware', S['What Car For A Grand'],
    { from: '#76b900', to: '#1a2a00', glyph: 'GPU' }, 987_045, 41_800, iso(2026, 11, 15),
    [[0, 'Test setup'], [90, 'Budget tier'], [240, 'Mid range'], [400, 'Flagships'], [520, 'Verdict']],
    ['hardware', 'gpu', 'localai'],
    'Thirty cards, three models and one spreadsheet. Find the best value GPU for running models at home.'),
  v('urlshort', 'System Design: Build a URL Shortener for 1 Billion Users', 'DesignSystemsLab', 'System Design', S['Elephants Dream'],
    { from: '#7f5cff', to: '#120838', glyph: '⇄' }, 640_219, 28_600, iso(2026, 10, 2),
    [[0, 'Requirements'], [110, 'Back-of-envelope math'], [260, 'Data model'], [420, 'Scaling reads'], [580, 'Trade-offs']],
    ['systemdesign', 'interview', 'architecture'],
    'A complete walkthrough of the classic interview question, from requirements to sharding and caching.'),
  v('eventdriven', 'Event-Driven Architecture Explained with One Whiteboard', 'DesignSystemsLab', 'System Design', S['Big Buck Bunny'],
    { from: '#0ea5e9', to: '#082f49', glyph: '◎' }, 233_480, 11_900, iso(2026, 11, 9),
    [[0, 'Events vs commands'], [150, 'Queues & logs'], [320, 'Exactly-once myths'], [480, 'When not to']],
    ['architecture', 'kafka', 'systemdesign'],
    'Queues, logs and idempotency drawn out step by step on a single whiteboard.'),
  v('tokensui', 'Design Tokens: From Figma to Tailwind in 20 Minutes', 'DesignSystemsLab', 'Coding', S['Tears of Steel'],
    { from: '#f43f5e', to: '#3b0a14', glyph: '◐' }, 118_772, 6_300, iso(2026, 7, 30),
    [[0, 'What are tokens'], [180, 'Naming'], [360, 'Tailwind theme'], [600, 'Automation']],
    ['designsystems', 'tailwind', 'figma'],
    'Build a single source of truth for colours, type and spacing that designers and developers both trust.'),
  v('lofi24', 'lofi coding radio 📻 beats to code / study to', 'SynthWaveRadio', 'Lo-Fi Music', S['Sintel'],
    { from: '#ff2e88', to: '#1a0533', glyph: '♫' }, 41_207, 120_400, iso(2026, 11, 17),
    [[0, 'Midnight Commit'], [210, 'Rainy Refactor'], [420, 'Merge Conflict Blues'], [640, 'Deploy at Dawn']],
    ['lofi', 'study', 'coding'],
    'Chill beats for long coding sessions. Tracks change every few minutes; grab a drink and stay a while.',
    { isLive: true }),
  v('neondrive', 'Neon Drive — Retro Synthwave Mix for Night Coding', 'SynthWaveRadio', 'Lo-Fi Music', S['Subaru Outback'],
    { from: '#f97316', to: '#4c0519', glyph: '◢' }, 2_780_330, 88_100, iso(2026, 6, 21),
    [[0, 'Neon Drive'], [150, 'Chrome Skyline'], [300, 'Laser Grid'], [450, 'Last Exit']],
    ['synthwave', 'retrowave', 'music'],
    'An hour of analog synths and drum machines, mixed for late-night focus.'),
  v('speedrun', 'Speedrunning a Pixel Platformer I Coded Myself', 'CrocByteDev', 'Gaming', S['What Car For A Grand'],
    { from: '#eab308', to: '#3a2a00', glyph: '▶▶' }, 301_556, 15_200, iso(2026, 10, 30),
    [[0, 'The game'], [120, 'Route planning'], [300, 'The run'], [500, 'Bugs I found']],
    ['gaming', 'speedrun', 'gamedev'],
    'I know every frame of this game because I wrote it. Can I beat my own dev time?'),
  v('mcpagents', 'AI Agents with Tool Calling — Explained Simply', 'fireship_clone', 'AI Agents', S['Big Buck Bunny'],
    { from: '#14b8a6', to: '#042f2e', glyph: '⚙' }, 1_455_090, 66_700, iso(2026, 11, 6),
    [[0, 'What is an agent'], [120, 'Tools'], [280, 'Memory'], [430, 'Guardrails']],
    ['ai', 'agents', 'tutorial'],
    'Agents demystified: a loop, some tools and a model deciding what to do next.'),
  v('musicfresh', 'Fresh Picks — New Music Videos This Week', MUSIC_CHANNEL_ID, 'Lo-Fi Music', S['Tears of Steel'],
    { from: '#ff0033', to: '#2b0010', glyph: '♪' }, 3_512_000, 140_000, iso(2026, 11, 10),
    [[0, 'Opening'], [200, 'Pop'], [400, 'Hip-hop'], [600, 'Rock']],
    ['music', 'newmusic'],
    'The week\'s biggest new music videos in one place.'),
  v('musicchill', 'Chill Hits Playlist — Easy Listening Mix', MUSIC_CHANNEL_ID, 'Lo-Fi Music', S['Elephants Dream'],
    { from: '#38bdf8', to: '#0c1a33', glyph: '♬' }, 561_000, 22_000, iso(2026, 11, 13),
    [[0, 'Start'], [300, 'Mellow'], [500, 'Sunset']],
    ['music', 'chill'],
    'Relaxed songs for a slower afternoon.'),
  // Shorts
  v('sh_css', 'One CSS line that centers anything', 'CrocByteDev', 'Coding', S['For Bigger Fun'],
    { from: '#00c896', to: '#022c22', glyph: '⌖' }, 912_000, 61_000, iso(2026, 11, 11), [], ['css', 'shorts'],
    'place-items: center. That is the tweet.', { isShort: true, track: 'Original sound — CrocByte Dev' }),
  v('sh_git', 'git reflog saved my job', 'fireship_clone', 'Coding', S['For Bigger Fun'],
    { from: '#ff6a00', to: '#3a0a00', glyph: '⎇' }, 2_301_000, 190_000, iso(2026, 11, 8), [], ['git', 'shorts'],
    'Never panic after a bad reset again.', { isShort: true, track: 'Hyperdrive — SynthWave Radio' }),
  v('sh_cache', 'Caching explained in 30 seconds', 'DesignSystemsLab', 'System Design', S['For Bigger Fun'],
    { from: '#7f5cff', to: '#120838', glyph: '⟳' }, 402_000, 21_000, iso(2026, 11, 2), [], ['systemdesign', 'shorts'],
    'Cache-aside, write-through and write-back with one diagram.', { isShort: true, track: 'Original sound — Design Systems Lab' }),
  v('sh_synth', 'Making a synthwave bassline from scratch', 'SynthWaveRadio', 'Lo-Fi Music', S['For Bigger Fun'],
    { from: '#ff2e88', to: '#1a0533', glyph: '♫' }, 1_120_000, 98_000, iso(2026, 10, 25), [], ['synthwave', 'shorts'],
    'Two oscillators, one arpeggiator.', { isShort: true, track: 'Bassline Study #4 — SynthWave Radio' }),
  v('sh_gpu', 'This GPU fits in your pocket?!', 'fireship_clone', 'Hardware', S['For Bigger Fun'],
    { from: '#76b900', to: '#1a2a00', glyph: '▣' }, 3_050_000, 240_000, iso(2026, 11, 14), [], ['hardware', 'shorts'],
    'Tiny accelerators are getting wild.', { isShort: true, track: 'Original sound — Flashfire Code' }),
];

export const SEED_PLAYLISTS: Playlist[] = [
  { id: 'PLnextjs', title: 'Next.js From Zero', ownerId: 'CrocByteDev', videoIds: ['nxt15course', 'tsstrict101', 'agentloop'], createdAt: iso(2026, 9, 1), description: 'Learn the App Router step by step.' },
  { id: 'PLagents', title: 'AI Agents Crash Course', ownerId: 'fireship_clone', videoIds: ['mcpagents', 'agentloop', 'gpu2026'], createdAt: iso(2026, 10, 1), description: 'Agents, tools and the hardware to run them.' },
  { id: 'PLsysdesign', title: 'System Design Interview Prep', ownerId: 'DesignSystemsLab', videoIds: ['urlshort', 'eventdriven', 'tokensui'], createdAt: iso(2026, 8, 1), description: 'Every whiteboard session in order.' },
  { id: 'PLlofi', title: 'Focus Mixes', ownerId: 'SynthWaveRadio', videoIds: ['lofi24', 'neondrive'], createdAt: iso(2026, 6, 1), description: 'Long mixes for deep work.' },
  { id: 'PLhits', title: 'Today\'s Biggest Hits', ownerId: MUSIC_CHANNEL_ID, videoIds: ['musicfresh', 'musicchill', 'neondrive'], createdAt: iso(2026, 11, 1), description: 'The songs everyone is playing right now.' },
  { id: 'PLtrending', title: 'New & Trending Songs', ownerId: MUSIC_CHANNEL_ID, videoIds: ['musicchill', 'lofi24', 'musicfresh'], createdAt: iso(2026, 11, 1), description: 'Fresh releases climbing the charts.' },
];

/** shortcut: static export can only serve pre-built paths, so user playlists take one of these ids; raise the count if people need more. */
export const CUSTOM_PLAYLIST_SLOTS = Array.from({ length: 24 }, (_, i) => `PL${i + 1}`);

export const SEED_POLLS: Poll[] = [
  { id: 'poll-croc', channelId: 'CrocByteDev', question: 'What should the next full course cover?', options: ['Auth from scratch', 'Realtime with WebSockets', 'Testing everything', 'Monorepos'], votes: [412, 655, 230, 198], postedAt: iso(2026, 11, 14) },
  { id: 'poll-fire', channelId: 'fireship_clone', question: 'Tabs or spaces? Final answer.', options: ['Tabs', 'Spaces', 'Whatever the formatter says'], votes: [5200, 4100, 12800], postedAt: iso(2026, 11, 10) },
  { id: 'poll-dsl', channelId: 'DesignSystemsLab', question: 'Which deep dive do you want next?', options: ['Rate limiters', 'Chat systems', 'Search ranking'], votes: [802, 1340, 655], postedAt: iso(2026, 11, 5) },
  { id: 'poll-synth', channelId: 'SynthWaveRadio', question: 'Pick the vibe for Friday\'s live mix', options: ['Rainy city', 'Sunset highway', 'Space station'], votes: [3100, 4400, 2900], postedAt: iso(2026, 11, 12) },
  { id: 'poll-music', channelId: MUSIC_CHANNEL_ID, question: 'Which genre should get its own weekly chart?', options: ['Indie', 'K-pop', 'Lo-fi', 'Rock'], votes: [9100, 15400, 7300, 6200], postedAt: iso(2026, 11, 9) },
];

const PEOPLE: [string, [string, string]][] = [
  ['@pixelpusher', ['#f59e0b', '#7c2d12']],
  ['@nullpointer', ['#22d3ee', '#164e63']],
  ['@async_ana', ['#a3e635', '#365314']],
  ['@deploy_friday', ['#f472b6', '#831843']],
  ['@kernelpanic', ['#818cf8', '#312e81']],
];

const LINES = [
  'This is the clearest explanation I have seen on this topic. Thank you!',
  'The chapter markers make rewatching so easy.',
  'Came for the tutorial, stayed for the editing.',
  'Can you do a follow-up on testing this setup?',
  'Watching this at 2x and still learning a ton.',
];

export function seedComments(videoId: string): Comment[] {
  const n = (videoId.length % 3) + 3;
  return Array.from({ length: n }, (_, i) => {
    const [author, avatar] = PEOPLE[(i + videoId.length) % PEOPLE.length];
    return {
      id: `${videoId}-c${i}`,
      author,
      avatar,
      text: LINES[(i + videoId.charCodeAt(0)) % LINES.length],
      likes: 1200 - i * 233 + videoId.length * 7,
      createdAt: iso(2026, 11, 15 - i * 3),
      hearted: i === 0,
      replies:
        i < 2
          ? [
              {
                id: `${videoId}-c${i}-r0`,
                author: PEOPLE[(i + 2) % PEOPLE.length][0],
                avatar: PEOPLE[(i + 2) % PEOPLE.length][1],
                text: 'Totally agree with this.',
                likes: 18 - i * 5,
                createdAt: iso(2026, 11, 16 - i * 3),
                replies: [],
              },
            ]
          : [],
    };
  });
}
