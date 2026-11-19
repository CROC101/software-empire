'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Heart, ListFilter, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Comment } from '@/types/youtube';
import { GradientAvatar, PillButton, useClickOutside } from '@/components/ui';
import { useYouTube } from '@/context/YouTubeContext';
import { compact, cx, timeAgo } from '@/lib/format';

function Composer({ onSubmit, onCancel, placeholder, autoFocus = false, size = 40 }: { onSubmit: (t: string) => void; onCancel?: () => void; placeholder: string; autoFocus?: boolean; size?: number }) {
  const [text, setText] = useState('');
  const [active, setActive] = useState(autoFocus);
  return (
    <form
      className="flex gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text);
        setText('');
        setActive(false);
        onCancel?.();
      }}
    >
      <GradientAvatar colors={['#3ea6ff', '#7f5cff']} label="Y" size={size} />
      <div className="flex-1">
        <input
          autoFocus={autoFocus}
          value={text}
          maxLength={2000}
          onFocus={() => setActive(true)}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full border-b border-line bg-transparent pb-1 text-sm outline-none placeholder:text-muted focus:border-ink"
        />
        {active && (
          <div className="mt-2 flex justify-end gap-2">
            <PillButton
              variant="soft"
              className="bg-transparent"
              onClick={() => {
                setText('');
                setActive(false);
                onCancel?.();
              }}
            >
              Cancel
            </PillButton>
            <PillButton type="submit" variant="blue" disabled={!text.trim()}>
              {onCancel ? 'Reply' : 'Comment'}
            </PillButton>
          </div>
        )}
      </div>
    </form>
  );
}

function CommentItem({ c, videoId, creator, depth = 0 }: { c: Comment; videoId: string; creator?: { name: string; avatar: [string, string]; initials: string }; depth?: number }) {
  const yt = useYouTube();
  const [replying, setReplying] = useState(false);
  const [open, setOpen] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const size = depth ? 24 : 40;
  return (
    <div className="flex gap-4">
      <GradientAvatar colors={c.avatar} label={c.author.slice(1, 2).toUpperCase()} size={size} />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs">
          <span className={cx('font-medium', c.author === '@you' && 'rounded-full bg-hover px-1.5 py-0.5')}>{c.author}</span>
          <span className="ml-1 text-muted">{timeAgo(c.createdAt)}</span>
        </p>
        <p className="text-sm leading-5 whitespace-pre-wrap">{c.text}</p>
        <div className="mt-1 -ml-2 flex items-center text-xs text-muted">
          <motion.button whileTap={{ scale: 0.85 }} type="button" aria-label="Like this comment" aria-pressed={!!c.liked} onClick={() => yt.toggleCommentLike(videoId, c.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-soft">
            <ThumbsUp size={16} className={cx(c.liked && 'fill-ink text-ink')} />
          </motion.button>
          <span className="tabular mr-2">{c.likes > 0 ? compact(c.likes) : ''}</span>
          <button type="button" aria-label="Dislike this comment" aria-pressed={disliked} onClick={() => setDisliked((d) => !d)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-soft">
            <ThumbsDown size={16} className={cx(disliked && 'fill-ink text-ink')} />
          </button>
          {creator && (
            <button type="button" aria-label="Heart" aria-pressed={!!c.hearted} title={c.hearted ? `❤ by ${creator.name}` : 'Heart'} onClick={() => yt.toggleHeart(videoId, c.id)} className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-soft">
              {c.hearted ? (
                <span className="relative">
                  <GradientAvatar colors={creator.avatar} label={creator.initials} size={18} />
                  <Heart size={11} className="absolute -right-1.5 -bottom-1 fill-brand text-brand" />
                </span>
              ) : (
                <Heart size={16} />
              )}
            </button>
          )}
          <button type="button" onClick={() => setReplying(true)} className="ml-1 h-8 rounded-pill px-3 text-xs font-medium text-ink hover:bg-soft">
            Reply
          </button>
        </div>
        {replying && (
          <div className="mt-2">
            <Composer
              autoFocus
              size={24}
              placeholder="Add a reply…"
              onCancel={() => setReplying(false)}
              onSubmit={(t) => {
                yt.addComment(videoId, `${depth ? '' : `${c.author} `}${t}`, c.id);
                setOpen(true);
              }}
            />
          </div>
        )}
        {c.replies.length > 0 && (
          <>
            <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 -ml-3 flex h-9 items-center gap-2 rounded-pill px-3 text-sm font-medium text-link hover:bg-[#263850]">
              {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              {c.replies.length} {c.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden pt-2">
                  {c.replies.map((r) => (
                    <CommentItem key={r.id} c={r} videoId={videoId} creator={creator} depth={depth + 1} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ videoId, channelId, compactHeader = false }: { videoId: string; channelId?: string; compactHeader?: boolean }) {
  const yt = useYouTube();
  const [sort, setSort] = useState<'top' | 'new'>('top');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  useClickOutside(sortRef, useCallback(() => setSortOpen(false), []), sortOpen);
  const list = yt.getComments(videoId);
  const ch = yt.getChannel(channelId);
  const total = useMemo(() => list.reduce((n, c) => n + 1 + c.replies.length, 0), [list]);
  const sorted = useMemo(
    () => [...list].sort((a, b) => (sort === 'top' ? b.likes - a.likes : b.createdAt.localeCompare(a.createdAt))),
    [list, sort],
  );

  return (
    <section aria-label="Comments" className="mt-6">
      <div className={cx('mb-6 flex items-center gap-8', compactHeader && 'mb-4')}>
        <h2 className="tabular text-xl font-bold">{total.toLocaleString()} Comments</h2>
        <div ref={sortRef} className="relative">
          <button type="button" aria-expanded={sortOpen} onClick={() => setSortOpen((o) => !o)} className="flex items-center gap-2 text-sm font-medium">
            <ListFilter size={22} /> Sort by
          </button>
          {sortOpen && (
            <ul className="absolute top-8 left-0 z-20 w-44 rounded-card bg-raised py-2 shadow-card">
              {(
                [
                  ['top', 'Top comments'],
                  ['new', 'Newest first'],
                ] as const
              ).map(([k, label]) => (
                <li key={k}>
                  <button type="button" onClick={() => (setSort(k), setSortOpen(false))} className={cx('h-12 w-full px-4 text-left text-sm hover:bg-soft', sort === k && 'bg-soft')}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Composer placeholder="Add a comment…" onSubmit={(t) => yt.addComment(videoId, t)} />
      <div className="mt-6 space-y-5">
        {sorted.map((c) => (
          <CommentItem key={c.id} c={c} videoId={videoId} creator={ch ? { name: ch.name, avatar: ch.avatar, initials: ch.initials } : undefined} />
        ))}
      </div>
    </section>
  );
}
