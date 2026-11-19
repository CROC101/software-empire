// Sample content so the app works fully offline. Everything here is invented.
import type { Comment, Highlight, Notification, Post, StorySet, Thread, User } from '../types';

export const ME = 'me';

const H = 3600_000;
const D = 24 * H;

const people: [string, string, string, string?][] = [
  ['mali.wanders', 'Mali Srisuk', 'Slow travel & street food 🍜 Bangkok → everywhere', 'Travel'],
  ['kenji.frames', 'Kenji Ito', 'Film photographer. Night walks. 35mm.', 'Art'],
  ['nora.bakes', 'Nora Lind', 'Sourdough every Sunday 🥖', 'Food'],
  ['tarn.climbs', 'Tarn Phong', 'Rock, ridge & sunrise chaser ⛰️', 'Nature'],
  ['ivy.studio', 'Ivy Chen', 'Ceramics + small things made by hand', 'Art'],
  ['leo.beats', 'Leo Moreau', 'Producer · live sets every Friday', 'Music'],
  ['pim.and.paws', 'Pim & Mochi', 'One orange cat, many opinions 🐈', 'Pets'],
  ['sofia.runs', 'Sofia Reyes', 'Marathon #4 loading… 🏃‍♀️', 'Sports'],
  ['arun.eats', 'Arun Patel', 'Eating my way through Asia', 'Food'],
  ['june.wears', 'June Park', 'Thrifted fits & soft colours', 'Style'],
  ['oskar.sea', 'Oskar Berg', 'Sailing the north. Salt in everything.', 'Travel'],
  ['dao.draws', 'Dao Nguyen', 'Illustrator — commissions open ✏️', 'Art'],
  ['lumi.team', 'Lumigram Team', 'News and tips from the team ✨', 'Art'],
  ['riya.reads', 'Riya Shah', 'Books, tea, rainy days 📚', 'Style'],
  ['max.trails', 'Max Keller', 'Trail running + mountain huts', 'Nature'],
  ['bee.garden', 'Bee Thompson', 'Tiny balcony, huge garden 🌱', 'Nature'],
];

export function makeUsers(): Record<string, User> {
  const users: Record<string, User> = {
    [ME]: {
      id: ME, username: 'you', name: 'Your Name', bio: 'Hello from Lumigram ✨', avatar: 'art:7',
      followers: 248, following: 9, website: '',
    },
  };
  people.forEach(([username, name, bio, category], i) => {
    users[`u${i}`] = {
      id: `u${i}`, username, name, bio, category, avatar: `art:${i * 7 + 3}`,
      verified: i % 5 === 0, followers: 1200 + ((i * 7919) % 98000), following: 150 + ((i * 131) % 900),
      active: i % 3 !== 2,
    };
  });
  return users;
}

export const userIds = people.map((_, i) => `u${i}`);

const captions = [
  'Golden hour never misses ☀️', 'Weekend reset.', 'Found this little corner today', 'Can’t stop thinking about this view',
  'New work in progress — thoughts?', 'Morning ritual ☕', 'Out of office 🌊', 'This light though…', 'Sunday market haul 🧺',
  'Tiny details, big joy', 'One more for the album 📸', 'The city after rain', 'Small wins count too', 'Back where it started',
];
const commentTexts = [
  'This is stunning 😍', 'Where is this?!', 'Need to go here asap', 'The colours 🔥', 'Obsessed', 'Love this so much',
  'Save me a seat next time', 'Wow 👏👏', 'Such a vibe', 'Teach me your ways', 'Beautiful shot!', 'Okay this is art',
];
const locations = ['Bangkok, Thailand', 'Chiang Mai', 'Kyoto, Japan', 'Lisbon, Portugal', 'Krabi', 'Seoul', 'Oslo, Norway', undefined];
const audios = ['Original audio', 'Night Drive — Leo Moreau', 'Soft Morning (lofi mix)', 'Sunset Loop — Studio Mix', 'Ocean Hum'];

function rng(seed: number) {
  let s = seed * 1103515245 + 12345;
  return () => ((s = (s * 1103515245 + 12345) % 2147483647) / 2147483647);
}

function makeComments(seed: number, now: number): Comment[] {
  const r = rng(seed);
  const n = Math.floor(r() * 4) + 1;
  return Array.from({ length: n }, (_, i) => ({
    id: `c${seed}_${i}`,
    author: userIds[Math.floor(r() * userIds.length)],
    text: commentTexts[Math.floor(r() * commentTexts.length)],
    createdAt: now - Math.floor(r() * 20 * H),
    likes: Math.floor(r() * 40),
    replies: r() > 0.6
      ? [{ id: `c${seed}_${i}r`, author: userIds[Math.floor(r() * userIds.length)], text: 'Agreed!! 🙌', createdAt: now - Math.floor(r() * 5 * H), likes: Math.floor(r() * 9), replies: [] }]
      : [],
  }));
}

