"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { BadgeCheck, Code2, Download, Heart, ListPlus, Share2, ThumbsDown, ThumbsUp, Clock } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { getCategory, getChannel } from "@/data/seed-media";
import { TheaterPlayer } from "@/components/video/TheaterPlayer";
import { VideoCard } from "@/components/video/VideoCard";
import { AddToPlaylistModal, Modal } from "@/components/ui/Modal";
import { CoverArt } from "@/components/video/CoverArt";
import { approval, formatCount, formatDuration, timeAgo } from "@/lib/format";

const TABS = ["Related Videos", "Comments", "Jump to Chapters"] as const;
const STAMP = /\b(\d{1,2}):([0-5]\d)\b/g;

export function WatchView({ id }: { id: string }) {
  const hub = useHub();
  const video = hub.getVideo(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerBox = useRef<HTMLDivElement>(null);
  const [theater, setTheater] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Related Videos");
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { addHistory } = hub;

  useEffect(() => {
    if (video) addHistory(video.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  if (!video) {
    return (
      <div className="mx-auto max-w-site px-[10px] py-16 text-center text-base text-ink">
        {hub.hydrated ? (
          <>
            This video is not available in this browser. <Link href="/upload" className="text-brand-text">Upload one</Link> or{" "}
            <Link href="/" className="text-brand-text">go home</Link>.
          </>
        ) : (
          "Loading…"
        )}
      </div>
    );
  }

  const creator = getChannel(video.creator);
  const category = getCategory(video.category);
  const my = hub.ratings[video.id];
  const likes = video.likes + (my === "up" ? 1 : 0);
  const dislikes = video.dislikes + (my === "down" ? 1 : 0);
  const pct = approval(likes, dislikes);
  const fav = hub.favorites.includes(video.id);
  const later = hub.watchLater.includes(video.id);
  const subscribed = hub.subscriptions.includes(video.creator);
  const comments = hub.commentsFor(video.id);
  const related = hub.videos
    .filter((v) => v.id !== video.id)
    .map((v) => ({ v, score: (v.category === video.category ? 3 : 0) + v.tags.filter((t) => video.tags.includes(t)).length + (v.creator === video.creator ? 2 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.v);
  const url = typeof window !== "undefined" ? window.location.href : `/watch/${video.id}/`;

  const seek = (sec: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.min(sec, el.duration || sec);
    void el.play().catch(() => undefined);
    playerBox.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderText = (text: string) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    for (const m of text.matchAll(STAMP)) {
      const at = m.index ?? 0;
      parts.push(text.slice(last, at));
      const sec = Number(m[1]) * 60 + Number(m[2]);
      parts.push(
        <button key={at} onClick={() => seek(sec)} className="font-bold text-brand-text hover:underline">
          {m[0]}
        </button>,
      );
      last = at + m[0].length;
    }
    parts.push(text.slice(last));
    return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = video.src;
    a.download = `${video.id}-4k.mp4`;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
    hub.toast("Premium unlocked: 4K download started");
  };

  return (
    <div className={`mx-auto pb-[40px] pt-[20px] ${theater ? "max-w-none px-0" : "max-w-site px-[10px] xl:px-0"}`}>
      <div className={`flex flex-col gap-[20px] ${theater ? "" : "lg:flex-row"}`}>
        <div className="min-w-0 flex-1">
          <div ref={playerBox} className="scroll-mt-[70px]">
            <TheaterPlayer
              key={video.id}
              src={video.src}
              seed={video.id}
              palette={video.palette}
              chapters={video.chapters}
              videoRef={videoRef}
              theater={theater}
              onTheater={() => setTheater((t) => !t)}
            />
          </div>

          <div className={theater ? "mx-auto max-w-site px-[10px] xl:px-0" : ""}>
            <h1 className="mt-[15px] text-2xl font-bold leading-[26px] text-white">{video.title}</h1>
            <div className="mt-[10px] flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-hairline pb-[15px]">
              <span className="text-md text-ink">
                <b className="text-white">{video.views.toLocaleString("en-US")}</b> views · {timeAgo(video.uploadedAt)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => hub.rate(video.id, "up")}
                  aria-pressed={my === "up"}
                  aria-label="Thumbs up"
                  className={`flex h-[34px] items-center gap-1 rounded-[3px] px-3 text-md ${my === "up" ? "bg-brand text-black" : "bg-pill text-ink hover:bg-pill-hover"}`}
                >
                  <ThumbsUp className="h-4 w-4" /> {formatCount(likes)}
                </button>
                <button
                  onClick={() => hub.rate(video.id, "down")}
                  aria-pressed={my === "down"}
                  aria-label="Thumbs down"
                  className={`flex h-[34px] items-center gap-1 rounded-[3px] px-3 text-md ${my === "down" ? "bg-white text-black" : "bg-pill text-ink hover:bg-pill-hover"}`}
                >
                  <ThumbsDown className="h-4 w-4" /> {formatCount(dislikes)}
                </button>
                <div className="w-[110px]">
                  <div className={`text-right text-md font-bold ${pct >= 90 ? "text-approve" : "text-brand"}`}>{pct}%</div>
                  <div className="h-[4px] overflow-hidden rounded-full bg-[#444]" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Approval">
                    <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:ml-auto">
                <ActionBtn active={fav} onClick={() => { hub.toggleFavorite(video.id); hub.toast(fav ? "Removed from Favorites" : "Added to Favorites"); }} icon={<Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />} label="Favorite" />
                <ActionBtn active={later} onClick={() => { hub.toggleWatchLater(video.id); hub.toast(later ? "Removed from Watch Later" : "Added to Watch Later"); }} icon={<Clock className="h-4 w-4" />} label="Later" />
                <ActionBtn onClick={() => setPlaylistOpen(true)} icon={<ListPlus className="h-4 w-4" />} label="Add to Playlist" />
                <ActionBtn onClick={download} icon={<Download className="h-4 w-4" />} label="Download 4K" brand />
                <ActionBtn onClick={() => setShareOpen(true)} icon={<Share2 className="h-4 w-4" />} label="Share / Embed" />
              </div>
            </div>

            {/* Creator & tags */}
            <div className="mt-[15px] rounded-[3px] bg-surface p-[15px]">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/channel/${video.creator}`} className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full border border-hairline">
                  <CoverArt seed={video.creator} palette={creator?.palette ?? video.palette} />
                </Link>
                <div>
                  <Link href={`/channel/${video.creator}`} className="flex items-center gap-1 text-base font-bold text-white hover:text-brand">
                    {creator?.name ?? video.creator}
                    {creator?.verified && <BadgeCheck className="h-4 w-4 text-brand" aria-label="Verified" />}
                  </Link>
                  <p className="text-xs text-muted">{creator ? `${formatCount(creator.subscribers + (subscribed ? 1 : 0))} subscribers` : "Independent creator"}</p>
                </div>
                <button
                  onClick={() => hub.toggleSubscribe(video.creator)}
                  aria-pressed={subscribed}
                  className={`ml-auto h-[34px] rounded-[3px] px-4 text-md font-bold ${subscribed ? "bg-pill text-ink hover:bg-pill-hover" : "bg-brand text-black hover:bg-brand-hover"}`}
                >
                  {subscribed ? "Subscribed ✓" : "Subscribe"}
                </button>
              </div>
              <p className="mt-3 text-md leading-[20px] text-ink">{video.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-muted">Category:</span>
                {category && (
                  <Link href={`/categories/${category.slug}`} className="rounded-pill bg-pill px-3 py-1 text-sm text-white hover:bg-pill-hover hover:text-brand">
                    {category.name}
                  </Link>
                )}
                <span className="ml-2 text-xs font-bold uppercase text-muted">Tags:</span>
                {video.tags.map((t) => (
                  <Link key={t} href={`/videos?tag=${encodeURIComponent(t)}`} className="rounded-[2px] border border-hairline bg-pill px-2 py-1 text-sm text-ink hover:border-brand/50 hover:text-brand">
                    #{t}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div role="tablist" className="mt-[20px] flex border-b border-hairline">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2 text-md font-bold ${tab === t ? "border-brand text-brand" : "border-transparent text-ink hover:text-white"}`}
                >
                  {t === "Comments" ? `Comments (${comments.length})` : t}
                </button>
              ))}
            </div>

            <div className="pt-[15px]" role="tabpanel">
              {tab === "Related Videos" && (
                <div className="grid grid-cols-1 gap-x-[10px] gap-y-[20px] sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {related.map((v) => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </div>
              )}
              {tab === "Comments" && (
                <div>
                  <form
                    className="mb-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!draft.trim()) return;
                      hub.addComment(video.id, draft.trim());
                      setDraft("");
                    }}
                  >
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Add a comment… tip: type a time like 00:05 to link it"
                      aria-label="Write a comment"
                      className="h-[40px] flex-1 rounded-[3px] bg-field px-3 text-md text-white outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button className="rounded-[3px] bg-brand px-4 text-md font-bold text-black hover:bg-brand-hover">Post</button>
                  </form>
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <li key={c.id} className="flex gap-3">
                        <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-chip text-sm font-bold uppercase text-brand">
                          {c.author[0]}
                        </span>
                        <div>
                          <p className="text-sm">
                            <b className="text-white">{c.author}</b> <span className="text-dim">{timeAgo(c.postedAt)}</span>
                          </p>
                          <p className="text-md leading-[19px] text-ink">{renderText(c.text)}</p>
                          <p className="text-xs text-dim">
                            <ThumbsUp className="mr-1 inline h-3 w-3" />
                            {c.likes}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tab === "Jump to Chapters" && (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {video.chapters.map((c, i) => (
                    <li key={c.time}>
                      <button onClick={() => seek(c.time)} className="flex w-full items-center gap-3 rounded-[3px] bg-surface p-2 text-left hover:bg-pill">
                        <span className="aspect-video w-[96px] shrink-0 overflow-hidden rounded-thumb">
                          <CoverArt seed={video.id} palette={video.palette} frame={i} />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-brand">{formatDuration(c.time)}</span>
                          <span className="text-md text-white">{c.title}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddToPlaylistModal videoId={playlistOpen ? video.id : null} onClose={() => setPlaylistOpen(false)} />
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share / Embed">
        <ShareBody url={url} id={video.id} onCopied={(t) => hub.toast(t)} />
      </Modal>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, active, brand }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; brand?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-[34px] items-center gap-1.5 rounded-[3px] px-3 text-md font-bold ${
        brand ? "bg-brand text-black hover:bg-brand-hover" : active ? "bg-pill text-brand" : "bg-pill text-ink hover:bg-pill-hover hover:text-white"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ShareBody({ url, id, onCopied }: { url: string; id: string; onCopied: (t: string) => void }) {
  const embed = `<iframe src="${url}" width="640" height="360" title="StreamHub ${id}" allowfullscreen></iframe>`;
  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text).then(() => onCopied(`${what} copied`), () => onCopied("Copy blocked by browser"));
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-bold uppercase text-muted">Link</p>
        <div className="flex gap-2">
          <input readOnly value={url} aria-label="Share link" className="h-[36px] flex-1 rounded-[3px] bg-field px-3 text-sm text-white" />
          <button onClick={() => copy(url, "Link")} className="rounded-[3px] bg-brand px-3 text-sm font-bold text-black">Copy</button>
        </div>
      </div>
      <div>
        <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-muted"><Code2 className="h-3.5 w-3.5" /> Embed</p>
        <textarea readOnly value={embed} aria-label="Embed code" rows={3} className="w-full rounded-[3px] bg-field p-2 font-mono text-xs text-white" />
        <button onClick={() => copy(embed, "Embed code")} className="mt-1 rounded-[3px] bg-pill px-3 py-1.5 text-sm font-bold text-white hover:bg-pill-hover">Copy embed code</button>
      </div>
    </div>
  );
}
