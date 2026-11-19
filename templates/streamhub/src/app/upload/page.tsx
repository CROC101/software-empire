"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { useHub } from "@/context/MediaHubContext";
import { ALL_TAGS, categories, channels, SAMPLE_STREAMS } from "@/data/seed-media";
import type { Quality } from "@/types/media";

const field = "h-[44px] w-full rounded-[3px] bg-field px-3 text-md text-white outline-none focus:ring-1 focus:ring-brand";

export default function UploadPage() {
  const hub = useHub();
  const router = useRouter();
  const [src, setSrc] = useState(SAMPLE_STREAMS[0].src);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(categories[0].slug);
  const [creator, setCreator] = useState(channels[0].handle);
  const [tags, setTags] = useState<string[]>(["4K"]);
  const [tagInput, setTagInput] = useState("");
  const [quality, setQuality] = useState<Quality>("4K");
  const [drag, setDrag] = useState(false);

  const addTag = (t: string) => {
    const clean = t.trim().replace(/^#/, "");
    if (clean && !tags.includes(clean) && tags.length < 10) setTags([...tags, clean]);
    setTagInput("");
  };
  const pickFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("video/")) return hub.toast("Please choose a video file");
    // Local files only play in this tab session; the blob URL is not persisted across reloads.
    // a blob URL is `blob:<origin>/<uuid>`; strip HTML metacharacters so a picked file never puts markup in src
    setSrc(URL.createObjectURL(f).replace(/[<>"'&]/g, ""));
    setFileName(f.name);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return hub.toast("Add a title first");
    // shortcut: blob URLs die on reload, so stored uploads fall back to a sample stream; upgrade with a real upload backend.
    const storedSrc = src.startsWith("blob:") ? SAMPLE_STREAMS[0].src : src;
    const id = hub.publishVideo({
      title: title.trim(),
      description: desc.trim() || "Uploaded on StreamHub.",
      creator,
      category,
      tags,
      duration: 596,
      views: 0,
      likes: 0,
      dislikes: 0,
      favorites: 0,
      uploadedAt: new Date().toISOString(),
      quality,
      fps: quality === "720p" ? 30 : 60,
      fullLength: true,
      src: storedSrc,
      palette: categories.find((c) => c.slug === category)!.palette,
      chapters: [
        { time: 0, title: "Intro" },
        { time: 120, title: "Main part" },
        { time: 480, title: "Outro" },
      ],
    });
    if (!id) return hub.toast("Upload limit reached (24). Delete browser data to reset.");
    hub.toast("Published! Opening your video…");
    router.push(`/watch/${id}/`);
  };

  return (
    <div className="mx-auto max-w-[860px] px-[10px] pb-[40px] pt-[20px]">
      <h1 className="mb-[15px] text-xl font-bold text-white">Upload Video</h1>
      <form onSubmit={publish} className="space-y-[14px]">
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[4px] border-2 border-dashed p-8 text-center ${drag ? "border-brand bg-brand/10" : "border-hairline bg-surface"}`}
        >
          <UploadCloud className="h-10 w-10 text-brand" />
          <span className="text-base font-bold text-white">{fileName || "Drag a video here or click to choose"}</span>
          <span className="text-sm text-muted">MP4 or WebM — or pick a sample stream below</span>
          <input type="file" accept="video/*" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
        </label>

        <div>
          <label htmlFor="sample" className="mb-1 block text-sm font-bold text-ink">Sample stream</label>
          <select id="sample" value={src.startsWith("blob:") ? "" : src} onChange={(e) => { const s = SAMPLE_STREAMS.find((x) => x.src === e.target.value); if (s) { setSrc(s.src); setFileName(""); } }} className={field}>
            {src.startsWith("blob:") && <option value="">Your file: {fileName}</option>}
            {SAMPLE_STREAMS.map((s) => <option key={s.src} value={s.src}>{s.label}</option>)}
          </select>
        </div>
        <video key={src} src={src} controls muted playsInline className="aspect-video w-full rounded-[3px] bg-black" />

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-bold text-ink">Title *</label>
          <input id="title" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="desc" className="mb-1 block text-sm font-bold text-ink">Description</label>
          <textarea id="desc" rows={3} maxLength={1000} value={desc} onChange={(e) => setDesc(e.target.value)} className={`${field} h-auto py-2`} />
        </div>
        <div className="grid gap-[14px] sm:grid-cols-3">
          <div>
            <label htmlFor="cat" className="mb-1 block text-sm font-bold text-ink">Category</label>
            <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ch" className="mb-1 block text-sm font-bold text-ink">Channel</label>
            <select id="ch" value={creator} onChange={(e) => setCreator(e.target.value)} className={field}>
              {channels.map((c) => <option key={c.handle} value={c.handle}>{c.name}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-bold text-ink">Quality</legend>
            <div className="flex gap-1">
              {(["4K", "1080p", "720p"] as Quality[]).map((qv) => (
                <button type="button" key={qv} onClick={() => setQuality(qv)} aria-pressed={quality === qv} className={`h-[44px] flex-1 rounded-[3px] text-md font-bold ${quality === qv ? "bg-brand text-black" : "bg-pill text-ink hover:bg-pill-hover"}`}>
                  {qv}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div>
          <label htmlFor="tags" className="mb-1 block text-sm font-bold text-ink">Tags</label>
          <div className="flex flex-wrap items-center gap-1 rounded-[3px] bg-field p-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-pill bg-brand px-2 py-0.5 text-sm font-bold text-black">
                #{t}
                <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
              </span>
            ))}
            <input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
              placeholder="Type a tag, press Enter"
              className="min-w-[140px] flex-1 bg-transparent text-md text-white outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {ALL_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button type="button" key={t} onClick={() => addTag(t)} className="rounded-pill bg-pill px-2 py-0.5 text-sm text-ink hover:bg-pill-hover">+ {t}</button>
            ))}
          </div>
        </div>
        <button className="h-[45px] w-full rounded-[3px] bg-brand text-md font-bold text-black hover:bg-brand-hover sm:w-[393px]">Publish</button>
      </form>
    </div>
  );
}
