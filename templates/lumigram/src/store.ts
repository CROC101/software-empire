// All app state in one persisted store: every action survives a page reload.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Collection, Comment, Highlight, Message, Notification, Post, Settings, StorySet, Thread, ThemeMode, User } from './types';
import { ME, autoReplies, makeHighlights, makeNotifications, makePost, makePosts, makeStories, makeThreads, makeUsers, userIds } from './data/mock';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

interface State {
  loggedIn: boolean;
  theme: ThemeMode;
  users: Record<string, User>;
  following: string[];
  posts: Record<string, Post>;
  nextPostN: number;
  liked: string[];
  likedComments: string[];
  saved: string[];
  collections: Collection[];
  stories: StorySet[];
  seenStories: string[];
  highlights: Highlight[];
  notifications: Notification[];
  threads: Thread[];
  typing: Record<string, boolean>;
  recentSearches: string[];
  settings: Settings;

  login: (username: string) => void;
  logout: () => void;
  setTheme: (t: ThemeMode) => void;
  toggleLike: (postId: string, force?: boolean) => void;
  toggleCommentLike: (commentId: string) => void;
  toggleSave: (postId: string) => void;
  createCollection: (name: string, postId?: string) => void;
  addToCollection: (collectionId: string, postId: string) => void;
  addComment: (postId: string, text: string, parentId?: string) => void;
  toggleFollow: (userId: string) => void;
  markStorySeen: (userId: string) => void;
  addStory: (src: string) => void;
  addPost: (p: Omit<Post, 'id' | 'author' | 'likes' | 'createdAt' | 'comments'>) => string;
  loadMorePosts: (count: number) => void;
  sendMessage: (threadId: string, msg: Partial<Message>) => void;
  openThreadWith: (userId: string) => string;
  reactToMessage: (threadId: string, messageId: string, emoji: string) => void;
  markThreadRead: (threadId: string) => void;
  addRecent: (q: string) => void;
  removeRecent: (q: string) => void;
  clearRecent: () => void;
  updateProfile: (patch: Partial<User>) => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  resetDemo: () => void;
}

function seed() {
  const now = Date.now();
  return {
    users: makeUsers(),
    following: userIds.slice(0, 9),
    posts: makePosts(now),
    nextPostN: 36,
    liked: [] as string[],
    likedComments: [] as string[],
    saved: [] as string[],
    collections: [] as Collection[],
    stories: makeStories(now),
    seenStories: [] as string[],
    highlights: makeHighlights(),
    notifications: makeNotifications(now),
    threads: makeThreads(now),
    typing: {},
    recentSearches: ['kenji.frames', '#travel'],
    settings: {
      privateAccount: false, activityStatus: true, pushLikes: true, pushComments: true, pushFollows: true, pushMessages: true,
      emailUpdates: false, storyReplies: 'everyone', hideLikeCounts: false, language: 'English',
    } as Settings,
  };
}

function addReply(list: Comment[], parentId: string, c: Comment): Comment[] {
  return list.map((x) => (x.id === parentId ? { ...x, replies: [...x.replies, c] } : { ...x, replies: addReply(x.replies, parentId, c) }));
}

