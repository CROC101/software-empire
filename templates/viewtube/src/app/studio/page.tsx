'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, Trash2, Upload, Users } from 'lucide-react';
import Thumbnail from '@/components/video/Thumbnail';
import { GradientAvatar, IconButton, Modal, PillButton, toast } from '@/components/ui';
import { MY_CHANNEL_ID, useYouTube } from '@/context/YouTubeContext';
import { CATEGORIES, SAMPLE_SOURCES, THUMB_PRESETS } from '@/data/seed-youtube';
import type { Category, Video } from '@/types/youtube';
import { compact, cx, fullDate } from '@/lib/format';

type Metric = 'views' | 'watch' | 'subs';

function Chart({ totalViews, subs }: { totalViews: number; subs: number }) {
  const [metric, setMetric] = useState<Metric>('views');
  const [hover, setHover] = useState<number | null>(null);
  const days = 28;
  const data = useMemo(() => {
    const base = metric === 'views' ? totalViews / 400 : metric === 'watch' ? totalViews / 9000 : subs / 2500;
    return Array.from({ length: days }, (_, i) => Math.round(base * (0.75 + 0.3 * Math.sin(i / 2.6) + 0.25 * Math.cos(i / 1.3) + i / 70)));
  }, [metric, totalViews, subs]);
  const max = Math.max(...data, 1);
  const W = 700;
  const H = 220;
  const bw = W / days;
  const y = (n: number) => H - (n / max) * (H - 20);
  const label = (i: number) => new Date(Date.now() - (days - 1 - i) * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const unit = metric === 'views' ? 'views' : metric === 'watch' ? 'hours' : 'subscribers';

  return (
    <section className="rounded-card border border-line bg-elevated p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Channel analytics</h2>
        <div className="flex gap-1 rounded-pill bg-canvas p-1">
          {(
            [
              ['views', 'Views'],
              ['watch', 'Watch time'],
              ['subs', 'Subscribers'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setMetric(k)} className={cx('h-8 rounded-pill px-3 text-sm font-medium', metric === k ? 'bg-ink text-canvas' : 'text-muted hover:text-ink')}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-2 text-sm text-muted">Last 28 days</p>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img" aria-label={`${unit} per day for the last 28 days`} onMouseLeave={() => setHover(null)}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,.08)" />
          ))}
          {data.map((n, i) => (
            <motion.rect
              key={`${metric}-${i}`}
              x={i * bw + 3}
              width={bw - 6}
              rx={3}
              initial={{ y: H, height: 0 }}
              animate={{ y: y(n), height: H - y(n) }}
              transition={{ delay: i * 0.012, duration: 0.35 }}
              fill={hover === i ? '#3ea6ff' : 'rgba(62,166,255,.45)'}
              onMouseEnter={() => setHover(i)}
            />
          ))}
          <polyline points={data.map((n, i) => `${i * bw + bw / 2},${y(n)}`).join(' ')} fill="none" stroke="#ff0000" strokeWidth={2} />
          {[0, 7, 14, 21, 27].map((i) => (
            <text key={i} x={i * bw + bw / 2} y={H + 18} fill="#aaa" fontSize={11} textAnchor="middle">
              {label(i)}
            </text>
          ))}
        </svg>
        {hover !== null && (
          <div className="tabular pointer-events-none absolute top-0 rounded-chip bg-raised px-3 py-2 text-xs shadow-card" style={{ left: `clamp(0px, calc(${((hover + 0.5) / days) * 100}% - 60px), calc(100% - 120px))` }}>
            <p className="text-muted">{label(hover)}</p>
            <p className="font-medium">
              {data[hover].toLocaleString()} {unit}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const yt = useYouTube();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<Category>('Coding');
  const [thumb, setThumb] = useState(0);
  const [source, setSource] = useState(0);
  const [visibility, setVisibility] = useState<Video['visibility']>('Public');

  const submit = () => {
    const src = SAMPLE_SOURCES[source];
    const id = yt.uploadVideo({
      title: title.trim(),
      description: desc.trim() || 'No description yet.',
      channelId: MY_CHANNEL_ID,
      category,
      src: src.src,
      duration: src.duration,
      thumb: THUMB_PRESETS[thumb],
      chapters: [],
      hashtags: Array.from(desc.matchAll(/#(\w+)/g), (m) => m[1].toLowerCase()),
      visibility,
    });
    toast(`“${title.trim()}” uploaded — ${visibility === 'Public' ? 'now on Home and your channel' : 'available by link'}`);
    setTitle('');
    setDesc('');
    onClose();
    return id;
  };

  const field = 'w-full rounded-chip border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-link';
  return (
    <Modal open={open} onClose={onClose} title="Upload video" width="max-w-2xl">
      <form
        className="thin-scroll max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) submit();
        }}
      >
        <label className="block text-xs text-muted">
          Title (required)
          <input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a title that describes your video" className={cx(field, 'mt-1 text-ink')} />
        </label>
        <label className="block text-xs text-muted">
          Description
          <textarea rows={4} maxLength={5000} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Tell viewers about your video (use #hashtags)" className={cx(field, 'mt-1 resize-none text-ink')} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs text-muted">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={cx(field, 'mt-1 text-ink')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted">
            Sample video source
            <select value={source} onChange={(e) => setSource(Number(e.target.value))} className={cx(field, 'mt-1 text-ink')}>
              {SAMPLE_SOURCES.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-xs text-muted">Thumbnail</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {THUMB_PRESETS.map((t, i) => (
              <button
                key={t.from}
                type="button"
                aria-label={`Thumbnail preset ${i + 1}`}
                aria-pressed={thumb === i}
                onClick={() => setThumb(i)}
                className={cx('grid aspect-video place-items-center rounded-chip text-lg font-black ring-2', thumb === i ? 'ring-link' : 'ring-transparent')}
                style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
              >
                {t.glyph}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex gap-6 text-sm">
          <legend className="mb-2 text-xs text-muted">Visibility</legend>
          {(['Public', 'Unlisted'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="vis" checked={visibility === v} onChange={() => setVisibility(v)} className="accent-link" /> {v}
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <PillButton variant="soft" className="bg-transparent" onClick={onClose}>
            Cancel
          </PillButton>
          <PillButton type="submit" variant="blue" disabled={!title.trim()}>
            Publish
          </PillButton>
        </div>
      </form>
    </Modal>
  );
}

export default function StudioPage() {
  const yt = useYouTube();
  const me = yt.getChannel(MY_CHANNEL_ID);
  const [open, setOpen] = useState(false);
  const mine = useMemo(() => yt.videos.filter((v) => v.channelId === MY_CHANNEL_ID).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), [yt.videos]);
  const totalViews = mine.reduce((n, v) => n + v.views, 0);
  const watchHours = Math.round(mine.reduce((n, v) => n + v.views * v.duration * 0.42, 0) / 3600);
  const subs = (me?.subscribers ?? 0) + (yt.subscribed.includes(MY_CHANNEL_ID) ? 1 : 0);
  const uploads = new Set(yt.uploads.map((u) => u.id));

  const kpis = [
    { label: 'Total views', value: totalViews, icon: <Eye size={22} />, delta: '+12.4%' },
    { label: 'Watch time (hours)', value: watchHours, icon: <Clock size={22} />, delta: '+8.1%' },
    { label: 'Subscribers', value: subs, icon: <Users size={22} />, delta: '+3.2%' },
  ];

  return (
    <div className="mx-auto max-w-[1284px] space-y-6 px-4 pt-6 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {me && <GradientAvatar colors={me.avatar} label={me.initials} size={56} />}
          <div>
            <p className="text-xs text-muted">Creator Studio</p>
            <h1 className="text-2xl font-bold">Channel dashboard</h1>
            <Link href={`/channel/${MY_CHANNEL_ID}`} className="text-sm text-link hover:underline">
              View {me?.name}
            </Link>
          </div>
        </div>
        <PillButton variant="red" onClick={() => setOpen(true)}>
          <Upload size={18} /> Upload video
        </PillButton>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-card border border-line bg-elevated p-5">
            <div className="flex items-center justify-between text-sm text-muted">
              {k.label} {k.icon}
            </div>
            <p className="tabular mt-3 text-3xl font-bold">{k.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-[#2ba640]">{k.delta} vs previous 28 days</p>
          </motion.div>
        ))}
      </div>

      <Chart totalViews={totalViews} subs={subs} />

      <section className="overflow-hidden rounded-card border border-line">
        <h2 className="border-b border-line bg-elevated px-4 py-3 text-xl font-bold sm:px-6">Channel content</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">Video</th>
                <th className="px-3 py-3 font-medium">Visibility</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 text-right font-medium">Views</th>
                <th className="px-3 py-3 text-right font-medium">Comments</th>
                <th className="px-3 py-3 font-medium">Likes (vs. dislikes)</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {mine.map((v) => {
                const ratio = v.views ? Math.min(99.9, 94 + (v.likes / v.views) * 60) : 100;
                return (
                  <tr key={v.id} className="border-b border-line last:border-0 hover:bg-soft">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <Link href={`/watch?v=${v.id}`} className="w-[120px] shrink-0">
                          <Thumbnail video={v} rounded="rounded" />
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/watch?v=${v.id}`} className="line-clamp-1 font-medium hover:underline">
                            {v.title}
                          </Link>
                          <p className="line-clamp-1 text-xs text-muted">{v.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cx('rounded-full px-2 py-0.5 text-xs', v.visibility === 'Public' ? 'bg-[#2ba640]/20 text-[#5fd17a]' : 'bg-soft text-muted')}>{v.visibility}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{fullDate(v.publishedAt)}</td>
                    <td className="tabular px-3 py-3 text-right">{v.views.toLocaleString()}</td>
                    <td className="tabular px-3 py-3 text-right">{yt.getComments(v.id).length}</td>
                    <td className="px-3 py-3">
                      <span className="tabular">{ratio.toFixed(1)}%</span>
                      <div className="mt-1 h-1 w-24 rounded bg-white/20">
                        <div className="h-full rounded bg-link" style={{ width: `${ratio}%` }} />
                      </div>
                      <span className="text-xs text-muted">{compact(v.likes)} likes</span>
                    </td>
                    <td className="pr-3">
                      {uploads.has(v.id) && (
                        <IconButton label="Delete video" onClick={() => (yt.deleteUpload(v.id), toast('Video deleted'))}>
                          <Trash2 size={18} />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <UploadModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
