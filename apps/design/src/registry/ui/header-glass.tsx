"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

const links = ["บริการ", "ผลงาน", "ราคา", "บทความ"];

/** A frosted sticky header; below the container's md width the links fold into a sheet behind a menu button. */
/** `demo={false}` drops the gallery backdrop so a page template gets the bare header, sticky over the whole page. */
export default function HeaderGlass({
  brand = "crocwork",
  demo = true,
}: {
  brand?: string;
  demo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const header = (
    <header className="vt-top sticky top-0 z-10 @container border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <a href="#top" className="flex items-center gap-2 font-heading text-lg font-black">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground"
          >
            {brand.slice(0, 1).toUpperCase()}
          </span>
          {brand}
        </a>
        <nav aria-label="หลัก" className="hidden @2xl:block">
          <ul className="flex gap-1">
            {links.map((l) => (
              <li key={l}>
                <a
                  href={`#${l}`}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground @md:inline-flex"
          >
            ติดต่อ
            <ArrowRight aria-hidden className="size-4" />
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            onClick={() => {
              setOpen((o) => !o);
            }}
            className="grid size-9 place-items-center rounded-md border border-border @2xl:hidden"
          >
            {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id={id}
            aria-label="หลัก (มือถือ)"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-border/60 px-5 py-3 @2xl:hidden"
          >
            <ul className="grid gap-1">
              {links.map((l) => (
                <li key={l}>
                  <a href={`#${l}`} className="block rounded-md px-3 py-2.5 hover:bg-muted">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
  if (!demo) return header;
  return (
    <div className="relative min-h-72 bg-linear-to-b from-(--em-sky-400)/30 to-background text-foreground @container">
      {header}
      <p className="px-6 py-16 text-center text-muted-foreground">
        เนื้อหาเลื่อนผ่านใต้แถบหัวที่เป็นกระจก
      </p>
    </div>
  );
}
