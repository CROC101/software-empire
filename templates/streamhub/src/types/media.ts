export type Quality = "4K" | "1080p" | "720p";

export interface ChapterMarker {
  time: number; // seconds
  title: string;
}

export interface CommentItem {
  id: string;
  videoId: string;
  author: string;
  text: string;
  postedAt: string; // ISO date
  likes: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  creator: string; // channel handle without @
  category: string; // category slug
  tags: string[];
  duration: number; // seconds
  views: number;
  likes: number;
  dislikes: number;
  favorites: number;
  uploadedAt: string; // ISO date
  quality: Quality;
  fps: 30 | 60;
  fullLength: boolean;
  src: string;
  palette: [string, string, string];
  chapters: ChapterMarker[];
}

export interface CreatorChannel {
  handle: string;
  name: string;
  bio: string;
  verified: boolean;
  subscribers: number;
  totalViews: number;
  rank: number;
  palette: [string, string, string];
  socials: { label: string; url: string }[];
  joined: string;
}

export interface CategoryItem {
  slug: string;
  name: string;
  description: string;
  videoCount: number;
  palette: [string, string, string];
  trendingTags: string[];
}

export interface PlaylistItem {
  id: string;
  name: string;
  videoIds: string[];
  system?: boolean;
}
