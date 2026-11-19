export type ID = string;

/** `art:<n>` = drawn placeholder scene, `idb:<key>` = uploaded file kept in IndexedDB. */
export type MediaSrc = string;

export interface User {
  id: ID;
  username: string;
  name: string;
  bio: string;
  website?: string;
  avatar: MediaSrc;
  verified?: boolean;
  followers: number;
  following: number;
  active?: boolean;
  category?: string;
  gender?: string;
}

export interface Media {
  src: MediaSrc;
  kind: 'image' | 'video';
  filter?: string;
  aspect?: number; // width / height
}

export interface Comment {
  id: ID;
  author: ID;
  text: string;
  createdAt: number;
  likes: number;
  replies: Comment[];
}

export interface Post {
  id: ID;
  author: ID;
  media: Media[];
  caption: string;
  location?: string;
  likes: number;
  createdAt: number;
  comments: Comment[];
  isReel?: boolean;
  audio?: string;
  tagged?: ID[];
  category?: string;
}

export interface StoryItem {
  id: ID;
  src: MediaSrc;
  createdAt: number;
}

export interface StorySet {
  user: ID;
  items: StoryItem[];
}

export interface Highlight {
  id: ID;
  user: ID;
  title: string;
  items: StoryItem[];
}

export type NotificationType = 'like' | 'follow' | 'comment' | 'mention';

export interface Notification {
  id: ID;
  type: NotificationType;
  from: ID[];
  postId?: ID;
  text?: string;
  createdAt: number;
}

export interface Message {
  id: ID;
  from: ID;
  text?: string;
  image?: MediaSrc;
  postId?: ID;
  createdAt: number;
  reactions: string[];
}

export interface Thread {
  id: ID;
  with: ID;
  messages: Message[];
  unread?: boolean;
}

export interface Collection {
  id: ID;
  name: string;
  postIds: ID[];
}

export interface Settings {
  privateAccount: boolean;
  activityStatus: boolean;
  pushLikes: boolean;
  pushComments: boolean;
  pushFollows: boolean;
  pushMessages: boolean;
  emailUpdates: boolean;
  storyReplies: 'everyone' | 'following' | 'off';
  hideLikeCounts: boolean;
  language: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