/** Builds post number `n` (stable for the same n), used for the seed feed and for infinite scroll. */
export function makePost(n: number, now: number): Post {
  const r = rng(n + 17);
  const authorIdx = Math.floor(r() * userIds.length);
  const isReel = n % 4 === 3;
  const pages = !isReel && r() > 0.72 ? 2 + Math.floor(r() * 2) : 1;
  return {
    id: `p${n}`,
    author: userIds[authorIdx],
    media: Array.from({ length: pages }, (_, i) => ({
      src: `art:${n * 3 + i * 11 + 1}`,
      kind: isReel ? 'video' : 'image',
      aspect: isReel ? 9 / 16 : r() > 0.7 ? 4 / 5 : 1,
    })),
    caption: `${captions[n % captions.length]} #${people[authorIdx][3]?.toLowerCase() ?? 'life'} #lumigram`,
    location: locations[n % locations.length],
    likes: Math.floor(r() * 9000) + 12,
    createdAt: now - n * 2.7 * H - Math.floor(r() * H),
    comments: makeComments(n, now),
    isReel,
    audio: isReel ? audios[n % audios.length] : undefined,
    category: people[authorIdx][3],
    tagged: r() > 0.85 ? [ME] : undefined,
  };
}

export function makePosts(now: number, count = 36): Record<string, Post> {
  const out: Record<string, Post> = {};
  for (let n = 0; n < count; n++) out[`p${n}`] = makePost(n, now);
  return out;
}

export function makeStories(now: number): StorySet[] {
  return userIds.slice(0, 11).map((user, i) => ({
    user,
    items: Array.from({ length: 1 + (i % 3) }, (_, j) => ({ id: `s${i}_${j}`, src: `art:${i * 13 + j * 5 + 2}`, createdAt: now - (i + j) * H })),
  }));
}

export function makeHighlights(): Highlight[] {
  const titles = ['Travel', 'Food', 'Friends', 'Studio', '2025'];
  const list: Highlight[] = [];
  [ME, ...userIds].forEach((user, ui) => {
    titles.slice(0, 3 + (ui % 3)).forEach((title, i) => {
      list.push({ id: `h${ui}_${i}`, user, title, items: [0, 1, 2].map((k) => ({ id: `h${ui}_${i}_${k}`, src: `art:${ui * 5 + i * 3 + k + 40}`, createdAt: 0 })) });
    });
  });
  return list;
}

export function makeNotifications(now: number): Notification[] {
  return [
    { id: 'n1', type: 'like', from: ['u1', 'u4'], postId: 'p1', createdAt: now - 0.5 * H },
    { id: 'n2', type: 'follow', from: ['u6'], createdAt: now - 2 * H },
    { id: 'n3', type: 'comment', from: ['u2'], postId: 'p1', text: 'This is stunning 😍', createdAt: now - 5 * H },
    { id: 'n4', type: 'mention', from: ['u9'], postId: 'p4', text: '@you come with us next time!', createdAt: now - 1.5 * D },
    { id: 'n5', type: 'like', from: ['u3', 'u7', 'u10'], postId: 'p2', createdAt: now - 3 * D },
    { id: 'n6', type: 'follow', from: ['u12'], createdAt: now - 4 * D },
    { id: 'n7', type: 'follow', from: ['u14'], createdAt: now - 12 * D },
    { id: 'n8', type: 'like', from: ['u5'], postId: 'p3', createdAt: now - 20 * D },
  ];
}

export function makeThreads(now: number): Thread[] {
  const lines = [
    ['Are we still on for Saturday?', 'Yes! 10am at the market 🧺'],
    ['Sent you the photos from the trip', 'Omg these are so good'],
    ['Did you see the new reel?', 'Haha yes I watched it 5 times'],
    ['Coffee tomorrow?', 'Always ☕'],
    ['Loved your last post!', 'Thank you 🥹'],
    ['Can you share the playlist?', 'Sending now 🎧'],
  ];
  return lines.map((pair, i) => ({
    id: `t${i}`,
    with: userIds[i],
    unread: i < 2,
    messages: [
      { id: `t${i}m0`, from: ME, text: pair[0], createdAt: now - (i + 1) * 3 * H - 5 * 60_000, reactions: [] },
      { id: `t${i}m1`, from: userIds[i], text: pair[1], createdAt: now - (i + 1) * 3 * H, reactions: i === 1 ? ['❤️'] : [] },
    ],
  }));
}

export const autoReplies = [
  'Haha love that 😂', 'Wait really?!', 'Sounds good to me 👍', 'Omg yes', 'Tell me more!', 'Sending you a voice note later',
  'That’s so cool ✨', '🥹🥹', 'Let’s do it!', 'Okay okay I see you 👀',
];

export const exploreCategories = ['For you', 'Travel', 'Food', 'Art', 'Style', 'Nature', 'Music', 'Pets', 'Sports'];
