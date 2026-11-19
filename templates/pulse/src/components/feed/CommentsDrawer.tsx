'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { Drawer } from '@/components/common/Overlay';
import { Avatar } from '@/components/common/Visuals';
import { useLookup, useTikTok } from '@/context/TikTokContext';
import { fmtCount } from '@/lib/format';

/** Comment list + composer; used in the drawer and in the theater page. */
export function CommentsList({ videoId }: { videoId: string }) {
  const { comments, addComment } = useTikTok();
  const { creator } = useLookup();
  const [text, setText] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
  const list = comments.filter((c) => c.videoId === videoId);

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-4 overflow-y-auto p-4">
        {list.length === 0 && <li className="py-10 text-center text-14 text-muted">Be the first to comment</li>}
        {list.map((c) => {
          const u = creator(c.handle);
          const on = liked.includes(c.id);
          return (
            <li key={c.id} className="flex gap-3">
              <Link href={`/@${u.handle}`}><Avatar hue={u.hue} name={u.name} size={40} /></Link>
              <div className="min-w-0 flex-1">
                <Link href={`/@${u.handle}`} className="text-14 font-semibold hover:underline">{u.name}</Link>
                <p className="text-15 leading-5">{c.text}</p>
                <p className="mt-1 text-13 text-muted">{c.at.slice(5, 10)} · Reply</p>
              </div>
              <button aria-label="Like comment" aria-pressed={on} onClick={() => setLiked((l) => (on ? l.filter((x) => x !== c.id) : [...l, c.id]))} className="flex flex-col items-center text-12 text-muted">
                <Heart size={18} className={on ? 'fill-brand text-brand' : ''} />{fmtCount(c.likes + (on ? 1 : 0))}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { addComment(videoId, text.trim()); setText(''); } }}
        className="flex shrink-0 items-center gap-2 border-t border-line p-3"
      >
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add comment..." aria-label="Add comment" className="h-10 min-w-0 flex-1 rounded-md bg-pill px-3 text-15 outline-none" />
        <button type="submit" disabled={!text.trim()} aria-label="Post comment" className="flex h-10 w-10 items-center justify-center rounded-full text-brand disabled:text-muted"><Send size={20} /></button>
      </form>
    </div>
  );
}

export default function CommentsDrawer({ open, onClose, videoId, count }: { open: boolean; onClose: () => void; videoId: string; count: number }) {
  return (
    <Drawer open={open} onClose={onClose} title={`Comments (${fmtCount(count)})`} width={420}>
      <CommentsList videoId={videoId} />
    </Drawer>
  );
}
