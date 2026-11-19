"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Gift, Send } from "lucide-react";
import { channels, STREAMS } from "@/data/seed-media";
import { CoverArt } from "@/components/video/CoverArt";
import { useHub } from "@/context/MediaHubContext";
import { formatCount } from "@/lib/format";

const ROOMS = [
  { id: "r1", title: "Live 3D sculpting: creature design", creator: "BlenderMaster", src: STREAMS.blazes, viewers: 4120 },
  { id: "r2", title: "Neon city build - real-time lighting", creator: "NeonRender", src: STREAMS.escapes, viewers: 2890 },
  { id: "r3", title: "Synthwave DJ set + visuals", creator: "SynthVisuals", src: STREAMS.fun, viewers: 6310 },
  { id: "r4", title: "Game jam day 2: boss fight", creator: "PixelForge", src: STREAMS.joyrides, viewers: 1540 },
  { id: "r5", title: "Animation dailies & Q&A", creator: "CrocByteStudios", src: STREAMS.meltdowns, viewers: 3370 },
  { id: "r6", title: "Camera gear unboxing", creator: "CodeCinema", src: STREAMS.escapes, viewers: 980 },
];
const BOT_LINES = ["this lighting is 🔥", "how many polys is that?", "hello from Bangkok!", "can you show the node setup?", "the colours 😍", "gg", "first time here, love it", "what GPU are you on?"];
const BOTS = ["orbit_cam", "keyframe_kid", "lumen_lover", "nodegraph", "cel_shade"];
const REACTIONS = ["🔥", "👏", "😍", "🚀"];

export default function LivePage() {
  const { toast } = useHub();
  const [room, setRoom] = useState(ROOMS[0]);
  const [viewers, setViewers] = useState(room.viewers);
  const [chat, setChat] = useState<{ id: number; who: string; text: string; tip?: boolean }[]>([]);
  const [msg, setMsg] = useState("");
  const [floats, setFloats] = useState<{ id: number; e: string; x: number }[]>([]);
  const n = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const channel = channels.find((c) => c.handle === room.creator)!;

  useEffect(() => {
    setChat([]);
    setViewers(room.viewers);
    const t = setInterval(() => {
      n.current++;
      setChat((c) => [...c.slice(-60), { id: n.current, who: BOTS[n.current % BOTS.length], text: BOT_LINES[(n.current * 3) % BOT_LINES.length] }]);
      setViewers((v) => Math.max(100, v + Math.round((Math.random() - 0.45) * 40)));
    }, 1600);
    return () => clearInterval(t);
  }, [room]);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [chat]);

  const react = (e: string) => {
    const id = ++n.current;
    setFloats((f) => [...f, { id, e, x: 10 + Math.random() * 70 }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1800);
  };
  const tip = (amount: number) => {
    const id = ++n.current;
    setChat((c) => [...c, { id, who: "you", text: `tipped ${amount} tokens!`, tip: true }]);
    react("💸");
    toast(`Sent a ${amount}-token tip to ${channel.name}`);
  };

  return (
    <div className="mx-auto max-w-site px-[10px] pb-[40px] pt-[20px] xl:px-0">
      <h1 className="mb-[15px] text-xl font-bold text-white">Live Streams</h1>
      <div className="flex flex-col gap-[15px] lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="relative aspect-video overflow-hidden bg-black">
            <video key={room.id} src={room.src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            <span className="live-pulse absolute left-3 top-3 rounded-[2px] bg-red-600 px-2 py-0.5 text-xs font-bold text-white">● LIVE</span>
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-[2px] bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
              <Eye className="h-3.5 w-3.5" /> {viewers.toLocaleString("en-US")}
            </span>
            <AnimatePresence>
              {floats.map((f) => (
                <motion.span
                  key={f.id}
                  initial={{ y: 0, opacity: 1, scale: 0.8 }}
                  animate={{ y: -220, opacity: 0, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="pointer-events-none absolute bottom-6 text-3xl"
                  style={{ left: `${f.x}%` }}
                >
                  {f.e}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white">{room.title}</p>
              <Link href={`/channel/${channel.handle}`} className="text-sm text-brand-text hover:underline">{channel.name}</Link>
            </div>
            {REACTIONS.map((e) => (
              <button key={e} onClick={() => react(e)} aria-label={`React ${e}`} className="h-[34px] w-[34px] rounded-[3px] bg-pill text-lg hover:bg-pill-hover">
                {e}
              </button>
            ))}
            {[10, 50, 100].map((a) => (
              <button key={a} onClick={() => tip(a)} className="flex h-[34px] items-center gap-1 rounded-[3px] bg-brand px-3 text-md font-bold text-black hover:bg-brand-hover">
                <Gift className="h-4 w-4" /> {a}
              </button>
            ))}
          </div>
        </div>
        <aside className="flex h-[420px] w-full flex-col rounded-[3px] border border-hairline bg-surface lg:h-auto lg:w-[320px]" aria-label="Live chat">
          <p className="border-b border-hairline px-3 py-2 text-md font-bold text-white">Live Chat</p>
          <div ref={box} className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-live="polite">
            {chat.map((c) => (
              <p key={c.id} className={`text-sm ${c.tip ? "rounded-[2px] bg-brand/15 px-1 text-brand" : "text-ink"}`}>
                <b className={c.who === "you" ? "text-brand" : "text-white"}>{c.who}</b> {c.text}
              </p>
            ))}
          </div>
          <form
            className="flex gap-1 border-t border-hairline p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!msg.trim()) return;
              setChat((c) => [...c, { id: ++n.current, who: "you", text: msg.trim() }]);
              setMsg("");
            }}
          >
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Say something…" aria-label="Chat message" className="h-[34px] flex-1 rounded-[3px] bg-field px-2 text-md text-white outline-none focus:ring-1 focus:ring-brand" />
            <button aria-label="Send" className="rounded-[3px] bg-brand px-3 text-black"><Send className="h-4 w-4" /></button>
          </form>
        </aside>
      </div>

      <h2 className="mb-[10px] mt-[30px] text-lg font-bold text-white">Live Now</h2>
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 md:grid-cols-3">
        {ROOMS.map((r) => {
          const c = channels.find((x) => x.handle === r.creator)!;
          return (
            <button key={r.id} onClick={() => { setRoom(r); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`text-left ${r.id === room.id ? "ring-2 ring-brand" : ""} rounded-[3px]`}>
              <span className="relative block aspect-video overflow-hidden rounded-thumb">
                <CoverArt seed={r.id} palette={c.palette} />
                <span className="live-pulse absolute left-2 top-2 rounded-[2px] bg-red-600 px-1.5 text-2xs font-bold text-white">● LIVE</span>
                <span className="absolute bottom-2 right-2 rounded-[2px] bg-black/70 px-1.5 text-2xs font-bold text-white">{formatCount(r.viewers)} watching</span>
              </span>
              <span className="mt-1 block text-base text-white">{r.title}</span>
              <span className="text-sm text-ink">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
