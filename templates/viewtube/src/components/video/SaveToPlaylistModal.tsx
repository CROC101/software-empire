'use client';

import { useState } from 'react';
import { Check, Clock, Lock, Plus, ThumbsUp } from 'lucide-react';
import { Modal, PillButton, toast } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { cx } from '@/lib/format';

export default function SaveToPlaylistModal({ videoId, open, onClose }: { videoId: string; open: boolean; onClose: () => void }) {
  const yt = useYouTube();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const rows = [
    { id: 'WL', title: 'Watch later', icon: <Clock size={18} />, on: yt.watchLater.includes(videoId) },
    { id: 'LL', title: 'Liked videos', icon: <ThumbsUp size={18} />, on: yt.liked.includes(videoId) },
    ...yt.playlists.map((p) => ({ id: p.id, title: p.title, icon: <Lock size={18} />, on: p.videoIds.includes(videoId) })),
  ];

  const create = () => {
    const id = yt.createPlaylist(name, [videoId]);
    if (!id) return toast('Playlist limit reached');
    toast(`Saved to ${name.trim() || 'Untitled list'}`);
    setName('');
    setCreating(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Save video to…" width="max-w-xs">
      <ul className="-mx-2 mb-3 max-h-72 overflow-y-auto">
        {rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => {
                yt.togglePlaylistVideo(r.id, videoId);
                toast(r.on ? `Removed from ${r.title}` : `Saved to ${r.title}`);
              }}
              className="flex w-full items-center gap-4 rounded-chip px-2 py-2 text-left text-sm hover:bg-soft"
              role="checkbox"
              aria-checked={r.on}
            >
              <span className={cx('grid h-5 w-5 place-items-center rounded-sm border-2', r.on ? 'border-ink bg-ink text-canvas' : 'border-muted')}>
                {r.on && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="flex-1 truncate">{r.title}</span>
              <span className="text-muted">{r.icon}</span>
            </button>
          </li>
        ))}
      </ul>
      {creating ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <label className="block text-xs text-muted">
            Name
            <input
              autoFocus
              value={name}
              maxLength={150}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name…"
              className="mt-1 w-full border-b border-muted bg-transparent py-1 text-sm text-ink outline-none focus:border-ink"
            />
          </label>
          <div className="flex justify-end">
            <PillButton type="submit" variant="blue" disabled={!name.trim()}>
              Create
            </PillButton>
          </div>
        </form>
      ) : (
        <PillButton onClick={() => setCreating(true)} className="w-full justify-center">
          <Plus size={18} /> New playlist
        </PillButton>
      )}
    </Modal>
  );
}
