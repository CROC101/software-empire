'use client';

import Link from 'next/link';
import type { AlbumItem, ArtistItem, PlaylistItem, TrackItem } from '@/types/spotify';
import { getArtist, TRACKS } from '@/data/seed-spotify';
import { useLibrary } from '@/context/LibraryContext';
import { albumHref, artistHref } from '@/lib/links';
import MediaCard from './MediaCard';

/** Typed wrappers around MediaCard so every card links to its own page. */
export function TrackCard({ t, fixed, list, contextHref }: { t: TrackItem; fixed?: boolean; list?: TrackItem[]; contextHref?: string }) {
  const tracks = list ? [...list.slice(list.indexOf(t)), ...list.slice(0, list.indexOf(t))] : [t];
  return (
    <MediaCard
      fixed={fixed}
      href={contextHref ?? albumHref(t)}
      title={t.title}
      cover={t.cover}
      tracks={tracks}
      contextName={t.albumName}
      explicit={t.explicit}
      subtitle={
        <Link href={artistHref(t)} className="hover:text-white hover:underline">
          {t.artistName}
        </Link>
      }
    />
  );
}

export function ArtistCard({ a, fixed }: { a: ArtistItem; fixed?: boolean }) {
  return <MediaCard fixed={fixed} round href={`/artist/${a.id}`} title={a.name} cover={a.cover} subtitle="Artist" tracks={TRACKS.filter((t) => t.artistId === a.id)} contextName={a.name} />;
}

export function AlbumCard({ a, fixed, showArtist = true }: { a: AlbumItem; fixed?: boolean; showArtist?: boolean }) {
  const artist = getArtist(a.artistId);
  return (
    <MediaCard
      fixed={fixed}
      href={`/album/${a.id}`}
      title={a.title}
      cover={a.cover}
      tracks={a.trackIds.map((id) => TRACKS.find((t) => t.id === id)!)}
      subtitle={
        showArtist && artist ? (
          <>
            {a.year} •{' '}
            <Link href={`/artist/${artist.id}`} className="hover:text-white hover:underline">
              {artist.name}
            </Link>
          </>
        ) : (
          `${a.year} • ${a.type}`
        )
      }
    />
  );
}

export function PlaylistCard({ pl, fixed }: { pl: PlaylistItem; fixed?: boolean }) {
  const lib = useLibrary();
  const tracks = pl.trackIds.map((id) => lib.trackById(id)).filter((t): t is TrackItem => !!t);
  return <MediaCard fixed={fixed} href={`/playlist/${pl.id}`} title={pl.name} cover={pl.cover} tracks={tracks} subtitle={pl.description || `By ${pl.owner}`} />;
}
