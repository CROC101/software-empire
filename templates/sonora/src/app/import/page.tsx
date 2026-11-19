'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Play, Trash2, UploadCloud } from 'lucide-react';
import type { TrackItem } from '@/types/spotify';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/SpotifyPlayerContext';
import { searchYouTube } from '@/lib/youtube';
import { fmtTime } from '@/lib/format';
import Cover from '@/components/ui/Cover';

type Draft = TrackItem & { pick: boolean; tagText: string };

const field = 'h-9 w-full rounded bg-white/10 px-2 text-sm text-white outline-none focus:ring-1 focus:ring-white/40';

export default function ImportPage() {
  const lib = useLibrary();
  const p = usePlayer();
  const [input, setInput] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');

  const preview = async () => {
    const lines = input.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20);
    if (!lines.length) return;
    setBusy(true);
    setNote('');
    const out: Draft[] = [];
    let fallback = 0;
    for (const line of lines) {
      const r = await searchYouTube(line);
      if (r.mode === 'fallback') fallback++;
      const t = r.tracks[0];
      if (t && !out.some((d) => d.id === t.id)) out.push({ ...t, pick: true, tagText: (t.tags ?? []).join(', ') });
    }
    setDrafts(out);
    setBusy(false);
    if (fallback) setNote(`${fallback} line(s) couldn't reach YouTube, so the closest built-in song was suggested instead.`);
  };

  const edit = (id: string, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const doImport = () => {
    const chosen = drafts.filter((d) => d.pick);
    if (!chosen.length) return;
    let playlistId = target || undefined;
    if (target === '__new') playlistId = lib.createPlaylist('My Imports') ?? undefined;
    const tracks: TrackItem[] = chosen.map(({ pick: _pick, tagText, ...t }) => ({
      ...t,
      tags: tagText.split(',').map((s) => s.trim()).filter(Boolean),
      trimStart: t.trimStart || undefined,
      trimEnd: t.trimEnd && t.trimEnd < t.duration ? t.trimEnd : undefined,
      addedAt: new Date().toISOString(),
    }));
    lib.importTracks(tracks, playlistId);
    setDrafts([]);
    setInput('');
    setNote(`Added ${tracks.length} song${tracks.length === 1 ? '' : 's'} to your library${playlistId ? ' and playlist' : ''}.`);
  };

  return (
    <div className="mx-auto max-w-[960px] px-4 pb-10 pt-6 md:px-6">
      <h1 className="font-title text-3xl font-bold">Import from YouTube</h1>
      <p className="mt-2 text-sm text-subdued">Paste one link or song name per line. Each one is looked up, previewed, and can be tidied before it joins your library.</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label="Links or song names"
        placeholder={'https://www.youtube.com/watch?v=…\nlofi beats to code to'}
        className="mt-4 h-32 w-full resize-y rounded-lg bg-elevated p-3 text-sm outline-none focus:ring-2 focus:ring-white/60"
      />
      <button type="button" onClick={preview} disabled={busy || !input.trim()} className="mt-3 flex h-12 items-center gap-2 rounded-full bg-green px-6 font-bold text-black hover:scale-105 hover:bg-green-hi disabled:opacity-50 disabled:hover:scale-100">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />} Preview
      </button>
      {note && <p className="mt-3 text-sm text-subdued" role="status">{note}</p>}

      {drafts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Preview</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {drafts.map((d) => (
              <li key={d.id} className="rounded-lg bg-card p-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={d.pick} onChange={(e) => edit(d.id, { pick: e.target.checked })} aria-label={`Include ${d.title}`} className="mt-4 h-4 w-4 accent-[#1ed760]" />
                  <Cover cover={d.cover} label={d.title} className="h-14 w-14 shrink-0" />
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <input className={field} value={d.title} onChange={(e) => edit(d.id, { title: e.target.value })} aria-label="Title" />
                    <input className={field} value={d.artistName} onChange={(e) => edit(d.id, { artistName: e.target.value })} aria-label="Artist" />
                    <label className="flex items-center gap-2 text-xs text-subdued">
                      Start (s)
                      <input type="number" min={0} max={d.duration} className={field} value={d.trimStart ?? 0} onChange={(e) => edit(d.id, { trimStart: Math.max(0, Number(e.target.value)) })} />
                    </label>
                    <label className="flex items-center gap-2 text-xs text-subdued">
                      End (s)
                      <input type="number" min={0} max={d.duration} className={field} value={d.trimEnd ?? d.duration} onChange={(e) => edit(d.id, { trimEnd: Math.max(0, Number(e.target.value)) })} />
                    </label>
                    <input className={`${field} sm:col-span-2`} value={d.tagText} onChange={(e) => edit(d.id, { tagText: e.target.value })} placeholder="Tags, comma separated" aria-label="Tags" />
                  </div>
                  <span className="mt-2 text-sm tabular-nums text-subdued">{fmtTime(d.duration)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Add to playlist" className="h-10 rounded bg-elevated px-3 text-sm">
              <option value="">Library only</option>
              <option value="__new">New playlist…</option>
              {lib.playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={doImport} className="h-10 rounded-full bg-white px-6 text-sm font-bold text-black hover:scale-105">
              Import {drafts.filter((d) => d.pick).length} selected
            </button>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Imported songs</h2>
        {lib.imported.length ? (
          <ul className="mt-3">
            {lib.imported.map((t, i) => (
              <li key={t.id} className="group flex items-center gap-3 rounded px-2 py-2 hover:bg-white/10">
                <button type="button" aria-label={`Play ${t.title}`} onClick={() => p.playTracks(lib.imported, i, { name: 'YouTube Imports', href: '/import' })} className="relative">
                  <Cover cover={t.cover} label={t.title} className="h-10 w-10" />
                  <Play size={16} fill="white" className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${p.isCurrent(t.id) ? 'text-green' : ''}`}>{t.title}</p>
                  <p className="truncate text-sm text-subdued">
                    {t.artistName}
                    {t.tags?.length ? ` · ${t.tags.join(', ')}` : ''}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-subdued">{fmtTime(t.duration)}</span>
                <button type="button" aria-label={`Remove ${t.title}`} onClick={() => lib.removeImported(t.id)} className="p-1 text-subdued hover:text-white">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-subdued">
            Nothing imported yet. You can also search from the <Link href="/search" className="text-white underline">Search</Link> page.
          </p>
        )}
      </section>
    </div>
  );
}
