import { Copy, LogIn, Play, Radio, Users } from "lucide-react";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { z } from "zod";
import { getRoom, lookup, type Video } from "@/lib/api";
import { follow, roomState, type RoomState } from "@/lib/room";
import { loadSupabase, signInUrl, useSession } from "@/lib/session";
import { thumb } from "@/lib/youtube";
import { usePlayer } from "./player";

type Room = { id: string; host: string; youtube_id: string };
const HEARTBEAT_MS = 5_000;

async function asVideo(id: string): Promise<Video> {
  const info = await lookup(id).catch(() => null);
  return {
    youtube_id: id,
    kind: "video",
    title: info?.title ?? "ดูพร้อมเพื่อน",
    author: info?.author ?? "",
    created_at: "",
  };
}

/**
 * Watch together. The host's player is the source of truth: it broadcasts where it is on a private
 * Realtime channel, and guests follow. Only the host may send (RLS on realtime.messages).
 */
export function RoomPage() {
  const { id = "" } = useParams();
  const { user, ready } = useSession();
  const player = usePlayer();
  const latest = useRef(player);
  const [fetched, setRoom] = useState<Room | null | undefined>(undefined);
  const [joined, setJoined] = useState(false);
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const pending = useRef<RoomState | null>(null);
  const valid = Boolean(user) && z.uuid().safeParse(id).success;
  const room = valid ? fetched : ready ? null : undefined;
  const isHost = Boolean(room && user && room.host === user.id);
  // the host's own player is already on the room's video when they arrive from "ดูพร้อมเพื่อน"
  const inRoom = joined || (isHost && room?.youtube_id === player.current?.youtube_id);

  useEffect(() => {
    latest.current = player;
  });

  useEffect(() => {
    if (!valid) return;
    let active = true;
    getRoom(id).then(
      (r) => active && setRoom(r),
      (e: unknown) => {
        console.error("โหลดห้องไม่สำเร็จ", e);
        if (active) setRoom(null);
      },
    );
    return () => {
      active = false;
    };
  }, [id, valid]);

  useEffect(() => {
    if (!room || !inRoom) return;
    const life = { stop: false };
    let cleanup = () => {};

    const apply = (host: RoomState) => {
      const p = latest.current;
      const step = follow(p.now(), host);
      if (step.load) {
        void asVideo(host.id).then((v) => p.play(v, [v], host.t));
        return;
      }
      if (step.seek) p.seek(host.t);
      if (step.toggle === "play") p.resume();
      if (step.toggle === "pause") p.pause();
    };

    void (async () => {
      const supabase = await loadSupabase();
      await supabase.realtime.setAuth();
      if (life.stop) return;
      const channel = supabase.channel(`stream-room:${room.id}`, { config: { private: true } });
      if (!isHost)
        channel.on("broadcast", { event: "state" }, ({ payload }) => {
          const parsed = roomState.safeParse(payload);
          if (parsed.success) apply(parsed.data);
        });
      channel.subscribe((status) => {
        setLive(status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
      });

      let timer: ReturnType<typeof setInterval> | undefined;
      let unwatch = () => {};
      if (isHost) {
        const send = (s: RoomState) =>
          void channel.send({ type: "broadcast", event: "state", payload: s });
        unwatch = latest.current.watch(send);
        timer = setInterval(() => {
          const s = latest.current.now();
          if (s) send(s);
        }, HEARTBEAT_MS);
      } else if (pending.current) {
        apply(pending.current);
      }
      cleanup = () => {
        clearInterval(timer);
        unwatch();
        void supabase.removeChannel(channel);
      };
    })();

    return () => {
      life.stop = true;
      cleanup();
    };
  }, [room, inRoom, isHost]);

  if (ready && !user)
    return (
      <Center>
        <p className="text-[var(--em-ink-200)]">ล็อกอินก่อนเข้าห้องดูด้วยกัน</p>
        <a
          href={signInUrl(location.href)}
          className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--em-blue-600)] px-5 font-semibold text-[var(--em-ink-0)]"
        >
          <LogIn className="size-4" aria-hidden /> ล็อกอิน
        </a>
      </Center>
    );
  if (room === undefined) return <Center>กำลังเปิดห้อง…</Center>;
  if (room === null) return <Center>ไม่พบห้องนี้ หรือห้องหมดอายุแล้ว (ห้องอยู่ได้ 1 วัน)</Center>;

  const join = async () => {
    // a tap starts the player: browsers block sound that starts by itself
    const v = await asVideo(room.youtube_id);
    player.play(v, [v]);
    player.setExpanded(true);
    setJoined(true);
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--em-blue-300)]">
        Watch together
      </p>
      <h1 className="mb-4 text-3xl font-black text-[var(--em-ink-0)]">ดูพร้อมเพื่อน</h1>
      <div className="grid gap-4 rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_12%,transparent)] bg-[var(--em-ink-950)] p-4">
        <img
          src={thumb(room.youtube_id)}
          alt=""
          className="aspect-video w-full rounded-lg object-cover"
        />
        <p className="flex items-center gap-2 text-sm text-[var(--em-ink-200)]">
          {isHost ? (
            <Radio className="size-4" aria-hidden />
          ) : (
            <Users className="size-4" aria-hidden />
          )}
          {isHost
            ? "คุณเป็นเจ้าของห้อง เล่น หยุด หรือกรอ แล้วเพื่อนจะตามไปด้วย"
            : "เจ้าของห้องเป็นคนคุม คุณจะเห็นตามจังหวะเดียวกัน"}
          {inRoom && (
            <span className="ml-auto text-xs text-[var(--em-ink-300)]">
              {live ? "เชื่อมต่อแล้ว" : "กำลังเชื่อม…"}
            </span>
          )}
        </p>
        {!inRoom && (
          <button
            type="button"
            onClick={() => void join()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--em-ink-0)] font-bold text-[var(--em-ink-975)] hover:bg-[var(--em-ink-100)]"
          >
            <Play className="size-5 fill-current" aria-hidden /> {isHost ? "เริ่มเล่น" : "เข้าร่วม"}
          </button>
        )}
        {isHost && (
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard.writeText(location.href).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--em-ink-0)_18%,transparent)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_8%,transparent)]"
          >
            <Copy className="size-4" aria-hidden />{" "}
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์ห้องส่งให้เพื่อน"}
          </button>
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-md gap-4 px-4 py-16 text-center text-[var(--em-ink-200)]">
      {children}
    </div>
  );
}
