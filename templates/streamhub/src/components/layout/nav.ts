import { categories, channels } from "@/data/seed-media";

export interface NavLink {
  href: string;
  label: string;
}

export const MAIN_NAV: (NavLink & { menu?: NavLink[] })[] = [
  { href: "/", label: "Home" },
  {
    href: "/videos",
    label: "Videos",
    menu: [
      { href: "/videos", label: "All Videos" },
      { href: "/videos?tag=4K", label: "4K Ultra HD" },
      { href: "/videos?tag=60FPS", label: "60 FPS" },
      { href: "/videos?tag=Tutorial", label: "Tutorials" },
      { href: "/trending", label: "Top Rated" },
    ],
  },
  { href: "/categories", label: "Categories", menu: categories.map((c) => ({ href: `/categories/${c.slug}`, label: c.name })) },
  { href: "/live", label: "Live Streams" },
  { href: "/channels", label: "Channels", menu: channels.map((c) => ({ href: `/channel/${c.handle}`, label: `@${c.handle}` })) },
  {
    href: "/community",
    label: "Community",
    menu: [
      { href: "/community", label: "Community Feed" },
      { href: "/channels", label: "Creator Rankings" },
      { href: "/upload", label: "Upload Studio" },
    ],
  },
  {
    href: "/gifs",
    label: "Photos & GIFs",
    menu: [
      { href: "/gifs", label: "GIF Gallery" },
      { href: "/playlists/favorites", label: "My Favorites" },
    ],
  },
  { href: "/trending", label: "Trending" },
];

export const STRIP_LINKS: NavLink[] = [
  { href: "/upload", label: "Studio" },
  { href: "/channels", label: "Creators" },
  { href: "/community", label: "Community" },
  { href: "/trending", label: "Insights" },
  { href: "/categories", label: "Sites" },
  { href: "/gifs", label: "Gifs" },
  { href: "/content-removal", label: "Trust & Safety" },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: "Information",
    links: [
      { href: "/categories", label: "Sitemap" },
      { href: "/information/terms", label: "Terms & Conditions" },
      { href: "/information/privacy", label: "Privacy Notice" },
      { href: "/information/copyright", label: "Copyright" },
      { href: "/content-removal", label: "Removal Requests" },
      { href: "/information/cookie-notice", label: "Cookie Notice" },
      { href: "/information/accessibility", label: "Accessibility" },
      { href: "/information/trust-and-safety", label: "Law Enforcement" },
    ],
  },
  {
    title: "Work With Us",
    links: [
      { href: "/upload", label: "Content Partners" },
      { href: "/channels", label: "Creator Program" },
      { href: "/information/press", label: "Press" },
    ],
  },
  {
    title: "Support and Help",
    links: [
      { href: "/content-removal", label: "Content Removal" },
      { href: "/information/faq", label: "FAQ" },
      { href: "/information/trust-and-safety", label: "Trust and Safety" },
      { href: "/information/cookie-notice", label: "Manage Cookies" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/community", label: "StreamHub Blog" },
      { href: "/trending", label: "Insights" },
      { href: "/live", label: "Live Streams" },
      { href: "/gifs", label: "GIF Gallery" },
    ],
  },
];

export const LANGUAGES = [
  "English", "Bulgarian", "Croatian", "Czech", "Danish", "Dutch", "Estonian", "Finnish", "French", "German", "Greek",
  "Hungarian", "Italian", "Latvian", "Lithuanian", "Polish", "Portuguese", "Romanian", "Slovak", "Slovenian", "Spanish", "Swedish", "Thai",
];
