'use client';

import Link from 'next/link';
import { ARTISTS, PLAYLISTS, PODCAST_CATEGORIES, PODCAST_HUB, TRACKS, genreBySlug } from '@/data/seed-spotify';
import Shelf from '@/components/ui/Shelf';
import { ArtistCard, PlaylistCard, TrackCard } from '@/components/ui/Cards';

/** Category tile: coloured card with a tilted accent block in the corner (genre page "Categories" grid). */
export function CategoryTile({ name, color, accent, href, tall }: { name: string; color: string; accent: string; href: string; tall?: boolean }) {
  return (
    <Link href={href} className={`relative block overflow-hidden rounded-lg p-4 transition hover:brightness-110 ${tall ? 'aspect-square' : 'aspect-[16/9]'}`} style={{ backgroundColor: color }}>
      <span className="relative z-10 block max-w-[70%] break-words font-title text-xl font-bold leading-tight md:text-2xl">{name}</span>
      <span aria-hidden className="absolute -bottom-2 -right-5 h-[55%] w-[45%] rotate-[25deg] rounded shadow-[0_2px_4px_rgba(0,0,0,.2)]" style={{ background: `linear-gradient(135deg, ${accent}, ${color})` }} />
    </Link>
  );
}

export default function GenreView({ slug }: { slug: string }) {
  const g = genreBySlug(slug)!;
  const podcasts = slug === PODCAST_HUB.slug;
  const tracks = TRACKS.filter((t) => t.genres.includes(slug));
  const artistIds = new Set(tracks.map((t) => t.artistId));
  const lists = PLAYLISTS.filter((p) => p.trackIds.some((id) => tracks.some((t) => t.id === id)));

  return (
    <div className="pb-10">
      <header className="relative flex h-[200px] items-end bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,.35)_100%)] px-4 pb-6 md:h-[276px] md:px-6" style={{ backgroundColor: g.color }}>
        <h1 className="font-title text-[48px] font-extrabold leading-none tracking-[-0.04em] md:text-hero">{g.name}</h1>
      </header>

      {podcasts ? (
        <div className="mx-auto max-w-[1955px] px-4 pt-6 lg:px-[23px]">
        <section>
          <h2 className="font-title text-2xl font-bold">Categories</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
            {PODCAST_CATEGORIES.map((c) => (
              <CategoryTile key={c.name} {...c} />
            ))}
          </div>
        </section>
        </div>
      ) : (
        <div className="mx-auto flex max-w-[1955px] flex-col gap-4 px-4 pt-4 md:px-10">
          {lists.length > 0 && (
            <Shelf title={`${g.name} playlists`} href="/section/made-for-you">
              {lists.map((p) => (
                <PlaylistCard key={p.id} pl={p} fixed />
              ))}
            </Shelf>
          )}
          <Shelf title={`Top ${g.name} songs`} href={`/section/0JQ5DB5E8N831KzFzsBBQ2`}>
            {tracks.map((t) => (
              <TrackCard key={t.id} t={t} list={tracks} fixed />
            ))}
          </Shelf>
          <Shelf title="Artists" href="/section/popular-artists">
            {ARTISTS.filter((a) => artistIds.has(a.id)).map((a) => (
              <ArtistCard key={a.id} a={a} fixed />
            ))}
          </Shelf>
        </div>
      )}
    </div>
  );
}
