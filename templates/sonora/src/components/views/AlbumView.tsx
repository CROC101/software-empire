'use client';

import Link from 'next/link';
import { Disc3, List, MoreHorizontal, PlusCircle, CheckCircle2, Shuffle } from 'lucide-react';
import { ALBUMS, getAlbum, getArtist, TRACKS } from '@/data/seed-spotify';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { fmtTotal } from '@/lib/format';
import Cover from '@/components/ui/Cover';
import PlayButton from '@/components/ui/PlayButton';
import TrackTable from '@/components/ui/TrackTable';
import { AlbumCard, TrackCard } from '@/components/ui/Cards';
import { ActionBand, DetailHero, useCoverColor } from '@/components/ui/Hero';

export default function AlbumView({ id }: { id: string }) {
  const album = getAlbum(id)!;
  const artist = getArtist(album.artistId)!;
  const p = usePlayer();
  const lib = useLibrary();
  const tracks = album.trackIds.map((t) => TRACKS.find((x) => x.id === t)!);
  const color = useCoverColor(album.cover);
  const href = `/album/${id}`;
  const here = p.context?.href === href;
  const total = tracks.reduce((s, t) => s + t.duration, 0);
  const saved = tracks.every((t) => lib.isLiked(t.id));
  const discs = [...new Set(tracks.map((t) => t.disc ?? 1))];
  const more = ALBUMS.filter((a) => a.artistId === album.artistId && a.id !== id);
  const artistTracks = TRACKS.filter((t) => t.artistId === album.artistId && t.albumId !== id);

  return (
    <section aria-label={album.title} className="pb-4">
      <DetailHero color={color} kind={album.type} title={album.title} art={<Cover cover={album.cover} label={album.title} big className="h-full w-full" />}>
        <Cover cover={artist.cover} round className="h-6 w-6" />
        <Link href={`/artist/${artist.id}`} className="font-bold text-white hover:underline">
          {artist.name}
        </Link>
        <span>• {album.year}</span>
        <span>
          • {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}, {fmtTotal(total)}
        </span>
      </DetailHero>

      <ActionBand color={color}>
        <PlayButton playing={here && p.isPlaying} onClick={() => (here ? p.togglePlay() : p.playTracks(tracks, 0, { name: album.title, href }))} />
        <button type="button" aria-label="Shuffle" onClick={() => { if (!p.shuffle) p.toggleShuffle(); p.playTracks(tracks, Math.floor(Math.random() * tracks.length), { name: album.title, href }); }} className="text-subdued hover:text-white">
          <Shuffle size={32} />
        </button>
        <button type="button" aria-label={saved ? 'Remove from Your Library' : 'Save to Your Library'} onClick={() => tracks.forEach((t) => lib.isLiked(t.id) === saved && lib.toggleLike(t))} className={saved ? 'text-green' : 'text-subdued hover:text-white'}>
          {saved ? <CheckCircle2 size={32} /> : <PlusCircle size={32} />}
        </button>
        <button type="button" aria-label="Add album to queue" onClick={() => tracks.forEach((t) => p.addToQueue(t))} className="text-subdued hover:text-white">
          <MoreHorizontal size={32} />
        </button>
        <span className="ml-auto hidden items-center gap-2 text-sm text-subdued md:flex">
          List <List size={16} />
        </span>
      </ActionBand>

      <div className="mx-auto max-w-[1955px] px-2 md:px-4 lg:px-[23px]">
        {discs.map((d) => (
          <div key={d}>
            {discs.length > 1 && (
              <div className="flex h-14 items-center gap-4 px-4 text-base font-bold text-subdued">
                <Disc3 size={18} /> Disc {d}
              </div>
            )}
            <TrackTable
              tracks={tracks.filter((t) => (t.disc ?? 1) === d)}
              playList={tracks}
              context={{ name: album.title, href }}
              showAlbum={false}
              showCover={false}
              header={d === discs[0]}
            />
          </div>
        ))}
        <div className="mt-8 px-0 text-subdued md:px-0">
          <p className="text-sm">{album.releaseDate}</p>
          <p className="mt-0.5 text-xs">© {album.copyright}</p>
          <p className="text-xs">℗ {album.copyright}</p>
        </div>

        <section aria-label={`More by ${artist.name}`} className="mt-16">
        <h2 className="flex items-end justify-between px-2 font-title md:px-0 text-2xl font-bold tracking-[-0.02em]">
          <Link href={`/artist/${artist.id}`} className="hover:underline">More by {artist.name}</Link>
          <Link href={`/artist/${artist.id}`} className="pb-1 font-sans text-sm text-subdued hover:underline">Show discography</Link>
        </h2>
        <div className="-mx-1 mt-2 grid grid-cols-2 md:-mx-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* releases first, then songs from them, so a one-EP artist still fills the row */}
          {[...more.map((a) => <AlbumCard key={a.id} a={a} showArtist={false} />), ...artistTracks.map((t) => <TrackCard key={t.id} t={t} list={artistTracks} />)].slice(0, 5)}
        </div>
        </section>
      </div>
    </section>
  );
}
