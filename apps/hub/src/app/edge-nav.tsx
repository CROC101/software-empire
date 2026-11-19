"use client";

import { LineSidebar, useSectionSpy } from "@empire/ui";
import { useCallback, useState, type CSSProperties } from "react";

/**
 * Desktop only: touch the screen's left edge and the page's sections slide out as a list whose
 * lines lean toward the pointer (LineSidebar); the section on screen is lit. It slides back when
 * the pointer leaves. Keyboard users reach the same places through the header nav.
 */
export function EdgeNav({ items }: { items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>();

  // the section crossing the middle of the screen is the one being read
  const ids = items.flatMap((i) => (i.href.startsWith("#") ? [i.href.slice(1)] : []));
  const onEnter = useCallback((id: string) => setActive(`#${id}`), []);
  useSectionSpy(ids, "-50% 0px -50% 0px", onEnter);

  return (
    <div
      className="fixed inset-y-0 left-0 z-40 hidden lg:pointer-fine:block"
      onPointerLeave={() => setOpen(false)}
    >
      {/* the hot strip along the edge */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-3"
        onPointerEnter={() => setOpen(true)}
      />
      <nav
        aria-label="ไปยังส่วนต่าง ๆ ของหน้า"
        aria-hidden={!open}
        inert={!open}
        className={`cw-glass absolute top-1/2 left-0 max-h-[86svh] w-80 -translate-y-1/2 overflow-x-hidden overflow-y-auto rounded-r-xl py-1 pr-6 pl-2 [scrollbar-width:none] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        <LineSidebar
          items={items}
          activeHref={active}
          style={{ "--ls-marker": "36px", "--ls-gap": "6px", "--ls-shift": "0px" } as CSSProperties}
          className="edge-nav"
        />
      </nav>
    </div>
  );
}
