"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Link2 } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { CoverArt } from "@/components/video/CoverArt";

const HEIGHTS = ["aspect-video", "aspect-square", "aspect-[4/5]", "aspect-[3/2]"];

/** Looping "GIF": cycles the procedural cover frames like a short clip. */
function LoopClip({ seed, palette }: { seed: string; palette: [string, string, string] }) {
  const [f, setF] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setF((x) => (x + 1) % 6), 260);
    return () => clearInterval(t);
  }, []);
  return <CoverArt seed={seed} palette={palette} frame={f} />;
}

export default function GifsPage() {
  const { videos, toast } = useHub();
  const copy = (id: string) => {
    const url = `${location.origin}/watch/${id}/`;
    void navigator.clipboard?.writeText(url).then(() => toast("GIF link copied"), () => toast("Copy blocked by browser"));
  };
  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <h1 className="mb-[15px] text-xl font-bold text-white">Photos & GIFs</h1>
      <div className="columns-1 gap-[10px] sm:columns-2 md:columns-3 lg:columns-4">
        {videos.map((v, i) => (
          <figure key={v.id} className="group relative mb-[10px] break-inside-avoid overflow-hidden rounded-[3px] bg-surface">
            <Link href={`/watch/${v.id}`} className={`block ${HEIGHTS[i % HEIGHTS.length]}`}>
              <LoopClip seed={v.id} palette={v.palette} />
            </Link>
            <span className="absolute left-2 top-2 rounded-thumb bg-brand px-1.5 text-2xs font-bold text-black">GIF</span>
            <figcaption className="flex items-center gap-2 p-2">
              <span className="line-clamp-1 flex-1 text-sm text-ink">{v.title}</span>
              <button onClick={() => copy(v.id)} aria-label="Copy GIF Link" title="Copy GIF Link" className="text-ink hover:text-brand">
                <Link2 className="h-4 w-4" />
              </button>
              <a href={v.src} target="_blank" rel="noreferrer" download aria-label="Download MP4/GIF" title="Download MP4/GIF" className="text-ink hover:text-brand">
                <Download className="h-4 w-4" />
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
