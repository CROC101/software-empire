"use client";

import { useState } from "react";

/**
 * The template loads only when asked: each is a whole app (tens of scripts). The frame is
 * sandboxed twice, here and by the /tpl/* header, so its scripts get an opaque origin and can
 * never read this site's cookies or storage.
 */
export function TemplatePreview({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-md border bg-muted">
      {open ? (
        <iframe
          src={src}
          title={title}
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen"
          className="size-full bg-background"
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-full items-center justify-center text-sm text-muted-foreground transition-colors duration-75 hover:text-foreground"
        >
          <span className="rounded-md border bg-background px-3 py-1.5">เปิดตัวอย่าง</span>
        </button>
      )}
    </div>
  );
}
