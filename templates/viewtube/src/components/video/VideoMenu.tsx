'use client';

import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ListEnd, ListPlus, MoreVertical, Share2 } from 'lucide-react';
import { toast, useClickOutside } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { cx } from '@/lib/format';
import SaveToPlaylistModal from './SaveToPlaylistModal';
import ShareModal from './ShareModal';

export default function VideoMenu({ videoId, className = '' }: { videoId: string; className?: string }) {
  const yt = useYouTube();
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const inWL = yt.watchLater.includes(videoId);

  const items = [
    { label: 'Add to queue', icon: <ListEnd size={20} />, run: () => (yt.addToQueue(videoId), toast('Video added to queue')) },
    {
      label: inWL ? 'Remove from Watch later' : 'Save to Watch later',
      icon: <Clock size={20} />,
      run: () => (yt.toggleWatchLater(videoId), toast(inWL ? 'Removed from Watch later' : 'Saved to Watch later')),
    },
    { label: 'Save to playlist', icon: <ListPlus size={20} />, run: () => setSaveOpen(true) },
    { label: 'Share', icon: <Share2 size={20} />, run: () => setShareOpen(true) },
  ];

  return (
    <div ref={ref} className={cx('relative', className)}>
      <button
        type="button"
        aria-label="Action menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="grid h-9 w-9 place-items-center rounded-full hover:bg-soft"
      >
        <MoreVertical size={20} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-9 right-0 z-50 w-64 origin-top-right rounded-card bg-raised py-2 shadow-card"
            role="menu"
          >
            {items.map((it) => (
              <li key={it.label}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    it.run();
                    setOpen(false);
                  }}
                  className="flex h-9 w-full items-center gap-4 px-4 text-left text-sm hover:bg-soft"
                >
                  {it.icon}
                  {it.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <SaveToPlaylistModal videoId={videoId} open={saveOpen} onClose={() => setSaveOpen(false)} />
      <ShareModal videoId={videoId} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
