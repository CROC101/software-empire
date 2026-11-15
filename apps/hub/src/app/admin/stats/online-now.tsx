"use client";

import { watchOnline, type OnlineRow } from "@empire/core/presence";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

/** Who is on a page right now (heartbeat in the last 90 s), live. Emails come from the server. */
export function OnlineNow({ emails }: { emails: Record<string, string> }) {
  const [online, setOnline] = useState<OnlineRow[] | null>(null);
  useEffect(() => watchOnline(createBrowserClient(), setOnline), []);

  return (
    <section aria-labelledby="online-title" className="cw-glass rounded-2xl p-5">
      <h2 id="online-title" className="flex items-center gap-2 font-heading text-lg font-bold">
        <span aria-hidden className="relative flex size-2.5">
          <span className="absolute inline-flex size-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        ออนไลน์ตอนนี้
        <span className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
          {online?.length ?? "…"}
        </span>
      </h2>
      {online === null ? (
        <p className="mt-3 text-sm text-muted-foreground">กำลังโหลด…</p>
      ) : online.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีใครออนไลน์</p>
      ) : (
        <ul className="mt-3 divide-y text-sm">
          {online.map((o) => (
            <li key={o.user_id} className="flex flex-wrap justify-between gap-x-3 py-2">
              <span className="min-w-0 truncate font-medium">
                {emails[o.user_id] ?? o.user_id.slice(0, 8)}
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                {o.app} {o.path}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
