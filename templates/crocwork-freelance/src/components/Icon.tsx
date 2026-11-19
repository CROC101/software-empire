import type { SVGProps } from 'react';

const paths = {
  palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1 .2-2.2 1.3-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10ZM7.5 12.5h.01M10 8h.01M15 8h.01',
  code: 'm8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  megaphone: 'M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1ZM17 9a4 4 0 0 1 0 6M7 15l1 5',
  pen: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
  video: 'M3 6h12v12H3zM15 10l6-3v10l-6-3',
  briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
  heart: 'M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9Z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-5-5',
  chevronDown: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chat: 'M4 5h16v11H9l-5 4V5Z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
  trend: 'm3 17 6-6 4 4 8-8M15 7h6v6',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  check: 'm5 12 5 5 9-10',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3ZM8.5 12l2.5 2.5 4.5-5',
  bag: 'M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  paperclip: 'M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l8-8',
  send: 'M4 12 20 4l-6 16-3-7-7-1Z',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
  repeat: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  building: 'M4 21V5l8-2v18M12 8h8v13M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M2 21h20',
  installment: 'M3 7h18v10H3zM7 12h.01M17 12h.01M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  medal: 'M8 3h8l-2 6h-4L8 3ZM12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5Z',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9h.01',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  wallet: 'M3 7h16v12H3zM3 7l12-4v4M15 13h.01',
  phone: 'M7 3h10v18H7zM11 18h2',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