const toggle = (list: string[], id: string, on = !list.includes(id)) => (on ? (list.includes(id) ? list : [...list, id]) : list.filter((x) => x !== id));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      loggedIn: false,
      theme: 'light',
      ...seed(),

      login: (username) => {
        const clean = username.trim().toLowerCase().split('@')[0].replace(/[^a-z0-9._]/g, '').slice(0, 30);
        set((s) => ({ loggedIn: true, users: clean ? { ...s.users, [ME]: { ...s.users[ME], username: clean } } : s.users }));
      },
      logout: () => set({ loggedIn: false }),
      setTheme: (theme) => set({ theme }),

      toggleLike: (postId, force) =>
        set((s) => {
          const was = s.liked.includes(postId);
          const on = force ?? !was;
          if (on === was) return s;
          const p = s.posts[postId];
          return { liked: toggle(s.liked, postId, on), posts: p ? { ...s.posts, [postId]: { ...p, likes: p.likes + (on ? 1 : -1) } } : s.posts };
        }),
      toggleCommentLike: (id) => set((s) => ({ likedComments: toggle(s.likedComments, id) })),
      toggleSave: (postId) =>
        set((s) => {
          const on = !s.saved.includes(postId);
          return {
            saved: toggle(s.saved, postId, on),
            collections: on ? s.collections : s.collections.map((c) => ({ ...c, postIds: c.postIds.filter((x) => x !== postId) })),
          };
        }),
      createCollection: (name, postId) =>
        set((s) => ({
          collections: [...s.collections, { id: uid(), name, postIds: postId ? [postId] : [] }],
          saved: postId ? toggle(s.saved, postId, true) : s.saved,
        })),
      addToCollection: (cid, postId) =>
        set((s) => ({
          collections: s.collections.map((c) => (c.id === cid ? { ...c, postIds: toggle(c.postIds, postId) } : c)),
          saved: toggle(s.saved, postId, true),
        })),
      addComment: (postId, text, parentId) =>
        set((s) => {
          const p = s.posts[postId];
          if (!p) return s;
          const c: Comment = { id: uid(), author: ME, text, createdAt: Date.now(), likes: 0, replies: [] };
          return { posts: { ...s.posts, [postId]: { ...p, comments: parentId ? addReply(p.comments, parentId, c) : [...p.comments, c] } } };
        }),
      toggleFollow: (userId) =>
        set((s) => {
          const on = !s.following.includes(userId);
          const u = s.users[userId];
          const me = s.users[ME];
          return {
            following: toggle(s.following, userId, on),
            users: {
              ...s.users,
              [userId]: { ...u, followers: u.followers + (on ? 1 : -1) },
              [ME]: { ...me, following: me.following + (on ? 1 : -1) },
            },
          };
        }),
      markStorySeen: (userId) => set((s) => ({ seenStories: toggle(s.seenStories, userId, true) })),
      addStory: (src) =>
        set((s) => {
          const mine = s.stories.find((x) => x.user === ME);
          const item = { id: uid(), src, createdAt: Date.now() };
          return {
            stories: mine ? s.stories.map((x) => (x.user === ME ? { ...x, items: [...x.items, item] } : x)) : [{ user: ME, items: [item] }, ...s.stories],
            seenStories: s.seenStories.filter((x) => x !== ME),
          };
        }),
      addPost: (p) => {
        const id = `mine_${uid()}`;
        set((s) => ({ posts: { ...s.posts, [id]: { ...p, id, author: ME, likes: 0, createdAt: Date.now(), comments: [] } } }));
        return id;
      },
      loadMorePosts: (count) =>
        set((s) => {
          // shortcut: generated posts are capped at 240 so localStorage stays small; raise if feeds need to be longer.
          if (s.nextPostN >= 240) return s;
          const posts = { ...s.posts };
          const now = Date.now();
          for (let n = s.nextPostN; n < s.nextPostN + count; n++) posts[`p${n}`] = makePost(n, now);
          return { posts, nextPostN: s.nextPostN + count };
        }),
      sendMessage: (threadId, msg) => {
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, messages: [...t.messages, { id: uid(), from: ME, createdAt: Date.now(), reactions: [], ...msg }] } : t,
          ),
        }));
        // Simulated friend: typing indicator, then an auto-reply.
        const t = get().threads.find((x) => x.id === threadId);
        if (!t) return;
        setTimeout(() => set((s) => ({ typing: { ...s.typing, [threadId]: true } })), 700);
        setTimeout(() => {
          set((s) => ({
            typing: { ...s.typing, [threadId]: false },
            threads: s.threads.map((x) =>
              x.id === threadId
                ? { ...x, messages: [...x.messages, { id: uid(), from: t.with, text: autoReplies[Math.floor(Math.random() * autoReplies.length)], createdAt: Date.now(), reactions: [] }] }
                : x,
            ),
          }));
        }, 2200 + Math.random() * 1200);
      },
      openThreadWith: (userId) => {
        const t = get().threads.find((x) => x.with === userId);
        if (t) return t.id;
        const id = uid();
        set((s) => ({ threads: [{ id, with: userId, messages: [] }, ...s.threads] }));
        return id;
      },
      reactToMessage: (threadId, messageId, emoji) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: t.messages.map((m) => (m.id === messageId ? { ...m, reactions: m.reactions.includes(emoji) ? m.reactions.filter((e) => e !== emoji) : [...m.reactions, emoji] } : m)) }
              : t,
          ),
        })),
      markThreadRead: (threadId) => set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, unread: false } : t)) })),
      addRecent: (q) => set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 12) })),
      removeRecent: (q) => set((s) => ({ recentSearches: s.recentSearches.filter((x) => x !== q) })),
      clearRecent: () => set({ recentSearches: [] }),
      updateProfile: (patch) => set((s) => ({ users: { ...s.users, [ME]: { ...s.users[ME], ...patch } } })),
      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      resetDemo: () => set({ ...seed() }),
    }),
    {
      name: 'lumigram-state',
      version: 1,
      partialize: ({ typing: _typing, ...rest }) => rest,
    },
  ),
);

export const useMe = () => useStore((s) => s.users[ME]);
export const userByName = (users: Record<string, User>, username: string) => Object.values(users).find((u) => u.username === username);

export function timeAgo(t: number, long = false) {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  const units: [number, string, string][] = [
    [31536000, 'y', ' year'], [604800, 'w', ' week'], [86400, 'd', ' day'], [3600, 'h', ' hour'], [60, 'm', ' minute'], [1, 's', ' second'],
  ];
  for (const [sec, short, word] of units) {
    if (s >= sec) {
      const n = Math.floor(s / sec);
      return long ? `${n}${word}${n > 1 ? 's' : ''} ago` : `${n}${short}`;
    }
  }
  return 'now';
}

export const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}K` : n.toLocaleString('en-US'));
