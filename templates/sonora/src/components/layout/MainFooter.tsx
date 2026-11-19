import Link from 'next/link';
import { Download, Info, LifeBuoy, type LucideIcon } from 'lucide-react';
import { MUSIC_CREDIT } from '@/data/seed-spotify';

const SOCIAL: [string, string, LucideIcon][] = [
  ['Install app', '/download', Download],
  ['Support', '/account#support', LifeBuoy],
  ['About', '/account#legal', Info],
];

const COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: 'Sonora', links: [['About', '/account#legal'], ['Premium', '/account'], ['Install app', '/download']] },
  { title: 'Listen', links: [['Home', '/'], ['Search', '/search'], ['Trending songs', '/section/0JQ5DB5E8N831KzFzsBBQ2'], ['Podcasts', '/genre/podcasts-web']] },
  { title: 'Your music', links: [['Liked Songs', '/collection/tracks'], ['Queue', '/queue'], ['Lyrics', '/lyrics'], ['Import', '/import']] },
  { title: 'Help', links: [['Support', '/account#support'], ['Equalizer', '/account#equalizer'], ['Credits', '/account#legal']] },
];

/** Link columns at the foot of every view (desktop), like the original's page footer. */
export default function MainFooter() {
  return (
    <footer className="hidden md:block">
    <nav aria-label="Footer" className="bg-surface px-4 pb-10 pt-2 lg:px-6">
      <div className="flex flex-wrap gap-y-8 border-t border-white/10 pt-8">
        {COLUMNS.map((c) => (
          <div key={c.title} className="w-1/2 lg:w-1/4">
            <h2 className="text-base font-bold text-white">{c.title}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-base text-subdued hover:text-white hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex gap-4 lg:ml-auto">
          {SOCIAL.map(([label, href, Icon]) => (
            <Link key={label} href={href} aria-label={label} className="grid h-10 w-10 place-items-center rounded-full bg-[#292929] text-white transition hover:bg-[#727272]">
              <Icon size={16} />
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-10 border-t border-white/10 pt-8 text-sm text-subdued">© 2026 Sonora · {MUSIC_CREDIT}</p>
    </nav>
    </footer>
  );
}
