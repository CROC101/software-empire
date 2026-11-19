"use client";

import { useHub } from "@/context/MediaHubContext";

export function SubscribeButton({ handle }: { handle: string }) {
  const { subscriptions, toggleSubscribe } = useHub();
  const on = subscriptions.includes(handle);
  return (
    <button
      onClick={() => toggleSubscribe(handle)}
      aria-pressed={on}
      className={`h-[32px] shrink-0 rounded-[3px] px-4 text-md font-bold ${on ? "bg-pill text-ink hover:bg-pill-hover" : "bg-brand text-black hover:bg-brand-hover"}`}
    >
      {on ? "Subscribed ✓" : "Subscribe"}
    </button>
  );
}
