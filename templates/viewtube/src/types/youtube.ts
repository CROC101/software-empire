export type Category =
  | 'Coding'
  | 'Next.js'
  | 'System Design'
  | 'AI Agents'
  | 'Gaming'
  | 'Lo-Fi Music'
  | 'Hardware';

export interface Channel {
  /** URL slug used in /channel/[handle] */
  id: string;
  /** Display handle without the @ */
  handle: string;
  name: string;
  subscribers: number;
  verified: boolean;
  bio: string;
  avatar: [string, string];
  banner: [string, string];
  initials: string;
}

export interface Chapter {
  time: number;
  title: string;
}

export interface Thumb {
  from: string;
  to: string;
  glyph: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  category: Category;
  views: number;
  likes: number;
  publishedAt: string;
  /** seconds */
  duration: number;
  src: string;
  thumb: Thumb;
  chapters: Chapter[];
  hashtags: string[];
  visibility: 'Public' | 'Unlisted';
  isShort?: boolean;
  isLive?: boolean;
  track?: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: [string, string];
  text: string;
  likes: number;
  createdAt: string;
  liked?: boolean;
  hearted?: boolean;
  replies: Comment[];
}

export interface Playlist {
  id: string;
  title: string;
  videoIds: string[];
  createdAt: string;
  ownerId?: string;
  description?: string;
}

export interface HistoryEntry {
  videoId: string;
  watchedAt: string;
}

export interface Poll {
  id: string;
  channelId: string;
  question: string;
  options: string[];
  votes: number[];
  postedAt: string;
}
