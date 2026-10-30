"use client";

import { AmbienceButton, LiquidThemeToggle } from "@empire/ui";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

/**
 * Hamburger for phones and portrait iPad (< lg). A native <dialog>: Escape, focus trap and
 * focus return come from the browser; the sheet slides down with a transform-only animation.
 */
export function MobileMenu({
  items,
  cta,
}: {
  items: readonly { href: string; label: string }[];
  cta: { href: string; label: string };
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  return (
    <>
      <button
        type="button"
        aria-label="เปิดเมนู"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
        className="grid size-10 place-items-center border border-border lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <dialog
        ref={ref}
        aria-label="เมนู"
        // a click on the backdrop lands on the <dialog> itself
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="em-sheet m-0 mt-0 h-auto max-h-dvh w-full max-w-none bg-background p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm lg:hidden"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            crocwork.studio
          </span>
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={close}
            className="grid size-10 place-items-center border border-border"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <nav aria-label="เมนูหลัก" className="px-4 py-2">
          <ul>
            {items.map((item, i) => (
              <li
                key={item.href}
                className="em-sheet-item"
                style={{ animationDelay: `${String(60 + i * 45)}ms` }}
              >
                <a
                  href={item.href}
                  onClick={close}
                  className="flex items-baseline justify-between border-b py-4 text-2xl font-black"
                >
                  {item.label}
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 px-4 pb-6 pt-3">
          <LiquidThemeToggle cookieDomain={domain} size={36} />
          <AmbienceButton cookieDomain={domain} />
          <Link
            href={cta.href}
            onClick={close}
            className="cw-btn-blue ml-auto inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold"
          >
            {cta.label} <span aria-hidden>→</span>
          </Link>
        </div>
      </dialog>
    </>
  );
}
