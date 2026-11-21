import { SearchCheck } from "lucide-react";
import type { Rescue } from "@/lib/search";

/** Says why the list shows near matches instead of exact ones; a search never ends on an empty page. */
export function RescueNote({ rescue, q }: { rescue: Rescue<unknown> | null; q: string }) {
  if (!rescue) return null;
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <SearchCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      {rescue.how === "layout" ? (
        <span>
          ไม่พบ “{q.trim()}” จึงลองอ่านเป็นแป้นอีกภาษา ได้ “
          <span className="text-foreground">{rescue.q}</span>”
        </span>
      ) : (
        <span>ไม่พบ “{q.trim()}” ตรงตัว นี่คือรายการที่ใกล้เคียงที่สุด</span>
      )}
    </p>
  );
}
