"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Play, Trash2, X } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { CoverArt } from "@/components/video/CoverArt";
import { TheaterPlayer } from "@/components/video/TheaterPlayer";
import { formatDuration } from "@/lib/format";

export function PlaylistView({ slug }: { slug: string }) {
  const hub = useHub();
  const router = useRouter();
  const pl = hub.getPlaylist(slug);
  const [playing, setPlaying] = useState<number | null>(null);
  const [theater, setTheater] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  if (!pl) {
    return (
      <div className="mx-auto max-w-site px-[10px] py-16 text-center text-base text-ink">
        {hub.hydrated ? <>This playlist doesn&apos;t exist yet. Create one from any video&apos;s “Add to Playlist” button. <Link href="/" className="text-brand-text">Go home</Link></> : "Loading…"}
      </div>
    );
  }
  const items = pl.videoIds.map((id) => hub.getVideo(id)).filter((v): v is NonNullable<typeof v> => !!v);
  const current = playing !== null ? items[playing] : null;

  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <div className="mb-[15px] flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-white">{pl.name}</h1>
        <span className="text-md text-muted">{items.length} videos</span>
        <div className="ml-auto flex gap-2">
          <button
            disabled={!items.length}
            onClick={() => setPlaying(0)}
            className="flex h-[34px] items-center gap-1 rounded-[3px] bg-brand px-4 text-md font-bold text-black hover:bg-brand-hover disabled:opacity-40"
          >
            <Play className="h-4 w-4" fill="currentColor" /> Play All
          </button>
          {!pl.system && (
            <button
              onClick={() => {
                hub.deletePlaylist(pl.id);
                router.push("/playlists/favorites");
              }}
              className="flex h-[34px] items-center gap-1 rounded-[3px] bg-pill px-3 text-md text-ink hover:bg-pill-hover"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="mb-[15px] flex flex-wrap gap-2">
        {hub.allPlaylists.map((p) => (
          <Link key={p.id} href={`/playlists/${p.id}`} className={`rounded-pill px-3 py-1 text-sm font-bold ${p.id === pl.id ? "bg-brand text-black" : "bg-pill text-ink hover:text-white"}`}>
            {p.name} ({p.videoIds.length})
          </Link>
        ))}
      </div>

      {current && (
        <div className="mb-[20px]">
          <TheaterPlayer
            key={current.id}
            src={current.src}
            seed={current.id}
            palette={current.palette}
            chapters={current.chapters}
            videoRef={ref}
            theater={theater}
            onTheater={() => setTheater((t) => !t)}
            autoPlay
            onEnded={() => setPlaying((p) => (p !== null && p + 1 < items.length ? p + 1 : null))}
          />
          <p className="mt-2 text-md text-ink">
            Playing <b className="text-white">{playing! + 1}</b> of {items.length}: <Link href={`/watch/${current.id}`} className="text-brand-text hover:underline">{current.title}</Link>
            <button onClick={() => setPlaying(null)} className="ml-3 text-muted hover:text-white">Stop</button>
          </p>
        </div>
      )}

      {items.length ? (
        <ol className="space-y-[8px]">
          {items.map((v, i) => (
            <li key={v.id} className={`flex items-center gap-3 rounded-[3px] p-[8px] ${i === playing ? "bg-pill ring-1 ring-brand" : "bg-surface"}`}>
              <span className="w-[24px] text-center text-md font-bold text-muted">{i + 1}</span>
              <button onClick={() => setPlaying(i)} className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-thumb" aria-label={`Play ${v.title}`}>
                <CoverArt seed={v.id} palette={v.palette} />
                <span className="absolute bottom-1 right-1 rounded-thumb bg-black/75 px-1 text-2xs font-bold text-white">{formatDuration(v.duration)}</span>
              </button>
              <Link href={`/watch/${v.id}`} className="line-clamp-2 min-w-0 flex-1 text-base text-white hover:text-brand">{v.title}</Link>
              {pl.id !== "history" && (
                <button onClick={() => hub.togglePlaylistVideo(pl.id, v.id)} aria-label="Remove from playlist" className="text-muted hover:text-brand">
                  <X className="h-5 w-5" />
                </button>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-[3px] bg-surface p-10 text-center text-base text-ink">
          Nothing here yet. Browse <Link href="/videos" className="text-brand-text">videos</Link> and use the clock or heart buttons to save them.
        </p>
      )}
    </div>
  );
}
