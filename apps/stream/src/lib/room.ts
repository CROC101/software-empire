import { z } from "zod";

/** What the host broadcasts on `stream-room:<id>`. Guests check it before touching their player. */
export const roomState = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  t: z.number().min(0).max(1e6),
  playing: z.boolean(),
});
export type RoomState = z.infer<typeof roomState>;

/** Seek only when a guest is clearly off; small gaps come from network delay and fix themselves. */
export const MAX_DRIFT = 2;

/** What a guest should do to match the host. */
export function follow(
  mine: { id: string; t: number; playing: boolean } | null,
  host: RoomState,
): { load: true } | { load: false; seek: boolean; toggle: "play" | "pause" | null } {
  if (!mine || mine.id !== host.id) return { load: true };
  return {
    load: false,
    seek: Math.abs(mine.t - host.t) > MAX_DRIFT,
    toggle: mine.playing === host.playing ? null : host.playing ? "play" : "pause",
  };
}
