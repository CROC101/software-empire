import { Repeat2 } from "lucide-react";
import { Avatar } from "@/components/base/user-name";

/// IG-style "you reposted": your avatar with a repost badge and an emoji bubble float up and fade.
/// Re-mount (change `key`) to play it again. Purely decorative — the toast says it in words.
export function RepostBurst({ coreUserId }: { coreUserId: string }) {
  return (
    <div
      aria-hidden
      className="nx-repost-burst pointer-events-none absolute bottom-24 left-6 z-30 flex flex-col items-start gap-1"
    >
      <span className="rounded-2xl rounded-bl-sm bg-card px-3 py-1.5 text-lg shadow-nx-md">😍</span>
      <span className="relative">
        <Avatar coreUserId={coreUserId} size={44} showOnline={false} />
        <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-aurora text-white ring-2 ring-background">
          <Repeat2 className="size-3" />
        </span>
      </span>
    </div>
  );
}
