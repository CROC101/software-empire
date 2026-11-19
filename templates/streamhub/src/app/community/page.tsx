"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { channels } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";

const POSTS = [
  "New tutorial drops Friday: procedural rocks in 10 minutes.",
  "Render farm finally finished the 4K cut. 41 hours!",
  "Which colour grade do you prefer: teal-orange or neon purple?",
  "Thanks for 1M subscribers! Livestream this weekend.",
  "Behind the scenes: our motion-capture setup on a budget.",
  "Open feedback thread: what should the next series cover?",
];

export default function CommunityPage() {
  const [liked, setLiked] = useState<number[]>([]);
  return (
    <div className="mx-auto max-w-[760px] px-[10px] pb-[40px] pt-[20px]">
      <h1 className="mb-[15px] text-xl font-bold text-white">Community</h1>
      <ul className="space-y-[10px]">
        {POSTS.map((text, i) => {
          const c = channels[i % channels.length];
          const on = liked.includes(i);
          return (
            <li key={i} className="rounded-[3px] bg-surface p-[14px]">
              <Link href={`/channel/${c.handle}`} className="flex items-center gap-2">
                <span className="h-[36px] w-[36px] overflow-hidden rounded-full"><CoverArt seed={c.handle} palette={c.palette} label={c.name[0]} /></span>
                <span className="text-md font-bold text-white hover:text-brand">{c.name}</span>
                <span className="text-sm text-muted">· {i + 1}d ago</span>
              </Link>
              <p className="mt-2 text-base text-ink">{text}</p>
              <div className="mt-2 flex gap-4 text-sm text-muted">
                <button onClick={() => setLiked(on ? liked.filter((x) => x !== i) : [...liked, i])} aria-pressed={on} className={`flex items-center gap-1 ${on ? "text-brand" : "hover:text-white"}`}>
                  <Heart className="h-4 w-4" fill={on ? "currentColor" : "none"} /> {120 + i * 37 + (on ? 1 : 0)}
                </button>
                <Link href={`/channel/${c.handle}`} className="flex items-center gap-1 hover:text-white"><MessageSquare className="h-4 w-4" /> {8 + i * 5}</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
