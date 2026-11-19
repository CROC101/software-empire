import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const S = ({ size = 24, children, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    {children}
  </svg>
);
const st = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const ChevronRight = (p: P) => <S {...p}><path d="M9 5l7 7-7 7" {...st} /></S>;
export const ChevronLeft = (p: P) => <S {...p}><path d="M15 5l-7 7 7 7" {...st} /></S>;
export const ChevronDown = (p: P) => <S {...p}><path d="M5 9l7 7 7-7" {...st} /></S>;
export const Plus = (p: P) => <S {...p}><path d="M12 3v18M3 12h18" {...st} strokeWidth={1.6} /></S>;
export const Close = (p: P) => <S {...p}><path d="M4 4l16 16M20 4L4 20" {...st} strokeWidth={1.6} /></S>;
export const Check = (p: P) => <S {...p}><path d="M4 12.5l5 5L20 6.5" {...st} /></S>;
export const Play = (p: P) => <S {...p}><path d="M6 4l15 8-15 8z" fill="currentColor" /></S>;
export const Pause = (p: P) => <S {...p}><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></S>;
export const Info = (p: P) => <S {...p}><circle cx="12" cy="12" r="9.5" {...st} /><path d="M12 11v6M12 7.2v.1" {...st} /></S>;
export const Search = (p: P) => <S {...p}><circle cx="10.5" cy="10.5" r="6.5" {...st} /><path d="M15.5 15.5L21 21" {...st} /></S>;
export const Bell = (p: P) => <S {...p}><path d="M6 17V11a6 6 0 1112 0v6l2 2H4zM10 21h4" {...st} /></S>;
export const ThumbUp = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p}><path d="M7 21H4V10h3m0 11V10m0 11h10.3a2 2 0 002-1.7l1.2-7A2 2 0 0018.5 10H14V5.5A2.5 2.5 0 0011.5 3L7 10" {...st} fill={filled ? 'currentColor' : 'none'} /></S>
);
export const ThumbDown = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p} style={{ transform: 'rotate(180deg)' }}><path d="M7 21H4V10h3m0 11V10m0 11h10.3a2 2 0 002-1.7l1.2-7A2 2 0 0018.5 10H14V5.5A2.5 2.5 0 0011.5 3L7 10" {...st} fill={filled ? 'currentColor' : 'none'} /></S>
);
export const DoubleThumb = ({ filled, ...p }: P & { filled?: boolean }) => (
  <S {...p}><path d="M5 21H3V11h2m0 10V11m0 10h8.5a2 2 0 002-1.7l1-6A2 2 0 0014.5 11H11V7a2 2 0 00-2-2l-4 6" {...st} fill={filled ? 'currentColor' : 'none'} /><path d="M13 5.5l2-3.5a2 2 0 012 2V8h3a2 2 0 012 2.3l-1 6a2 2 0 01-2 1.7h-1" {...st} /></S>
);
export const VolumeOn = (p: P) => <S {...p}><path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" {...st} /></S>;
export const VolumeOff = (p: P) => <S {...p}><path d="M4 9h4l5-4v14l-5-4H4zM16.5 9.5l5 5M21.5 9.5l-5 5" {...st} /></S>;
export const Replay = (p: P) => <S {...p}><path d="M4 12a8 8 0 108-8H8M8 1L5 4l3 3" {...st} /></S>;
export const Back10 = (p: P) => (
  <S {...p}><path d="M5 12a7.5 7.5 0 107.5-7.5H9M9 1.5l-3 3 3 3" {...st} /><text x="12.5" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" fontWeight="700">10</text></S>
);
export const Fwd10 = (p: P) => (
  <S {...p}><path d="M19 12a7.5 7.5 0 11-7.5-7.5H15M15 1.5l3 3-3 3" {...st} /><text x="11.5" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" fontWeight="700">10</text></S>
);
export const Fullscreen = (p: P) => <S {...p}><path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" {...st} /></S>;
export const Subtitles = (p: P) => <S {...p}><rect x="2.5" y="5" width="19" height="14" rx="2" {...st} /><path d="M6 13h4M12 13h6M6 16h8" {...st} /></S>;
export const Episodes = (p: P) => <S {...p}><rect x="2.5" y="8" width="15" height="12" rx="1" {...st} /><path d="M6 5h15v11" {...st} /></S>;
export const NextEp = (p: P) => <S {...p}><path d="M4 4l11 8-11 8zM19 4v16" {...st} fill="currentColor" /></S>;
export const Speed = (p: P) => <S {...p}><path d="M4 18a9 9 0 1116 0M12 14l4-5" {...st} /></S>;
export const Back = (p: P) => <S {...p}><path d="M20 12H4M10 6l-6 6 6 6" {...st} /></S>;
export const Pencil = (p: P) => <S {...p}><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" {...st} /></S>;
export const Grid = (p: P) => <S {...p}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" {...st} /></S>;
export const List = (p: P) => <S {...p}><path d="M4 6h16M4 12h16M4 18h16" {...st} /></S>;
export const Download = (p: P) => <S {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" {...st} /></S>;

export const Translate = (p: P) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M10.7668 5.33333L10.5038 5.99715L9.33974 8.9355L8.76866 10.377L7.33333 14H9.10751L9.83505 12.0326H13.4217L14.162 14H16L12.5665 5.33333H10.7668ZM10.6247 9.90838L10.8723 9.23964L11.634 7.18017L12.4082 9.23964L12.6566 9.90838H10.6247ZM4.33333 2.33333V1H2.66667V2.33333H0V4H6.6V3.98H6.67C6.4 4.98 5.85 6.07 5.06 7.08 4.71 6.67 4.4 6.25 4.16 5.83H2.33C2.62 6.49 3.1 7.24 3.98 8.29 3.14 9.08 2.13 9.76 0.75 10.25L1.36 11.85C2.91 11.25 4.13 10.47 5.08 9.53 5.7 10.09 6.19 10.43 6.82 10.84L7.43 9.28C7.06 9.02 6.66 8.71 6.18 8.29 7.29 6.84 8.04 5.25 8.36 4H9.33V2.33H4.33Z" />
  </svg>
);
export const Caret = (p: P) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M11.6 6.43a.75.75 0 01.07 1.06L8 11.15 4.33 7.49a.75.75 0 011.13-.98L8 9.05l2.54-2.54a.75.75 0 011.06-.08z" />
  </svg>
);
