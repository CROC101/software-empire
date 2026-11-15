import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Who is online and which pages people open, shared by every app (migration hub_accounts).
 * Signed-in people only: each app calls `startBeacon` once it knows the user, then `page()` on
 * every route change. Online = a heartbeat in hub.online within ONLINE_MS; only admins read it.
 */
export const ONLINE_MS = 90_000;
const BEAT_MS = 30_000;

export const onlineRow = z.object({
  user_id: z.string(),
  app: z.string(),
  path: z.string(),
  seen_at: z.string(),
});
export type OnlineRow = z.infer<typeof onlineRow>;

const appName = z.string().regex(/^[a-z0-9-]{1,32}$/);
/** Same rule as the table's check: a site path without query or hash (they may carry tokens). */
export const visitPath = (path: string) => (path.split(/[?#]/)[0] ?? "").slice(0, 200) || "/";

// shortcut: any Supabase client fits (Next and Vite apps type theirs differently); rows are Zod-checked
type Client = SupabaseClient<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function startBeacon(supabase: Client, app: string) {
  const name = appName.parse(app);
  let path = "";
  // failed writes never break the page (rate cap, offline, signed out, banned)
  const beat = () => {
    if (!path || document.visibilityState === "hidden") return;
    void supabase
      .schema("hub")
      .from("online")
      .upsert({ app: name, path }, { onConflict: "user_id" })
      .then(() => undefined);
  };
  const timer = setInterval(beat, BEAT_MS);
  document.addEventListener("visibilitychange", beat);

  return {
    page(raw: string) {
      const next = visitPath(raw);
      if (next === path) return;
      path = next;
      beat();
      void supabase
        .schema("hub")
        .from("visits")
        .insert({ app: name, path })
        .then(() => undefined);
    },
    stop() {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    },
  };
}

/** Admins: everyone seen in the last ONLINE_MS, live (Realtime) and re-checked every 15 s. */
export function watchOnline(supabase: Client, onChange: (online: OnlineRow[]) => void) {
  const rows = new Map<string, OnlineRow>();
  const emit = () => {
    const since = Date.now() - ONLINE_MS;
    onChange([...rows.values()].filter((r) => Date.parse(r.seen_at) > since));
  };
  const take = (raw: unknown) => {
    const row = onlineRow.safeParse(raw);
    if (row.success) rows.set(row.data.user_id, row.data);
  };
  const load = async () => {
    const since = new Date(Date.now() - ONLINE_MS).toISOString();
    const { data } = await supabase.schema("hub").from("online").select("*").gt("seen_at", since);
    rows.clear();
    for (const raw of data ?? []) take(raw);
    emit();
  };
  const channel = supabase
    .channel("admin-online")
    .on("postgres_changes", { event: "*", schema: "hub", table: "online" }, (change) => {
      take(change.new);
      emit();
    })
    .subscribe();
  void load();
  const timer = setInterval(() => void load(), 15_000);
  return () => {
    clearInterval(timer);
    void supabase.removeChannel(channel);
  };
}
