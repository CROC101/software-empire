'use client';

import { ALBUMS, ARTISTS, PLAYLISTS, SECTIONS, TRACKS } from '@/data/seed-spotify';
import { AlbumCard, ArtistCard, PlaylistCard, TrackCard } from '@/components/ui/Cards';

/** "Show all" page: the shelf's items as a wrapping grid. */
export default function SectionView({ id }: { id: string }) {
  const s = SECTIONS.find((x) => x.id === id)!;
  return (
    <section aria-label={s.title}>
      <div className="mx-auto max-w-[1955px] px-4 lg:px-[23px]">
      <h1 className="mt-12 md:mt-[74px] font-title text-2xl font-bold leading-[39px] tracking-[-0.02em] md:text-3xl">{s.title}</h1>
      {/* -mx-3 cancels the cards' own 12px padding so art lines up with the title */}
      <section aria-label={s.title} className="-mx-3 mb-10 mt-6 grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:mt-8">
        {s.kind === 'tracks' && TRACKS.map((t) => <TrackCard key={t.id} t={t} list={TRACKS} />)}
        {s.kind === 'artists' && ARTISTS.map((a) => <ArtistCard key={a.id} a={a} />)}
        {s.kind === 'albums' && ALBUMS.map((a) => <AlbumCard key={a.id} a={a} />)}
        {s.kind === 'playlists' && PLAYLISTS.map((p) => <PlaylistCard key={p.id} pl={p} />)}
      </section>
      </div>
    </section>
  );
}
