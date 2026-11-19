import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 24, ...p }: P) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p,
});

export const I = {
  Home: (p: P) => <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /></svg>,
  HomeFill: (p: P) => <svg {...base(p)} fill="currentColor"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /></svg>,
  Search: (p: P) => <svg {...base(p)}><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></svg>,
  Explore: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9.5" /><path d="m15.8 8.2-2.4 5.2-5.2 2.4 2.4-5.2z" /></svg>,
  Reels: (p: P) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M3 8h18M9 3l3 5M14 3l3 5" /><path d="m10 11.5 4.5 2.5-4.5 2.5z" /></svg>,
  Send: (p: P) => <svg {...base(p)}><path d="M22 3 9.2 10.1M22 3l-7.2 18-3.6-8.9L2.5 8.4z" /></svg>,
  Heart: (p: P) => <svg {...base(p)}><path d="M12 20.5s-8.5-4.9-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6.1-8.5 11-8.5 11z" /></svg>,
  HeartFill: (p: P) => <svg {...base(p)} fill="currentColor"><path d="M12 20.5s-8.5-4.9-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6.1-8.5 11-8.5 11z" /></svg>,
  Create: (p: P) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>,
  Menu: (p: P) => <svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>,
  Comment: (p: P) => <svg {...base(p)}><path d="M20.7 16.2A9 9 0 1 0 17 19.6L21 21z" /></svg>,
  Bookmark: (p: P) => <svg {...base(p)}><path d="M19 21l-7-6.2L5 21V3h14z" /></svg>,
  BookmarkFill: (p: P) => <svg {...base(p)} fill="currentColor"><path d="M19 21l-7-6.2L5 21V3h14z" /></svg>,
  More: (p: P) => <svg {...base(p)} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>,
  Close: (p: P) => <svg {...base(p)}><path d="M5 5l14 14M19 5 5 19" /></svg>,
  ChevronLeft: (p: P) => <svg {...base(p)}><path d="m15 5-7 7 7 7" /></svg>,
  ChevronRight: (p: P) => <svg {...base(p)}><path d="m9 5 7 7-7 7" /></svg>,
  ChevronDown: (p: P) => <svg {...base(p)}><path d="m5 9 7 7 7-7" /></svg>,
  ChevronUp: (p: P) => <svg {...base(p)}><path d="m5 15 7-7 7 7" /></svg>,
  Settings: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  Sun: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  Moon: (p: P) => <svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>,
  Mute: (p: P) => <svg {...base(p)}><path d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" /></svg>,
  Sound: (p: P) => <svg {...base(p)}><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>,
  Play: (p: P) => <svg {...base(p)} fill="currentColor"><path d="M7 4v16l13-8z" /></svg>,
  Pause: (p: P) => <svg {...base(p)} fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>,
  Smile: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9.5" /><path d="M8 14.5s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01" /></svg>,
  Image: (p: P) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.8" /><path d="m21 15-5-5L5 21" /></svg>,
  Media: (p: P) => <svg {...base({ ...p, size: p.size ?? 96 })} viewBox="0 0 97.6 77.3" strokeWidth={2.4}><rect x="20" y="4" width="66" height="52" rx="8" /><path d="M8 18h4M8 18v46a6 6 0 0 0 6 6h50" /><circle cx="40" cy="22" r="6" /><path d="m26 50 16-16 10 10 10-12 18 18" /></svg>,
  Phone: (p: P) => <svg {...base(p)}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>,
  Video: (p: P) => <svg {...base(p)}><rect x="2" y="6" width="14" height="12" rx="3" /><path d="m22 8-6 4 6 4z" /></svg>,
  Info: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5h.01" /></svg>,
  Grid: (p: P) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>,
  Tag: (p: P) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="12" cy="10" r="3" /><path d="M6.5 21a6 6 0 0 1 11 0" /></svg>,
  Location: (p: P) => <svg {...base(p)}><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  Link: (p: P) => <svg {...base(p)}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>,
  Activity: (p: P) => <svg {...base(p)}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  Lock: (p: P) => <svg {...base(p)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  Bell: (p: P) => <svg {...base(p)}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  User: (p: P) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  Globe: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5a14 14 0 0 1 0 19M12 2.5a14 14 0 0 0 0 19" /></svg>,
  Help: (p: P) => <svg {...base(p)}><circle cx="12" cy="12" r="9.5" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg>,
  Shield: (p: P) => <svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Logout: (p: P) => <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  Crop: (p: P) => <svg {...base(p)}><path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" /></svg>,
  Edit: (p: P) => <svg {...base(p)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  Copy: (p: P) => <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  Music: (p: P) => <svg {...base(p)}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
  Verified: ({ size = 12, ...p }: P) => (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="Verified" {...p}>
      <path fill="#0095f6" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z" />
      <path fill="#fff" d="m17.2 26.6-6.1-6.2 2.1-2.1 4 4 9.6-9.6 2.1 2.1z" />
    </svg>
  ),
  Plus: (p: P) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>,
  Check: (p: P) => <svg {...base(p)}><path d="m5 12 5 5 9-10" /></svg>,
  ArrowLeft: (p: P) => <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  Trash: (p: P) => <svg {...base(p)}><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" /></svg>,
};

/** Round badge for the "log in with your company account" button (brand-neutral). */
export const SocialBadge = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="8" fill="var(--accent)" />
    <circle cx="8" cy="6.2" r="2.3" fill="#fff" />
    <path d="M3.8 12.6a4.4 4.4 0 0 1 8.4 0z" fill="#fff" />
  </svg>
);
