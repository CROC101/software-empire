'use client';

import { ARTISTS, ALBUMS, PLAYLISTS, PODCAST_CATEGORIES, TRACKS, TRENDING_SECTION_ID } from '@/data/seed-spotify';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import type { TrackItem } from '@/types/spotify';
import Shelf from '@/components/ui/Shelf';
import { AlbumCard, ArtistCard, PlaylistCard, TrackCard } from '@/components/ui/Cards';
import MediaCard from '@/components/ui/MediaCard';

export default function HomePage() {
  const lib = useLibrary();
  const p = usePlayer();
  const recent = p.history.map((id) => lib.trackById(id)).filter((t): t is TrackItem => !!t).slice(0, 10);
  const trending = [...TRACKS].sort((a, b) => (a.id === 't-snap-back' ? -1 : b.id === 't-snap-back' ? 1 : a.title.length % 3 - b.title.length % 3));

  return (
    <div>
      <section aria-label="Home" className="relative pb-6 pt-1 md:pb-8">
        <div className="mx-auto max-w-[1955px] px-4 md:px-10 flex flex-col gap-4">
        <h1 className="sr-only">Home</h1>
            <Shelf title="Trending songs" href={`/section/${TRENDING_SECTION_ID}`}>
              {trending.slice(0, 20).map((t) => (
                <TrackCard key={t.id} t={t} fixed list={trending} contextHref={`/album/${t.albumId}`} />
              ))}
            </Shelf>
            <Shelf title="Popular artists" href="/section/popular-artists">
              {ARTISTS.map((a) => (
                <ArtistCard key={a.id} a={a} fixed />
              ))}
            </Shelf>
            <Shelf title="Popular albums and singles" href="/section/popular-albums">
              {ALBUMS.slice(0, 10).map((a) => (
                <AlbumCard key={a.id} a={a} fixed />
              ))}
            </Shelf>
            <Shelf title="Popular radio" href="/section/popular-artists">
              {ARTISTS.map((a) => (
                <MediaCard key={a.id} fixed href={`/artist/${a.id}`} title={`${a.name} Radio`} cover={{ color: a.cover.accent, accent: a.cover.color }} subtitle={`With ${a.name} and similar artists`} tracks={trending.filter((t) => t.artistId === a.id)} contextName={`${a.name} Radio`} />
              ))}
            </Shelf>
            <Shelf title="Featured Charts" href="/section/made-for-you">
              {PLAYLISTS.filter((pl) => ['top-beats', 'daily-mix-1', 'neon-drive', 'boss-battle'].includes(pl.id)).map((pl) => (
                <PlaylistCard key={pl.id} pl={pl} fixed />
              ))}
            </Shelf>
            <Shelf title="Made For You" href="/section/made-for-you">
              {PLAYLISTS.map((pl) => (
                <PlaylistCard key={pl.id} pl={pl} fixed />
              ))}
            </Shelf>
            {recent.length > 0 && (
              <Shelf title="Jump Back In" href="/queue">
                {recent.map((t) => (
                  <TrackCard key={t.id} t={t} fixed />
                ))}
              </Shelf>
            )}
          <Shelf title="Imported From YouTube" href="/import">
            {lib.imported.map((t) => (
              <TrackCard key={t.id} t={t} fixed list={lib.imported} contextHref="/import" />
            ))}
            <MediaCard fixed href="/import" title="Import a song" cover={{ color: '#c4302b', accent: '#ffffff' }} subtitle="Paste a YouTube link or search for a track" />
          </Shelf>
          <Shelf title="Podcast categories" href="/genre/podcasts-web">
            {PODCAST_CATEGORIES.map((c) => (
              <MediaCard key={c.name} fixed href={c.href} title={c.name} cover={{ color: c.color, accent: c.accent }} subtitle="Podcasts" />
            ))}
          </Shelf>
        </div>
      </section>
    </div>
  );
}
