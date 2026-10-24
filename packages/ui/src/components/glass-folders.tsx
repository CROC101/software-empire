"use client";

import * as React from "react";

/**
 * Glass folders: frosted-glass folders that assemble as they scroll in, lean toward the pointer
 * and, when clicked, tip their front pane down and fan their files out above. Each folder is one
 * button (aria-expanded); Escape closes it. CSS does the motion (`.gf` in styles.css); the
 * pointer lean writes two custom properties, no re-render.
 *
 * Our own build after "Glassmorphism Folder Cards" (21st.dev).
 */
export type GlassFolderItem = {
  id: string;
  label: string;
  title: string;
  body?: string;
  tags?: readonly string[];
  files: readonly string[];
  /** A palette token for the back plate, e.g. "var(--em-blue-600)". */
  accent: string;
};

export function GlassFolders({
  folders,
  hint,
  className,
}: {
  folders: readonly GlassFolderItem[];
  hint?: string;
  className?: string;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState<string | null>(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const lean = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--gf-rx", `${(x * 14).toFixed(2)}deg`);
    el.style.setProperty("--gf-ry", `${(-y * 10).toFixed(2)}deg`);
  };
  const rest = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--gf-rx", "0deg");
    e.currentTarget.style.setProperty("--gf-ry", "0deg");
  };

  return (
    <div className={className}>
      <div
        ref={rootRef}
        data-seen={seen || undefined}
        className="gf-grid grid gap-x-6 gap-y-36 pt-36 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-6"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(null);
        }}
      >
        {folders.map((f, i) => {
          const isOpen = open === f.id;
          return (
            <div
              key={f.id}
              className="gf"
              data-open={isOpen || undefined}
              style={{ "--gf-i": i, "--gf-accent": f.accent } as React.CSSProperties}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                className="gf__hit"
                onClick={() => setOpen(isOpen ? null : f.id)}
                onPointerMove={lean}
                onPointerLeave={rest}
              >
                <span aria-hidden className="gf__back" />
                <span className="gf__files">
                  {f.files.map((file, k) => (
                    <span
                      key={file}
                      className="gf__file"
                      style={
                        {
                          "--gf-k": k,
                          "--gf-o": k - (f.files.length - 1) / 2,
                        } as React.CSSProperties
                      }
                    >
                      <span aria-hidden className="gf__file-ico" />
                      {file}
                    </span>
                  ))}
                </span>
                <span className="gf__front">
                  <span className="font-mono text-xs cw-blue">{f.label}</span>
                  <span className="mt-1 block text-xl font-black leading-tight">{f.title}</span>
                  {f.body && (
                    <span className="mt-2 line-clamp-2 block text-xs text-muted-foreground">
                      {f.body}
                    </span>
                  )}
                  {f.tags && (
                    <span className="mt-auto flex flex-wrap gap-1.5 pt-3 text-[11px]">
                      {f.tags.map((t) => (
                        <span key={t} className="border border-current/20 px-1.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                  <span aria-hidden className="gf__knob">
                    {isOpen ? "×" : "+"}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
      {hint && (
        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
